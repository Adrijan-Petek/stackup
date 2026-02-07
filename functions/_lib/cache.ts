export type D1DatabaseLike = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
};

type CacheRow = { value: string; expires_at: number };

export async function getCacheJson<T>(
  db: D1DatabaseLike,
  key: string
): Promise<{ hit: true; value: T } | { hit: false }> {
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare("SELECT value, expires_at FROM kv_cache WHERE key = ?1")
    .bind(key)
    .first<CacheRow>();

  if (!row) return { hit: false };
  if (typeof row.expires_at !== "number" || row.expires_at <= now) return { hit: false };

  return { hit: true, value: JSON.parse(row.value) as T };
}

export async function setCacheJson(
  db: D1DatabaseLike,
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + ttlSeconds;
  const json = JSON.stringify(value);

  await db
    .prepare(
      "INSERT INTO kv_cache(key, value, updated_at, expires_at) VALUES (?1, ?2, ?3, ?4) " +
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, expires_at = excluded.expires_at"
    )
    .bind(key, json, now, expiresAt)
    .run();
}

export async function purgeExpired(db: D1DatabaseLike): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare("DELETE FROM kv_cache WHERE expires_at <= ?1").bind(now).run();
}

