import { NextRequest, NextResponse } from 'next/server';
import { createState, getGoogleClientConfig, getGoogleRedirectUri, setGoogleStateCookie } from '../../../../../lib/auth';

export function GET(request: NextRequest) {
  const { clientId } = getGoogleClientConfig();
  const state = createState();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', getGoogleRedirectUri(request));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(url);
  setGoogleStateCookie(response, state);
  return response;
}
