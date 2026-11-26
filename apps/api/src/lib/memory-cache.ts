interface Entry<T> {
  value: T;
  expiresAt: number;
}

interface MemoryCacheOptions {
  ttlMs: number;
  maxEntries: number;
}

export function createMemoryCache<T>({ ttlMs, maxEntries }: MemoryCacheOptions) {
  const entries = new Map<string, Entry<T>>();

  function get(key: string): T | undefined {
    const entry = entries.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      entries.delete(key);
      return undefined;
    }

    entries.delete(key);
    entries.set(key, entry);

    return entry.value;
  }

  function set(key: string, value: T): void {
    entries.delete(key);

    if (entries.size >= maxEntries) {
      const oldest = entries.keys().next().value;
      if (oldest !== undefined) entries.delete(oldest);
    }

    entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  function clear(): void {
    entries.clear();
  }

  return { get, set, clear };
}
