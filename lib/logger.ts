type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_NAMESPACE = 'pasty-front';
const SHIP_ENDPOINT = '/api/logs';
const SHIP_API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

function shipToServer(payload: unknown) {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return;
  fetch(SHIP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(SHIP_API_KEY ? { 'X-API-Key': SHIP_API_KEY } : {}) },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Server de logs caído/no disponible: no reintenta, no vuelve a loguear
    // el fallo (evitaría un loop). Console.* sigue funcionando igual.
  });
}

function shouldLog(level: LogLevel) {
  const configured = process.env.NEXT_PUBLIC_LOG_LEVEL ?? 'debug';
  const order: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
  return order[level] >= (order[configured as LogLevel] ?? order.debug);
}

function serialize(value: unknown) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  return value;
}

export function logEvent(level: LogLevel, area: string, message: string, details?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const payload = {
    level,
    area,
    message,
    timestamp: new Date().toISOString(),
    ...(details ? { details: Object.fromEntries(Object.entries(details).map(([key, value]) => [key, serialize(value)])) } : {}),
  };

  const prefix = `[${LOG_NAMESPACE}:${area}] ${message}`;
  if (level === 'error') console.error(prefix, payload);
  else if (level === 'warn') console.warn(prefix, payload);
  else if (level === 'info') console.info(prefix, payload);
  else console.debug(prefix, payload);

  shipToServer(payload);
}

export function logDuration(area: string, message: string, startedAt: number, details?: Record<string, unknown>) {
  logEvent('debug', area, message, {
    duration_ms: Math.round(performance.now() - startedAt),
    ...details,
  });
}
