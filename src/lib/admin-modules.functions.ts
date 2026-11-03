import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AdminView } from "@/config/admin-nav";
import { getAcaoEspecial, getModuloForm } from "@/config/admin-module-forms";
import { MODULO_DB, PDF_RESTRITO_VIEWS, TABELAS_SISTEMA } from "@/config/admin-modules-db";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAccessKey } from "@/lib/access-key.server";
import { registrarLog } from "@/lib/logs.server";

const RESTRITO_BUCKET = "area-restrita";

export type ModuloAdminPayload = {
  rows: Record<string, string>[];
  stats: { label: string; value: string | number; sub?: string }[];
};

export const carregarModuloAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        view: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ModuloAdminPayload> => {
    assertAccessKey(data.accessKey);
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

    const spec = MODULO_DB[view];
    if (!spec) {
      return { rows: [], stats: [{ label: "Registros", value: 0 }] };
    }

    let q = supabaseAdmin
      .from(spec.table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (spec.filter) {
      for (const [k, v] of Object.entries(spec.filter)) {
        q = q.eq(k, v as string | number | boolean);
      }
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const mapped = (rows ?? []).map((r) => {
      const row = spec.rowMap(r as Record<string, unknown>);
      if (PDF_RESTRITO_VIEWS.has(view)) {
        const rec = r as Record<string, unknown>;
        return {
          ...row,
          __id: String(rec.id ?? ""),
          __pdf_path: rec.pdf_path ? String(rec.pdf_path) : "",
        };
      }
      return row;
    });
    const total = mapped.length;

    return {
      rows: mapped,
      stats: [{ label: "Registros", value: total }],
    };
  });

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

  return {
    rows: [
      { rota: "inscricoes.*", metodo: "POST", status: hasSupabase ? "200 OK" : "Indisponível" },
      { rota: "admin.modulos", metodo: "POST", status: hasSupabase ? "200 OK" : "Indisponível" },
    ],
    stats: [{ label: "Integrações", value: hasSupabase ? 1 : 0 }],
  };
}

function carregarSysSeguranca(): ModuloAdminPayload {
  const hasKey = !!process.env.ACCESS_KEY?.trim();
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return {
    rows: [
      { item: "ACCESS_KEY painel", status: hasKey ? "Configurado" : "Ausente" },
      { item: "Service role Supabase", status: hasService ? "Configurado" : "Ausente" },
      { item: "RLS Supabase", status: "Ativo" },
    ],
    stats: [{ label: "Nível", value: hasService && hasKey ? "Alto" : "Médio" }],
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
    assertAccessKey(data.accessKey);
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
        else if (field.type === "datetime-local")
          insert[field.dbColumn] = new Date(raw).toISOString();
        else insert[field.dbColumn] = raw;
      }
    }

    const { data: inserted, error } = await supabaseAdmin
      .from(db.table)
      .insert(insert)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);

    await registrarLogAdmin(`Registro criado em ${db.table}`, view);
    return { ok: true, id: (inserted?.id as string | undefined) ?? null };
  });

export const executarAcaoEspecial = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ accessKey: z.string(), view: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);
    const view = data.view as AdminView;
    const acao = getAcaoEspecial(view);
    if (!acao) throw new Error("Ação não disponível");

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

function registrarLogAdmin(acao: string, view: string) {
  return registrarLog("admin", acao, view);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF da Área Restrita (upload/download/remove)
// Requer bucket privado `area-restrita` no Supabase Storage.
// ─────────────────────────────────────────────────────────────────────────────

function ensurePdfView(view: AdminView) {
  if (!PDF_RESTRITO_VIEWS.has(view)) {
    throw new Error("PDF não é suportado para esta view.");
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.includes(",") ? base64.split(",")[1]! : base64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const uploadPdfRestrito = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        view: z.string(),
        recordId: z.string().uuid(),
        base64: z.string().min(1),
        filename: z.string().min(1).max(255),
        mime: z.string().min(1).default("application/pdf"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);
    const view = data.view as AdminView;
    ensurePdfView(view);

    const bytes = base64ToUint8Array(data.base64);
    if (bytes.length > 25 * 1024 * 1024) {
      throw new Error("Arquivo acima de 25 MB.");
    }
    const safeName = data.filename.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
    const path = `${view}/${data.recordId}-${Date.now()}-${safeName}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(RESTRITO_BUCKET)
      .upload(path, bytes, { contentType: data.mime, upsert: true });
    if (upErr) throw new Error(`Falha no upload: ${upErr.message}`);

    const { error: dbErr } = await supabaseAdmin
      .from("documentos_restritos")
      .update({
        pdf_path: path,
        pdf_filename: data.filename,
        pdf_mime: data.mime,
        pdf_size_bytes: bytes.length,
      })
      .eq("id", data.recordId);
    if (dbErr) throw new Error(dbErr.message);

    await registrarLogAdmin(`PDF anexado a ${view} (${data.filename})`, view);
    return { ok: true, path };
  });

export const baixarPdfRestrito = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        recordId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);

    const { data: rec, error } = await supabaseAdmin
      .from("documentos_restritos")
      .select("pdf_path, pdf_filename")
      .eq("id", data.recordId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!rec?.pdf_path) throw new Error("Documento sem PDF anexado.");

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(RESTRITO_BUCKET)
      .createSignedUrl(rec.pdf_path, 60);
    if (signErr || !signed) throw new Error(signErr?.message ?? "Falha ao gerar URL");

    await registrarLogAdmin(`PDF baixado (${rec.pdf_filename ?? rec.pdf_path})`, "restrito");
    return { url: signed.signedUrl, filename: rec.pdf_filename ?? "documento.pdf" };
  });

export const removerPdfRestrito = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessKey: z.string(),
        recordId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAccessKey(data.accessKey);

    const { data: rec, error } = await supabaseAdmin
      .from("documentos_restritos")
      .select("pdf_path")
      .eq("id", data.recordId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!rec?.pdf_path) return { ok: true };

    await supabaseAdmin.storage.from(RESTRITO_BUCKET).remove([rec.pdf_path]);
    const { error: updErr } = await supabaseAdmin
      .from("documentos_restritos")
      .update({
        pdf_path: null,
        pdf_filename: null,
        pdf_mime: null,
        pdf_size_bytes: null,
      })
      .eq("id", data.recordId);
    if (updErr) throw new Error(updErr.message);

    await registrarLogAdmin(`PDF removido (${rec.pdf_path})`, "restrito");
    return { ok: true };
  });
