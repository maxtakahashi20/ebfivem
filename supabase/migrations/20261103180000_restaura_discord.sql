-- =============================================================================
-- 2ª DE — restaura a integração com o Discord
-- Só acrescenta: não apaga tabela nem dado. Pode rodar mais de uma vez.
-- =============================================================================

ALTER TYPE public.tipo_log ADD VALUE IF NOT EXISTS 'discord';

-- ── Colunas nas tabelas existentes ───────────────────────────────────────────
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS discord_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS discord_user_id TEXT;
ALTER TABLE public.militares ADD COLUMN IF NOT EXISTS discord_user_id TEXT UNIQUE;
ALTER TABLE public.identidades_militares ADD COLUMN IF NOT EXISTS discord_user_id TEXT;
ALTER TABLE public.documentos_emitidos ADD COLUMN IF NOT EXISTS emitido_por_discord_id TEXT;
ALTER TABLE public.suporte_tickets ADD COLUMN IF NOT EXISTS atendente_discord_id TEXT;
ALTER TABLE public.suporte_mensagens ADD COLUMN IF NOT EXISTS autor_discord_id TEXT;

-- ── Tabelas do Discord ───────────────────────────────────────────────────────
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

DO $$ BEGIN
  ALTER TABLE public.identidades_militares
    ADD CONSTRAINT identidades_militares_discord_user_id_fkey
    FOREIGN KEY (discord_user_id) REFERENCES public.discord_membros(discord_user_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS inscricoes_discord_user_id_idx ON public.inscricoes (discord_user_id);
CREATE INDEX IF NOT EXISTS discord_membros_inscricao_idx ON public.discord_membros (inscricao_id);
CREATE INDEX IF NOT EXISTS identidades_discord_user_idx ON public.identidades_militares (discord_user_id);
CREATE INDEX IF NOT EXISTS militares_discord_user_id_idx ON public.militares (discord_user_id);

-- ── RLS: sem policy pública, acesso só pelo servidor (service role) ──────────
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'discord_webhooks','discord_cargos','discord_bot_status','discord_sync_eventos','discord_membros'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ── Inscrição pública volta a exigir o Discord ───────────────────────────────
DROP POLICY IF EXISTS "anyone can insert inscricao" ON public.inscricoes;
CREATE POLICY "anyone can insert inscricao" ON public.inscricoes FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(nome) BETWEEN 1 AND 80 AND char_length(sobrenome) BETWEEN 1 AND 80
    AND rg ~ '^[0-9]{1,8}$' AND char_length(telefone) BETWEEN 1 AND 20
    AND char_length(discord_id) BETWEEN 1 AND 64
  );

-- Faz a API do Supabase enxergar as mudanças na hora
NOTIFY pgrst, 'reload schema';
