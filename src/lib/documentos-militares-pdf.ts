/** PDFs militares: certificado, ficha, ordem de serviço, boletim interno */
import { jsPDF } from "jspdf";
import type { DiscordProfile } from "@/lib/discord-oauth";
import type { IdentidadeGerada } from "@/lib/militar-identidade";

export type TipoDocumentoMilitar = "certificado" | "ficha" | "ordem" | "boletim";

export type DocumentoMilitarInput = {
  tipo: TipoDocumentoMilitar;
  titulo?: string;
  subtitulo?: string;
  /** Corpo principal / descrição da missão / texto do boletim */
  corpo: string;
  /** Destinatário ou unidade */
  destinatario?: string;
  /** Referência do documento */
  referencia?: string;
  /** Dados do militar (opcional) */
  militar?: {
    nome: string;
    matricula?: string;
    patente?: string;
    rg?: string;
  };
  /** Assinatura / autoridade */
  autoridade?: string;
  identidade?: IdentidadeGerada;
};

const OLIVE = { r: 40, g: 60, b: 25 };
const KHAKI = { r: 245, g: 240, b: 215 };

function headerBand(doc: jsPDF, W: number, M: number, title: string, subtitle: string) {
  doc.setFillColor(OLIVE.r, OLIVE.g, OLIVE.b);
  doc.rect(M - 4, M - 4, W - (M - 4) * 2, 22, "F");
  doc.setTextColor(220, 215, 170);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("CMF · COMANDO MILITAR DO FIVEM", W / 2, M + 2, { align: "center" });
  doc.setFontSize(11);
  doc.text(title, W / 2, M + 9, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(subtitle, W / 2, M + 15, { align: "center" });
  doc.setTextColor(20, 30, 15);
}

function section(doc: jsPDF, x: number, y: number, w: number, label: string) {
  doc.setFillColor(OLIVE.r, OLIVE.g, OLIVE.b);
  doc.rect(x, y, w - x * 2, 6, "F");
  doc.setTextColor(220, 215, 170);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(label, x + 2, y + 4.2);
  doc.setTextColor(20, 30, 15);
}

function field(doc: jsPDF, x: number, y: number, label: string, value: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(80, 90, 60);
  doc.text(label, x, y);
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 30, 15);
  doc.text(value || "—", x, y + 5);
}

function borders(doc: jsPDF, W: number, H: number, M: number) {
  doc.setDrawColor(OLIVE.r, OLIVE.g, OLIVE.b);
  doc.setLineWidth(0.8);
  doc.rect(M - 4, M - 4, W - (M - 4) * 2, H - (M - 4) * 2);
  doc.setLineWidth(0.2);
  doc.rect(M - 2, M - 2, W - (M - 2) * 2, H - (M - 2) * 2);
}

function footer(doc: jsPDF, W: number, H: number, M: number, ref: string) {
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    `CMF · DOC ${ref} · USO FICTÍCIO FIVEM · ${new Date().toLocaleString("pt-BR")}`,
    W / 2,
    H - M - 2,
    { align: "center" },
  );
}

function metaBlock(doc: jsPDF, M: number, W: number, y: number, input: DocumentoMilitarInput): number {
  const ref =
    input.referencia ??
    `${input.tipo.toUpperCase()}-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  doc.setFillColor(KHAKI.r, KHAKI.g, KHAKI.b);
  doc.rect(M, y, W - M * 2, 14, "F");
  doc.setDrawColor(OLIVE.r, OLIVE.g, OLIVE.b);
  doc.rect(M, y, W - M * 2, 14);
  field(doc, M + 3, y + 2, "REFERÊNCIA", ref);
  field(doc, M + (W - M * 2) / 2, y + 2, "DATA DE EMISSÃO", new Date().toLocaleDateString("pt-BR"));
  if (input.destinatario) {
    y += 16;
    field(doc, M, y, "DESTINATÁRIO / UNIDADE", input.destinatario);
    return y + 12;
  }
  return y + 18;
}

export function gerarDocumentoMilitarPdf(input: DocumentoMilitarInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 16;
  borders(doc, W, H, M);

  const configs: Record<
    TipoDocumentoMilitar,
    { title: string; subtitle: string; sectionBody: string }
  > = {
    certificado: {
      title: "CERTIFICADO MILITAR",
      subtitle: "Condecoração de mérito operacional",
      sectionBody: "SEÇÃO I — TEXTO DO CERTIFICADO",
    },
    ficha: {
      title: "FICHA MILITAR",
      subtitle: "Registro individual de efetivo",
      sectionBody: "SEÇÃO I — DADOS REGISTRADOS",
    },
    ordem: {
      title: "ORDEM DE SERVIÇO",
      subtitle: "Diretriz operacional do Comando",
      sectionBody: "SEÇÃO I — DISPOSITIVOS",
    },
    boletim: {
      title: "BOLETIM INTERNO",
      subtitle: "Publicação oficial da unidade",
      sectionBody: "SEÇÃO I — PUBLICAÇÃO",
    },
  };

  const cfg = configs[input.tipo];
  headerBand(doc, W, M, input.titulo ?? cfg.title, input.subtitulo ?? cfg.subtitle);

  let y = M + 24;
  y = metaBlock(doc, M, W, y, input);

  if (input.militar) {
    section(doc, M, y, W, "IDENTIFICAÇÃO DO MILITAR");
    y += 8;
    field(doc, M, y, "NOME", input.militar.nome);
    if (input.militar.matricula) field(doc, M + 90, y, "MATRÍCULA", input.militar.matricula);
    y += 10;
    if (input.militar.patente) field(doc, M, y, "PATENTE", input.militar.patente);
    if (input.militar.rg) field(doc, M + 90, y, "RG", input.militar.rg);
    y += 14;
  }

  if (input.identidade) {
    section(doc, M, y, W, "VÍNCULO — IDENTIDADE DIGITAL");
    y += 8;
    field(doc, M, y, "MATRÍCULA", input.identidade.matricula);
    field(doc, M + 90, y, "VALIDADE", `${input.identidade.validadeDe} — ${input.identidade.validadeAte}`);
    y += 14;
  }

  section(doc, M, y, W, cfg.sectionBody);
  y += 8;
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  const split = doc.splitTextToSize(input.corpo, W - M * 2 - 4);
  const boxH = Math.max(40, split.length * 5 + 8);
  doc.setFillColor(252, 250, 235);
  doc.rect(M, y, W - M * 2, boxH, "F");
  doc.setDrawColor(80, 90, 60);
  doc.rect(M, y, W - M * 2, boxH);
  doc.text(split, M + 3, y + 6);
  y += boxH + 12;

  section(doc, M, y, W, "AUTENTICAÇÃO");
  y += 10;
  doc.line(M, y, M + 60, y);
  doc.line(W - M - 60, y, W - M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(input.autoridade ?? "COMANDO MILITAR DO FIVEM", M, y + 4);
  doc.text("CARIMBO / PROTOCOLO", W - M - 60, y + 4);

  const ref =
    input.referencia ?? `${input.tipo}-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  footer(doc, W, H, M, ref);
  return doc;
}

export function baixarDocumentoMilitar(input: DocumentoMilitarInput) {
  const ref =
    input.referencia ?? `${input.tipo}-${new Date().toISOString().slice(0, 10)}`;
  const pdf = gerarDocumentoMilitarPdf(input);
  pdf.save(`CMF-${input.tipo}-${ref}.pdf`);
}

export type CarteiraPdfOptions = {
  discordProfile?: DiscordProfile | null;
  footerLeft?: string;
};

/** ISO ID-1 horizontal — título de eleitor (~86 × 54 mm) com margem interna extra. */
const CARD_W = 90;
const CARD_H = 57;
const INSET = 2;
const HEADER_H = 9;
const FOOTER_H = 6;

function pdfSafe(text: string, maxLen = 80): string {
  const t = text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[%]/g, "")
    .replace(/│/g, "|")
    .replace(/[⌜⌟]/g, "")
    .replace(/·/g, "-")
    .replace(/Δ/g, "A")
    .replace(/[^\w\s|.\-@áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t;
}

function imageFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  if (dataUrl.includes("image/png")) return "PNG";
  if (dataUrl.includes("image/webp")) return "WEBP";
  return "JPEG";
}

function fieldCarteira(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
  w: number,
  valueSize = 6.2,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.6);
  doc.setTextColor(80, 90, 60);
  doc.text(label, x, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(valueSize);
  doc.setTextColor(20, 30, 15);
  const lines = doc.splitTextToSize(pdfSafe(value), w).slice(0, 1);
  doc.text(lines[0] ?? "—", x, y + 3);
  return y + 3 + valueSize * 0.42;
}

/** Carteira militar em PDF — horizontal, sem cargos Discord (só dados + QR). */
export async function gerarCarteiraMilitarPdf(
  id: IdentidadeGerada,
  qrDataUrl: string,
  options?: CarteiraPdfOptions,
): Promise<jsPDF> {
  const profile = options?.discordProfile;
  const doc = new jsPDF({
    unit: "mm",
    format: [CARD_W, CARD_H],
    compress: false,
  });
  const W = CARD_W;
  const H = CARD_H;

  doc.setFillColor(KHAKI.r, KHAKI.g, KHAKI.b);
  doc.rect(0, 0, W, H, "F");

  doc.setFillColor(OLIVE.r, OLIVE.g, OLIVE.b);
  doc.rect(INSET, INSET, W - INSET * 2, HEADER_H, "F");
  doc.setTextColor(220, 215, 170);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.8);
  doc.text("REPUBLICA - CMF - FIVEM", W / 2, INSET + 3.2, { align: "center" });
  doc.setFontSize(5.4);
  doc.text("IDENTIDADE MILITAR", W / 2, INSET + 7, { align: "center" });

  const footerTop = H - INSET - FOOTER_H;
  const bodyY = INSET + HEADER_H + 1;
  const bodyBottom = footerTop - 0.8;
  const bodyH = bodyBottom - bodyY;

  const photoW = 14;
  const photoH = Math.min(32, bodyH - 1);
  const photoX = INSET + 1;
  const photoY = bodyY + (bodyH - photoH) / 2;

  doc.setDrawColor(OLIVE.r, OLIVE.g, OLIVE.b);
  doc.setLineWidth(0.25);
  if (id.fotoDataUrl) {
    try {
      doc.addImage(id.fotoDataUrl, imageFormat(id.fotoDataUrl), photoX, photoY, photoW, photoH);
    } catch {
      doc.setFillColor(210, 205, 180);
      doc.rect(photoX, photoY, photoW, photoH, "F");
    }
    doc.rect(photoX, photoY, photoW, photoH);
  } else {
    doc.setFillColor(210, 205, 180);
    doc.rect(photoX, photoY, photoW, photoH, "F");
    doc.rect(photoX, photoY, photoW, photoH);
    doc.setFontSize(3.8);
    doc.setTextColor(100, 100, 90);
    doc.text("FOTO", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
  }

  const qrSize = Math.min(15, bodyH - 2);
  const qrX = W - INSET - 1 - qrSize;
  const qrY = bodyY + (bodyH - qrSize) / 2;
  try {
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    doc.rect(qrX, qrY, qrSize, qrSize);
  } catch {
    /* QR opcional */
  }

  const infoX = photoX + photoW + 2;
  const infoW = Math.max(20, qrX - infoX - 1.5);
  const nome =
    profile?.displayName?.toUpperCase() ??
    pdfSafe(`${id.nome} ${id.sobrenome}`.toUpperCase(), 32);

  let y = bodyY + 0.5;
  const rowGap = 1.1;
  y = fieldCarteira(doc, infoX, y, "NOME", nome, infoW, 5.2) + rowGap;
  const row2Y = y;
  fieldCarteira(doc, infoX, row2Y, "MATRICULA", id.matricula, infoW * 0.5, 5.8);
  fieldCarteira(doc, infoX + infoW * 0.52, row2Y, "PATENTE / CARGO", id.patente ?? "—", infoW * 0.48, 4.8);
  y = row2Y + 6.2 + rowGap;
  const row3Y = y;
  fieldCarteira(doc, infoX, row3Y, "RG / ID", id.rg, infoW * 0.38, 5.2);
  fieldCarteira(
    doc,
    infoX + infoW * 0.4,
    row3Y,
    "VALIDADE",
    `${id.validadeDe} - ${id.validadeAte}`,
    infoW * 0.6,
    4.6,
  );

  doc.setDrawColor(OLIVE.r, OLIVE.g, OLIVE.b);
  doc.setLineWidth(0.1);
  doc.setLineDashPattern([0.6, 0.6], 0);
  doc.line(INSET + 1, footerTop, W - INSET - 1, footerTop);
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.4);
  doc.setTextColor(80, 90, 60);
  const footLeft = pdfSafe(options?.footerLeft ?? `PROTOCOLO ${id.protocolo}`, 28);
  doc.text(footLeft, INSET + 1, footerTop + 3.6, { maxWidth: infoW });
  doc.text("DOC. FICTICIO - CMF", W - INSET - 1, footerTop + 3.6, { align: "right" });

  doc.setDrawColor(OLIVE.r, OLIVE.g, OLIVE.b);
  doc.setLineWidth(0.35);
  doc.rect(INSET, INSET, W - INSET * 2, H - INSET * 2);

  return doc;
}

export async function baixarCarteiraMilitar(
  id: IdentidadeGerada,
  qrDataUrl: string,
  options?: CarteiraPdfOptions,
) {
  const pdf = await gerarCarteiraMilitarPdf(id, qrDataUrl, options);
  pdf.save(`CMF-carteira-${id.matricula}.pdf`);
}
