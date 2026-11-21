import { describe, expect, it } from 'vitest';
import {
  completeQuestion,
  createEmptyState,
  SCHEMA_VERSION,
  type ProgressState,
} from './progress';
import {
  loadState,
  parseImport,
  parsePayload,
  saveState,
  serializeExport,
  STORAGE_KEY,
  type StorageLike,
} from './storage';

class MemoryStorage implements StorageLike {
  readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function completedState(): ProgressState {
  const state = completeQuestion(createEmptyState(), 'q-abc', '2026-05-04T12:00:00.000Z');
  return { ...state, lastCategory: 'decouverte' };
}

describe('storage', () => {
  it('round-trips a progression', () => {
    const store = new MemoryStorage();
    const state = completedState();

    expect(saveState(state, store).ok).toBe(true);
    const loaded = loadState(store);

    expect(loaded.status).toBe('ok');
    expect(loaded.state.completed).toEqual(state.completed);
    expect(loaded.state.lastCategory).toBe('decouverte');
  });

  it('reports unavailable storage without throwing', () => {
    const loaded = loadState(null);
    expect(loaded.status).toBe('unavailable');
    expect(loaded.state.completed).toEqual({});
    expect(saveState(createEmptyState(), null).ok).toBe(false);
  });

  it('reports a quota error', () => {
    const store = new MemoryStorage();
    store.setItem = () => {
      const error = new Error('full');
      error.name = 'QuotaExceededError';
      throw error;
    };
    expect(saveState(createEmptyState(), store)).toEqual({ ok: false, status: 'quota' });
  });

  it('migrates version 1 data without inventing dates', () => {
    const store = new MemoryStorage();
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        completed: ['a', 'b'],
        skipped: ['c'],
        lastCategory: 'relation',
        lastQuestion: 'b',
        preferences: { shuffle: true },
      }),
    );

    const loaded = loadState(store);
    expect(loaded.status).toBe('ok');
    expect(loaded.state.version).toBe(SCHEMA_VERSION);
    expect(loaded.state.completed).toEqual({ a: '', b: '' });
    expect(loaded.state.skipped).toEqual({ c: '' });
    expect(loaded.state.lastSession?.questionId).toBe('b');
    expect(loaded.state.preferences.shuffle).toBe(true);
    expect(loaded.state.preferences.replayCompleted).toBe(false);
  });

  it('preserves corrupt data in a backup key', () => {
    const store = new MemoryStorage();
    store.setItem(STORAGE_KEY, '{ not json');

    const loaded = loadState(store);
    expect(loaded.status).toBe('corrupt');
    expect(loaded.raw).toBe('{ not json');
    expect(loaded.backupKey).toBeTruthy();
    expect(store.getItem(loaded.backupKey as string)).toBe('{ not json');
  });

  it('does not overwrite data from a newer version', () => {
    const store = new MemoryStorage();
    const raw = JSON.stringify({ version: SCHEMA_VERSION + 1, completed: { a: 'x' } });
    store.setItem(STORAGE_KEY, raw);

    const loaded = loadState(store);
    expect(loaded.status).toBe('future');
    expect(loaded.raw).toBe(raw);
    expect(store.getItem(STORAGE_KEY)).toBe(raw);
  });

  it('exports a signed payload that can be imported again', () => {
    const state = completedState();
    const text = serializeExport(state);
    const parsed = parseImport(text);

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state.completed).toEqual(state.completed);
      expect(parsed.state.version).toBe(SCHEMA_VERSION);
    }
  });

  it('accepts a legacy export and rejects unrelated files', () => {
    const legacy = parseImport(JSON.stringify({ completed: ['a'], skipped: [] }));
    expect(legacy.ok).toBe(true);

    expect(parseImport('hello').ok).toBe(false);
    expect(parseImport('[]').ok).toBe(false);
    expect(parseImport(JSON.stringify({ app: 'autre-app', completed: [] })).ok).toBe(false);
    expect(parseImport(JSON.stringify({ version: 2, preferences: {} })).ok).toBe(false);
  });

  it('refuses an import from a newer schema', () => {
    const parsed = parseImport(JSON.stringify({ version: SCHEMA_VERSION + 1, completed: {} }));
    expect(parsed.ok).toBe(false);
  });

  it('parses unknown versions conservatively', () => {
    expect(parsePayload('null').status).toBe('corrupt');
    expect(parsePayload(JSON.stringify({ foo: 'bar' })).status).toBe('corrupt');
  });
});
