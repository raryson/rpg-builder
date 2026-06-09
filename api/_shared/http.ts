export function json(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(res: any) {
  json(res, 405, { error: 'Method not allowed.' });
}

export function handleError(res: any, error: unknown) {
  const statusCode = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number'
    ? error.statusCode
    : 400;
  const message = error instanceof Error ? error.message : 'Unexpected API error.';
  json(res, statusCode, { error: message });
}

export async function readBody<T>(req: any): Promise<T> {
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}') as T;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) as T : {} as T;
}

export function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
