/** Gera matrícula, validade e payload QR para identidade militar digital CMF */

import type { DiscordProfile, DiscordRoleTag } from "@/lib/discord-oauth";

/** Índice do cargo de patente/graduação na lista (3º cargo = Sub Tenente, etc.). */
export const PATENTE_CARGO_INDEX = 2;

/** Mesma ordem das tags na carteira: maior position do Discord primeiro. */
export function ordenarCargosDiscord(roles: DiscordRoleTag[]): DiscordRoleTag[] {
  return [...roles].sort((a, b) => b.position - a.position);
}

/** Patente/graduação = 3º cargo do membro no servidor CMF. */
export function patenteFromDiscordRoles(roles: DiscordRoleTag[]): string {
  const ordenados = ordenarCargosDiscord(roles);
  const cargo = ordenados[PATENTE_CARGO_INDEX] ?? ordenados.at(-1);
  if (!cargo) return "Membro CMF";
  const nome = cargo.name.trim();
  return nome.length > 48 ? `${nome.slice(0, 45)}…` : nome;
}

export type IdentidadeMilitarData = {
  protocolo: string;
  nome: string;
  sobrenome: string;
  rg: string;
  patente?: string;
  fotoDataUrl?: string | null;
  created_at?: string;
};

export type IdentidadeGerada = IdentidadeMilitarData & {
  matricula: string;
  validadeDe: string;
  validadeAte: string;
  qrPayload: string;
};

const PATENTE_APROVADO = "Soldado";

function hash8(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
}

/** Matrícula única derivada do protocolo + RG */
export function gerarMatricula(protocolo: string, rg: string): string {
  const ano = new Date().getFullYear();
  const seq = hash8(`${protocolo}:${rg}`);
  return `CMF-${ano}-${seq.slice(0, 6)}`;
}

export function gerarValidade(baseDate?: Date): { de: string; ate: string; deIso: string; ateIso: string } {
  const inicio = baseDate ?? new Date();
  const fim = new Date(inicio);
  fim.setFullYear(fim.getFullYear() + 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return {
    de: fmt(inicio),
    ate: fmt(fim),
    deIso: inicio.toISOString().slice(0, 10),
    ateIso: fim.toISOString().slice(0, 10),
  };
}

export function montarIdentidade(d: IdentidadeMilitarData): IdentidadeGerada {
  const matricula = gerarMatricula(d.protocolo, d.rg);
  const { de, ate } = gerarValidade(d.created_at ? new Date(d.created_at) : undefined);
  const qrPayload = JSON.stringify({
    org: "CMF",
    matricula,
    protocolo: d.protocolo,
    rg: d.rg,
    nome: `${d.nome} ${d.sobrenome}`.trim(),
    validade: ate,
    v: 1,
  });

  return {
    ...d,
    patente: d.patente ?? PATENTE_APROVADO,
    matricula,
    validadeDe: de,
    validadeAte: ate,
    qrPayload,
  };
}

/** Carteira + QR logo após login Discord (sem depender de inscrição aprovada). */
export function montarIdentidadeDiscord(profile: DiscordProfile): IdentidadeGerada {
  const protocolo = `DSC-${profile.id}`;
  const rg = profile.id.replace(/\D/g, "").slice(-8).padStart(8, "0").slice(0, 8);
  const patente = patenteFromDiscordRoles(profile.roles);
  const partes = profile.displayName.trim().split(/\s+/);
  const nome = partes[0] ?? profile.username;
  const sobrenome = partes.length > 1 ? partes.slice(1).join(" ") : profile.username;

  const gerada = montarIdentidade({
    protocolo,
    nome,
    sobrenome,
    rg,
    patente,
    fotoDataUrl: profile.avatarUrl,
  });

  const cargosOrdenados = ordenarCargosDiscord(profile.roles);

  return {
    ...gerada,
    qrPayload: JSON.stringify({
      org: "CMF",
      matricula: gerada.matricula,
      discordId: profile.id,
      usuario: profile.username,
      nome: profile.displayName,
      patente,
      cargos: cargosOrdenados.slice(0, 20).map((r) => r.name),
      validade: gerada.validadeAte,
      v: 2,
    }),
  };
}

export async function gerarQrDataUrl(text: string, size = 120): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: "#1a2e14", light: "#f5f0d7" },
  });
}

const FOTO_KEY = "cmf_id_foto_";

export function salvarFotoLocal(matricula: string, dataUrl: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FOTO_KEY + matricula, dataUrl);
  } catch {
    /* quota */
  }
}

export function carregarFotoLocal(matricula: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FOTO_KEY + matricula);
}
