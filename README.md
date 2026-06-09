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
npm run seed:rules
```

## Ambiente

Crie um `.env.local` em `apps/api` com:

```bash
MONGODB_URI=mongodb://localhost:27017/rpg-builder
MONGODB_DB=rpg-builder
AUTH_SESSION_SECRET=troque-por-uma-string-com-32-caracteres-ou-mais
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
WEB_APP_URL=http://localhost:5173
```

No Google Cloud Console, configure o OAuth Client como aplicação web e adicione este redirect em desenvolvimento:

```text
http://localhost:3000/api/auth/google/callback
```

Em produção, adicione também o domínio real da API, por exemplo:

```text
https://rpg-builder-seven.vercel.app/api/auth/google/callback
```

Na Vercel, configure as variáveis de ambiente de produção:

```bash
MONGODB_URI=sua-uri-do-mongodb
MONGODB_DB=rpg-builder
AUTH_SESSION_SECRET=troque-por-uma-string-com-32-caracteres-ou-mais
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=https://rpg-builder-seven.vercel.app/api/auth/google/callback
WEB_APP_URL=https://rpg-builder-seven.vercel.app
```

No OAuth Client do Google, adicione também estes valores de produção:

```text
Authorized JavaScript origins:
https://rpg-builder-seven.vercel.app

Authorized redirect URIs:
https://rpg-builder-seven.vercel.app/api/auth/google/callback
```

## Wiki Pública

A área `/wiki` é pública e carrega dados no cliente via `GET /api/wiki/rules`, mostrando skeleton enquanto a API responde. Para popular o Mongo com o catálogo atual de Star Wars Saga:

```bash
npm run seed:rules
```

O seed lê `apps/web/src/starWarsSagaCatalogData.ts` e grava entradas estruturadas na coleção `RuleEntry`, com conteúdo markdown e campos como dano, custo, tipo e disponibilidade quando existirem no catálogo.

## Rotas Frontend

- `/wiki/star-wars-saga`: wiki pública de Star Wars Saga, sem login.
- `/wiki/star-wars-saga/:slug`: página pública de uma regra específica, com regras relacionadas.
- `/app`: criador/editor de ficha, exige login Google.

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
