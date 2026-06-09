import crypto from 'node:crypto';
import { saveGoogleUser } from './mongo';

export const SESSION_COOKIE = 'rpg_builder_session';
export const GOOGLE_STATE_COOKIE = 'rpg_builder_google_state';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const STATE_MAX_AGE_SECONDS = 60 * 10;

type AuthSession = {
  sub: string;
  email: string;
  name: string;
  picture: string;
  exp: number;
};

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenInfo = {
  sub: string;
  aud: string;
  email: string;
  email_verified: 'true' | 'false' | boolean;
  name?: string;
  picture?: string;
  exp: string;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SESSION_SECRET must be defined with at least 32 characters.');
  }

  return secret;
}

function sign(value: string) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(req: any) {
  const cookieHeader = req.headers.cookie ?? '';
  return Object.fromEntries(
    String(cookieHeader)
      .split(';')
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf('=');
        if (separatorIndex === -1) return [cookie, ''];
        return [cookie.slice(0, separatorIndex), decodeURIComponent(cookie.slice(separatorIndex + 1))];
      }),
  ) as Record<string, string>;
}

function serializeCookie(name: string, value: string, maxAge: number) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function getOrigin(req: any) {
  const protocol = req.headers['x-forwarded-proto'] ?? 'https';
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  return `${protocol}://${host}`;
}

export function getGoogleRedirectUri(req: any) {
  return process.env.GOOGLE_REDIRECT_URI ?? `${getOrigin(req)}/api/auth/google/callback`;
}

export function getWebAppUrl(req: any) {
  return process.env.WEB_APP_URL ?? getOrigin(req);
}

export function getSheetBuilderUrl(req: any) {
  return new URL('/app', getWebAppUrl(req)).toString();
}

export function getGoogleClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be defined.');
  }

  return { clientId, clientSecret };
}

export function createState() {
  return crypto.randomBytes(24).toString('base64url');
}

export function getStateCookie(state: string) {
  return serializeCookie(GOOGLE_STATE_COOKIE, state, STATE_MAX_AGE_SECONDS);
}

export function clearStateCookie() {
  return serializeCookie(GOOGLE_STATE_COOKIE, '', 0);
}

export function createSessionToken(session: Omit<AuthSession, 'exp'>) {
  const payload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function getSessionCookie(session: Omit<AuthSession, 'exp'>) {
  return serializeCookie(SESSION_COOKIE, createSessionToken(session), SESSION_MAX_AGE_SECONDS);
}

export function clearSessionCookie() {
  return serializeCookie(SESSION_COOKIE, '', 0);
}

export function getSessionFromRequest(req: any): AuthSession | null {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature || !timingSafeEqual(signature, sign(encoded))) return null;

  try {
    const session = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AuthSession;
    if (!session.sub || !session.email || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function requireOwnerId(req: any) {
  const session = getSessionFromRequest(req);
  if (!session) {
    const error = new Error('Faça login com Google para acessar suas fichas.') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  return `google:${session.sub}`;
}

export function validateGoogleState(req: any, state: string | undefined) {
  const expected = parseCookies(req)[GOOGLE_STATE_COOKIE];
  return Boolean(expected && state && timingSafeEqual(expected, state));
}

export async function exchangeGoogleCode(req: any, code: string) {
  const { clientId, clientSecret } = getGoogleClientConfig();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: getGoogleRedirectUri(req),
    }),
  });
  const token = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !token.id_token) {
    throw new Error(token.error_description || token.error || 'Google login failed.');
  }

  const infoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token.id_token)}`);
  const info = (await infoResponse.json()) as GoogleTokenInfo;

  if (!infoResponse.ok || info.aud !== clientId || Number(info.exp) < Math.floor(Date.now() / 1000)) {
    throw new Error('Could not validate Google identity token.');
  }

  return {
    sub: info.sub,
    email: info.email,
    emailVerified: info.email_verified === true || info.email_verified === 'true',
    name: info.name ?? info.email,
    picture: info.picture ?? '',
  };
}

export async function persistGoogleUser(googleUser: Awaited<ReturnType<typeof exchangeGoogleCode>>) {
  return saveGoogleUser({
    providerId: googleUser.sub,
    email: googleUser.email,
    emailVerified: googleUser.emailVerified,
    name: googleUser.name,
    picture: googleUser.picture,
  });
}
