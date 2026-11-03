-- =============================================================================
-- ⚠️  APAGA TODO O SCHEMA public DO BANCO E RECRIA AS TABELAS DA 2ª DE. SEM VOLTA.
--
-- Rode no projeto certo: Supabase → SQL Editor → cole INTEIRO → Run.
-- Fica fora de supabase/migrations/ de propósito, para o `npm run db:migrate`
-- nunca executar isto sozinho.
--
-- Não mexe em auth (usuários) nem em storage (arquivos e buckets já existentes),
-- que são gerenciados pelo Supabase.
-- Se algo der erro, a transação inteira é desfeita e nada é apagado.
-- =============================================================================
BEGIN;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- O DROP leva junto as permissões padrão do Supabase: restaura.
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- ── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.status_inscricao AS ENUM ('pendente', 'em_analise', 'aprovado', 'reprovado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.categoria_militar AS ENUM ('ativo', 'oficial', 'instrutor', 'recruta', 'inativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_log AS ENUM ('admin', 'operacional', 'sistema');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_doc_restrito AS ENUM ('intel', 'ops_sigilosa', 'interno');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.situacao_operacao AS ENUM ('ativa', 'concluida', 'preparacao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_ticket_suporte AS ENUM ('aberto', 'em_atendimento', 'encerrado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.autor_mensagem_suporte AS ENUM ('conscrito', 'militar', 'sistema');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Trigger updated_at ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

-- ── Recrutamento ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sobrenome TEXT NOT NULL,
  rg TEXT NOT NULL,
  telefone TEXT NOT NULL,
  motivacao TEXT NOT NULL DEFAULT '',
  status public.status_inscricao NOT NULL DEFAULT 'pendente',
  observacoes_instrutor TEXT,
  protocolo TEXT NOT NULL UNIQUE DEFAULT ('EB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inscricoes ALTER COLUMN motivacao SET DEFAULT '';

CREATE TABLE IF NOT EXISTS public.entrevistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato TEXT NOT NULL,
  instrutor TEXT,
  data_hora TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Operações (apenas tabela base — subordinados foram removidos) ──────────
CREATE TABLE IF NOT EXISTS public.operacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  lider TEXT,
  status TEXT,
  situacao public.situacao_operacao NOT NULL DEFAULT 'ativa',
  inicio TIMESTAMPTZ,
  resultado TEXT,
  encerramento TIMESTAMPTZ,
  area TEXT,
  nivel_risco TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Efetivo ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.militares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT,
  nome TEXT NOT NULL,
  patente TEXT,
  posto TEXT,
  funcao TEXT,
  categoria public.categoria_militar NOT NULL DEFAULT 'ativo',
  status TEXT,
  turma TEXT,
  fase TEXT,
  instrutor TEXT,
  modulos TEXT,
  carga TEXT,
  motivo TEXT,
  desde DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Comunicação (apenas comunicados) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  emitido_por TEXT,
  publicado_em TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Inteligência ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.intel_relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL,
  assunto TEXT NOT NULL,
  classificacao TEXT,
  data_evento DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intel_investigacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso TEXT NOT NULL,
  titulo TEXT NOT NULL,
  responsavel TEXT,
  status TEXT DEFAULT 'Em curso',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intel_suspeitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cod TEXT NOT NULL,
  alias TEXT NOT NULL,
  risco TEXT,
  ultima_avistagem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intel_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id TEXT NOT NULL,
  identificacao TEXT NOT NULL,
  motivo TEXT,
  desde DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intel_docs_sigilosos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc TEXT NOT NULL,
  titulo TEXT NOT NULL,
  nivel TEXT,
  acesso TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Logs (Logs em geral) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_log NOT NULL,
  hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario TEXT,
  acao TEXT,
  detalhe TEXT,
  op_codigo TEXT,
  componente TEXT,
  evento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Disciplina ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.disciplina_advertencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  militar TEXT NOT NULL,
  motivo TEXT,
  grau TEXT,
  data_evento DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.disciplina_prisoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  militar TEXT NOT NULL,
  motivo TEXT,
  tempo_rp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.disciplina_suspensoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  militar TEXT NOT NULL,
  ate_data DATE,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.disciplina_expulsoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  militar TEXT NOT NULL,
  motivo TEXT,
  data_evento DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.disciplina_sindicancias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo TEXT NOT NULL,
  acusado TEXT,
  status TEXT DEFAULT 'Instrução',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Área restrita (com anexo PDF opcional) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documentos_restritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_doc_restrito NOT NULL,
  ref TEXT,
  codigo TEXT,
  titulo TEXT NOT NULL,
  nivel TEXT,
  acesso TEXT,
  custodia TEXT,
  pdf_path TEXT,
  pdf_filename TEXT,
  pdf_mime TEXT,
  pdf_size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos_restritos ADD COLUMN IF NOT EXISTS pdf_path TEXT;
ALTER TABLE public.documentos_restritos ADD COLUMN IF NOT EXISTS pdf_filename TEXT;
ALTER TABLE public.documentos_restritos ADD COLUMN IF NOT EXISTS pdf_mime TEXT;
ALTER TABLE public.documentos_restritos ADD COLUMN IF NOT EXISTS pdf_size_bytes INTEGER;

-- ── Sistema ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessoes_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  origem TEXT,
  status TEXT DEFAULT 'Ativa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.backups_registro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id TEXT NOT NULL,
  tipo TEXT,
  tamanho TEXT,
  data_backup TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Identidade militar digital ───────────────
CREATE TABLE IF NOT EXISTS public.identidades_militares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
  matricula TEXT NOT NULL UNIQUE,
  validade_de DATE NOT NULL,
  validade_ate DATE NOT NULL,
  patente TEXT NOT NULL DEFAULT 'Soldado',
  foto_url TEXT,
  qr_payload JSONB,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT identidades_militares_inscricao_unique UNIQUE (inscricao_id)
);

CREATE TABLE IF NOT EXISTS public.documentos_emitidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (char_length(tipo) BETWEEN 2 AND 32),
  referencia TEXT,
  titulo TEXT,
  emitido_por TEXT,
  inscricao_id UUID REFERENCES public.inscricoes(id) ON DELETE SET NULL,
  destinatario TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Suporte (chat conscrito ↔ alto comando) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.suporte_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  protocolo TEXT,
  rg TEXT,
  nome TEXT,
  sobrenome TEXT,
  acesso_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status public.status_ticket_suporte NOT NULL DEFAULT 'aberto',
  atendente_nome TEXT,
  ultima_mensagem_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Migração idempotente: novos campos / relaxar NOT NULL
ALTER TABLE public.suporte_tickets ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE public.suporte_tickets ALTER COLUMN protocolo DROP NOT NULL;
ALTER TABLE public.suporte_tickets ALTER COLUMN rg DROP NOT NULL;
UPDATE public.suporte_tickets SET titulo = COALESCE(NULLIF(titulo, ''), CONCAT('Ticket ', LEFT(id::text, 8)))
  WHERE titulo IS NULL OR titulo = '';
ALTER TABLE public.suporte_tickets ALTER COLUMN titulo SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.suporte_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.suporte_tickets(id) ON DELETE CASCADE,
  autor public.autor_mensagem_suporte NOT NULL,
  autor_nome TEXT,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Índices ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS inscricoes_rg_idx ON public.inscricoes (rg);
CREATE INDEX IF NOT EXISTS inscricoes_status_idx ON public.inscricoes (status);
CREATE INDEX IF NOT EXISTS inscricoes_protocolo_idx ON public.inscricoes (protocolo);
CREATE INDEX IF NOT EXISTS identidades_matricula_idx ON public.identidades_militares (matricula);
CREATE INDEX IF NOT EXISTS documentos_emitidos_tipo_idx ON public.documentos_emitidos (tipo);
CREATE INDEX IF NOT EXISTS documentos_emitidos_inscricao_idx ON public.documentos_emitidos (inscricao_id);
CREATE INDEX IF NOT EXISTS operacoes_situacao_idx ON public.operacoes (situacao);
CREATE INDEX IF NOT EXISTS militares_categoria_idx ON public.militares (categoria);

CREATE INDEX IF NOT EXISTS logs_tipo_idx ON public.logs (tipo);
CREATE INDEX IF NOT EXISTS docs_restritos_tipo_idx ON public.documentos_restritos (tipo);
CREATE INDEX IF NOT EXISTS suporte_tickets_status_idx ON public.suporte_tickets (status);
CREATE INDEX IF NOT EXISTS suporte_tickets_ultima_msg_idx ON public.suporte_tickets (ultima_mensagem_em DESC);
CREATE INDEX IF NOT EXISTS suporte_mensagens_ticket_idx ON public.suporte_mensagens (ticket_id, created_at);

-- ── RLS (somente service role no servidor; inscrições públicas) ────────────────
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can insert inscricao" ON public.inscricoes;
CREATE POLICY "anyone can insert inscricao" ON public.inscricoes FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(nome) BETWEEN 1 AND 80 AND char_length(sobrenome) BETWEEN 1 AND 80
    AND rg ~ '^[0-9]{1,8}$' AND char_length(telefone) BETWEEN 1 AND 20
  );

-- Demais tabelas: RLS ativo sem policy pública (admin via service role)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'entrevistas','operacoes','militares','comunicados',
    'intel_relatorios','intel_investigacoes','intel_suspeitos','intel_blacklist',
    'intel_docs_sigilosos','logs',
    'disciplina_advertencias','disciplina_prisoes','disciplina_suspensoes','disciplina_expulsoes',
    'disciplina_sindicancias','documentos_restritos','sessoes_admin','backups_registro',
    'identidades_militares','documentos_emitidos',
    'suporte_tickets','suporte_mensagens'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ── Triggers updated_at ──────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'inscricoes','entrevistas','operacoes','militares','comunicados',
    'intel_relatorios','intel_investigacoes','intel_suspeitos','intel_blacklist',
    'intel_docs_sigilosos','disciplina_advertencias','disciplina_prisoes',
    'disciplina_suspensoes','disciplina_expulsoes','disciplina_sindicancias',
    'documentos_restritos','identidades_militares',
    'suporte_tickets'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ── Storage: bucket privado dos PDFs da Área Restrita ───────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('area-restrita', 'area-restrita', false)
ON CONFLICT (id) DO NOTHING;

-- Faz a API do Supabase enxergar as tabelas novas na hora
NOTIFY pgrst, 'reload schema';

COMMIT;
