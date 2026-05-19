
CREATE TYPE public.status_inscricao AS ENUM ('pendente', 'em_analise', 'aprovado', 'reprovado');

CREATE TABLE public.inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sobrenome TEXT NOT NULL,
  rg TEXT NOT NULL,
  telefone TEXT NOT NULL,
  discord_id TEXT NOT NULL,
  motivacao TEXT NOT NULL,
  status public.status_inscricao NOT NULL DEFAULT 'pendente',
  observacoes_instrutor TEXT,
  protocolo TEXT NOT NULL UNIQUE DEFAULT ('EB-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) may create an enrollment
CREATE POLICY "anyone can insert inscricao"
  ON public.inscricoes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No client SELECT/UPDATE/DELETE — handled via server functions with admin key
CREATE INDEX inscricoes_rg_idx ON public.inscricoes(rg);
CREATE INDEX inscricoes_status_idx ON public.inscricoes(status);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inscricoes_updated_at
  BEFORE UPDATE ON public.inscricoes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
