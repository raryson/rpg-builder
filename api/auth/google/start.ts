import { createState, getGoogleClientConfig, getGoogleRedirectUri, getStateCookie } from '../../_shared/auth';
import { handleError } from '../../_shared/http';

export default function handler(req: any, res: any) {
  try {
    const { clientId } = getGoogleClientConfig();
    const state = createState();
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');

    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', getGoogleRedirectUri(req));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');

    res.writeHead(302, {
      location: url.toString(),
      'set-cookie': getStateCookie(state),
    });
    res.end();
  } catch (error) {
    handleError(res, error);
  }
}
