import { getSessionFromRequest } from '../_shared/auth';
import { json } from '../_shared/http';

export default function handler(req: any, res: any) {
  const session = getSessionFromRequest(req);

  if (!session) {
    json(res, 401, { user: null });
    return;
  }

  json(res, 200, {
    user: {
      email: session.email,
      name: session.name,
      picture: session.picture,
    },
  });
}
