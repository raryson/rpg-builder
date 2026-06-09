import { clearSessionCookie } from '../_shared/auth';
import { json, methodNotAllowed } from '../_shared/http';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  res.setHeader('set-cookie', clearSessionCookie());
  json(res, 200, { ok: true });
}
