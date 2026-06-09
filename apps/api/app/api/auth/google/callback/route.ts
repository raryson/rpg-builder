import { NextRequest, NextResponse } from 'next/server';
import {
  clearGoogleStateCookie,
  exchangeGoogleCode,
  getSheetBuilderUrl,
  setSessionCookie,
  validateGoogleState,
} from '../../../../../lib/auth';
import { WebUserService } from '../../../../../services/WebUserService';

const webUserService = new WebUserService();

export async function GET(request: NextRequest) {
  const appUrl = getSheetBuilderUrl(request);

  try {
    if (!validateGoogleState(request)) {
      throw new Error('Estado de login inválido. Tente entrar novamente.');
    }

    const code = request.nextUrl.searchParams.get('code');
    if (!code) {
      throw new Error('Código de autorização do Google não encontrado.');
    }

    const googleUser = await exchangeGoogleCode(request, code);
    if (!googleUser.emailVerified) {
      throw new Error('A conta Google precisa ter e-mail verificado.');
    }

    await webUserService.saveGoogleUser({
      providerId: googleUser.sub,
      email: googleUser.email,
      emailVerified: googleUser.emailVerified,
      name: googleUser.name,
      picture: googleUser.picture,
    });

    const response = NextResponse.redirect(appUrl);
    setSessionCookie(response, {
      sub: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });
    clearGoogleStateCookie(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível entrar com Google.';
    const url = new URL(appUrl);
    url.searchParams.set('authError', message);
    const response = NextResponse.redirect(url);
    clearGoogleStateCookie(response);
    return response;
  }
}
