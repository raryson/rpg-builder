import crypto from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const SESSION_COOKIE = 'rpg_builder_session';
export const GOOGLE_STATE_COOKIE = 'rpg_builder_google_state';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const STATE_MAX_AGE_SECONDS = 60 * 10;

export type AuthSession = {
  sub: string;
  email: string;
  name: string;
  picture: string;
  exp: number;
};

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
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

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function createState() {
  return crypto.randomBytes(24).toString('base64url');
}

export function createSessionToken(session: Omit<AuthSession, 'exp'>) {
  const payload: AuthSession = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function getSessionFromRequest(request: Request): AuthSession | null {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature || !timingSafeEqual(signature, sign(encoded))) return null;

  try {
    const session = JSON.parse(fromBase64Url(encoded)) as AuthSession;
    if (!session.sub || !session.email || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, session: Omit<AuthSession, 'exp'>) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(session), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function setGoogleStateCookie(response: NextResponse, state: string) {
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: STATE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearGoogleStateCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_STATE_COOKIE, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function validateGoogleState(request: NextRequest) {
  const expected = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const received = request.nextUrl.searchParams.get('state');
  return Boolean(expected && received && timingSafeEqual(expected, received));
}

export function getGoogleRedirectUri(request: NextRequest) {
  return process.env.GOOGLE_REDIRECT_URI ?? `${request.nextUrl.origin}/api/auth/google/callback`;
}

export function getWebAppUrl(request: NextRequest) {
  return process.env.WEB_APP_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : request.nextUrl.origin);
}

export function getSheetBuilderUrl(request: NextRequest) {
  return new URL('/app', getWebAppUrl(request)).toString();
}

export function getGoogleClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be defined.');
  }

  return { clientId, clientSecret };
}

export async function exchangeGoogleCode(request: NextRequest, code: string) {
  const { clientId, clientSecret } = getGoogleClientConfig();
  const redirectUri = getGoogleRedirectUri(request);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  const token = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !token.id_token) {
    throw new Error(token.error_description || token.error || 'Google login failed.');
  }

  const infoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token.id_token)}`);
  const info = (await infoResponse.json()) as GoogleTokenInfo;

  if (!infoResponse.ok) {
    throw new Error('Could not validate Google identity token.');
  }

  if (info.aud !== clientId) {
    throw new Error('Google identity token audience is invalid.');
  }

  if (Number(info.exp) < Math.floor(Date.now() / 1000)) {
    throw new Error('Google identity token is expired.');
  }

  return {
    sub: info.sub,
    email: info.email,
    emailVerified: info.email_verified === true || info.email_verified === 'true',
    name: info.name ?? info.email,
    picture: info.picture ?? '',
  };
}
