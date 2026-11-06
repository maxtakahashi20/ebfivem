-- Hierarquia pública da 2ª DE, mantida pelo desenvolvedor no painel. Só acrescenta; pode rodar mais de uma vez.
CREATE TABLE IF NOT EXISTS public.hierarquia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posto TEXT NOT NULL,
  nome TEXT,
  funcao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hierarquia_ordem_idx ON public.hierarquia (ordem, created_at);

-- Só o servidor (service role) lê e grava; sem políticas para anon/authenticated.
ALTER TABLE public.hierarquia ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
