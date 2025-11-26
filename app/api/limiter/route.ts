import { NextRequest } from "next/server";
import { RateLimiter } from "../../../lib/rateLimiter";
import { MemoryAdapter } from "../../../lib/adapters/memoryAdapter";
import { RedisAdapter } from "../../../lib/adapters/redisAdapter";

// Extend globalThis for memory adapter persistence
declare global {
  var __memoryAdapter: MemoryAdapter | undefined;
}

// adapter selection by env var
const REDIS_URL = process.env.REDIS_URL || '';

let adapter;
if (REDIS_URL) {
  adapter = new RedisAdapter(REDIS_URL);
} else {
  // keep a single MemoryAdapter across cold-start life
  if (!globalThis.__memoryAdapter) {
    globalThis.__memoryAdapter = new MemoryAdapter();
  }
  adapter = globalThis.__memoryAdapter;
}

const limiter = new RateLimiter(
  Number(process.env.RL_LIMIT || 10),
  Number(process.env.RL_REFILL || 1),
  adapter
);

// basic JSON logger
function log(obj: any) {
  try { console.log(JSON.stringify(obj)); } catch(e){ console.log(obj); }
}

export async function GET(req: NextRequest) {
  const user = String(req.nextUrl.searchParams.get("user") || "anonymous");
  const key = req.nextUrl.searchParams.get("key") || '';
  // optional simple API key check (enterprise-y)
  const expected = process.env.API_KEY;
  if (expected && key !== expected) {
    log({ event: "auth_failed", user, ts: Date.now() });
    return new Response(JSON.stringify({ error: "invalid key" }), { status: 401 });
  }

  const res = await limiter.allowAndConsume(user);

  log({
    event: "rate_check",
    user,
    allowed: res.allowed,
    remaining: res.remaining,
    ts: Date.now()
  });

  // also update in-process metrics map (for /metrics)
  // metrics.* counters updated inside limiter already
  return new Response(JSON.stringify({ user, ...res }), {
    headers: { "content-type": "application/json" }
  });
}
