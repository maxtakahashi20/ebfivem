// Gera um comprovante de inscrição em PDF, com padrão militar.
import { jsPDF } from "jspdf";

export type InscricaoPdfData = {
  protocolo: string;
  nome: string;
  sobrenome: string;
  rg: string;
  telefone: string;
  discord_id: string;
  motivacao: string;
  created_at?: string;
};

export function gerarComprovantePdf(d: InscricaoPdfData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const MARGIN = 16;

  // Outer border
  doc.setDrawColor(40, 60, 25);
  doc.setLineWidth(0.8);
  doc.rect(MARGIN - 4, MARGIN - 4, W - (MARGIN - 4) * 2, H - (MARGIN - 4) * 2);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN - 2, MARGIN - 2, W - (MARGIN - 2) * 2, H - (MARGIN - 2) * 2);

  // Header band
  doc.setFillColor(40, 60, 25);
  doc.rect(MARGIN - 4, MARGIN - 4, W - (MARGIN - 4) * 2, 18, "F");
  doc.setTextColor(220, 215, 170);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CMF · COMANDO MILITAR DO FIVEM", W / 2, MARGIN + 4, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("COMPROVANTE OFICIAL DE ALISTAMENTO", W / 2, MARGIN + 10, { align: "center" });

  // Body
  doc.setTextColor(20, 30, 15);
  let y = MARGIN + 26;

  // Protocolo box
  doc.setFillColor(245, 240, 215);
  doc.rect(MARGIN, y, W - MARGIN * 2, 16, "F");
  doc.setDrawColor(40, 60, 25);
  doc.rect(MARGIN, y, W - MARGIN * 2, 16);
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text("PROTOCOLO DE IDENTIFICAÇÃO", MARGIN + 3, y + 5);
  doc.setFontSize(20);
  doc.text(d.protocolo, MARGIN + 3, y + 13);
  y += 24;

  // Section: dados pessoais
  drawSection(doc, MARGIN, y, W, "SEÇÃO I — DADOS DO CONSCRITO");
  y += 8;
  drawField(doc, MARGIN, y, "NOME COMPLETO", `${d.nome} ${d.sobrenome}`);
  y += 10;
  drawField(doc, MARGIN, y, "RG (IDENTIDADE)", d.rg);
  drawField(doc, MARGIN + (W - MARGIN * 2) / 2, y, "TELEFONE", d.telefone);
  y += 10;
  drawField(doc, MARGIN, y, "ID DO DISCORD", d.discord_id);
  y += 14;

  // Section: motivação
  drawSection(doc, MARGIN, y, W, "SEÇÃO II — DECLARAÇÃO DE MOTIVAÇÃO");
  y += 8;
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  const split = doc.splitTextToSize(d.motivacao, W - MARGIN * 2 - 4);
  doc.setFillColor(252, 250, 235);
  const boxH = Math.max(20, split.length * 5 + 6);
  doc.rect(MARGIN, y, W - MARGIN * 2, boxH, "F");
  doc.setDrawColor(80, 90, 60);
  doc.rect(MARGIN, y, W - MARGIN * 2, boxH);
  doc.text(split, MARGIN + 3, y + 6);
  y += boxH + 8;

  // Section: registro
  drawSection(doc, MARGIN, y, W, "SEÇÃO III — REGISTRO");
  y += 8;
  const dataIns = d.created_at ? new Date(d.created_at) : new Date();
  drawField(doc, MARGIN, y, "DATA DE APRESENTAÇÃO", dataIns.toLocaleString("pt-BR"));
  y += 10;
  drawField(doc, MARGIN, y, "STATUS INICIAL", "PENDENTE · AGUARDANDO ANÁLISE");
  y += 14;

  // Declaração
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  const decl = doc.splitTextToSize(
    "Declaro, sob compromisso, que as informações prestadas neste comprovante são verdadeiras e " +
      "que me apresento voluntariamente ao Comando Militar do Fivem (CMF), reconhecendo a hierarquia, " +
      "a disciplina e o regulamento interno da tropa. Este documento é de uso fictício, destinado " +
      "exclusivamente ao ambiente FiveM.",
    W - MARGIN * 2,
  );
  doc.text(decl, MARGIN, y);
  y += decl.length * 4.5 + 14;

  // Assinatura
  doc.setDrawColor(40, 60, 25);
  doc.line(MARGIN, y, MARGIN + 70, y);
  doc.line(W - MARGIN - 70, y, W - MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("ASSINATURA DO CONSCRITO", MARGIN, y + 4);
  doc.text("INSTRUTOR DESIGNADO", W - MARGIN - 70, y + 4);

  // Stamp CMF (faux)
  doc.saveGraphicsState?.();
  doc.setTextColor(20, 20, 20);
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(1.2);
  const sx = W - MARGIN - 35;
  const sy = y - 26;
  doc.rect(sx, sy, 30, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CMF", sx + 15, sy + 11, { align: "center" });
  doc.restoreGraphicsState?.();

  // Footer
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    `CMF · COMANDO MILITAR DO FIVEM · DOCUMENTO Nº ${d.protocolo} · USO FICTÍCIO · ${new Date().getFullYear()}`,
    W / 2,
    H - MARGIN - 2,
    { align: "center" },
  );

  return doc;
}

function drawSection(doc: jsPDF, x: number, y: number, w: number, label: string) {
  doc.setFillColor(40, 60, 25);
  doc.rect(x, y, w - x * 2, 6, "F");
  doc.setTextColor(220, 215, 170);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label, x + 2, y + 4.2);
  doc.setTextColor(20, 30, 15);
}

function drawField(doc: jsPDF, x: number, y: number, label: string, value: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(80, 90, 60);
  doc.text(label, x, y);
  doc.setFont("courier", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 15);
  doc.text(value || "—", x, y + 5);
}

export function baixarComprovante(d: InscricaoPdfData) {
  const pdf = gerarComprovantePdf(d);
  pdf.save(`CMF-${d.protocolo}.pdf`);
}
