/** Persistência Supabase: identidade militar e documentos emitidos */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  gerarValidade,
  montarIdentidade,
  type IdentidadeGerada,
} from "@/lib/militar-identidade";

type InscricaoRow = {
  id: string;
  protocolo: string;
  nome: string;
  sobrenome: string;
  rg: string;
  status: string;
  created_at: string;
  updated_at?: string;
  observacoes_instrutor?: string | null;
};

export async function sincronizarIdentidadeMilitar(
  inscricao: InscricaoRow,
): Promise<IdentidadeGerada | null> {
  if (inscricao.status !== "aprovado") return null;

  const gerada = montarIdentidade({
    protocolo: inscricao.protocolo,
    nome: inscricao.nome,
    sobrenome: inscricao.sobrenome,
    rg: inscricao.rg,
    created_at: inscricao.created_at,
  });

  const { deIso, ateIso } = gerarValidade(
    inscricao.created_at ? new Date(inscricao.created_at) : undefined,
  );

  const { error } = await supabaseAdmin.from("identidades_militares").upsert(
    {
      inscricao_id: inscricao.id,
      matricula: gerada.matricula,
      validade_de: deIso,
      validade_ate: ateIso,
      patente: gerada.patente ?? "Soldado",
      qr_payload: JSON.parse(gerada.qrPayload) as Record<string, unknown>,
      ativa: true,
    },
    { onConflict: "inscricao_id" },
  );
  if (error) console.error("[identidades_militares]", error.message);

  return gerada;
}

export async function registrarDocumentoEmitido(input: {
  tipo: string;
  referencia?: string;
  titulo?: string;
  emitidoPor?: string;
  inscricaoId?: string;
  destinatario?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("documentos_emitidos").insert({
    tipo: input.tipo,
    referencia: input.referencia ?? null,
    titulo: input.titulo ?? null,
    emitido_por: input.emitidoPor ?? null,
    inscricao_id: input.inscricaoId ?? null,
    destinatario: input.destinatario ?? null,
  });
  if (error) console.error("[documentos_emitidos]", error.message);
}

export async function obterIdentidadePorInscricao(inscricaoId: string) {
  const { data, error } = await supabaseAdmin
    .from("identidades_militares")
    .select("*")
    .eq("inscricao_id", inscricaoId)
    .eq("ativa", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
