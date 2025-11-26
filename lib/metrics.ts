export const metrics = {
  requests_total: 0,
  requests_allowed_total: 0,
  requests_denied_total: 0,
  // optional map of remaining tokens per user for debugging (not ideal for real Prometheus labels)
  tokens_remaining: new Map<string, number>(),
};

export function inc(name: keyof typeof metrics, value = 1) {
  if (typeof metrics[name] === 'number') {
    // @ts-ignore
    metrics[name] += value;
  }
}

export function setToken(user: string, v: number) {
  metrics.tokens_remaining.set(user, v);
}
