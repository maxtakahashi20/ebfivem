
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP POLICY "anyone can insert inscricao" ON public.inscricoes;

CREATE POLICY "anyone can insert inscricao"
  ON public.inscricoes FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(nome) BETWEEN 1 AND 80
    AND char_length(sobrenome) BETWEEN 1 AND 80
    AND rg ~ '^[0-9]{1,8}$'
    AND char_length(telefone) BETWEEN 8 AND 20
    AND char_length(discord_id) BETWEEN 2 AND 64
    AND char_length(motivacao) BETWEEN 10 AND 2000
  );
