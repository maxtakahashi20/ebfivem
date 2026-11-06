// Cada papel só alcança o que deve, conferido no servidor. Sai com erro se algo vazar.
// Precisa do ambiente de e2e/ambiente.sh e do site em E2E_URL (padrão http://127.0.0.1:8090).
const { chromium } = require("playwright");
const crypto = require("crypto");

const B = process.env.E2E_URL || "http://127.0.0.1:8090";
const SEGREDO = process.env.DISCORD_SESSION_SECRET;
const b64 = (x) => Buffer.from(x).toString("base64url");
const sessao = (id, cargos, segredo = SEGREDO, exp = Date.now() + 3600e3) => {
  const roles = cargos.map((r) => ({ id: r, name: r, color: "", position: 1 }));
  const body = b64(JSON.stringify({ id, username: "e2e", globalName: null, displayName: "E2E", avatarUrl: "", nick: null, roles, exp }));
  return body + "." + crypto.createHmac("sha256", segredo).update(body).digest("base64url");
};

const NIVEL = { membro: 0, instrutor: 1, alto: 2, alto_tag: 2, dev: 3 };
const SESSOES = {
  membro: sessao("900000000000000003", []),
  instrutor: sessao("900000000000000005", ["111"]),
  alto: sessao("900000000000000004", ["222"]),
  dev: sessao("900000000000000006", ["333"]),
  // Sem cargo no Discord; Alto Comando pela tag no efetivo (e2e/ambiente.sh).
  alto_tag: sessao("900000000000000009", []),
  forjada: sessao("900000000000000007", ["222"], "segredo-errado"),
  expirada: sessao("900000000000000008", ["222"], SEGREDO, Date.now() - 1000),
  chave_antiga: "26L5",
  vazia: "",
};

const I = "/src/lib/inscricoes.functions.ts";
const A = "/src/lib/admin-modules.functions.ts";
const U = "/src/lib/suporte.functions.ts";
const D = "/src/lib/discord.functions.ts";
const P = "/src/lib/admin.functions.ts";
const ID = "00000000-0000-4000-8000-000000000000";
const VIEWS_ALTO = ["intel-sigilosos", "intel-blacklist", "disc-sindicancias", "discord-webhooks", "efetivo-ativos", "ops-ativas", "logs-geral", "view-inventada"];
const VIEWS_DEV = ["sys-db", "sys-api", "sys-seguranca", "restrito-docs", "restrito-intel"];
const casos = (session) => [
  [0, P, "getPainelStatus", { session }],
  [0, I, "obterEstatisticas", { session }],
  [1, I, "listarInscricoes", { session }],
  [1, I, "obterUltimoProtocolo", { session }],
  [1, I, "atualizarInscricao", { session, id: ID, status: "aprovado" }],
  [1, I, "excluirInscricao", { session, id: ID }],
  [1, A, "carregarModuloAdmin", { session, view: "recrutamento-entrevistas" }],
  ...VIEWS_ALTO.map((view) => [2, A, "carregarModuloAdmin", { session, view }]),
  ...VIEWS_DEV.map((view) => [3, A, "carregarModuloAdmin", { session, view }]),
  [3, A, "definirAltoComando", { session, militarId: ID, ativo: false }],
  [2, A, "criarRegistroModulo", { session, view: "disc-expulsoes", valores: { militar: "E2E", motivo: "e2e" } }],
  [2, A, "atualizarStatusDiscordBot", { session }],
  [3, A, "baixarPdfRestrito", { session, recordId: ID }],
  [2, D, "enviarComunicadoDiscord", { session, titulo: "Título e2e", mensagem: "Mensagem e2e", tipo: "informativo" }],
  [2, U, "listarTicketsAdmin", { session }],
];
const negado = (m) => /Acesso restrito|Sessão Discord|too_small/.test(m || "");

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  await ctx.route("https://discord.com/**", (r) => r.abort());
  const pg = await ctx.newPage();
  await pg.goto(B + "/autoria", { waitUntil: "load", timeout: 180000 });
  await pg.waitForFunction(() => document.documentElement && Object.keys(document).some((k) => k.startsWith("__react")), null, { timeout: 120000 });
  const chamar = (m, f, d) =>
    pg.evaluate(
      async ([m, f, d]) => {
        const x = await import(m);
        try {
          await x[f]({ data: d });
          return {};
        } catch (e) {
          return { err: e.message };
        }
      },
      [m, f, d],
    );

  let erros = 0;
  let total = 0;
  for (const [nome, s] of Object.entries(SESSOES)) {
    for (const [exigido, m, f, d] of casos(s)) {
      total++;
      const r = await chamar(m, f, d);
      const deve = nome in NIVEL && NIVEL[nome] >= exigido;
      if (deve === negado(r.err)) {
        erros++;
        console.error(`ERRADO ${nome} ${f} ${d.view || ""}: ${deve ? "devia liberar" : "devia negar"} (${(r.err || "liberou").slice(0, 80)})`);
      }
    }
  }
  const soRg = await chamar(I, "consultarFicha", { rg: "11111" });
  total++;
  if (!soRg.err) {
    erros++;
    console.error("ERRADO consulta pública aceitou só RG");
  }
  await b.close();
  console.log(erros ? `${erros} erros em ${total} verificações` : `OK: ${total} verificações`);
  process.exit(erros ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
