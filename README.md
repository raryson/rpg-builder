# RPG Builder

Aplicacao para criar, versionar e salvar fichas de RPG. O primeiro sistema suportado e Star Wars RPG - Saga Edition.

## Estrutura Recomendada

- `apps/web`: frontend React SPA com Vite. Este app deve continuar 100% client-side, sem SSR.
- `apps/api`: backend Next.js para API routes e regras de persistencia.
- `apps/api/models`: models MongoDB/Mongoose.
- `apps/api/services`: regras de aplicacao fora da camada HTTP.
- `apps/api/game-systems`: engines e definicoes por sistema de RPG.
- `apps/api/types/snapshots`: snapshots tipados por sistema.
- `apps/api/lib`: infraestrutura compartilhada, como conexao MongoDB.

## Fonte da Verdade

A ficha nao e um PDF editavel. A fonte da verdade sempre e dado estruturado salvo no MongoDB:

- `Character`
- `CharacterVersion`
- `snapshot`

PDF pode existir futuramente apenas como exportacao visual.

## Versionamento

- Versao publicada nunca e editada.
- Draft pode ser editado.
- Ao publicar, o draft vira `published`.
- `currentVersionId` aponta para a ultima versao publicada.
- Nova edicao cria um novo draft baseado na versao atual.
- Rollback nao apaga historico: ele cria uma nova draft ou uma nova versao publicada baseada em uma versao antiga.

## Sistemas de RPG

Cada sistema deve ter sua propria engine. A primeira engine implementada e `StarWarsSagaEngine`.

Engines futuras previstas:

- `Dnd5eEngine`
- `ThreeDetEngine`
- `Tormenta20Engine`
- `CallOfCthulhuEngine`

Cada engine e responsavel por validar ficha, calcular campos derivados, validar pre-requisitos, validar progressao, gerar resumo e preparar dados para exportacao.

## Comandos

```bash
npm install
npm run dev:web
npm run dev:api
npm run build
```

## Ambiente

Crie um `.env.local` em `apps/api` com:

```bash
MONGODB_URI=mongodb://localhost:27017/rpg-builder
```

## Endpoints Base

- `POST /api/characters`
- `GET /api/characters`
- `GET /api/characters/:characterId`
- `PATCH /api/characters/:characterId/draft`
- `POST /api/characters/:characterId/publish`
- `GET /api/characters/:characterId/versions`
- `GET /api/characters/:characterId/versions/:versionId`
- `POST /api/characters/:characterId/restore/:versionId`
- `GET /api/characters/:characterId/diff?fromVersionId=&toVersionId=`
- `GET /api/game-systems`

O frontend atual ainda usa `localStorage` como prototipo de tela. A proxima etapa natural e trocar essa persistencia local pela API de drafts e publicacao.
