-- Relatório de patrulha da PE (Polícia do Exército). Só acrescenta; pode rodar mais de uma vez.
CREATE TABLE IF NOT EXISTS public.relatorios_patrulha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_discord_id TEXT NOT NULL,
  autor_nome TEXT NOT NULL,
  data DATE NOT NULL,
  inicio TIME NOT NULL,
  fim TIME NOT NULL,
  viatura TEXT NOT NULL,
  equipe TEXT NOT NULL,
  area TEXT NOT NULL,
  abordagens INTEGER NOT NULL DEFAULT 0 CHECK (abordagens >= 0),
  prisoes INTEGER NOT NULL DEFAULT 0 CHECK (prisoes >= 0),
  apreensoes INTEGER NOT NULL DEFAULT 0 CHECK (apreensoes >= 0),
  ocorrencias TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'aprovado', 'devolvido')),
  parecer TEXT,
  revisado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS relatorios_patrulha_autor_idx ON public.relatorios_patrulha (autor_discord_id, data DESC);
CREATE INDEX IF NOT EXISTS relatorios_patrulha_data_idx ON public.relatorios_patrulha (data DESC);

-- Só o servidor (service role) lê e grava; sem políticas para anon/authenticated.
ALTER TABLE public.relatorios_patrulha ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
