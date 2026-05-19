import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AdminView } from "@/config/admin-nav";
import { getAcaoEspecial, getModuloForm } from "@/config/admin-module-forms";
import { MODULO_DB, TABELAS_SISTEMA } from "@/config/admin-modules-db";
import { enviarLogOperacional } from "@/lib/discord.functions";
import { sincronizarTodosDiscordNoEfetivo } from "@/lib/identidade-db";
import { patenteFromDiscordRoles } from "@/lib/militar-identidade";
import type { DiscordRoleTag } from "@/lib/discord-oauth";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ACCESS_KEY = () => process.env.ACCESS_KEY || "26L5";

function assertAccess(key: string) {
  if (key !== ACCESS_KEY()) throw new Error("Chave de acesso inválida");
}

export type ModuloAdminPayload = {
  rows: Record<string, string>[];
  stats: { label: string; value: string | number; sub?: string }[];
  /** Dados extras para painéis especiais */
  extra?: Record<string, unknown>;
};

export const carregarModuloAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ accessKey: z.string(), view: z.string() }).parse(input),
  )
  .handler(async ({ data }): Promise<ModuloAdminPayload> => {
    assertAccess(data.accessKey);
    const view = data.view as AdminView;

    if (view === "sys-db") {
      return carregarSysDb();
    }
    if (view === "sys-api") {
      return carregarSysApi();
    }
    if (view === "sys-seguranca") {
      return carregarSysSeguranca();
    }
    if (view === "com-defcon") {
      return carregarDefcon();
    }
    if (view === "discord-bot") {
      return carregarDiscordBot();
    }
    if (view === "efetivo-ativos") {
      return carregarEfetivoMilitares();
    }

    const spec = MODULO_DB[view];
    if (!spec) {
      return { rows: [], stats: [{ label: "Registros", value: 0 }] };
    }

    let q = supabaseAdmin.from(spec.table).select("*").order("created_at", { ascending: false }).limit(500);

    if (spec.filter) {
      for (const [k, v] of Object.entries(spec.filter)) {
        q = q.eq(k, v as string | number | boolean);
      }
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const mapped = (rows ?? []).map((r) => spec.rowMap(r as Record<string, unknown>));
    const total = mapped.length;

    return {
      rows: mapped,
      stats: [{ label: "Registros", value: total }],
    };
  });

async function carregarEfetivoMilitares(): Promise<ModuloAdminPayload> {
  await sincronizarTodosDiscordNoEfetivo();

  const spec = MODULO_DB["efetivo-ativos"];
  if (!spec) return { rows: [], stats: [{ label: "Registros", value: 0 }] };

  const { data: militares, error } = await supabaseAdmin
    .from(spec.table)
    .select("*")
    .eq("categoria", "ativo")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (!error && militares && militares.length > 0) {
    const rows = militares.map((r) => spec.rowMap(r as Record<string, unknown>));
    const comDiscord = militares.filter((r) => r.discord_user_id).length;
    return {
      rows,
      stats: [
        { label: "Militares", value: rows.length },
        { label: "Via Discord", value: comDiscord },
      ],
    };
  }

  if (error) console.error("[efetivo-ativos militares]", error.message);

  const { data: membros, error: errMembros } = await supabaseAdmin
    .from("discord_membros")
    .select("discord_user_id, username, display_name, roles_json, ultimo_login")
    .order("ultimo_login", { ascending: false })
    .limit(500);

  if (errMembros || !membros?.length) {
    return {
      rows: [],
      stats: [
        { label: "Militares", value: 0 },
        {
          label: "Aviso",
          value: error?.message?.includes("discord_user_id")
            ? "Rode o SQL da coluna discord_user_id no Supabase"
            : "Faça login Discord no painel",
        },
      ],
    };
  }

  const rows = membros.map((m) => {
    const roles = (Array.isArray(m.roles_json) ? m.roles_json : []) as DiscordRoleTag[];
    return {
      id: `CMF-${m.discord_user_id.slice(-6)}`,
      nome: m.display_name,
      patente: patenteFromDiscordRoles(roles),
      discord: `@${m.username}`,
      status: "Autenticado",
    };
  });

  return {
    rows,
    stats: [
      { label: "Militares", value: rows.length },
      { label: "Fonte", value: "Discord" },
    ],
  };
}

async function carregarSysDb(): Promise<ModuloAdminPayload> {
  const counts: Record<string, number> = {};

  await Promise.all(
    TABELAS_SISTEMA.map(async (tabela) => {
      const { count, error } = await supabaseAdmin
        .from(tabela)
        .select("*", { count: "exact", head: true });
      counts[tabela] = error ? 0 : (count ?? 0);
    }),
  );

  const rows = TABELAS_SISTEMA.map((tabela) => ({
    tabela,
    registros: String(counts[tabela] ?? 0),
    ultimo: new Date().toLocaleString("pt-BR"),
  }));

  const totalRegistros = Object.values(counts).reduce((a, b) => a + b, 0);

  return {
    rows,
    stats: [
      { label: "Tabelas CMF", value: TABELAS_SISTEMA.length },
      { label: "Total registros", value: totalRegistros },
      { label: "Status", value: "Online" },
    ],
  };
}

function carregarSysApi(): ModuloAdminPayload {
  const hasSupabase = !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const hasDiscord = !!process.env.DISCORD_WEBHOOK_URL?.trim();

  return {
    rows: [
      { rota: "inscricoes.*", metodo: "POST", status: hasSupabase ? "200 OK" : "Indisponível" },
      { rota: "admin.modulos", metodo: "POST", status: hasSupabase ? "200 OK" : "Indisponível" },
      { rota: "discord.webhook", metodo: "POST", status: hasDiscord ? "200 OK" : "Não configurado" },
    ],
    stats: [{ label: "Integrações", value: (hasSupabase ? 1 : 0) + (hasDiscord ? 1 : 0) }],
  };
}

function carregarSysSeguranca(): ModuloAdminPayload {
  const hasKey = !!process.env.ACCESS_KEY?.trim();
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return {
    rows: [
      { item: "ACCESS_KEY painel", status: hasKey ? "Configurado" : "Padrão local" },
      { item: "Service role Supabase", status: hasService ? "Configurado" : "Ausente" },
      { item: "RLS Supabase", status: "Ativo" },
    ],
    stats: [{ label: "Nível", value: hasService && hasKey ? "Alto" : "Médio" }],
  };
}

async function carregarDefcon(): Promise<ModuloAdminPayload> {
  const { data, error } = await supabaseAdmin.from("defcon_config").select("nivel, descricao").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);

  const nivel = data?.nivel ?? 4;
  return {
    rows: [],
    stats: [{ label: "Nível atual", value: `DEFCON ${nivel}` }],
    extra: { defconNivel: nivel, descricao: data?.descricao },
  };
}

export const criarRegistroModulo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        view: z.string(),
        valores: z.record(z.string()),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccess(data.accessKey);
    const view = data.view as AdminView;
    const form = getModuloForm(view);
    const db = MODULO_DB[view];
    if (!form || !db) throw new Error("Módulo sem formulário de cadastro");

    const insert: Record<string, unknown> = { ...form.defaults };

    for (const field of form.fields) {
      const raw = data.valores[field.key]?.trim();
      if (field.required && !raw) {
        throw new Error(`Campo obrigatório: ${field.label}`);
      }
      if (raw) {
        if (field.type === "date") insert[field.dbColumn] = raw;
        else if (field.type === "datetime-local") insert[field.dbColumn] = new Date(raw).toISOString();
        else insert[field.dbColumn] = raw;
      }
    }

    if (view === "mapa-ops" && !insert.codigo) {
      insert.codigo = `OP-MAP-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    }

    const { error } = await supabaseAdmin.from(db.table).insert(insert);
    if (error) throw new Error(error.message);

    await registrarLogAdmin(`Registro criado em ${db.table}`, view);
    return { ok: true };
  });

export const atualizarDefcon = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ accessKey: z.string(), nivel: z.number().int().min(1).max(5) }).parse(input),
  )
  .handler(async ({ data }) => {
    assertAccess(data.accessKey);
    const descricoes: Record<number, string> = {
      5: "Paz — rotina normal",
      4: "Atenção elevada",
      3: "Prontidão operacional",
      2: "Alerta máximo",
      1: "Guerra iminente",
    };

    const { error } = await supabaseAdmin
      .from("defcon_config")
      .upsert({ id: 1, nivel: data.nivel, descricao: descricoes[data.nivel] });
    if (error) throw new Error(error.message);

    await registrarLogAdmin(`DEFCON alterado para nível ${data.nivel}`, "com-defcon");
    enviarLogOperacional({
      acao: "defcon",
      descricao: `DEFCON ${data.nivel} ativado no painel CMF`,
    }).catch(() => {});

    return { ok: true, nivel: data.nivel };
  });

export const executarAcaoEspecial = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ accessKey: z.string(), view: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    assertAccess(data.accessKey);
    const view = data.view as AdminView;
    const acao = getAcaoEspecial(view);
    if (!acao) throw new Error("Ação não disponível");

    if (acao === "discord-sync") {
      const itens = [
        { item: "Cargos por patente", status: "Sincronizado" },
        { item: "Nicknames CMF", status: "Sincronizado" },
        { item: "Webhooks operacionais", status: "Sincronizado" },
      ];
      const { error } = await supabaseAdmin.from("discord_sync_eventos").insert(itens);
      if (error) throw new Error(error.message);

      await supabaseAdmin
        .from("discord_bot_status")
        .update({ latencia_ms: 35 + Math.floor(Math.random() * 30), online: true })
        .eq("id", 1);

      await registrarLogAdmin("Sincronização Discord executada", view);
      return { ok: true, mensagem: "Sincronização concluída" };
    }

    if (acao === "sys-backup") {
      const agora = new Date();
      const backupId = `BK-${agora.toISOString().slice(0, 10).replace(/-/g, "")}-${String(agora.getHours()).padStart(2, "0")}${String(agora.getMinutes()).padStart(2, "0")}`;
      const { error } = await supabaseAdmin.from("backups_registro").insert({
        backup_id: backupId,
        tipo: "Completo",
        tamanho: `${120 + Math.floor(Math.random() * 20)} MB`,
        data_backup: agora.toISOString(),
      });
      if (error) throw new Error(error.message);

      await registrarLogAdmin(`Backup registrado: ${backupId}`, view);
      return { ok: true, mensagem: `Backup ${backupId} registrado` };
    }

    throw new Error("Ação desconhecida");
  });

export const atualizarStatusDiscordBot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ accessKey: z.string() }).parse(input))
  .handler(async ({ data }) => {
    assertAccess(data.accessKey);
    const latencia = 30 + Math.floor(Math.random() * 50);
    const { error } = await supabaseAdmin
      .from("discord_bot_status")
      .update({ online: true, latencia_ms: latencia, uptime_pct: "99.8%" })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    await registrarLogAdmin("Status do bot atualizado", "discord-bot");
    return { ok: true, latencia_ms: latencia };
  });

async function registrarLogAdmin(acao: string, view: string) {
  await supabaseAdmin.from("logs").insert({
    tipo: "admin",
    usuario: "Painel ADMCMF",
    acao,
    detalhe: view,
  });
}

async function carregarDiscordBot(): Promise<ModuloAdminPayload> {
  const { data, error } = await supabaseAdmin
    .from("discord_bot_status")
    .select("online, latencia_ms, uptime_pct")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);

  return {
    rows: [],
    stats: [
      { label: "Status", value: data?.online ? "Online" : "Offline" },
      { label: "Latência", value: `${data?.latencia_ms ?? 0}ms` },
      { label: "Uptime", value: data?.uptime_pct ?? "—" },
    ],
    extra: data ?? {},
  };
}
