#!/usr/bin/env node
/**
 * migrate.mjs — aplica supabase/migrations/ no banco Supabase remoto.
 *
 * Uso:
 *   npm run db:migrate
 *
 * Requer no .env uma das opções abaixo:
 *
 *   Opção A — string completa:
 *     DATABASE_URL=postgresql://postgres.[ref]:[senha]@aws-0-[região].pooler.supabase.com:6543/postgres
 *
 *   Opção B — senha do banco separada (recomendado):
 *     SUPABASE_DB_PASSWORD=<senha do banco>
 *     (SUPABASE_URL já deve estar definido)
 *
 * A senha fica em: Supabase Dashboard → Project Settings → Database → Connection string
 */

import pg from 'pg';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── 1. Carrega .env manualmente (sem dependência extra) ─────────────────────
function loadEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim();
    const val = raw.replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

loadEnv();

// ── 2. Resolve a string de conexão ─────────────────────────────────────────
function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const password    = process.env.SUPABASE_DB_PASSWORD;

  if (supabaseUrl && password) {
    // Extrai o ref do projeto da URL (https://<ref>.supabase.co)
    const ref = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0];
    // Conexão direta — funciona em qualquer região sem configuração extra
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }

  return null;
}

// ── 3. Valida pré-condições ─────────────────────────────────────────────────
const dbUrl = getDatabaseUrl();

if (!dbUrl) {
  console.error(`
❌  String de conexão não encontrada.

Adicione ao .env uma das opções:

  Opção A — string completa do Pooler:
    DATABASE_URL=postgresql://postgres.[ref]:[senha]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres

  Opção B — só a senha (mais simples):
    SUPABASE_DB_PASSWORD=[senha do banco]

  A senha fica em:
    Supabase Dashboard → Project Settings → Database → Connection string → Password
`);
  process.exit(1);
}

const migrationsDir = resolve(root, 'supabase', 'migrations');
if (!existsSync(migrationsDir)) {
  console.error('❌  Pasta supabase/migrations/ não encontrada.');
  process.exit(1);
}

// Lê e ordena os .sql por nome (timestamp garante ordem cronológica)
const sqlFiles = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

if (sqlFiles.length === 0) {
  console.log('ℹ️   Nenhum arquivo .sql encontrado em supabase/migrations/');
  process.exit(0);
}

// ── 4. Conecta e aplica ─────────────────────────────────────────────────────
const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
});

async function run() {
  console.log('🔌  Conectando ao banco Supabase...');
  await client.connect();
  console.log('✅  Conectado.\n');

  // Tabela de controle compatível com o schema do Supabase CLI
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;

    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version  TEXT NOT NULL PRIMARY KEY,
      name     TEXT,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  let applied = 0;
  let skipped = 0;

  for (const file of sqlFiles) {
    const version = file.replace(/\.sql$/, '');

    const { rows } = await client.query(
      'SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1',
      [version],
    );

    if (rows.length > 0) {
      console.log(`  ⏭   ${file}  (já aplicada)`);
      skipped++;
      continue;
    }

    const sql = readFileSync(resolve(migrationsDir, file), 'utf8');

    console.log(`  ▶   Aplicando ${file}…`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ($1, $2)',
        [version, file],
      );
      await client.query('COMMIT');
      console.log(`  ✅  ${file}  aplicada\n`);
      applied++;
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Falha em ${file}: ${err.message}`);
    }
  }

  await client.end();

  console.log('─'.repeat(50));
  if (applied > 0) {
    console.log(`✅  ${applied} migration(s) aplicada(s) com sucesso.`);
  } else {
    console.log('ℹ️   Banco já está atualizado — nenhuma migration nova.');
  }
  if (skipped > 0) console.log(`   (${skipped} pulada(s) — já aplicadas anteriormente)`);
}

run().catch(async err => {
  await client.end().catch(() => {});
  console.error(`\n❌  Erro: ${err.message}`);
  process.exit(1);
});
