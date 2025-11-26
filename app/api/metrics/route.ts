import { NextRequest } from "next/server";
import { metrics } from "../../../lib/metrics";

function renderPrometheus() {
  let out = '';
  out += `# HELP rate_requests_total Total requests seen\n`;
  out += `# TYPE rate_requests_total counter\n`;
  out += `rate_requests_total ${metrics.requests_total}\n\n`;

  out += `# HELP rate_requests_allowed_total Total allowed requests\n`;
  out += `# TYPE rate_requests_allowed_total counter\n`;
  out += `rate_requests_allowed_total ${metrics.requests_allowed_total}\n\n`;

  out += `# HELP rate_requests_denied_total Total denied requests\n`;
  out += `# TYPE rate_requests_denied_total counter\n`;
  out += `rate_requests_denied_total ${metrics.requests_denied_total}\n\n`;

  // tokens_remaining as multiple lines (not ideal for many users)
  out += `# HELP rate_tokens_remaining Tokens remaining per user (debug)\n`;
  out += `# TYPE rate_tokens_remaining gauge\n`;
  metrics.tokens_remaining.forEach((v, user) => {
    // sanitize label value
    const u = user.replace(/[^a-zA-Z0-9_]/g, "_");
    out += `rate_tokens_remaining{user="${u}"} ${v}\n`;
  });

  return out;
}

export async function GET(_req: NextRequest) {
  const body = renderPrometheus();
  return new Response(body, {
    headers: { "content-type": "text/plain; version=0.0.4" }
  });
}
