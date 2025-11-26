// app/api/log/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const payload = await req.json();

  // basic console log
  console.log(JSON.stringify({ forwarded_log: payload, ts: Date.now() }));

  // optional: forward to external log service if LOG_FORWARD_URL present
  const forwardUrl = process.env.LOG_FORWARD_URL;
  const forwardKey = process.env.LOG_FORWARD_KEY;

  if (forwardUrl) {
    try {
      await fetch(forwardUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(forwardKey ? { 'x-api-key': forwardKey } : {})
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("log forward failed", e);
    }
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}
