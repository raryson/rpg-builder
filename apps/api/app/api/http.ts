import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../lib/auth';

export function getOwnerId(request: Request) {
  const session = getSessionFromRequest(request);

  if (!session) {
    const error = new Error('Faça login com Google para acessar suas fichas.') as Error & { status?: number };
    error.status = 401;
    throw error;
  }

  return `google:${session.sub}`;
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Unexpected API error.';
  const responseStatus = typeof error === 'object' && error && 'status' in error && typeof error.status === 'number'
    ? error.status
    : status;

  return NextResponse.json(
    {
      error: message,
    },
    { status: responseStatus },
  );
}
