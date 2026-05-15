// Simple in-memory per-user rate limiter for AI endpoints.
// Resets each window. Good enough for a personal app — upgrade to Redis for multi-instance.

const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, limit = 20, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry || entry.resetAt < now) {
    store.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count < limit) {
    entry.count++;
    return true;
  }

  return false;
}
