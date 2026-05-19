import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DEFCON_LEVELS = [
  { level: 5, label: "DEFCON 5", desc: "Paz — rotina normal", color: "oklch(0.50 0.13 145)" },
  { level: 4, label: "DEFCON 4", desc: "Atenção elevada", color: "oklch(0.72 0.13 80)" },
  { level: 3, label: "DEFCON 3", desc: "Prontidão operacional", color: "oklch(0.65 0.15 55)" },
  { level: 2, label: "DEFCON 2", desc: "Alerta máximo", color: "oklch(0.55 0.18 35)" },
  { level: 1, label: "DEFCON 1", desc: "Guerra iminente", color: "oklch(0.48 0.18 30)" },
];

export function CentralGuerra() {
  const defcon = 4;

  return (
    <div className="central-guerra">
      <div className="stencil text-xs mb-1 text-(--color-destructive)">⚠ CENTRAL OPERACIONAL</div>
      <h1 className="text-3xl mb-2 font-display tracking-widest">Central de Guerra</h1>
      <p className="text-sm text-(--color-stencil) mb-6 max-w-2xl">
        Visão tática em tempo real — radar, tropas, alertas e nível DEFCON (demonstração).
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4 mb-4">
        <Card className="field-paper border-0 shadow-none overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="stencil text-xs">RADAR TÁTICO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="guerra-radar relative aspect-square max-h-80 mx-auto rounded-full border-2 border-(--color-olive-deep)/40 bg-(--color-olive-deep)/5">
              <div className="guerra-radar-sweep" />
              {[0, 45, 90, 135].map((deg) => (
                <span
                  key={deg}
                  className="absolute inset-0 m-auto w-px h-1/2 origin-bottom bg-(--color-olive-deep)/20"
                  style={{ transform: `rotate(${deg}deg)` }}
                />
              ))}
              <span className="absolute top-[22%] left-[58%] size-2 rounded-full bg-green-500 shadow-[0_0_8px_lime]" title="Unidade" />
              <span className="absolute top-[48%] left-[28%] size-2 rounded-full bg-yellow-500 shadow-[0_0_8px_gold]" title="Patrulha" />
              <span className="absolute top-[65%] left-[70%] size-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" title="Contato" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-[10px] text-(--color-stencil)">CMF · AO VIVO</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="field-paper border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="stencil text-xs">DEFCON ATUAL</CardTitle>
            </CardHeader>
            <CardContent>
              {DEFCON_LEVELS.filter((d) => d.level === defcon).map((d) => (
                <div key={d.level}>
                  <div className="font-display text-2xl tracking-widest" style={{ color: d.color }}>
                    {d.label}
                  </div>
                  <p className="text-xs text-(--color-stencil) mt-1">{d.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="field-paper border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="stencil text-xs">TROPAS ONLINE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-sm">
              <StatRow label="Efetivo em serviço" value="—" />
              <StatRow label="Patrulhas ativas" value="—" />
              <StatRow label="Operações" value="—" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="field-paper border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="stencil text-xs">LOGS EM TEMPO REAL</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="font-mono text-[11px] space-y-1.5 text-(--color-stencil) max-h-40 overflow-y-auto">
            <li><span className="text-green-600">[SYS]</span> Central de guerra inicializada</li>
            <li><span className="text-(--color-olive-deep)">[OPS]</span> Aguardando dados operacionais…</li>
            <li><span className="text-yellow-600">[ALERT]</span> Nenhum alerta crítico</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-(--color-border)/50 pb-1.5 last:border-0">
      <span className="text-(--color-stencil)">{label}</span>
      <span className="font-display tracking-wider text-(--color-olive-deep)">{value}</span>
    </div>
  );
}
