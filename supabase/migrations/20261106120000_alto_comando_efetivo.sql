-- Tag de Alto Comando dada pelo desenvolvedor no efetivo, além do cargo no Discord.
ALTER TABLE public.militares ADD COLUMN IF NOT EXISTS alto_comando BOOLEAN NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
