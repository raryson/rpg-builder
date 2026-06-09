import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contextDir = path.join(root, 'context', 'pt-br');
const targetFile = path.join(root, 'apps', 'web', 'src', 'starWarsSagaCatalogData.ts');

const read = (file) => fs.readFileSync(path.join(contextDir, file), 'utf8').replace(/\r\n/g, '\n');

const stripFenceIds = (text) => text.replace(/```txt\s+id="[^"]+"/g, '```txt');

const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const textSummary = (markdown) =>
  markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\|.*\|$/gm, ' ')
    .replace(/^#+\s+/gm, ' ')
    .replace(/[*_`>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);

const lookupKey = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(d[aeo]s?|de)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sectionDetails = (section) => section.body.replace(/^##\s+.+\n+/, '## Detalhes\n\n');

const sectionMap = (sections) => new Map(sections.map((section) => [lookupKey(section.title), sectionDetails(section)]));

const findExtraDetails = (detailsMap, name) => {
  const key = lookupKey(name);
  if (detailsMap.has(key)) return detailsMap.get(key);
  for (const [candidate, details] of detailsMap) {
    if (candidate.length > 4 && (key.includes(candidate) || candidate.includes(key))) {
      return details;
    }
  }
  return undefined;
};

const parseTableFields = (section) => {
  const fields = {};
  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 2) continue;
    const [key, value] = cells;
    if (!key || /^-+$/.test(key.replace(/[:\s]/g, ''))) continue;
    fields[key] = value;
  }
  return fields;
};

const parseMarkdownTable = (markdown) => {
  const lines = markdown.split('\n').filter((line) => line.trim().startsWith('|'));
  if (lines.length < 2) return [];
  const parseRow = (line) =>
    line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
  const headers = parseRow(lines[0]);
  return lines.slice(2).map((line) => {
    const cells = parseRow(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
  });
};

const markdownTableFromObject = (row) => {
  const entries = Object.entries(row).filter(([, value]) => value);
  return ['| Campo | Valor |', '| ----- | ----- |', ...entries.map(([key, value]) => `| ${key} | ${value} |`)].join('\n');
};

const addCatalogItem = ({ name, category, details, summary, extra, slugPrefix = 'droides' }) => {
  catalog.push({
    name,
    slug: `${slugPrefix}-${slugify(name)}`,
    summary: summary || textSummary(details),
    details,
    category,
    extra,
  });
};

const splitH2Sections = (markdown) => {
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  return matches.map((match, index) => {
    const start = match.index;
    const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    return {
      title: match[1].trim(),
      body: markdown.slice(start, end).trim(),
    };
  });
};

const addRowsFromTable = ({ markdown, nameKey, category, source, titlePrefix = '', extraDetails = new Map() }) => {
  for (const row of parseMarkdownTable(markdown)) {
    const name = row[nameKey];
    if (!name || /^-+$/.test(name)) continue;
    const details = [`## ${titlePrefix}${name}`, markdownTableFromObject(row), findExtraDetails(extraDetails, name)].filter(Boolean).join('\n\n');
    const summary = Object.entries(row)
      .filter(([key]) => key !== nameKey)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
    addCatalogItem({
      name: `${titlePrefix}${name}`,
      category,
      summary,
      details,
      extra: `Fonte OCR: ${source}`,
    });
  }
};

const modelFiles = [
  ['droides-pt-2.txt', 'Dróides civis'],
  ['droides-pt-3.txt', 'Dróides militares'],
  ['droides-pt-4.txt', 'Dróides especiais'],
];

const catalog = [];

for (const [file, category] of modelFiles) {
  const content = read(file);
  const matches = [...content.matchAll(/^#\s+\d+\.\s+(.+)$/gm)];
  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index;
    const end = index + 1 < matches.length ? matches[index + 1].index : content.length;
    const section = stripFenceIds(content.slice(start, end).trim());
    const fields = parseTableFields(section);
    const baseName = fields.Nome || matches[index][1].replace(/\s+—\s+/g, ' ');
    const series = fields.Série ? ` ${fields.Série}` : '';
    const name = `${baseName}${series}`.replace(/\s+/g, ' ').trim();
    const summaryParts = [fields.Papel, fields.Categoria, fields.ND && `ND ${fields.ND}`, fields.Jogável && `Jogável: ${fields.Jogável}`, fields.Custo].filter(Boolean);

    catalog.push({
      name,
      slug: slugify(name),
      summary: summaryParts.join(' | ') || textSummary(section),
      details: section,
      category,
      extra: `Fonte OCR: ${file}`,
    });
  }
}

const extractBetween = (content, startPattern, endPattern) => {
  const startMatch = content.match(startPattern);
  if (!startMatch || startMatch.index === undefined) return '';
  const rest = content.slice(startMatch.index);
  if (!endPattern) return rest.trim();
  const endMatch = rest.slice(startMatch[0].length).match(endPattern);
  if (!endMatch || endMatch.index === undefined) return rest.trim();
  return rest.slice(0, startMatch[0].length + endMatch.index).trim();
};

const addReference = ({ name, category, file, startPattern, endPattern }) => {
  const details = stripFenceIds(extractBetween(read(file), startPattern, endPattern));
  if (!details) return;
  catalog.push({
    name,
    slug: `droides-doc-${slugify(name)}`,
    summary: textSummary(details),
    details,
    category,
    extra: `Fonte OCR: ${file}`,
  });
};

addReference({
  name: 'Tamanho dos Dróides',
  category: 'Documentação de dróides',
  file: 'droides-pt-5.txt',
  startPattern: /^# TABELA — TAMANHO DOS DRÓIDES$/m,
  endPattern: /^# TABELA — LOCOMOÇÃO$/m,
});
addReference({
  name: 'Locomoção',
  category: 'Documentação de dróides',
  file: 'droides-pt-5.txt',
  startPattern: /^# TABELA — LOCOMOÇÃO$/m,
  endPattern: /^# TABELA — TIPOS DE ANEXO$/m,
});
addReference({
  name: 'Regras de Construção',
  category: 'Documentação de dróides',
  file: 'droides-pt-5.txt',
  startPattern: /^# REGRAS DE CONSTRUÇÃO$/m,
  endPattern: /^# Arquivos relacionados$/m,
});
addReference({
  name: 'Graus de Dróides',
  category: 'Documentação de dróides',
  file: 'droides-pt-1.txt',
  startPattern: /^# Graus de Dróides$/m,
  endPattern: /^# Modelos Prontos de Dróides$/m,
});

const droidTables = read('droides-pt-1.txt');
const droidReference = read('droides-pt-5.txt');

const sizeTable = extractBetween(droidTables, /^# Tabela 11-2: Tamanho dos Dróides$/m, /^# Tabela 11-3: Locomoção de Dróide$/m);
const locomotionTable = extractBetween(droidTables, /^# Tabela 11-3: Locomoção de Dróide$/m, /^# Tabela 11-4: Dano dos Anexos de Dróides$/m);
const gradeTable = extractBetween(droidTables, /^# Graus de Dróides$/m, /^# Modelos Prontos de Dróides$/m);
const accessoryTable = extractBetween(droidTables, /^# Tabela 11-5: Acessórios de Dróides$/m, /^# Tabela 11-6: Armadura de Dróide$/m);
const annexesTable = extractBetween(accessoryTable, /^## Anexos$/m, /^## Melhorias de Anexos$/m);
const annexImprovementsTable = extractBetween(accessoryTable, /^## Melhorias de Anexos$/m, /^## Comunicação e Diagnóstico$/m);
const communicationTable = extractBetween(accessoryTable, /^## Comunicação e Diagnóstico$/m, /^## Sistemas Enrijecidos$/m);
const hardenedTable = extractBetween(accessoryTable, /^## Sistemas Enrijecidos$/m, /^## Armazenamento Interno$/m);
const storageTable = extractBetween(accessoryTable, /^## Armazenamento Interno$/m, /^---$/m);

const improvementsReference = extractBetween(droidReference, /^# MELHORIAS ESPECIAIS$/m, /^# SISTEMAS INTERNOS$/m);
const improvementDetails = sectionMap(splitH2Sections(improvementsReference));
const internalSystemsReference = extractBetween(droidReference, /^# SISTEMAS INTERNOS$/m, /^# SISTEMAS ENRIJECIDOS$/m);
const internalSystemDetails = sectionMap(splitH2Sections(internalSystemsReference));
const storageReference = extractBetween(droidReference, /^# ARMAZENAMENTO INTERNO$/m, /^# REGRAS DE CONSTRUÇÃO$/m);
const storageDetails = sectionMap(splitH2Sections(storageReference));

addRowsFromTable({
  markdown: sizeTable,
  nameKey: 'Tamanho do Dróide',
  category: 'Tamanhos de dróide',
  source: 'droides-pt-1.txt',
});
addRowsFromTable({
  markdown: locomotionTable,
  nameKey: 'Locomoção',
  category: 'Locomoções de dróide',
  source: 'droides-pt-1.txt',
});
addRowsFromTable({
  markdown: gradeTable,
  nameKey: 'Grau',
  category: 'Graus de dróide',
  source: 'droides-pt-1.txt',
});
addRowsFromTable({
  markdown: annexesTable,
  nameKey: 'Equipamento',
  category: 'Anexos de dróide',
  source: 'droides-pt-1.txt',
});
addRowsFromTable({
  markdown: annexImprovementsTable,
  nameKey: 'Equipamento',
  category: 'Melhorias de anexos',
  source: 'droides-pt-1.txt + droides-pt-5.txt',
  extraDetails: improvementDetails,
});
addRowsFromTable({
  markdown: communicationTable,
  nameKey: 'Equipamento',
  category: 'Sistemas internos',
  source: 'droides-pt-1.txt + droides-pt-5.txt',
  extraDetails: internalSystemDetails,
});
addRowsFromTable({
  markdown: hardenedTable,
  nameKey: 'Equipamento',
  category: 'Sistemas enrijecidos',
  source: 'droides-pt-1.txt',
});
addRowsFromTable({
  markdown: storageTable,
  nameKey: 'Equipamento',
  category: 'Armazenamento interno',
  source: 'droides-pt-1.txt + droides-pt-5.txt',
  extraDetails: storageDetails,
});

const armorBlock = extractBetween(droidTables, /^# Tabela 11-6: Armadura de Dróide$/m, /^# Graus de Dróides$/m);
for (const section of splitH2Sections(armorBlock)) {
  addRowsFromTable({
    markdown: section.body,
    nameKey: 'Armadura',
    category: 'Armaduras de dróide',
    source: 'droides-pt-1.txt',
    titlePrefix: `${section.title}: `,
  });
}

catalog.sort((a, b) => a.category.localeCompare(b.category, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'));

const source = fs.readFileSync(targetFile, 'utf8');
const replacement = `export const sagaDroidDetailsCatalog = ${JSON.stringify(catalog, null, 2)};\n`;
const updated = source.replace(/export const sagaDroidDetailsCatalog = \[[\s\S]*?\];\s*$/m, replacement);

if (updated === source) {
  throw new Error('sagaDroidDetailsCatalog export was not found.');
}

fs.writeFileSync(targetFile, updated, 'utf8');
console.log(`Generated ${catalog.length} droid catalog entries.`);
