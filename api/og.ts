import { getRuleEntryWithRelated } from './_shared/mongo';

const siteName = 'RPG Builder';
const defaultDescription = 'Crie fichas e consulte a wiki pública de Star Wars Saga Edition.';

type Meta = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteUrl(req: any, pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] ?? 'https';
  return `${protocol}://${host}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

function fallbackImage(title: string, description: string) {
  return `/api/og-image?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description)}`;
}

async function getMeta(path: string): Promise<Meta> {
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'wiki') {
    const systemSlug = parts[1] ?? 'star-wars-saga';
    const ruleSlug = parts[2];

    if (ruleSlug) {
      const result = await getRuleEntryWithRelated(systemSlug, ruleSlug);

      if (result?.rule) {
        return {
          title: `${result.rule.name} | Star Wars Saga`,
          description: result.rule.summary || `Consulte ${result.rule.name} na wiki pública de Star Wars Saga Edition.`,
          image: result.rule.imageUrl || undefined,
          path: `/wiki/${systemSlug}/${result.rule.slug}`,
          type: 'article',
        };
      }
    }

    return {
      title: 'Wiki Star Wars Saga | RPG Builder',
      description: 'Equipamentos, talentos, veículos, dróides e regras de Star Wars Saga Edition em uma wiki pública.',
      path: `/wiki/${systemSlug}`,
    };
  }

  if (parts[0] === 'app') {
    return {
      title: 'Criador de fichas Star Wars Saga | RPG Builder',
      description: defaultDescription,
      path: '/app',
    };
  }

  return {
    title: 'RPG Builder | Star Wars Saga',
    description: defaultDescription,
    path: '/',
  };
}

function html(meta: Meta, req: any) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(absoluteUrl(req, meta.path));
  const image = escapeHtml(absoluteUrl(req, meta.image || fallbackImage(meta.title, meta.description)));
  const type = meta.type ?? 'website';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="${title}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="pt_BR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${title}" />
    <meta http-equiv="refresh" content="0;url=${url}" />
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${description}</p>
      <p><a href="${url}">Abrir no RPG Builder</a></p>
    </main>
  </body>
</html>`;
}

export default async function handler(req: any, res: any) {
  try {
    const rawPath = Array.isArray(req.query?.path) ? req.query.path[0] : req.query?.path;
    const path = typeof rawPath === 'string' && rawPath.startsWith('/') ? rawPath : `/${rawPath ?? ''}`;
    const meta = await getMeta(path);

    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'public, max-age=300, s-maxage=3600');
    res.status(200).send(html(meta, req));
  } catch {
    const meta = await getMeta('/');

    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.status(200).send(html(meta, req));
  }
}
