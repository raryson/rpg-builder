import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, 'apps', 'api', '.env.local');
const apiEndpoint = 'https://starwars.fandom.com/api.php';
const commonsEndpoint = 'https://commons.wikimedia.org/w/api.php';
const defaultSystem = 'star-wars-saga';

function loadLocalEnv() {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function cleanSearchPart(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function applyPhraseTranslations(value = '') {
  let translated = ` ${cleanSearchPart(value).toLowerCase()} `;
  const phraseTranslations = [
    [' pistola blaster de bolso ', ' hold-out blaster pistol '],
    [' pistola blaster esportiva ', ' sporting blaster pistol '],
    [' pistola blaster pesada ', ' heavy blaster pistol '],
    [' pistola blaster ', ' blaster pistol '],
    [' rifle blaster esportivo ', ' sporting blaster rifle '],
    [' rifle blaster pesado ', ' heavy blaster rifle '],
    [' rifle blaster ', ' blaster rifle '],
    [' rifle de ions ', ' ion rifle '],
    [' rifle de projeteis ', ' slugthrower rifle '],
    [' carabina blaster ', ' blaster carbine '],
    [' canhao blaster ', ' blaster cannon '],
    [' blaster de repeticao leve ', ' light repeating blaster '],
    [' blaster de repeticao pesada ', ' heavy repeating blaster '],
    [' blaster e web de repeticao ', ' e-web repeating blaster '],
    [' sabre de luz duplo ', ' double-bladed lightsaber '],
    [' sabre de luz curto ', ' short lightsaber '],
    [' sabre de luz ', ' lightsaber '],
    [' bastao eletrico ', ' electrostaff '],
    [' lanca chamas ', ' flamethrower '],
    [' granada de fragmentacao ', ' fragmentation grenade '],
    [' granada de concussao ', ' concussion grenade '],
    [' granada ', ' grenade '],
    [' detonador termico ', ' thermal detonator '],
    [' traje de piloto ', ' flight suit '],
    [' capacete ', ' helmet '],
    [' colete blindado ', ' armored vest '],
    [' macacao de combate ', ' combat jumpsuit '],
    [' mira telescopica ', ' targeting scope '],
    [' coldre ', ' holster '],
    [' bandoleira ', ' bandolier '],
    [' kit de ferramentas ', ' tool kit '],
    [' medpac ', ' medpac '],
    [' sensor ', ' sensor '],
    [' comunicador ', ' comlink '],
    [' datapad ', ' datapad '],
    [' astromec ', ' astromech '],
    [' droide de protocolo ', ' protocol droid '],
    [' droide de batalha ', ' battle droid '],
    [' droide medico ', ' medical droid '],
    [' droide sonda ', ' probe droid '],
    [' droide aranha anao ', ' dwarf spider droid '],
    [' droide caranguejo ', ' crab droid '],
    [' droide destrier ', ' droideka '],
    [' droide destroier ', ' droideka '],
    [' magnaguarda ', ' magnaguard '],
    [' montagem de droide ', ' droid assembly '],
    [' construcao de droides ', ' droid construction '],
    [' anexo telescopico ', ' telescopic appendage '],
    [' pes magneticos ', ' magnetic feet '],
    [' garras para escalar ', ' climbing claws '],
    [' sistemas enrijecidos ', ' hardened systems '],
    [' ferramenta ', ' tool appendage '],
    [' garra ', ' claw gripper '],
    [' mao ', ' robotic hand '],
    [' instrumento ', ' instrument appendage '],
    [' sonda ', ' probe '],
    [' armadura ', ' armor '],
    [' revestimento ', ' plating '],
    [' locomocao ', ' locomotion '],
    [' andante ', ' walking locomotion '],
    [' esteira ', ' tread locomotion '],
    [' flutuante ', ' repulsorlift locomotion '],
    [' voador ', ' flying locomotion '],
  ];

  for (const [source, target] of phraseTranslations) {
    translated = translated.replaceAll(source, target);
  }

  const wordTranslations = new Map([
    ['leve', 'light'],
    ['media', 'medium'],
    ['medio', 'medium'],
    ['pesada', 'heavy'],
    ['pesado', 'heavy'],
    ['curto', 'short'],
    ['curta', 'short'],
    ['duplo', 'double'],
    ['dupla', 'double'],
    ['esportivo', 'sporting'],
    ['esportiva', 'sporting'],
    ['bolso', 'hold-out'],
    ['projetil', 'slugthrower'],
    ['projeteis', 'slugthrower'],
    ['ion', 'ion'],
    ['ions', 'ion'],
    ['vibora', 'viper'],
    ['droide', 'droid'],
    ['droides', 'droids'],
    ['arma', 'weapon'],
    ['armas', 'weapons'],
    ['veiculo', 'vehicle'],
    ['veiculos', 'vehicles'],
    ['blindado', 'armored'],
    ['blindados', 'armored'],
    ['transporte', 'transport'],
    ['andador', 'walker'],
    ['canhao', 'cannon'],
    ['canhoes', 'cannons'],
    ['laser', 'laser'],
    ['foguete', 'rocket'],
    ['misseis', 'missiles'],
    ['missil', 'missile'],
    ['protocolo', 'protocol'],
    ['medico', 'medical'],
    ['batalha', 'battle'],
    ['trabalho', 'labor'],
    ['astromec', 'astromech'],
    ['militar', 'military'],
    ['civil', 'civilian'],
  ]);

  translated = translated
    .trim()
    .split(/\s+/)
    .map((part) => wordTranslations.get(part) ?? part)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return translated;
}

function englishNameCandidatesFor(entry) {
  const rawCandidates = [
    applyPhraseTranslations(entry.name),
    applyPhraseTranslations(`${entry.name} ${entry.category ?? ''}`),
  ];

  const contentTitle = String(entry.content ?? '').match(/^##\s+([A-Z][A-Za-z0-9' -]{4,80})$/m)?.[1];
  if (contentTitle) rawCandidates.push(contentTitle);

  return Array.from(new Set(
    rawCandidates
      .map((candidate) => candidate.replace(/\s+/g, ' ').trim())
      .filter((candidate) => candidate.length > 1),
  ));
}

function englishHintsFor(entry) {
  const name = cleanSearchPart(entry.name).toLowerCase();
  const hints = [...englishNameCandidatesFor(entry)];

  const replacements = [
    ['pistola blaster de bolso', 'hold-out blaster pistol'],
    ['pistola blaster esportiva', 'sporting blaster pistol'],
    ['pistola blaster pesada', 'heavy blaster pistol'],
    ['pistola blaster', 'blaster pistol'],
    ['rifle blaster esportivo', 'sporting blaster rifle'],
    ['rifle blaster pesado', 'heavy blaster rifle'],
    ['rifle blaster', 'blaster rifle'],
    ['rifle de ions', 'ion rifle'],
    ['rifle de projeteis', 'slugthrower rifle'],
    ['carabina blaster', 'blaster carbine'],
    ['canhao blaster', 'blaster cannon'],
    ['sabre de luz duplo', 'double-bladed lightsaber'],
    ['sabre de luz curto', 'short lightsaber'],
    ['sabre de luz', 'lightsaber'],
    ['lanca chamas', 'flamethrower'],
    ['granada', 'grenade'],
    ['sonda', 'probe droid'],
    ['garra', 'droid claw appendage'],
    ['mao', 'droid hand appendage'],
    ['ferramenta', 'droid tool appendage'],
    ['instrumento', 'droid instrument appendage'],
  ];

  for (const [source, target] of replacements) {
    if (name.includes(source)) hints.push(target);
  }

  const contentTitle = String(entry.content ?? '').match(/^##\s+([A-Z][A-Za-z0-9' -]{4,80})$/m)?.[1];
  if (contentTitle) hints.push(contentTitle);

  return Array.from(new Set(hints));
}

function genericImageTermsFor(entry) {
  const name = cleanSearchPart(entry.name).toLowerCase();
  const category = cleanSearchPart(entry.category).toLowerCase();
  const content = cleanSearchPart(entry.content).toLowerCase();
  const terms = [];

  const isDroidPart = entry.type === 'droid' && (
    category.includes('anexo')
    || category.includes('armadura')
    || category.includes('locomocao')
    || content.includes('sistemas instalados')
  );

  if (!isDroidPart) return terms;

  if (name.includes('garra')) terms.push('robot claw gripper', 'mechanical claw gripper', 'robot gripper');
  if (name.includes('mao')) terms.push('robot hand', 'prosthetic robot hand');
  if (name.includes('ferramenta')) terms.push('robot tool arm', 'robotic tool changer');
  if (name.includes('instrumento')) terms.push('robot instrument arm', 'robotic manipulator');
  if (name.includes('esteira')) terms.push('tracked robot', 'robot tank treads');
  if (name.includes('voador') || name.includes('flutuante')) terms.push('flying robot drone', 'probe drone');
  if (name.includes('armadura') || name.includes('revestimento') || name.includes('corpo')) terms.push('robot armor plating', 'armored robot');
  if (name.includes('magnetico')) terms.push('magnetic robot feet');
  if (name.includes('salto')) terms.push('jumping robot');
  if (name.includes('telescopico')) terms.push('telescopic robot arm');

  return Array.from(new Set(terms));
}

function searchTermsFor(entry) {
  const name = cleanSearchPart(entry.name);
  const category = cleanSearchPart(entry.category);
  const englishNames = englishNameCandidatesFor(entry);
  const englishHints = englishHintsFor(entry);
  const typeHint = {
    droid: 'droid',
    equipment: 'weapon equipment',
    talent: 'Saga Edition talent',
    vehicle: 'vehicle',
  }[entry.type] ?? entry.type;

  return Array.from(new Set([
    ...englishNames.map((hint) => `${hint} Star Wars`),
    ...englishNames,
    ...englishHints.map((hint) => `${hint} Star Wars`),
    `${name} ${typeHint}`,
    `${name} ${category} Star Wars`,
    `${name} Star Wars`,
    name,
  ].filter((term) => term.trim().length > 1)));
}

function importantTokens(value = '') {
  const weakTokens = new Set([
    'star',
    'wars',
    'saga',
    'edition',
    'weapon',
    'equipment',
    'droid',
    'appendage',
    'vehicle',
    'talent',
    'com',
    'de',
    'da',
    'do',
    'das',
    'dos',
    'para',
    'um',
    'uma',
  ]);

  return cleanSearchPart(value)
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 3 && !weakTokens.has(token));
}

function titleMatchesEntry(pageTitle = '', entry) {
  const titleTokens = new Set(importantTokens(pageTitle));
  const hintTokens = englishHintsFor(entry).flatMap(importantTokens);
  const nameTokens = importantTokens(entry.name);
  const acceptedTokens = new Set([...hintTokens, ...nameTokens]);

  if (acceptedTokens.size === 0) return false;

  return [...acceptedTokens].some((token) => titleTokens.has(token));
}

function mediaWikiUrl(params, endpoint = apiEndpoint) {
  const searchParams = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    ...params,
  });
  return `${endpoint}?${searchParams.toString()}`;
}

function isUsefulImageUrl(url = '') {
  const lowerUrl = url.toLowerCase();
  return Boolean(url)
    && !lowerUrl.includes('placeholder')
    && !lowerUrl.includes('no_image')
    && !lowerUrl.includes('questionmark')
    && !lowerUrl.endsWith('.svg');
}

function sortCandidatePages(pages = []) {
  return [...pages]
    .filter((page) => page?.title && !/\b(category|template|list of|disambiguation)\b/i.test(page.title))
    .sort((a, b) => {
      const imageScore = Number(Boolean(b.thumbnail?.source || b.original?.source)) - Number(Boolean(a.thumbnail?.source || a.original?.source));
      if (imageScore !== 0) return imageScore;
      return (a.index ?? 999) - (b.index ?? 999);
    });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'user-agent': 'rpg-builder-image-enricher/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`MediaWiki returned ${response.status}`);
  }

  return response.json();
}

async function findImageFromPageFiles(pageId) {
  const pageImagesUrl = mediaWikiUrl({
    prop: 'images',
    pageids: String(pageId),
    imlimit: '20',
  });
  const pageImagesPayload = await fetchJson(pageImagesUrl);
  const images = pageImagesPayload?.query?.pages?.[0]?.images ?? [];
  const titles = images
    .map((image) => image.title)
    .filter((title) => /\.(jpe?g|png|webp)$/i.test(title))
    .filter((title) => !/\b(icon|logo|symbol|map|flag|audio|appearance)\b/i.test(title))
    .slice(0, 5);

  if (titles.length === 0) return null;

  const imageInfoUrl = mediaWikiUrl({
    prop: 'imageinfo',
    titles: titles.join('|'),
    iiprop: 'url',
    iiurlwidth: '900',
  });
  const imageInfoPayload = await fetchJson(imageInfoUrl);
  const imagePages = imageInfoPayload?.query?.pages ?? [];
  const imagePage = imagePages.find((page) => isUsefulImageUrl(page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url));
  const imageInfo = imagePage?.imageinfo?.[0];

  if (!imageInfo) return null;

  return {
    imageUrl: imageInfo.thumburl || imageInfo.url,
  };
}

async function findGenericCommonsImage(entry) {
  for (const term of genericImageTermsFor(entry)) {
    const searchUrl = mediaWikiUrl({
      generator: 'search',
      gsrsearch: `filetype:bitmap ${term}`,
      gsrnamespace: '6',
      gsrlimit: '8',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '900',
    }, commonsEndpoint);
    const payload = await fetchJson(searchUrl);
    const pages = sortCandidatePages(payload?.query?.pages ?? []);

    for (const page of pages) {
      const imageInfo = page?.imageinfo?.[0];
      const imageUrl = imageInfo?.thumburl || imageInfo?.url;
      if (!isUsefulImageUrl(imageUrl)) continue;

      return {
        imageUrl,
        imageSourceUrl: imageInfo?.descriptionurl || page.fullurl || '',
        imageAttribution: page.title?.replace(/^File:/, '') || term,
        imageProvider: 'Wikimedia Commons',
      };
    }

    await sleep(250);
  }

  return null;
}

async function findRuleImage(entry) {
  const genericFirstImage = await findGenericCommonsImage(entry);
  if (genericFirstImage) return genericFirstImage;

  for (const term of searchTermsFor(entry)) {
    const searchUrl = mediaWikiUrl({
      generator: 'search',
      gsrsearch: term,
      gsrnamespace: '0',
      gsrlimit: '4',
      prop: 'pageimages|info',
      piprop: 'thumbnail|original',
      pithumbsize: '900',
      inprop: 'url',
    });
    const payload = await fetchJson(searchUrl);
    const pages = sortCandidatePages(payload?.query?.pages ?? []);

    for (const page of pages) {
      if (!titleMatchesEntry(page.title, entry)) continue;

      const directImageUrl = page.thumbnail?.source || page.original?.source;
      const fileImage = directImageUrl ? null : await findImageFromPageFiles(page.pageid);
      const imageUrl = directImageUrl || fileImage?.imageUrl;

      if (!isUsefulImageUrl(imageUrl)) continue;

      return {
        imageUrl,
        imageSourceUrl: page.fullurl || '',
        imageAttribution: page.title || '',
        imageProvider: 'Wookieepedia',
      };
    }

    await sleep(250);
  }

  return null;
}

loadLocalEnv();

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI must be defined.');
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
const force = process.env.IMAGE_ENRICH_FORCE === '1';
const clearMisses = process.env.IMAGE_ENRICH_CLEAR_MISSES === '1';
const statusOnly = process.env.IMAGE_ENRICH_STATUS === '1';
const resetOnly = process.env.IMAGE_ENRICH_RESET === '1';
const retryMisses = process.env.IMAGE_ENRICH_RETRY_MISSES === '1';
const limit = Math.max(Number(process.env.IMAGE_ENRICH_LIMIT ?? '400'), 1);
const systemSlug = process.env.IMAGE_ENRICH_SYSTEM ?? defaultSystem;
const slugs = (process.env.IMAGE_ENRICH_SLUGS ?? '')
  .split(',')
  .map((slug) => slug.trim())
  .filter(Boolean);

await mongoose.connect(process.env.MONGODB_URI, {
  bufferCommands: false,
  dbName: process.env.MONGODB_DB ?? 'rpg-builder',
});

if (resetOnly) {
  const resetResult = await RuleEntry.updateMany(
    {
      systemSlug,
      visibility: 'public',
      status: 'published',
    },
    {
      $set: {
        imageUrl: '',
        imageSourceUrl: '',
        imageAttribution: '',
        imageProvider: '',
        imageUpdatedAt: null,
        imageSearchStatus: 'pending',
        imageSearchUpdatedAt: null,
      },
    },
  );

  console.log(`Image reset for ${systemSlug}: ${resetResult.modifiedCount} published entries cleaned.`);
  await mongoose.disconnect();
  process.exit(0);
}

if (statusOnly) {
  const total = await RuleEntry.countDocuments({
    systemSlug,
    visibility: 'public',
    status: 'published',
  });
  const withImages = await RuleEntry.countDocuments({
    systemSlug,
    visibility: 'public',
    status: 'published',
    imageUrl: { $nin: ['', null] },
  });
  const missed = await RuleEntry.countDocuments({
    systemSlug,
    visibility: 'public',
    status: 'published',
    imageSearchStatus: 'missed',
    $or: [
      { imageUrl: { $exists: false } },
      { imageUrl: '' },
      { imageUrl: null },
    ],
  });

  console.log(`Image status for ${systemSlug}: ${withImages}/${total} with images. Missed: ${missed}. Pending: ${total - withImages - missed}.`);
  await mongoose.disconnect();
  process.exit(0);
}

const filter = {
  systemSlug,
  visibility: 'public',
  status: 'published',
};

if (slugs.length > 0) {
  filter.slug = { $in: slugs };
}

if (!force) {
  filter.$and = [
    {
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: '' },
        { imageUrl: null },
      ],
    },
  ];

  if (!retryMisses) {
    filter.$and.push({
      $or: [
        { imageSearchStatus: { $exists: false } },
        { imageSearchStatus: { $ne: 'missed' } },
      ],
    });
  }
}

const entries = await RuleEntry.find(filter)
  .sort({ type: 1, category: 1, name: 1 })
  .limit(limit)
  .lean();

let updated = 0;
let missed = 0;

console.log(`Searching images for ${entries.length} ${systemSlug} rule entries...`);

for (const entry of entries) {
  try {
    const image = await findRuleImage(entry);

    if (!image) {
      missed += 1;
      if (clearMisses) {
        await RuleEntry.updateOne(
          { _id: entry._id },
          {
            $set: {
              imageUrl: '',
              imageSourceUrl: '',
              imageAttribution: '',
              imageProvider: '',
              imageUpdatedAt: null,
              imageSearchStatus: 'missed',
              imageSearchUpdatedAt: new Date(),
            },
          },
        );
      } else {
        await RuleEntry.updateOne(
          { _id: entry._id },
          {
            $set: {
              imageSearchStatus: 'missed',
              imageSearchUpdatedAt: new Date(),
            },
          },
        );
      }
      console.log(`missed ${entry.slug} (${entry.name})`);
      continue;
    }

    await RuleEntry.updateOne(
      { _id: entry._id },
      {
        $set: {
          ...image,
          imageUpdatedAt: new Date(),
          imageSearchStatus: 'found',
          imageSearchUpdatedAt: new Date(),
        },
      },
    );

    updated += 1;
    console.log(`updated ${entry.slug} -> ${image.imageAttribution}`);
  } catch (error) {
    missed += 1;
    console.log(`failed ${entry.slug}: ${error instanceof Error ? error.message : String(error)}`);
  }

  await sleep(350);
}

console.log(`Image enrichment finished. Updated: ${updated}. Missed: ${missed}.`);
await mongoose.disconnect();
