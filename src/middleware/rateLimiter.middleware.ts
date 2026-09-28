import rateLimiter, {
  type Store,
  type Options,
  type IncrementResponse,
} from "express-rate-limit";

/**
 * A sliding-window-log store for express-rate-limit.
 *
 * Unlike the default fixed-window store (which resets the counter at fixed
 * boundaries and lets a client burst 2x the limit across a boundary), this
 * keeps a timestamp log per client and counts only the hits that fall within
 * the trailing `windowMs`. The window therefore "slides" with every request.
 */
class SlidingWindowStore implements Store {
  private windowMs = 60_000;
  private readonly hits = new Map<string, number[]>();
  private sweeper?: NodeJS.Timeout;

  init(options: Options): void {
    this.windowMs = options.windowMs;

    // Periodically drop keys whose hits have all aged out, so idle clients
    // don't leak memory. unref() keeps this timer from holding the process open.
    this.sweeper = setInterval(() => this.sweep(), this.windowMs).unref();
  }

  increment(key: string): IncrementResponse {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = (this.hits.get(key) ?? []).filter((t) => t > windowStart);
    timestamps.push(now);
    this.hits.set(key, timestamps);

    return {
      totalHits: timestamps.length,
      resetTime: new Date(timestamps[0] + this.windowMs),
    };
  }

  decrement(key: string): void {
    const timestamps = this.hits.get(key);
    if (timestamps?.length) {
      timestamps.pop();
    }
  }

  resetKey(key: string): void {
    this.hits.delete(key);
  }

  resetAll(): void {
    this.hits.clear();
  }

  private sweep(): void {
    const windowStart = Date.now() - this.windowMs;
    for (const [key, timestamps] of this.hits) {
      if (timestamps.every((t) => t <= windowStart)) {
        this.hits.delete(key);
      }
    }
  }
}

// App-wide limiter mounted in server.ts as a baseline for every route.
// Tighter, purpose-specific limiters (e.g. OTP, login) still live on the
// individual auth routes and stack on top of this one.
export const globalLimiter = rateLimiter({
  windowMs: 1000 * 60 * 15, // 15 minutes
  max: 200, // per IP, across all routes
  standardHeaders: true,
  legacyHeaders: false,
  store: new SlidingWindowStore(),
  message: { msg: "Too many requests from this IP, please try again later" },
});
