import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { put } from '@vercel/blob';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiEnvPath = path.join(root, 'apps', 'api', '.env.local');
const rootEnvPath = path.join(root, '.env.local');
const localImageDir = process.env.RULE_IMAGE_DIR ?? 'C:\\Users\\rarys\\Downloads\\imagens-star-wars';
const systemSlug = process.env.RULE_IMAGE_SYSTEM ?? 'star-wars-saga';
const dryRun = process.env.RULE_IMAGE_DRY_RUN === '1';
const repairDryRun = process.env.RULE_IMAGE_REPAIR_DRY_RUN === '1';
const mirrorRemote = process.env.RULE_IMAGE_MIRROR_REMOTE !== '0';
const uploadLocal = process.env.RULE_IMAGE_UPLOAD_LOCAL !== '0';

const localImageMappings = [
  ['esfera-de-energia', 'esfera-de-energia.avif'],
  ['pistola-de-projeteis', 'pistola-de-projeteis.JPG'],
  ['pistola-de-ions', 'pistola-de-ions.jpeg'],
  ['holoprojetor-pessoal', 'holoprojetor-pessoal.jpg'],
  ['computador-portatil', 'computador-portatil.webp'],
  ['cilindro-de-codigo', 'cilindro-deocidog.jpg'],
  ['datapad-basico', 'datapad-basico.webp'],
  ['cartoes-de-dados-em-branco-10', 'carta-de-dados.jpg'],
  ['luvas-de-combate', 'luvas-de-combate.jpg'],
  ['desarmado', 'desarmado.jpg'],
  ['lanca', 'lança.webp'],
  ['funda', 'funda.jpg'],
  ['faca', 'faca-star-wars.jpg'],
  ['cassetete-de-atordoamento', 'cassetete-de-atordoamento.webp'],
  ['cassetete-porrete', 'cassetete.webp'],
  ['cajado', 'cajado.jpg'],
  ['baioneta', 'baioneta.jpg'],
  ['arco', 'arco.jpg'],
  ['detonita', 'detonita.webp'],
  ['cajado-amphi', 'cajado-amphi.webp'],
  ['besta-de-energia', 'besta-de-energia.jpg'],
  ['vibromachado', 'vibromachado.jpg'],
  ['vibrolamina', 'vibrolamina.webp'],
  ['vibrobaioneta', 'vibro-baioneta.webp'],
  ['vibroadaga', 'vibroadaga.webp'],
  ['pique-de-energia', 'pique-de-energia.webp'],
  ['cajado-eletrico', 'cajado-eletrico.webp'],
  ['traje-espacial-blindado', 'traje-especial-blindado.webp'],
  ['carapaca-de-caranguejo-vonduun', 'carapaça-caranguejo.webp'],
  ['capacete-e-colete-blindados', 'capecete-e-colete-blindado.png'],
  ['mira-telescopica-aperfeicoada-com-visao-na-penumbra', 'mira-telescopica-visao-penumbra.jpg'],
  ['mira-telescopica-padrao', 'mira-telescopica.webp'],
  ['conjunto-para-capacete', 'conjunto-capacete.jpg'],
  ['coldre-oculto', 'coldre-oculto.webp'],
  ['coldre-de-cintura', 'coldre.png'],
  ['droide-de-trabalho-asp', 'droide-asp.png'],
  ['armadura-coralina', 'armadura-coralina.webp'],
  ['carapaca-de-caranguejo-vonduun', 'armadura-coralina.webp'],
  ['traje-de-piloto-acolchoado', 'traje-piloto-acolchoado.jpg'],
];

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  }
}

function contentTypeFromExtension(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    '.avif': 'image/avif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  }[extension] ?? 'application/octet-stream';
}

function extensionFromContentType(contentType = '') {
  const normalized = contentType.split(';')[0].trim().toLowerCase();
  return {
    'image/avif': '.avif',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  }[normalized] ?? '';
}

function extensionFromUrl(url = '') {
  try {
    const pathname = new URL(url).pathname;
    const extension = path.extname(pathname).toLowerCase();
    return extension && extension.length <= 8 ? extension : '';
  } catch {
    return '';
  }
}

function digest(buffer) {
  return crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12);
}

function blobPathFor(slug, sourceName, buffer, fallbackExtension = '') {
  const parsedExtension = path.extname(sourceName).toLowerCase();
  const extension = parsedExtension || fallbackExtension || '.jpg';
  return `star-wars-saga/rules/${slug}/${digest(buffer)}${extension}`;
}

async function uploadBuffer({ slug, buffer, sourceName, contentType }) {
  const pathname = blobPathFor(slug, sourceName, buffer, extensionFromContentType(contentType));

  if (dryRun) {
    return {
      url: `dry-run://${pathname}`,
      pathname,
    };
  }

  return put(pathname, buffer, {
    access: 'public',
    allowOverwrite: true,
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

async function uploadRemoteImage(entry) {
  let sourceOrigin = '';
  try {
    sourceOrigin = new URL(entry.imageSourceUrl || entry.imageUrl).origin;
  } catch {
    sourceOrigin = '';
  }

  const response = await fetch(entry.imageUrl, {
    headers: {
      accept: 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
      referer: entry.imageSourceUrl || sourceOrigin || 'https://starwars.fandom.com/',
      origin: sourceOrigin || 'https://starwars.fandom.com',
      'user-agent': 'rpg-builder-blob-migrator/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`fetch ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`not an image: ${contentType || 'unknown content type'}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const sourceName = `remote${extensionFromUrl(entry.imageUrl) || extensionFromContentType(contentType)}`;
  return uploadBuffer({
    slug: entry.slug,
    buffer,
    sourceName,
    contentType,
  });
}

async function uploadLocalImage(mapping) {
  const [slug, filename] = mapping;
  const filePath = path.join(localImageDir, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`file not found: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  return uploadBuffer({
    slug,
    buffer,
    sourceName: filename,
    contentType: contentTypeFromExtension(filename),
  });
}

loadEnvFile(rootEnvPath);
loadEnvFile(apiEnvPath);

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI must be defined.');
}

if (!dryRun && !repairDryRun && !process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN must be defined to upload to Vercel Blob.');
}

const schema = new mongoose.Schema(
  {
    systemSlug: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    category: { type: String, default: '', index: true },
    summary: { type: String, default: '' },
    content: { type: String, default: '' },
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    tags: { type: [String], default: [], index: true },
    source: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    imageSourceUrl: { type: String, default: '' },
    imageAttribution: { type: String, default: '' },
    imageProvider: { type: String, default: '' },
    imageUpdatedAt: { type: Date, default: null },
    imageSearchStatus: { type: String, enum: ['pending', 'found', 'missed'], default: 'pending', index: true },
    imageSearchUpdatedAt: { type: Date, default: null },
    visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
  },
  { timestamps: true },
);

const RuleEntry = mongoose.models.RuleEntry || mongoose.model('RuleEntry', schema);

await mongoose.connect(process.env.MONGODB_URI, {
  bufferCommands: false,
  dbName: process.env.MONGODB_DB ?? 'rpg-builder',
});

if (repairDryRun) {
  const dryRunEntries = await RuleEntry.find({
    systemSlug,
    visibility: 'public',
    status: 'published',
    imageUrl: /^dry-run:\/\//,
  });

  let restored = 0;
  let cleared = 0;

  for (const entry of dryRunEntries) {
    const sourceUrl = String(entry.imageSourceUrl ?? '');

    if (/^https?:\/\//.test(sourceUrl)) {
      entry.imageUrl = sourceUrl;
      entry.imageProvider = 'External image';
      entry.imageUpdatedAt = new Date();
      entry.imageSearchStatus = 'found';
      entry.imageSearchUpdatedAt = new Date();
      await entry.save();
      restored += 1;
    } else {
      entry.imageUrl = '';
      entry.imageProvider = '';
      entry.imageUpdatedAt = null;
      entry.imageSearchStatus = 'missed';
      entry.imageSearchUpdatedAt = new Date();
      await entry.save();
      cleared += 1;
    }
  }

  console.log(`Dry-run repair finished. Restored: ${restored}. Cleared: ${cleared}.`);
  await mongoose.disconnect();
  process.exit(0);
}

let mirrored = 0;
let localUploaded = 0;
let skipped = 0;
let failed = 0;

if (mirrorRemote) {
  const remoteEntries = await RuleEntry.find({
    systemSlug,
    visibility: 'public',
    status: 'published',
    imageUrl: /^https?:\/\//,
    imageProvider: { $ne: 'Vercel Blob' },
  }).lean();

  console.log(`Mirroring ${remoteEntries.length} existing remote images to Vercel Blob...`);

  for (const entry of remoteEntries) {
    try {
      const blob = await uploadRemoteImage(entry);
      if (!dryRun) {
        await RuleEntry.updateOne(
          { _id: entry._id },
          {
            $set: {
              imageUrl: blob.url,
              imageSourceUrl: entry.imageSourceUrl || entry.imageUrl,
              imageAttribution: entry.imageAttribution || entry.name,
              imageProvider: 'Vercel Blob',
              imageUpdatedAt: new Date(),
              imageSearchStatus: 'found',
              imageSearchUpdatedAt: new Date(),
            },
          },
        );
      }
      mirrored += 1;
      console.log(`mirrored ${entry.slug}`);
    } catch (error) {
      failed += 1;
      console.log(`failed mirror ${entry.slug}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

if (uploadLocal) {
  console.log(`Uploading ${localImageMappings.length} curated local images to Vercel Blob...`);

  for (const mapping of localImageMappings) {
    const [slug, filename] = mapping;

    try {
      const entry = await RuleEntry.findOne({
        systemSlug,
        slug,
        visibility: 'public',
        status: 'published',
      });

      if (!entry) {
        skipped += 1;
        console.log(`skipped ${slug}: rule not found for ${filename}`);
        continue;
      }

      const blob = await uploadLocalImage(mapping);
      if (!dryRun) {
        await RuleEntry.updateOne(
          { _id: entry._id },
          {
            $set: {
              imageUrl: blob.url,
              imageSourceUrl: `local:${filename}`,
              imageAttribution: filename,
              imageProvider: 'Vercel Blob',
              imageUpdatedAt: new Date(),
              imageSearchStatus: 'found',
              imageSearchUpdatedAt: new Date(),
            },
          },
        );
      }
      localUploaded += 1;
      console.log(`uploaded local ${slug} <- ${filename}`);
    } catch (error) {
      failed += 1;
      console.log(`failed local ${slug}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

console.log(`Blob migration finished. Mirrored: ${mirrored}. Local: ${localUploaded}. Skipped: ${skipped}. Failed: ${failed}.`);
await mongoose.disconnect();
