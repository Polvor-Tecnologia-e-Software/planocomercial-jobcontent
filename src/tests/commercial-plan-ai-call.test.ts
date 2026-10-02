import { describe, expect, it, vi } from "vitest";

import type { AIContext } from "@/lib/ai/commercial-plan-prompt";

const generateStructuredJson = vi.fn();

vi.mock("@/lib/ai/client", () => ({ generateStructuredJson }));

const { generateCommercialPlanContent } = await import("@/lib/ai/commercial-plan");

const FAKE_CONTEXT: AIContext = {
  company: null,
  selectedChallenge: "D2",
  relevantAnswers: [],
  funnelAnalysis: { requiredFunnel: {}, gaps: {}, conversionRates: {}, missingData: [] },
  primaryBottleneckCandidate: null,
  secondaryRiskCandidate: null,
  signals: [],
  dataQuality: { percentage: 60, confidence: "medium" },
  scores: [],
  candidateActions: [],
};

/**
 * Bug real em produção: generateCommercialPlanContent gera até ~15-16k
 * tokens de saída (MAX_OUTPUT_TOKENS em src/lib/ai/commercial-plan.ts),
 * mas o timeout padrão de generateStructuredJson (DEFAULT_TIMEOUT_MS em
 * src/lib/ai/client.ts) é 30s — curto demais pra esse volume num modelo
 * real. A chamada precisa passar um timeoutMs maior explicitamente, nunca
 * confiar no padrão (que é dimensionado pras chamadas pequenas de
 * site-analysis/seo-keywords).
 */
describe("generateCommercialPlanContent — timeout proporcional ao tamanho da saída", () => {
  it("passa um timeoutMs bem maior que o padrão de 30s, dado o volume de saída desta chamada", async () => {
    // Fases já com 2 posts completos cada — não dispara a chamada extra
    // de ensureBlogCadence (testada à parte em blog-cadence.test.ts).
    const twoBlogs = [
      { actionType: "content_blog", blogBrief: { subtitle: "x", sections: [] } },
      { actionType: "content_blog", blogBrief: { subtitle: "x", sections: [] } },
    ];
    generateStructuredJson.mockResolvedValue({
      data: { plan90Days: { days1to30: twoBlogs, days31to60: twoBlogs, days61to90: twoBlogs } },
      inputTokens: 1,
      outputTokens: 1,
      model: "modelo-de-teste",
      latencyMs: 1,
    });

    await generateCommercialPlanContent(FAKE_CONTEXT);

    expect(generateStructuredJson).toHaveBeenCalledTimes(1);
    const callArgs = generateStructuredJson.mock.calls[0][0];
    expect(callArgs.timeoutMs).toBeGreaterThanOrEqual(120_000);
  });
});
