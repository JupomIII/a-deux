import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CategoryId } from '../data/types';
import {
  completeQuestion,
  createEmptyState,
  resetProgress as resetProgressState,
  setPreference,
  setHeroCategory as setHeroCategoryState,
  skipQuestion,
  touchSession as touchSessionState,
  uncompleteQuestion,
  visitCategory as visitCategoryState,
  type ProgressState,
} from '../lib/progress';
import {
  getLocalStorage,
  loadState,
  parsePayload,
  preserveRaw,
  saveState,
  serializeState,
  STORAGE_KEY,
  type StorageStatus,
} from '../lib/storage';

export interface ProgressActions {
  complete(questionId: string): void;
  skip(questionId: string): void;
  uncomplete(questionId: string): void;
  touchSession(categoryId: CategoryId, questionId: string): void;
  visitCategory(categoryId: CategoryId): void;
  /** Remember the category the home hero opens. */
  setHeroCategory(categoryId: CategoryId | null): void;
  setShuffle(value: boolean): void;
  setReplay(value: boolean): void;
  reset(): void;
  replaceState(next: ProgressState): void;
  discardIncompatible(): void;
  dismissNotice(): void;
}

interface ProgressContextValue {
  state: ProgressState;
  status: StorageStatus;
  notice: StorageStatus | null;
  rawStored?: string;
  actions: ProgressActions;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadState);
  const [state, setState] = useState<ProgressState>(initial.state);
  const [status, setStatus] = useState<StorageStatus>(initial.status);
  const [notice, setNotice] = useState<StorageStatus | null>(
    initial.status === 'ok' || initial.status === 'future' ? null : initial.status,
  );

  const statusRef = useRef(status);
  const stateRef = useRef(state);
  const firstPersist = useRef(true);

  const applyStatus = useCallback((next: StorageStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist after every change. The first render only reflects what was loaded.
  useEffect(() => {
    if (firstPersist.current) {
      firstPersist.current = false;
      return;
    }
    if (statusRef.current === 'future') return;

    const result = saveState(state);
    if (!result.ok) {
      applyStatus(result.status);
      setNotice(result.status);
    } else if (statusRef.current !== 'ok') {
      applyStatus('ok');
    }
  }, [state, applyStatus]);

  // Another tab wrote a newer progression: adopt it without echoing it back.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      if (event.newValue === serializeState(stateRef.current)) return;

      const parsed = parsePayload(event.newValue);
      if (parsed.status === 'ok' && parsed.state) {
        firstPersist.current = true;
        setState(parsed.state);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const complete = useCallback((questionId: string) => {
    setState((previous) => completeQuestion(previous, questionId, new Date().toISOString()));
  }, []);

  const skip = useCallback((questionId: string) => {
    setState((previous) => skipQuestion(previous, questionId, new Date().toISOString()));
  }, []);

  const uncomplete = useCallback((questionId: string) => {
    setState((previous) => uncompleteQuestion(previous, questionId));
  }, []);

  const touchSession = useCallback((categoryId: CategoryId, questionId: string) => {
    setState((previous) => touchSessionState(previous, categoryId, questionId, new Date().toISOString()));
  }, []);

  const visitCategory = useCallback((categoryId: CategoryId) => {
    setState((previous) => visitCategoryState(previous, categoryId));
  }, []);

  const setHeroCategory = useCallback((categoryId: CategoryId | null) => {
    setState((previous) => setHeroCategoryState(previous, categoryId));
  }, []);

  const setShuffle = useCallback((value: boolean) => {
    setState((previous) => setPreference(previous, 'shuffle', value));
  }, []);

  const setReplay = useCallback((value: boolean) => {
    setState((previous) => setPreference(previous, 'replayCompleted', value));
  }, []);

  const reset = useCallback(() => {
    setState((previous) => resetProgressState(previous));
  }, []);

  const replaceState = useCallback((next: ProgressState) => {
    setState({ ...next, version: createEmptyState().version });
  }, []);

  const discardIncompatible = useCallback(() => {
    if (initial.raw) preserveRaw(getLocalStorage(), initial.raw);
    setState(createEmptyState());
    applyStatus('ok');
    setNotice(null);
  }, [initial.raw, applyStatus]);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const actions = useMemo<ProgressActions>(
    () => ({
      complete,
      skip,
      uncomplete,
      touchSession,
      visitCategory,
      setHeroCategory,
      setShuffle,
      setReplay,
      reset,
      replaceState,
      discardIncompatible,
      dismissNotice,
    }),
    [
      complete,
      skip,
      uncomplete,
      touchSession,
      visitCategory,
      setHeroCategory,
      setShuffle,
      setReplay,
      reset,
      replaceState,
      discardIncompatible,
      dismissNotice,
    ],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({ state, status, notice, rawStored: initial.raw, actions }),
    [state, status, notice, initial.raw, actions],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used inside ProgressProvider');
  return context;
}
