import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ResultFunnelStage } from "@/server/get-commercial-plan-result";

type FunnelLeakMapProps = {
  stages: ResultFunnelStage[];
};

/**
 * Seção 2 (BRD): Atual x Necessário por estágio do funil, em barras CSS
 * simples (sem biblioteca de gráfico — nem justifica o peso para 5
 * barras). Só mostra o que foi de fato calculado; nunca inventa um
 * número para preencher uma etapa sem dado (ver
 * src/server/get-commercial-plan-result.ts).
 */
export function FunnelLeakMap({ stages }: FunnelLeakMapProps) {
  const calculableStages = stages.filter((stage) => !stage.uncalculable);
  const biggestLeakKey =
    calculableStages.length > 0
      ? calculableStages.reduce((worst, stage) =>
          (stage.gap ?? -1) > (worst.gap ?? -1) ? stage : worst,
        ).key
      : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">Mapa de gargalos comerciais</h2>
        <p className="text-muted-foreground text-sm">
          Onde a operação comercial perde volume entre um estágio e o próximo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {stages.map((stage) => (
          <FunnelStageCard key={stage.key} stage={stage} isBiggestLeak={stage.key === biggestLeakKey} />
        ))}
      </div>
    </section>
  );
}

function FunnelStageCard({
  stage,
  isBiggestLeak,
}: {
  stage: ResultFunnelStage;
  isBiggestLeak: boolean;
}) {
  if (stage.uncalculable) {
    return (
      <Card className="shadow-card flex flex-col py-0">
        <CardHeader className="gap-1 p-4 pb-0">
          <CardTitle className="text-brand-navy-900 text-sm font-bold">{stage.label}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center p-4">
          <p className="text-muted-foreground text-xs">
            Não foi possível calcular esta etapa com os dados disponíveis.
          </p>
        </CardContent>
      </Card>
    );
  }

  const max = Math.max(stage.current ?? 0, stage.required ?? 0, 1);

  return (
    <Card
      className={cn(
        "relative flex flex-col border-2 py-0",
        isBiggestLeak
          ? "border-brand-orange shadow-lift bg-gradient-to-b from-[#fff6ef] to-white"
          : "border-transparent shadow-card",
      )}
    >
      {isBiggestLeak ? (
        <span className="bg-gradient-brand-orange shadow-brand-orange-deep/35 absolute -top-2.5 right-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-white" />
          </span>
          Maior gargalo
        </span>
      ) : null}
      <CardHeader className="gap-1 p-4 pb-0">
        <CardTitle className="text-brand-navy-900 text-sm font-bold">{stage.label}</CardTitle>
        {stage.rateLabel && stage.ratePercent !== null ? (
          <CardDescription className="text-xs">
            {stage.rateLabel}: {stage.ratePercent}%
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <FunnelBar label="Atual" value={stage.current} max={max} tone={isBiggestLeak ? "orange" : "blue"} />
        <FunnelBar
          label="Necessário"
          value={stage.required}
          max={max}
          tone={isBiggestLeak ? "orange" : "blue"}
          full
        />
        {stage.gap !== null ? (
          <p className={cn("text-xs font-bold", isBiggestLeak ? "text-brand-orange-deep" : "text-brand-blue-dark")}>
            Gap: {stage.gap}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FunnelBar({
  label,
  value,
  max,
  tone,
  full,
}: {
  label: string;
  value: number | null;
  max: number;
  tone: "blue" | "orange";
  full?: boolean;
}) {
  const percent = full ? 100 : value !== null ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-brand-navy-900 font-semibold">{value ?? "—"}</span>
      </div>
      <div className="bg-brand-gray-light h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "orange" ? "bg-gradient-brand-orange" : "bg-gradient-brand-blue",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
