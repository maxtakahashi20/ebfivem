-- Limite de tentativas por IP nas funções públicas. Só acrescenta; pode rodar mais de uma vez.
CREATE TABLE IF NOT EXISTS public.limite_tentativas (
  chave TEXT PRIMARY KEY,
  inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  total INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE public.limite_tentativas ENABLE ROW LEVEL SECURITY;

-- Devolve false quando a chave passou do máximo dentro da janela.
CREATE OR REPLACE FUNCTION public.registrar_tentativa(p_chave TEXT, p_maximo INTEGER, p_janela_segundos INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE v_total INTEGER;
BEGIN
  INSERT INTO public.limite_tentativas AS l (chave)
  VALUES (p_chave)
  ON CONFLICT (chave) DO UPDATE SET
    total = CASE WHEN l.inicio < now() - make_interval(secs => p_janela_segundos) THEN 1 ELSE l.total + 1 END,
    inicio = CASE WHEN l.inicio < now() - make_interval(secs => p_janela_segundos) THEN now() ELSE l.inicio END
  RETURNING total INTO v_total;

  IF random() < 0.01 THEN
    DELETE FROM public.limite_tentativas WHERE inicio < now() - interval '1 day';
  END IF;
  RETURN v_total <= p_maximo;
END $$;

REVOKE ALL ON FUNCTION public.registrar_tentativa(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_tentativa(TEXT, INTEGER, INTEGER) TO service_role;

NOTIFY pgrst, 'reload schema';
