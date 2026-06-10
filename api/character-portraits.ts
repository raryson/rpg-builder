import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { requireOwnerId } from './_shared/auth';
import { handleError, json, methodNotAllowed, readBody } from './_shared/http';

type UploadPortraitBody = {
  characterId?: string;
  fileName?: string;
  contentType?: string;
  dataUrl?: string;
};

const maxBytes = 4 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function safeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'portrait';
}

function parseDataUrl(dataUrl: string, fallbackContentType: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);

  if (!match) {
    throw new Error('Imagem inválida.');
  }

  const contentType = match[1] || fallbackContentType;
  const buffer = Buffer.from(match[2], 'base64');

  if (!allowedTypes.has(contentType)) {
    throw new Error('Use uma imagem JPG, PNG, WebP ou GIF.');
  }

  if (buffer.byteLength > maxBytes) {
    throw new Error('A imagem deve ter até 4 MB.');
  }

  return { buffer, contentType };
}

export default async function handler(req: any, res: any) {
  try {
    const ownerId = requireOwnerId(req);

    if (req.method !== 'POST') {
      methodNotAllowed(res);
      return;
    }

    const body = await readBody<UploadPortraitBody>(req);

    if (!body.characterId || !body.dataUrl) {
      json(res, 422, { error: 'characterId and dataUrl are required.' });
      return;
    }

    const { buffer, contentType } = parseDataUrl(body.dataUrl, body.contentType ?? 'image/png');
    const ownerHash = crypto.createHash('sha256').update(ownerId).digest('hex').slice(0, 16);
    const characterHash = crypto.createHash('sha256').update(body.characterId).digest('hex').slice(0, 16);
    const pathname = [
      'character-portraits',
      ownerHash,
      `${characterHash}-${Date.now()}-${safeFileName(body.fileName ?? 'portrait')}`,
    ].join('/');
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });

    json(res, 201, {
      url: blob.url,
      pathname: blob.pathname,
      contentType,
    });
  } catch (error) {
    handleError(res, error);
  }
}
