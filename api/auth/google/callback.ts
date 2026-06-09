import {
  clearStateCookie,
  exchangeGoogleCode,
  getSessionCookie,
  getSheetBuilderUrl,
  persistGoogleUser,
  validateGoogleState,
} from '../../_shared/auth';
import { queryValue } from '../../_shared/http';

export default async function handler(req: any, res: any) {
  const appUrl = getSheetBuilderUrl(req);

  try {
    const code = queryValue(req.query?.code);
    const state = queryValue(req.query?.state);

    if (!validateGoogleState(req, state)) {
      throw new Error('Estado de login inválido. Tente entrar novamente.');
    }

    if (!code) {
      throw new Error('Código de autorização do Google não encontrado.');
    }

    const googleUser = await exchangeGoogleCode(req, code);
    if (!googleUser.emailVerified) {
      throw new Error('A conta Google precisa ter e-mail verificado.');
    }

    await persistGoogleUser(googleUser);

    res.writeHead(302, {
      location: appUrl,
      'set-cookie': [
        getSessionCookie({
          sub: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
        }),
        clearStateCookie(),
      ],
    });
    res.end();
  } catch (error) {
    const url = new URL(appUrl);
    url.searchParams.set('authError', error instanceof Error ? error.message : 'Não foi possível entrar com Google.');
    res.writeHead(302, {
      location: url.toString(),
      'set-cookie': clearStateCookie(),
    });
    res.end();
  }
}
