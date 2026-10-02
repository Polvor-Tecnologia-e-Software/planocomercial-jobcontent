import { describe, expect, it } from "vitest";

import { computeMediaBudgetSplit } from "@/lib/plan-media-budget";

describe("computeMediaBudgetSplit", () => {
  it("converte prioridade qualitativa em porcentagem, sempre somando 100", () => {
    const result = computeMediaBudgetSplit([
      { channel: "Google", priority: "alta" },
      { channel: "LinkedIn", priority: "media" },
      { channel: "Meta", priority: "baixa" },
      { channel: "Testes", priority: "teste" },
    ]);

    expect(result.reduce((sum, r) => sum + r.percent, 0)).toBe(100);
    // alta > media > baixa > teste
    expect(result[0].percent).toBeGreaterThan(result[1].percent);
    expect(result[1].percent).toBeGreaterThan(result[2].percent);
    expect(result[2].percent).toBeGreaterThan(result[3].percent);
  });

  it("soma 100 mesmo com só 2 canais", () => {
    const result = computeMediaBudgetSplit([
      { channel: "Google", priority: "alta" },
      { channel: "Meta", priority: "baixa" },
    ]);
    expect(result.reduce((sum, r) => sum + r.percent, 0)).toBe(100);
  });

  it("soma 100 mesmo com 5 canais da mesma prioridade (caso de arredondamento feio: 20% cada)", () => {
    const result = computeMediaBudgetSplit([
      { channel: "A", priority: "alta" },
      { channel: "B", priority: "alta" },
      { channel: "C", priority: "alta" },
      { channel: "D", priority: "alta" },
      { channel: "E", priority: "alta" },
    ]);
    expect(result.reduce((sum, r) => sum + r.percent, 0)).toBe(100);
    expect(result.every((r) => r.percent === 20)).toBe(true);
  });

  it("nunca inventa um canal — a lista de saída é exatamente a de entrada, só com percent calculado", () => {
    const input = [
      { channel: "Google", priority: "alta" as const },
      { channel: "LinkedIn", priority: "media" as const },
    ];
    const result = computeMediaBudgetSplit(input);
    expect(result.map((r) => r.channel)).toEqual(["Google", "LinkedIn"]);
  });
});
