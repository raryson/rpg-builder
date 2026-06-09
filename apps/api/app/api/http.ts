import { NextResponse } from 'next/server';

export function getOwnerId(request: Request) {
  return request.headers.get('x-owner-id') ?? 'development-owner';
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

  return NextResponse.json(
    {
      error: message,
    },
    { status },
  );
}
