import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { errorResponse, getOwnerId, ok, readJson } from '../http';

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
    const error = new Error('Imagem invalida.') as Error & { status?: number };
    error.status = 422;
    throw error;
  }

  const contentType = match[1] || fallbackContentType;
  const buffer = Buffer.from(match[2], 'base64');

  if (!allowedTypes.has(contentType)) {
    const error = new Error('Use uma imagem JPG, PNG, WebP ou GIF.') as Error & { status?: number };
    error.status = 422;
    throw error;
  }

  if (buffer.byteLength > maxBytes) {
    const error = new Error('A imagem deve ter ate 4 MB.') as Error & { status?: number };
    error.status = 422;
    throw error;
  }

  return { buffer, contentType };
}

export async function POST(request: Request) {
  try {
    const ownerId = getOwnerId(request);
    const body = await readJson<UploadPortraitBody>(request);

    if (!body.characterId || !body.dataUrl) {
      return errorResponse(new Error('characterId and dataUrl are required.'), 422);
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return errorResponse(new Error('BLOB_READ_WRITE_TOKEN must be defined to upload portraits.'), 500);
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

    return ok(
      {
        url: blob.url,
        pathname: blob.pathname,
        contentType,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
