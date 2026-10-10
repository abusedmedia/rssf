import { sha256Hex } from "./crypto";
import type { Env } from "./env";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMITS = 10;

export async function checkSubmitRateLimit(
  env: Env,
  formId: string,
  ip: string,
): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number }> {
  const ipHash = await sha256Hex(ip || "unknown");
  const key = `submit:${formId}:${ipHash}`;
  const now = Date.now();

  const row = await env.DB.prepare(
    "SELECT count, window_start FROM rate_limits WHERE key = ?",
  )
    .bind(key)
    .first<{ count: number; window_start: string }>();

  if (!row) {
    await env.DB.prepare(
      "INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)",
    )
      .bind(key, new Date(now).toISOString())
      .run();
    return { allowed: true };
  }

  const windowStart = Date.parse(row.window_start);
  if (!Number.isFinite(windowStart) || now - windowStart >= WINDOW_MS) {
    await env.DB.prepare(
      "UPDATE rate_limits SET count = 1, window_start = ? WHERE key = ?",
    )
      .bind(new Date(now).toISOString(), key)
      .run();
    return { allowed: true };
  }

  if (row.count >= MAX_SUBMITS) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((WINDOW_MS - (now - windowStart)) / 1000),
    );
    return { allowed: false, retryAfterSec };
  }

  await env.DB.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?")
    .bind(key)
    .run();
  return { allowed: true };
}
