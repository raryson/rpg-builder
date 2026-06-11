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
  const entry = {
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

  if (item.imageUrl) {
    entry.imageUrl = item.imageUrl;
    entry.imageSourceUrl = item.imageSourceUrl ?? '';
    entry.imageAttribution = item.imageAttribution ?? '';
    entry.imageProvider = item.imageProvider ?? '';
    entry.imageSearchStatus = item.imageSearchStatus ?? 'found';
  }

  return entry;
}

function isDroidAssemblyItem(item) {
  return String(item.slug ?? '').startsWith('droides-');
}

function buildDroidAssemblyEntry(items) {
  const grouped = new Map();

  for (const item of items) {
    const category = item.category || 'Montagem';
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(item);
  }

  const sections = Array.from(grouped.entries()).map(([category, categoryItems]) => {
    const rules = categoryItems.map((item) => [
      `### ${item.name}`,
      '',
      item.summary ? `**Resumo:** ${item.summary}` : '',
      '',
      item.details ?? '',
    ].filter(Boolean).join('\n'));

    return [`## ${category}`, '', ...rules].join('\n');
  });

  return {
    systemSlug: 'star-wars-saga',
    type: 'droid',
    name: 'Montagem de Dróide',
    slug: 'montagem-de-droide',
    category: 'Construção de dróides',
    summary: 'Regras de construção, tamanho, locomoção, armaduras, anexos, armazenamento interno e sistemas usados para montar ou modificar dróides.',
    content: [
      '# Montagem de Dróide',
      '',
      'Use esta página como referência central para construir, adaptar e equipar dróides. Ela reúne as regras de tamanho, locomoção, armadura, anexos, armazenamento interno e melhorias que antes ficavam espalhadas em várias páginas menores.',
      '',
      ...sections,
    ].join('\n'),
    stats: {
      sections: items.length,
    },
    tags: [
      'droid',
      'montagem',
      'construção',
      'anexos',
      'locomoção',
      'armadura',
      'sistemas',
    ],
    source: 'Fonte OCR: droides-pt-1.txt + droides-pt-5.txt',
    imageUrl: 'https://www.theleonardo.org/wp-content/uploads/2017/02/Anakin-Building-C-3PO.jpg',
    imageSourceUrl: 'https://theleonardo.org/androids-help-bridge-gap-fiction-real-life/',
    imageAttribution: 'Anakin Building C-3PO',
    imageProvider: 'The Leonardo',
    imageUpdatedAt: new Date(),
    imageSearchStatus: 'found',
    imageSearchUpdatedAt: new Date(),
    visibility: 'public',
    status: 'published',
  };
}

loadLocalEnv();

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI must be defined.');
}

const catalog = loadCatalog();
const droidAssemblyItems = (catalog.sagaDroidDetailsCatalog ?? []).filter(isDroidAssemblyItem);
const droidCatalogItems = (catalog.sagaDroidDetailsCatalog ?? []).filter((item) => !isDroidAssemblyItem(item));
const archivedRuleSlugs = [
  { type: 'feat', slug: 'proficiencia-armas-corpo-a-corpo-avancadas' },
];
const entries = [
  ...(catalog.sagaClassDetailsCatalog ?? []).map((item) => mapDetailItem(item, 'class')),
  ...(catalog.sagaSkillDetailsCatalog ?? []).map((item) => mapDetailItem(item, 'skill')),
  ...(catalog.sagaFeatDetailsCatalog ?? []).map((item) => mapDetailItem(item, 'feat')),
  ...(catalog.sagaTalentDetailsCatalog ?? []).map((item) => mapDetailItem(item, 'talent')),
  ...(catalog.sagaEquipmentDetailsCatalog ?? []).map((item) => mapDetailItem(item, 'equipment')),
  ...(catalog.sagaVehicleDetailsCatalog ?? []).map((item) => mapDetailItem(item, 'vehicle')),
  ...droidCatalogItems.map((item) => mapDetailItem(item, 'droid')),
  buildDroidAssemblyEntry(droidAssemblyItems),
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

const archivedAssemblyEntries = await RuleEntry.updateMany(
  {
    systemSlug: 'star-wars-saga',
    type: 'droid',
    slug: { $in: droidAssemblyItems.map((item) => item.slug) },
  },
  {
    $set: {
      status: 'archived',
    },
  },
);

const archivedRemovedEntries = await RuleEntry.updateMany(
  {
    systemSlug: 'star-wars-saga',
    $or: archivedRuleSlugs,
  },
  {
    $set: {
      status: 'archived',
    },
  },
);

console.log(`Seeded ${entries.length} Star Wars Saga rule entries. Archived ${archivedAssemblyEntries.modifiedCount} droid assembly fragments and ${archivedRemovedEntries.modifiedCount} removed rules.`);
await mongoose.disconnect();
