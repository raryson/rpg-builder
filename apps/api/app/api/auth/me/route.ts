import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '../../../../lib/auth';
import { ok } from '../../http';

export function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    return ok({ user: null }, { status: 401 });
  }

  return ok({
    user: {
      email: session.email,
      name: session.name,
      picture: session.picture,
    },
  });
}
