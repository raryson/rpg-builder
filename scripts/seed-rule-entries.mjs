import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, 'apps', 'api', '.env.local');
const catalogPath = path.join(root, 'apps', 'web', 'src', 'starWarsSagaCatalogData.ts');

function loadLocalEnv() {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  }
}

function loadCatalog() {
  const source = fs.readFileSync(catalogPath, 'utf8')
    .replace(/export const (\w+) =/g, 'exports.$1 =');
  const sandbox = { exports: {} };
  vm.runInNewContext(source, sandbox, { filename: catalogPath });
  return sandbox.exports;
}

function parseStats(extra = '') {
  const stats = {};
  for (const line of extra.split(/\r?\n/)) {
    const match = line.match(/^([^:]{2,48}):\s*(.+)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();

    if (key === 'dano') stats.damage = value;
    else if (key === 'dano de atordoamento') stats.stunDamage = value;
    else if (key === 'custo' || key === 'preço') stats.cost = value;
    else if (key === 'peso') stats.weight = value;
    else if (key === 'tipo') stats.damageType = value;
    else if (key === 'disponibilidade') stats.availability = value;
    else if (key === 'cadência' || key === 'cadência de tiro') stats.fireRate = value;
    else if (key === 'categoria') stats.category = value;
    else stats[key.replace(/\s+/g, '_')] = value;
  }

  return stats;
}

function sourceFromExtra(extra = '') {
  return extra.split(/\r?\n/).find((line) => line.startsWith('Fonte OCR:'))?.replace('Fonte OCR:', '').trim() ?? '';
}

function tagsFor(item, type) {
  return Array.from(new Set([
    type,
    item.category,
    ...(item.classRestriction ?? []),
    ...String(item.name).toLowerCase().split(/\s+/).filter((part) => part.length > 3),
  ].filter(Boolean).map((tag) => String(tag).toLowerCase())));
}

function mapDetailItem(item, type) {
  return {
    systemSlug: 'star-wars-saga',
    type,
    name: item.name,
    slug: item.slug,
    category: item.category ?? '',
    summary: item.summary ?? '',
    content: item.details ?? '',
    stats: parseStats(item.extra ?? ''),
    tags: tagsFor(item, type),
    source: sourceFromExtra(item.extra ?? ''),
    visibility: 'public',
    status: 'published',
  };
}

loadLocalEnv();

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI must be defined.');
}

const catalog = loadCatalog();
const entries = [
  ...(catalog.sagaTalentDetailsCatalog ?? []).map((item) => mapDetailItem(item, 'talent')),
  ...(catalog.sagaEquipmentDetailsCatalog ?? []).map((item) => mapDetailItem(item, 'equipment')),
  ...(catalog.sagaVehicleDetailsCatalog ?? []).map((item) => mapDetailItem(item, 'vehicle')),
  ...(catalog.sagaDroidDetailsCatalog ?? []).map((item) => mapDetailItem(item, 'droid')),
];

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
    visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
  },
  { timestamps: true },
);

schema.index({ systemSlug: 1, type: 1, slug: 1 }, { unique: true });
schema.index({ systemSlug: 1, visibility: 1, status: 1, type: 1, category: 1, name: 1 });
schema.index({ name: 'text', summary: 'text', content: 'text', tags: 'text' });

const RuleEntry = mongoose.models.RuleEntry || mongoose.model('RuleEntry', schema);

await mongoose.connect(process.env.MONGODB_URI, {
  bufferCommands: false,
  dbName: process.env.MONGODB_DB ?? 'rpg-builder',
});

for (const entry of entries) {
  await RuleEntry.findOneAndUpdate(
    {
      systemSlug: entry.systemSlug,
      type: entry.type,
      slug: entry.slug,
    },
    { $set: entry },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}

console.log(`Seeded ${entries.length} Star Wars Saga rule entries.`);
await mongoose.disconnect();
