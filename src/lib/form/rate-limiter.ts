const submissions = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 5;

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of submissions) {
      if (now > entry.resetAt) submissions.delete(key);
    }
  }, 5 * 60_000);
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = submissions.get(ip);

  if (!entry || now > entry.resetAt) {
    submissions.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

export function isHoneypotTriggered(body: Record<string, unknown>): boolean {
  return !!(body._hp_website || body["_hp_website"]);
}
