import { useEffect, useMemo, useState } from 'react';
import { isCategoryId, type CategoryId } from '../data/types';

export type Route =
  | { name: 'home' }
  | { name: 'category'; categoryId: CategoryId }
  | { name: 'session'; categoryId: CategoryId }
  | { name: 'history' }
  | { name: 'settings' }
  | { name: 'notFound' };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\?.*$/, '');
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return { name: 'home' };

  const [first, second, third] = parts;

  if (first === 'history' && parts.length === 1) return { name: 'history' };
  if (first === 'settings' && parts.length === 1) return { name: 'settings' };

  if (first === 'c' && isCategoryId(second)) {
    if (third === 'session' && parts.length === 3) {
      return { name: 'session', categoryId: second };
    }
    if (parts.length === 2) return { name: 'category', categoryId: second };
  }

  return { name: 'notFound' };
}

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  const target = path.startsWith('#') ? path : `#${path}`;
  if (window.location.hash === target) return;

  if (options.replace) {
    window.history.replaceState(null, '', target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }

  window.location.hash = target;
}

export function categoryPath(categoryId: CategoryId): string {
  return `#/c/${categoryId}`;
}

export function sessionPath(categoryId: CategoryId): string {
  return `#/c/${categoryId}/session`;
}

export function useRoute(): Route {
  const [hash, setHash] = useState(() => (typeof window === 'undefined' ? '' : window.location.hash));

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return useMemo(() => parseRoute(hash), [hash]);
}
