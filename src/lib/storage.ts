import { isCategoryId, type CategoryId } from '../data/types';
import {
  createEmptyState,
  DEFAULT_PREFERENCES,
  SCHEMA_VERSION,
  type LastSession,
  type Preferences,
  type ProgressState,
} from './progress';

export const STORAGE_KEY = 'a-deux.progress';
export const APP_SIGNATURE = 'a-deux';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type StorageStatus = 'ok' | 'corrupt' | 'future' | 'unavailable' | 'quota';

export interface LoadResult {
  state: ProgressState;
  status: StorageStatus;
  /** Original payload, kept so a corrupt or newer file can be exported. */
  raw?: string;
  backupKey?: string;
}

export interface SaveResult {
  ok: boolean;
  status: StorageStatus;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0 && item.length <= 200);
}

function sanitizeRecord(value: unknown): Record<string, string> {
  if (!isPlainObject(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, stamp] of Object.entries(value)) {
    if (key.length === 0 || key.length > 200) continue;
    if (typeof stamp === 'string' && stamp.length <= 40) result[key] = stamp;
  }
  return result;
}

function sanitizePreferences(value: unknown): Preferences {
  if (!isPlainObject(value)) return { ...DEFAULT_PREFERENCES };
  return {
    shuffle: value.shuffle === true,
    replayCompleted: value.replayCompleted === true,
  };
}

function sanitizeLastSession(value: unknown): LastSession | null {
  if (!isPlainObject(value)) return null;
  const { categoryId, questionId, updatedAt } = value;
  if (!isCategoryId(categoryId)) return null;
  if (typeof questionId !== 'string' || questionId.length === 0) return null;
  return {
    categoryId,
    questionId,
    updatedAt: typeof updatedAt === 'string' ? updatedAt : '',
  };
}

function normalizeV2(raw: Record<string, unknown>): ProgressState | null {
  if (!isPlainObject(raw.completed) && !isPlainObject(raw.skipped)) return null;

  return {
    version: SCHEMA_VERSION,
    completed: sanitizeRecord(raw.completed),
    skipped: sanitizeRecord(raw.skipped),
    lastSession: sanitizeLastSession(raw.lastSession),
    lastCategory: isCategoryId(raw.lastCategory) ? (raw.lastCategory as CategoryId) : null,
    preferences: sanitizePreferences(raw.preferences),
  };
}

/**
 * Version 1 stored questions as plain arrays, without dates.
 * Those entries are migrated with an unknown stamp rather than a fake date.
 */
function fromV1(raw: Record<string, unknown>): ProgressState {
  const completed: Record<string, string> = {};
  for (const id of asStringArray(raw.completed)) completed[id] = '';

  const skipped: Record<string, string> = {};
  for (const id of asStringArray(raw.skipped)) {
    if (completed[id] === undefined) skipped[id] = '';
  }

  const lastCategory = isCategoryId(raw.lastCategory) ? raw.lastCategory : null;
  const lastQuestion = typeof raw.lastQuestion === 'string' ? raw.lastQuestion : null;
  const lastSession =
    lastCategory && lastQuestion
      ? { categoryId: lastCategory, questionId: lastQuestion, updatedAt: '' }
      : null;

  return {
    version: SCHEMA_VERSION,
    completed,
    skipped,
    lastSession,
    lastCategory,
    preferences: sanitizePreferences(raw.preferences),
  };
}

function detectVersion(raw: Record<string, unknown>): number | null {
  if (typeof raw.version === 'number' && Number.isFinite(raw.version)) return raw.version;
  if (Array.isArray(raw.completed)) return 1;
  return null;
}

export interface ParsedPayload {
  status: StorageStatus;
  state?: ProgressState;
  migrated?: boolean;
}

export function parsePayload(text: string): ParsedPayload {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { status: 'corrupt' };
  }

  if (!isPlainObject(raw)) return { status: 'corrupt' };

  const version = detectVersion(raw);
  if (version === null) return { status: 'corrupt' };
  if (version > SCHEMA_VERSION) return { status: 'future' };

  if (version <= 1) {
    return { status: 'ok', state: fromV1(raw), migrated: true };
  }

  const state = normalizeV2(raw);
  if (!state) return { status: 'corrupt' };
  return { status: 'ok', state, migrated: false };
}

export function serializeState(state: ProgressState): string {
  return JSON.stringify(state);
}

export function getLocalStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const probe = '__a_deux_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function preserveRaw(store: StorageLike | null, raw: string): string | null {
  if (!store) return null;
  const key = `${STORAGE_KEY}.backup-${Date.now()}`;
  try {
    store.setItem(key, raw);
    return key;
  } catch {
    return null;
  }
}

export function loadState(store: StorageLike | null = getLocalStorage()): LoadResult {
  if (!store) return { state: createEmptyState(), status: 'unavailable' };

  let raw: string | null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return { state: createEmptyState(), status: 'unavailable' };
  }

  if (!raw) return { state: createEmptyState(), status: 'ok' };

  const parsed = parsePayload(raw);
  if (parsed.status === 'ok' && parsed.state) {
    return { state: parsed.state, status: 'ok', raw };
  }

  if (parsed.status === 'future') {
    return { state: createEmptyState(), status: 'future', raw };
  }

  const backupKey = preserveRaw(store, raw);
  return { state: createEmptyState(), status: 'corrupt', raw, backupKey: backupKey ?? undefined };
}

export function saveState(
  state: ProgressState,
  store: StorageLike | null = getLocalStorage(),
): SaveResult {
  if (!store) return { ok: false, status: 'unavailable' };
  try {
    store.setItem(STORAGE_KEY, serializeState(state));
    return { ok: true, status: 'ok' };
  } catch (error) {
    const name = isPlainObject(error) ? error.name : undefined;
    const quota = name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED';
    return { ok: false, status: quota ? 'quota' : 'unavailable' };
  }
}

// ---------------------------------------------------------------------------
// Export / import
// ---------------------------------------------------------------------------

export interface ExportFile {
  app: typeof APP_SIGNATURE;
  version: number;
  exportedAt: string;
  progress: ProgressState;
}

export function buildExport(state: ProgressState, now = new Date()): ExportFile {
  return {
    app: APP_SIGNATURE,
    version: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    progress: state,
  };
}

export function serializeExport(state: ProgressState, now = new Date()): string {
  return JSON.stringify(buildExport(state, now), null, 2);
}

export type ImportResult =
  | { ok: true; state: ProgressState; migrated: boolean }
  | { ok: false; error: string };

export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Ce fichier n’est pas un fichier JSON valide.' };
  }

  if (!isPlainObject(raw)) {
    return { ok: false, error: 'Ce fichier ne contient pas une sauvegarde de progression.' };
  }

  if (typeof raw.app === 'string' && raw.app !== APP_SIGNATURE) {
    return { ok: false, error: 'Cette sauvegarde ne vient pas de à deux.' };
  }

  const candidate = isPlainObject(raw.progress) ? raw.progress : raw;
  const version = detectVersion(candidate);

  if (version === null) {
    return { ok: false, error: 'Cette sauvegarde ne contient aucune progression lisible.' };
  }

  if (version > SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'Cette sauvegarde vient d’une version plus récente de l’application et ne peut pas être importée ici.',
    };
  }

  if (version <= 1) {
    return { ok: true, state: fromV1(candidate), migrated: true };
  }

  const state = normalizeV2(candidate);
  if (!state) {
    return { ok: false, error: 'La progression de ce fichier est incomplète ou endommagée.' };
  }

  return { ok: true, state, migrated: false };
}
