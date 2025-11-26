import { MemoryAdapter } from './adapters/memoryAdapter';
import { RedisAdapter } from './adapters/redisAdapter';
import { inc, setToken } from './metrics';

type Adapter = MemoryAdapter | RedisAdapter;

export class RateLimiter {
  limit: number;
  refillRate: number; // tokens per second
  adapter: Adapter;

  constructor(limit = 10, refillRate = 1, adapter?: Adapter) {
    this.limit = limit;
    this.refillRate = refillRate;
    this.adapter = adapter ?? new MemoryAdapter();
  }

  private now() {
    return Date.now();
  }

  async _getBucket(user: string) {
    if (this.adapter instanceof MemoryAdapter) {
      let b = this.adapter.get(user);
      if (!b) {
        b = { tokens: this.limit, lastRefill: this.now() };
        this.adapter.set(user, b);
      }
      return b;
    } else {
      // RedisAdapter path
      const b = await (this.adapter as RedisAdapter).get(user);
      if (!b) {
        const newB = { tokens: this.limit, lastRefill: this.now() };
        await (this.adapter as RedisAdapter).set(user, newB);
        return newB;
      }
      return b;
    }
  }

  refillBucket(bucket: { tokens: number; lastRefill: number }) {
    const now = this.now();
    const elapsed = (now - bucket.lastRefill) / 1000;
    const refillAmount = elapsed * this.refillRate;
    bucket.tokens = Math.min(this.limit, bucket.tokens + refillAmount);
    bucket.lastRefill = now;
    return bucket;
  }

  async allowAndConsume(user: string) {
    inc('requests_total', 1);
    const bucket = await this._getBucket(user);
    this.refillBucket(bucket);
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      if (this.adapter instanceof MemoryAdapter) {
        this.adapter.set(user, bucket);
      } else {
        await (this.adapter as RedisAdapter).set(user, bucket);
      }
      inc('requests_allowed_total', 1);
      setToken(user, Math.floor(bucket.tokens));
      return { allowed: true, remaining: Math.floor(bucket.tokens) };
    } else {
      inc('requests_denied_total', 1);
      setToken(user, Math.floor(bucket.tokens));
      return { allowed: false, remaining: Math.floor(bucket.tokens) };
    }
  }
}
