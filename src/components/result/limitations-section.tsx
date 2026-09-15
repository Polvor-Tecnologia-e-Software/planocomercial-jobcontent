type LimitationsSectionProps = {
  limitations: string[];
};

/** Seção 9 (BRD): bloco pequeno e discreto — de propósito, sem destaque forte, para não competir com o restante do relatório. */
export function LimitationsSection({ limitations }: LimitationsSectionProps) {
  if (limitations.length === 0) return null;

  return (
    <section className="shadow-card flex flex-col gap-3 rounded-lg bg-white px-6 py-6">
      <h2 className="text-brand-navy-900 text-[15px] font-extrabold">
        O que considerar ao interpretar este diagnóstico
      </h2>
      <ul className="flex flex-col gap-1.5 text-[13.5px] text-[#45505f]">
        {limitations.map((limitation) => (
          <li key={limitation}>• {limitation}</li>
        ))}
      </ul>
    </section>
  );
}
