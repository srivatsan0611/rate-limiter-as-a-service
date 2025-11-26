import Redis from 'ioredis';

export class RedisAdapter {
  client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl);
  }

  // store tokens and lastRefill as JSON
  async get(user: string) {
    const raw = await this.client.get(`rate:${user}`);
    return raw ? JSON.parse(raw) : null;
  }

  async set(user: string, bucket: { tokens: number; lastRefill: number }) {
    await this.client.set(`rate:${user}`, JSON.stringify(bucket), 'EX', 60 * 60 * 24);
    // EX keeps it bounded
  }
}
