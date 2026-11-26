import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryCache } from './memory-cache';

describe('createMemoryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a stored value', () => {
    const cache = createMemoryCache<string>({ ttlMs: 1000, maxEntries: 10 });

    cache.set('a', 'x');

    expect(cache.get('a')).toBe('x');
  });

  it('returns undefined for an unknown key', () => {
    const cache = createMemoryCache<string>({ ttlMs: 1000, maxEntries: 10 });

    expect(cache.get('missing')).toBeUndefined();
  });

  it('expires entries once the ttl has passed', () => {
    const cache = createMemoryCache<string>({ ttlMs: 1000, maxEntries: 10 });
    cache.set('a', 'x');

    vi.advanceTimersByTime(999);
    expect(cache.get('a')).toBe('x');

    vi.advanceTimersByTime(1);
    expect(cache.get('a')).toBeUndefined();
  });

  it('evicts the oldest entry when the cache is full', () => {
    const cache = createMemoryCache<string>({ ttlMs: 1000, maxEntries: 2 });

    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
  });

  it('keeps recently read entries when evicting', () => {
    const cache = createMemoryCache<string>({ ttlMs: 1000, maxEntries: 2 });

    cache.set('a', '1');
    cache.set('b', '2');
    cache.get('a'); // 'a' passa a ser a mais recente
    cache.set('c', '3');

    expect(cache.get('a')).toBe('1');
    expect(cache.get('b')).toBeUndefined();
  });

  it('does not evict anything when overwriting an existing key', () => {
    const cache = createMemoryCache<string>({ ttlMs: 1000, maxEntries: 2 });

    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('a', 'updated');

    expect(cache.get('a')).toBe('updated');
    expect(cache.get('b')).toBe('2');
  });

  it('removes every entry on clear', () => {
    const cache = createMemoryCache<string>({ ttlMs: 1000, maxEntries: 10 });
    cache.set('a', '1');

    cache.clear();

    expect(cache.get('a')).toBeUndefined();
  });
});
