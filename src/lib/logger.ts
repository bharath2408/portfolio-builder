const isDev = process.env.NODE_ENV === "development";

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.log(`[INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error);
    // In production, you could send to an external service here:
    // if (!isDev) sendToErrorTracker(message, error);
  },
  api: (method: string, path: string, status: number, durationMs?: number) => {
    if (isDev) {
      const dur = durationMs ? ` (${durationMs}ms)` : "";
      console.log(`[API] ${method} ${path} ${status}${dur}`);
    }
  },
};
