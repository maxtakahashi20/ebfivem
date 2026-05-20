# CMF · Defesa Brasileira Digital

Portal institucional temático (**uso fictício / comunidade FiveM**) para o **Comando Militar do Fivem (CMF)** — história, organograma, ficha de alistamento e acompanhamento de status. Stack moderna full-stack com **TanStack Start**, **React 19**, **Supabase** e deploy pensado para **Cloudflare Workers**.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack técnica](#stack-técnica)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar localmente](#como-rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados (Supabase)](#banco-de-dados-supabase)
- [Rotas principais](#rotas-principais)
- [Arquitetura do código](#arquitetura-do-código)
- [Scripts NPM](#scripts-npm)
- [Build e deploy](#build-e-deploy)
- [Segurança](#segurança)
- [Licença e aviso](#licença-e-aviso)

---

## Funcionalidades

| Área | Descrição |
|------|-----------|
| **Site público** | Página inicial, história institucional, organograma, créditos/autoria. |
| **Inscrição** (`/inscricao`) | Formulário de ficha de alistamento com validação (Zod no servidor). |
| **Comprovante PDF** | Após envio bem-sucedido, geração de PDF local com **jsPDF** (protocolo e dados principais). |
| **Acompanhar** (`/acompanhar`) | Consulta de status por **RG** ou **protocolo** (`EB-XXXXXXXX`). |
| **Painel instrutor** (`/ADMCMF`) | Lista filtro/busca de inscrições; atualização de status e observações (protegido por **ACCESS_KEY**). |

Status possíveis da inscrição: `pendente`, `em_analise`, `aprovado`, `reprovado`.

---

## Stack técnica

| Camada | Tecnologia |
|--------|------------|
| Framework UI | React 19 |
| Roteamento / SSR | TanStack Router + TanStack Start |
| Build | Vite 7 |
| Runtime servidor | Nitro (Vercel Functions em produção), entrada em `src/server.ts` |
| Estilo | Tailwind CSS 4 (`@tailwindcss/vite`), componentes Radix UI |
| Backend de dados | Supabase (Postgres + Row Level Security) |
| Validação | Zod |
| Notificações | Sonner |

Deploy recomendado: **Vercel** (plugin **`nitro/vite`**). Opcional: Cloudflare via `wrangler.jsonc`.

---

## Pré-requisitos

- **Node.js** 20+ (recomendado)
- Conta e projeto em **[Supabase](https://supabase.com)** com a tabela `inscricoes` criada (veja [Banco de dados](#banco-de-dados-supabase))
- Opcional: **Wrangler** CLI para deploy (`npm i -g wrangler`)

---

## Como rodar localmente

```bash
git clone <url-do-repositório>
cd defesa-brasileira-digital
npm install
cp .env.example .env
# Edite .env com URL e chaves do seu projeto Supabase (obrigatório o service role para server functions).
npm run dev
```

Por padrão o servidor de desenvolvimento usa a porta **8080** (`vite.config.ts`).

O arquivo **`.env`** na raiz é lido pelo Vite (`loadEnv`) e injetado como **bindings (`vars`)** do Worker em desenvolvimento — não é obrigatório usar `.dev.vars` neste projeto.

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha.

### Cliente (browser) — prefixo `VITE_`

| Variável | Uso |
|----------|-----|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publishable / anon (segura para o front) |

### Servidor (TanStack Start / Worker)

| Variável | Uso |
|----------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` | **Obrigatória** para `criarInscricao`, consultas admin e painel — **nunca** exponha no cliente nem em `VITE_*`. |
| `SUPABASE_URL` | Opcional se já existir `VITE_SUPABASE_URL` (há fallback no código). |
| `SUPABASE_PUBLISHABLE_KEY` | Usada pelo middleware de auth; pode repetir o valor publishable do dashboard. |
| `ACCESS_KEY` | Chave compartilhada para `/ADMCMF` e operações restritas nas server functions; se vazio, o código pode usar um padrão local (ver `src/lib/inscricoes.functions.ts`). |
| `DISCORD_ALTO_COMANDO_ROLE_IDS` | Lista de IDs de cargos Discord que liberam Alto Comando — separados por vírgula. Quem **não** tem esses cargos não vê **Logs em geral**, **Sistema**, **Área Restrita** e a aba **Suporte** do painel. |
| `DISCORD_DESENVOLVEDOR_ROLE_IDS` | Lista de IDs de cargos Discord com **acesso pleno** ao painel (mesmo que Alto Comando + badge "MODO DESENVOLVEDOR"). Use apenas para o cargo de dev. |

Consulte sempre `.env.example` para comentários atualizados.

### Alto Comando

Para identificar quais cargos do Discord pertencem ao Alto Comando:

1. No Discord, ative o **Modo Desenvolvedor** (Configurações → Avançado).
2. Clique com o botão direito no cargo do servidor CMF e copie o **ID**.
3. Cole o ID em `DISCORD_ALTO_COMANDO_ROLE_IDS` (separe múltiplos por vírgula).
4. Reinicie `npm run dev` ou redeploy.

A checagem é feita em `src/lib/access-control.ts` comparando `profile.roles[].id` com os IDs do env. Sem variável configurada, **ninguém** é Alto Comando.

### Desenvolvedor

`DISCORD_DESENVOLVEDOR_ROLE_IDS` aceita os mesmos formatos. Quem tem um desses cargos é tratado como **Alto Comando + DEV**: vê todas as áreas restritas e ganha uma pílula **MODO DESENVOLVEDOR** no rodapé do sidebar. Funciona em paralelo ao Alto Comando — basta possuir **um** cargo de qualquer um dos dois grupos.

### Suporte ao conscrito

- **Conscrito (público):** `/suporte` — abre o ticket informando **protocolo + RG** da inscrição.
- **Atendente (Alto Comando):** aba **Suporte** dentro de `/ADMCMF` (visível somente para membros com cargo de Alto Comando).
- Chat é "ao vivo" via polling a cada 3 segundos.

---

## Banco de dados (Supabase)

1. No **SQL Editor** do projeto Supabase, cole e execute o arquivo inteiro:

   **`supabase/schema.sql`**

   Isso cria o enum `status_inscricao`, a tabela `public.inscricoes`, índices, RLS (INSERT para `anon`/`authenticated`), trigger de `updated_at`, etc. Pode rodar mais de uma vez.

2. Alternativa: `npm run db:migrate` ou migrações em **`supabase/migrations/`**.

Leituras sensíveis e updates são feitos no servidor com **`SUPABASE_SERVICE_ROLE_KEY`** (cliente admin Supabase), não via políticas públicas de `SELECT`.

### Storage para Área Restrita (PDF)

Os itens da **Área Restrita** suportam anexar PDFs. Crie um bucket **privado** no Supabase para armazenar os arquivos:

1. **Storage → New bucket** → nome `area-restrita` → privado.
2. Não é preciso criar policies — o servidor usa a service role para upload/download.

Sem o bucket, criar registros funciona; só os anexos falham.

Tipos TypeScript gerados / alinhados estão em `src/integrations/supabase/types.ts`.

---

## Rotas principais

| Caminho | Arquivo | Função |
|---------|---------|--------|
| `/` | `src/routes/index.tsx` | Landing |
| `/historia` | `src/routes/historia.tsx` | Linha do tempo |
| `/organograma` | `src/routes/organograma.tsx` | Estrutura visual |
| `/inscricao` | `src/routes/inscricao.tsx` | Envio da ficha |
| `/acompanhar` | `src/routes/acompanhar.tsx` | Consulta RG/protocolo |
| `/suporte` | `src/routes/suporte.tsx` | Chat de suporte ao conscrito (protocolo + RG) |
| `/ADMCMF` | `src/routes/ADMCMF.tsx` | Painel (Discord OAuth + `ACCESS_KEY`) |
| `/autoria` | `src/routes/autoria.tsx` | Créditos |

A árvore gerada pelo TanStack Router fica em `src/routeTree.gen.ts` (não editar manualmente).

---

## Arquitetura do código

```
src/
├── routes/           # Rotas file-based (TanStack Router)
├── components/       # UI compartilhada (site-chrome, Radix, etc.)
├── integrations/supabase/
│   ├── client.ts        # Cliente browser (publishable)
│   ├── client.server.ts # Cliente admin (service role) — só servidor
│   ├── auth-middleware.ts
│   └── types.ts
├── lib/
│   ├── inscricoes.functions.ts  # createServerFn: criar/listar/consultar/atualizar
│   └── inscricao-pdf.ts        # PDF do comprovante
├── server.ts         # Wrapper Worker: sincroniza env → process.env + SSR errors
├── start.ts          # createStart — middleware global de erro
└── styles.css        # Tailwind / tema militar
```

- **Server functions**: `@tanstack/react-start` (`createServerFn`) em `lib/inscricoes.functions.ts`.
- **`vite.config.ts`**: `workerBindingsFromEnv()` injeta `.env` nas `vars` do Worker para desenvolvimento/build local coerente com Cloudflare.

---

## Scripts NPM

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor Vite + Worker local |
| `npm run build` | Build cliente + SSR/Worker (`dist/`) |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (inclui `endOfLine: lf` no `.prettierrc`) |

---

## Build e deploy

### Vercel (recomendado)

1. Conecte o repositório em [vercel.com](https://vercel.com).
2. **Build Command:** `npm run build` (padrão).
3. **Variáveis de ambiente:** copie de `.env.example` (Supabase, Discord, `ACCESS_KEY`, webhooks).
4. **Discord OAuth:** `DISCORD_REDIRECT_URI` = `https://SEU-DOMINIO.vercel.app/auth/discord/callback` (e cadastre a mesma URL no Discord Developer Portal).
5. Deploy — o preset Nitro `vercel` é aplicado automaticamente quando `VERCEL=1` no build.

Documentação: [TanStack Start on Vercel](https://vercel.com/docs/frameworks/full-stack/tanstack-start)

### Cloudflare Workers (opcional)

- `wrangler.jsonc` + `wrangler deploy` (requer reativar `@cloudflare/vite-plugin` no `vite.config.ts`).

### Local

- **`npm run build`** → saída em `.output/`
- **`npm run preview`** → preview do build Nitro

Documentação: [TanStack Start](https://tanstack.com/start)

---

## Segurança

- **Service role**: poder total sobre o projeto Supabase; só em servidor e CI seguros.
- **ACCESS_KEY**: mecanismo simples por ambiente — troque o padrão em produção e use valor forte.
- **RLS**: insert público controlado por política; demais operações via backend com service role.
- Não commite `.env`; mantenha apenas `.env.example` sem segredos reais.

---

## Licença e aviso

Este repositório é **privado** conforme `package.json`. O conteúdo institucional e militar é **ficcional / temático para comunidade de roleplay** e não substitui canais oficiais das Forças Armadas brasileiras.

Para dúvidas sobre schema ou fluxo de inscrição, consulte `src/lib/inscricoes.functions.ts` e `supabase/schema.sql`.
