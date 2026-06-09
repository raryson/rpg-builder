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
    slug: `droides-${slugify(name)}`,
    summary: textSummary(details),
    details,
    category,
    extra: `Fonte OCR: ${file}`,
  });
};

addReference({
  name: 'Tamanho dos Dróides',
  category: 'Construção de dróides',
  file: 'droides-pt-5.txt',
  startPattern: /^# TABELA — TAMANHO DOS DRÓIDES$/m,
  endPattern: /^# TABELA — LOCOMOÇÃO$/m,
});
addReference({
  name: 'Locomoção',
  category: 'Construção de dróides',
  file: 'droides-pt-5.txt',
  startPattern: /^# TABELA — LOCOMOÇÃO$/m,
  endPattern: /^# TABELA — TIPOS DE ANEXO$/m,
});
addReference({
  name: 'Tipos de Anexo',
  category: 'Anexos e acessórios',
  file: 'droides-pt-5.txt',
  startPattern: /^# TABELA — TIPOS DE ANEXO$/m,
  endPattern: /^# MELHORIAS ESPECIAIS$/m,
});
addReference({
  name: 'Melhorias Especiais',
  category: 'Anexos e acessórios',
  file: 'droides-pt-5.txt',
  startPattern: /^# MELHORIAS ESPECIAIS$/m,
  endPattern: /^# SISTEMAS INTERNOS$/m,
});
addReference({
  name: 'Sistemas Internos',
  category: 'Sistemas internos',
  file: 'droides-pt-5.txt',
  startPattern: /^# SISTEMAS INTERNOS$/m,
  endPattern: /^# SISTEMAS ENRIJECIDOS$/m,
});
addReference({
  name: 'Sistemas Enrijecidos',
  category: 'Sistemas internos',
  file: 'droides-pt-5.txt',
  startPattern: /^# SISTEMAS ENRIJECIDOS$/m,
  endPattern: /^# ARMAZENAMENTO INTERNO$/m,
});
addReference({
  name: 'Armazenamento Interno',
  category: 'Sistemas internos',
  file: 'droides-pt-5.txt',
  startPattern: /^# ARMAZENAMENTO INTERNO$/m,
  endPattern: /^# REGRAS DE CONSTRUÇÃO$/m,
});
addReference({
  name: 'Regras de Construção',
  category: 'Construção de dróides',
  file: 'droides-pt-5.txt',
  startPattern: /^# REGRAS DE CONSTRUÇÃO$/m,
  endPattern: /^# Arquivos relacionados$/m,
});
addReference({
  name: 'Armaduras de Dróide',
  category: 'Armaduras de dróide',
  file: 'droides-pt-1.txt',
  startPattern: /^# Tabela 11-6: Armadura de Dróide$/m,
  endPattern: /^# Graus de Dróides$/m,
});
addReference({
  name: 'Graus de Dróides',
  category: 'Construção de dróides',
  file: 'droides-pt-1.txt',
  startPattern: /^# Graus de Dróides$/m,
  endPattern: /^# Modelos Prontos de Dróides$/m,
});

catalog.sort((a, b) => a.category.localeCompare(b.category, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'));

const source = fs.readFileSync(targetFile, 'utf8');
const replacement = `export const sagaDroidDetailsCatalog = ${JSON.stringify(catalog, null, 2)};\n`;
const updated = source.replace(/export const sagaDroidDetailsCatalog = \[[\s\S]*?\];\s*$/m, replacement);

if (updated === source) {
  throw new Error('sagaDroidDetailsCatalog export was not found.');
}

fs.writeFileSync(targetFile, updated, 'utf8');
console.log(`Generated ${catalog.length} droid catalog entries.`);
