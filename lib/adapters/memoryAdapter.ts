export type Bucket = {
  tokens: number;
  lastRefill: number;
};

export class MemoryAdapter {
  buckets: Map<string, Bucket> = new Map();

  get(user: string) {
    return this.buckets.get(user);
  }
  set(user: string, bucket: Bucket) {
    this.buckets.set(user, bucket);
  }
}
