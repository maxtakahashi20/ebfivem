// Discord webhook integration for CMF admin panel.
// Reads DISCORD_WEBHOOK_URL (general / inscriptions) and DISCORD_WEBHOOK_LOG_URL (admin logs).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ACCESS_KEY = () => process.env.ACCESS_KEY || "26L5";

type DiscordEmbed = {
  title: string;
  description?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
};

function trimEnvUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.trim().replace(/^["']|["']$/g, "");
}

/** Bloqueia URL de exemplo do .env.example antes de chamar a API do Discord. */
function assertWebhookConfigured(url: string | undefined): string {
  const webhookUrl = trimEnvUrl(url);
  if (!webhookUrl) {
    throw new Error(
      "DISCORD_WEBHOOK_URL não está no .env. Cole a URL completa do webhook do canal e reinicie o npm run dev.",
    );
  }
  if (
    /YOUR_ID|YOUR_TOKEN|SEU_ID|SEU_TOKEN/i.test(webhookUrl) ||
    !/^https:\/\/discord\.com\/api\/webhooks\/\d+\/.+$/i.test(webhookUrl)
  ) {
    throw new Error(
      "DISCORD_WEBHOOK_URL inválida no .env. No Discord: canal → Integrações → Webhooks → copie a URL completa (com números no meio, não use YOUR_ID do exemplo).",
    );
  }
  return webhookUrl;
}

function clip(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

type WebhookResult =
  | { ok: true }
  | { ok: false; status: number; detail: string };

async function postWebhook(url: string, payload: object): Promise<WebhookResult> {
  const webhookUrl = trimEnvUrl(url);
  if (!webhookUrl?.startsWith("https://discord.com/api/webhooks/")) {
    return { ok: false, status: 0, detail: "URL do webhook inválida no .env" };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) return { ok: true };

    const raw = await res.text();
    let detail = raw;
    try {
      const parsed = JSON.parse(raw) as { message?: string };
      if (parsed.message) detail = parsed.message;
    } catch {
      /* mantém texto bruto */
    }

    return {
      ok: false,
      status: res.status,
      detail: clip(detail || `HTTP ${res.status}`, 300),
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      detail: err instanceof Error ? err.message : "Erro de rede ao contactar o Discord",
    };
  }
}

function discordErrorMessage(result: Extract<WebhookResult, { ok: false }>) {
  if (result.status === 401 || result.status === 404) {
    return "Webhook do Discord inválido ou expirado. Gere um novo em Configurações do canal → Integrações → Webhooks e atualize DISCORD_WEBHOOK_URL no .env.";
  }
  if (result.status === 0) {
    return result.detail;
  }
  return `Discord recusou o envio (${result.status}): ${result.detail}`;
}

function buildPayload(embed: DiscordEmbed) {
  return {
    embeds: [
      {
        ...embed,
        title: clip(embed.title, 256),
        description: embed.description ? clip(embed.description, 4096) : undefined,
        fields: embed.fields?.map((f) => ({
          ...f,
          name: clip(f.name, 256),
          value: clip(f.value, 1024),
        })),
        footer: embed.footer ? { text: clip(embed.footer.text, 2048) } : undefined,
        timestamp: embed.timestamp ?? new Date().toISOString(),
      },
    ],
  };
}

/** Notifica canal geral do Discord sobre nova inscrição recebida. */
export async function notificarNovaInscricao(dados: {
  nome: string;
  sobrenome: string;
  protocolo: string;
  rg: string;
  discord_id: string;
  created_at: string;
}): Promise<void> {
  const url = trimEnvUrl(process.env.DISCORD_WEBHOOK_URL);
  if (!url) return;

  await postWebhook(
    url,
    buildPayload({
      title: "📋 NOVA FICHA DE ALISTAMENTO",
      color: 0xd4a017,
      fields: [
        { name: "RECRUTA", value: `${dados.nome} ${dados.sobrenome}`, inline: true },
        { name: "PROTOCOLO", value: `\`${dados.protocolo}\``, inline: true },
        { name: "RG", value: dados.rg, inline: true },
        { name: "DISCORD", value: dados.discord_id, inline: true },
        {
          name: "DATA/HORA",
          value: new Date(dados.created_at).toLocaleString("pt-BR"),
          inline: true,
        },
      ],
      footer: { text: "CMF · Sistema de Alistamento" },
    }),
  );
}

const STATUS_COLOR: Record<string, number> = {
  aprovado: 0x4caf50,
  reprovado: 0xf44336,
  em_analise: 0x2196f3,
  pendente: 0x9e9e9e,
};

const STATUS_EMOJI: Record<string, string> = {
  aprovado: "✅",
  reprovado: "❌",
  em_analise: "🔍",
  pendente: "⏳",
};

const STATUS_LABEL: Record<string, string> = {
  aprovado: "APROVADO",
  reprovado: "REPROVADO",
  em_analise: "EM ANÁLISE",
  pendente: "PENDENTE",
};

/** Notifica canal de recrutamento sobre mudança de status de uma inscrição. */
export async function notificarMudancaStatus(dados: {
  nome: string;
  sobrenome: string;
  protocolo: string;
  status: string;
  observacoes?: string | null;
}): Promise<void> {
  const url = trimEnvUrl(process.env.DISCORD_WEBHOOK_URL);
  if (!url) return;

  const emoji = STATUS_EMOJI[dados.status] ?? "📌";
  const label = STATUS_LABEL[dados.status] ?? dados.status.toUpperCase();
  const color = STATUS_COLOR[dados.status] ?? 0x607d8b;

  const fields: DiscordEmbed["fields"] = [
    { name: "RECRUTA", value: `${dados.nome} ${dados.sobrenome}`, inline: true },
    { name: "PROTOCOLO", value: `\`${dados.protocolo}\``, inline: true },
    { name: "NOVO STATUS", value: label, inline: true },
  ];

  if (dados.observacoes) {
    fields.push({ name: "OBSERVACOES DO INSTRUTOR", value: dados.observacoes });
  }

  await postWebhook(
    url,
    buildPayload({
      title: `${emoji} DECISAO CMF — ${label}`,
      color,
      fields,
      footer: { text: "CMF · Comando de Recrutamento" },
    }),
  );
}

/** Envia log operacional para canal de logs administrativos. */
export async function enviarLogOperacional(dados: {
  acao: string;
  descricao: string;
  responsavel?: string;
}): Promise<void> {
  const url =
    trimEnvUrl(process.env.DISCORD_WEBHOOK_LOG_URL) ??
    trimEnvUrl(process.env.DISCORD_WEBHOOK_URL);
  if (!url) return;

  await postWebhook(
    url,
    buildPayload({
      title: `📡 LOG OPERACIONAL — ${dados.acao.toUpperCase()}`,
      description: dados.descricao,
      color: 0x607d8b,
      fields: dados.responsavel
        ? [{ name: "RESPONSAVEL", value: dados.responsavel, inline: true }]
        : undefined,
      footer: { text: "CMF · Sistema Administrativo" },
    }),
  );
}

const COMUNICADO_META = {
  informativo: { color: 0x4caf50, emoji: "📣", label: "INFORMATIVO" },
  alerta: { color: 0xf9a825, emoji: "⚠️", label: "ALERTA" },
  operacao: { color: 0x2196f3, emoji: "⚔️", label: "OPERACAO" },
  urgente: { color: 0xf44336, emoji: "🚨", label: "URGENTE" },
} as const;

/** Server function para envio manual de comunicado via webhook (painel) — embed. */
export const enviarComunicadoDiscord = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        titulo: z.string().min(3).max(100),
        mensagem: z.string().min(5).max(2000),
        tipo: z.enum(["informativo", "alerta", "operacao", "urgente"]).default("informativo"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (data.accessKey !== ACCESS_KEY()) {
      throw new Error("Chave de acesso inválida");
    }

    const url = assertWebhookConfigured(process.env.DISCORD_WEBHOOK_URL);

    const meta = COMUNICADO_META[data.tipo];
    const emitidoEm = new Date().toLocaleString("pt-BR");

    const result = await postWebhook(
      url,
      buildPayload({
        title: `${meta.emoji} COMUNICADO OFICIAL — ${meta.label}`,
        description: data.mensagem,
        color: meta.color,
        fields: [
          { name: "ASSUNTO", value: data.titulo },
          { name: "CLASSIFICACAO", value: meta.label, inline: true },
          { name: "EMITIDO EM", value: emitidoEm, inline: true },
        ],
        footer: { text: "CMF · Comando Militar do FiveM" },
      }),
    );

    if (!result.ok) {
      throw new Error(discordErrorMessage(result));
    }

    await enviarLogOperacional({
      acao: "COMUNICADO",
      descricao: `[${meta.label}] ${data.titulo}`,
    });
    return { ok: true };
  });
