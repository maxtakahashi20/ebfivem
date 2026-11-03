-- A chave pública não pode criar inscrição já aprovada nem vinculada a um Discord alheio.
-- O app insere pelo service role, que não passa por esta policy.
DROP POLICY IF EXISTS "anyone can insert inscricao" ON public.inscricoes;
CREATE POLICY "anyone can insert inscricao" ON public.inscricoes FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(nome) BETWEEN 1 AND 80 AND char_length(sobrenome) BETWEEN 1 AND 80
    AND rg ~ '^[0-9]{1,8}$' AND char_length(telefone) BETWEEN 1 AND 20
    AND char_length(discord_id) BETWEEN 1 AND 64
    AND status = 'pendente' AND discord_user_id IS NULL
  );

NOTIFY pgrst, 'reload schema';
