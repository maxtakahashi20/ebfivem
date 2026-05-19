-- =============================================================================
-- CMF — schema completo (sidebar ADMCMF + Painel Membro / Identidade digital)
-- Cole INTEIRO no Supabase → SQL Editor → Run (idempotente)
-- =============================================================================

-- ── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.status_inscricao AS ENUM ('pendente', 'em_analise', 'aprovado', 'reprovado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.categoria_militar AS ENUM ('ativo', 'oficial', 'instrutor', 'recruta', 'inativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_treinamento AS ENUM ('sat', 'cqb', 'taf');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_log AS ENUM ('admin', 'discord', 'operacional', 'sistema');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_agenda AS ENUM ('treino', 'operacao', 'entrevista', 'reuniao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_doc_restrito AS ENUM ('intel', 'ops_sigilosa', 'interno');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.situacao_operacao AS ENUM ('ativa', 'concluida', 'preparacao');
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
  discord_id TEXT NOT NULL,
  motivacao TEXT NOT NULL,
  status public.status_inscricao NOT NULL DEFAULT 'pendente',
  observacoes_instrutor TEXT,
  protocolo TEXT NOT NULL UNIQUE DEFAULT ('EB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- ── Operações ────────────────────────────────────────────────────────────────
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

CREATE TABLE IF NOT EXISTS public.briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc TEXT NOT NULL,
  titulo TEXT NOT NULL,
  autor TEXT,
  data_emissao DATE DEFAULT CURRENT_DATE,
  classificado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.missoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  prioridade TEXT DEFAULT 'Média',
  prazo DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patrulhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rota TEXT NOT NULL,
  setor TEXT,
  viatura TEXT,
  horario TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Treinamentos ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.treinamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_treinamento NOT NULL,
  militar TEXT,
  turma TEXT,
  instrutor TEXT,
  local TEXT,
  nota TEXT,
  corrida TEXT,
  flexoes TEXT,
  resultado TEXT,
  proxima_aula TIMESTAMPTZ,
  status TEXT,
  data_avaliacao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  carga_horas TEXT,
  vagas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.presencas_treino (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treino TEXT NOT NULL,
  presentes TEXT,
  ausentes TEXT,
  data_registro DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.instrutores_escala (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  especialidade TEXT,
  turmas TEXT,
  carga_semanal TEXT,
  status TEXT DEFAULT 'Disponível',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Efetivo / Sistema militar ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.militares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT,
  discord_user_id TEXT UNIQUE,
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

CREATE TABLE IF NOT EXISTS public.patentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patente TEXT NOT NULL,
  qtd TEXT,
  insignia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.medalhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medalha TEXT NOT NULL,
  criterio TEXT,
  concedidas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promocoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  militar TEXT NOT NULL,
  de_patente TEXT,
  para_patente TEXT,
  data_promocao DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.honrarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  honra TEXT NOT NULL,
  militar TEXT NOT NULL,
  data_honra DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Comunicação ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  emitido_por TEXT,
  publicado_em TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  emitido TEXT,
  data_evento DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  data_evento TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.defcon_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nivel SMALLINT NOT NULL DEFAULT 4 CHECK (nivel BETWEEN 1 AND 5),
  descricao TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.defcon_config (id, nivel, descricao)
VALUES (1, 4, 'Atenção elevada')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.protocolos_emergencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ultimo_uso TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal TEXT,
  alcance TEXT,
  data_evento TIMESTAMPTZ DEFAULT now(),
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

-- ── Logs ─────────────────────────────────────────────────────────────────────
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

-- ── Mapa tático ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bases_taticas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base TEXT NOT NULL,
  coords TEXT,
  status TEXT DEFAULT 'Operacional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zonas_vermelhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona TEXT NOT NULL,
  motivo TEXT,
  desde DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Discord ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.discord_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  url TEXT,
  uso TEXT,
  status TEXT DEFAULT 'Ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discord_cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patente_rp TEXT NOT NULL,
  cargo_discord TEXT NOT NULL,
  auto_sync TEXT DEFAULT 'Sim',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discord_bot_status (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  online BOOLEAN DEFAULT true,
  latencia_ms INTEGER DEFAULT 0,
  uptime_pct TEXT DEFAULT '99.8%',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.discord_bot_status (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.discord_sync_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  status TEXT DEFAULT 'Sincronizado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Agenda ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agenda_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_agenda NOT NULL,
  data_hora TIMESTAMPTZ,
  titulo TEXT,
  evento TEXT,
  local TEXT,
  candidato TEXT,
  instrutor TEXT,
  comandante TEXT,
  participantes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- ── Área restrita ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documentos_restritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_doc_restrito NOT NULL,
  ref TEXT,
  codigo TEXT,
  titulo TEXT NOT NULL,
  nivel TEXT,
  acesso TEXT,
  custodia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- ── Painel Membro · Discord OAuth · Identidade militar digital ───────────────
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS discord_user_id TEXT;

CREATE TABLE IF NOT EXISTS public.discord_membros (
  discord_user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  global_name TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  nick TEXT,
  roles_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  inscricao_id UUID REFERENCES public.inscricoes(id) ON DELETE SET NULL,
  ultimo_login TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.identidades_militares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
  discord_user_id TEXT REFERENCES public.discord_membros(discord_user_id) ON DELETE SET NULL,
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
  emitido_por_discord_id TEXT,
  inscricao_id UUID REFERENCES public.inscricoes(id) ON DELETE SET NULL,
  destinatario TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Índices ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS inscricoes_rg_idx ON public.inscricoes (rg);
CREATE INDEX IF NOT EXISTS inscricoes_status_idx ON public.inscricoes (status);
CREATE INDEX IF NOT EXISTS inscricoes_discord_user_id_idx ON public.inscricoes (discord_user_id);
CREATE INDEX IF NOT EXISTS inscricoes_protocolo_idx ON public.inscricoes (protocolo);
CREATE INDEX IF NOT EXISTS discord_membros_inscricao_idx ON public.discord_membros (inscricao_id);
CREATE INDEX IF NOT EXISTS identidades_matricula_idx ON public.identidades_militares (matricula);
CREATE INDEX IF NOT EXISTS identidades_discord_user_idx ON public.identidades_militares (discord_user_id);
CREATE INDEX IF NOT EXISTS documentos_emitidos_tipo_idx ON public.documentos_emitidos (tipo);
CREATE INDEX IF NOT EXISTS documentos_emitidos_inscricao_idx ON public.documentos_emitidos (inscricao_id);
CREATE INDEX IF NOT EXISTS operacoes_situacao_idx ON public.operacoes (situacao);
CREATE INDEX IF NOT EXISTS militares_categoria_idx ON public.militares (categoria);
CREATE INDEX IF NOT EXISTS militares_discord_user_id_idx ON public.militares (discord_user_id);

ALTER TABLE public.militares ADD COLUMN IF NOT EXISTS discord_user_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS treinamentos_tipo_idx ON public.treinamentos (tipo);
CREATE INDEX IF NOT EXISTS logs_tipo_idx ON public.logs (tipo);
CREATE INDEX IF NOT EXISTS agenda_tipo_idx ON public.agenda_eventos (tipo);
CREATE INDEX IF NOT EXISTS docs_restritos_tipo_idx ON public.documentos_restritos (tipo);

-- ── RLS (somente service role no servidor; inscrições públicas) ────────────────
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can insert inscricao" ON public.inscricoes;
CREATE POLICY "anyone can insert inscricao" ON public.inscricoes FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(nome) BETWEEN 1 AND 80 AND char_length(sobrenome) BETWEEN 1 AND 80
    AND rg ~ '^[0-9]{1,8}$' AND char_length(telefone) BETWEEN 8 AND 20
    AND char_length(discord_id) BETWEEN 2 AND 64 AND char_length(motivacao) BETWEEN 10 AND 2000
  );

-- Demais tabelas: RLS ativo sem policy pública (admin via service role)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'entrevistas','operacoes','briefings','missoes','patrulhas','treinamentos','cursos',
    'presencas_treino','instrutores_escala','militares','patentes','medalhas','promocoes',
    'honrarias','comunicados','avisos','alertas','defcon_config','protocolos_emergencia',
    'broadcasts','intel_relatorios','intel_investigacoes','intel_suspeitos','intel_blacklist',
    'intel_docs_sigilosos','logs','bases_taticas','zonas_vermelhas','discord_webhooks',
    'discord_cargos','discord_bot_status','discord_sync_eventos','agenda_eventos',
    'disciplina_advertencias','disciplina_prisoes','disciplina_suspensoes','disciplina_expulsoes',
    'disciplina_sindicancias','documentos_restritos','sessoes_admin','backups_registro',
    'discord_membros','identidades_militares','documentos_emitidos'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ── Triggers updated_at ──────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'inscricoes','entrevistas','operacoes','briefings','missoes','patrulhas','treinamentos',
    'cursos','presencas_treino','instrutores_escala','militares','patentes','medalhas',
    'promocoes','honrarias','comunicados','avisos','alertas','defcon_config',
    'protocolos_emergencia','broadcasts','intel_relatorios','intel_investigacoes',
    'intel_suspeitos','intel_blacklist','intel_docs_sigilosos','bases_taticas',
    'zonas_vermelhas','discord_webhooks','discord_cargos','discord_bot_status',
    'discord_sync_eventos','agenda_eventos','disciplina_advertencias','disciplina_prisoes',
    'disciplina_suspensoes','disciplina_expulsoes','disciplina_sindicancias',
    'documentos_restritos','discord_membros','identidades_militares'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()',
      t, t
    );
  END LOOP;
END $$;
