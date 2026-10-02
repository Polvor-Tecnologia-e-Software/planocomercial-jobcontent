import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AIContext } from "@/lib/ai/commercial-plan-prompt";
import type { ActionType, CommercialPlan, PlanAction } from "@/schemas/commercial-plan";

const generateStructuredJson = vi.fn();
vi.mock("@/lib/ai/client", () => ({ generateStructuredJson }));

const { ensureBlogCadence, missingBlogPostsByPhase } = await import("@/lib/ai/blog-cadence");

const CONTEXT: AIContext = {
  company: null,
  selectedChallenge: "D1",
  relevantAnswers: [],
  funnelAnalysis: { requiredFunnel: {}, gaps: {}, conversionRates: {}, missingData: [] },
  primaryBottleneckCandidate: "demand",
  secondaryRiskCandidate: null,
  signals: [],
  dataQuality: { percentage: 60, confidence: "medium" },
  scores: [],
  candidateActions: [],
};

function action(actionType: ActionType, title: string, withBrief = true): PlanAction {
  return {
    title,
    objective: "Objetivo",
    actionType,
    details: ["a", "b"],
    blogBrief:
      actionType === "content_blog" && withBrief
        ? { subtitle: "Gancho", sections: [{ heading: "H2", body: "Corpo" }, { heading: "H2b", body: "Corpo" }] }
        : null,
    richMaterialBrief: null,
    paidTrafficBrief: null,
    cadenceBrief: null,
    landingPageBrief: null,
    playbookBrief: null,
    suggestedOwner: "Marketing",
    deadline: "Semana 1",
    indicator: "Indicador",
    completionCriteria: "Critério",
    relatedPriority: 1,
  };
}

function planWith(plan90Days: CommercialPlan["plan90Days"]): CommercialPlan {
  return {
    priorities: [1, 2, 3].map((n) => ({
      title: `Prioridade ${n}`,
      rationale: "x",
      problemSolved: "x",
      expectedImpact: "x",
      primaryIndicator: "x",
      timeframe: "30 dias",
    })),
    plan90Days,
  } as CommercialPlan;
}

function newPost(title: string) {
  return {
    title,
    objective: "Objetivo",
    details: ["a", "b"],
    blogBrief: { subtitle: "Gancho", sections: [{ heading: "H2", body: "Corpo" }, { heading: "H2b", body: "Corpo" }] },
    suggestedOwner: "Marketing",
    deadline: "Semana 2",
    indicator: "Visitas",
    completionCriteria: "Publicado",
    relatedPriority: 1,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("missingBlogPostsByPhase", () => {
  it("aponta quantos posts faltam em cada fase, contando só blogs com blogBrief", () => {
    const missing = missingBlogPostsByPhase({
      days1to30: [action("content_blog", "A"), action("content_blog", "B")],
      days31to60: [action("content_blog", "C"), action("sales_process", "D")],
      days61to90: [action("content_blog", "E", false), action("rich_material", "F")],
    });
    expect(missing).toEqual({ days31to60: 1, days61to90: 2 });
  });
});

describe("ensureBlogCadence", () => {
  it("não chama a IA quando todo mês já tem 2 posts", async () => {
    const plan = planWith({
      days1to30: [action("content_blog", "A"), action("content_blog", "B")],
      days31to60: [action("content_blog", "C"), action("content_blog", "D")],
      days61to90: [action("content_blog", "E"), action("content_blog", "F")],
    });
    const result = await ensureBlogCadence(CONTEXT, plan);
    expect(generateStructuredJson).not.toHaveBeenCalled();
    expect(result.plan).toBe(plan);
  });

  it("completa só os meses que faltam, com a quantidade exata, e descarta blog sem brief", async () => {
    generateStructuredJson.mockResolvedValue({
      data: { days31to60: [newPost("Novo post mês 2")], days61to90: [newPost("Novo 3a"), newPost("Novo 3b")] },
      inputTokens: 100,
      outputTokens: 200,
      model: "teste",
      latencyMs: 300,
    });
    const plan = planWith({
      days1to30: [action("content_blog", "A"), action("content_blog", "B")],
      days31to60: [action("content_blog", "C"), action("sales_process", "D")],
      days61to90: [action("content_blog", "Sem brief", false), action("rich_material", "F")],
    });

    const result = await ensureBlogCadence(CONTEXT, plan);

    expect(generateStructuredJson).toHaveBeenCalledTimes(1);
    const schema = generateStructuredJson.mock.calls[0][0].schema;
    expect(schema.safeParse({ days31to60: [newPost("x")], days61to90: [newPost("y"), newPost("z")] }).success).toBe(
      true,
    );
    expect(schema.safeParse({ days31to60: [newPost("x")], days61to90: [newPost("y")] }).success).toBe(false);

    expect(missingBlogPostsByPhase(result.plan.plan90Days)).toEqual({});
    expect(result.plan.plan90Days.days1to30).toHaveLength(2);
    expect(result.plan.plan90Days.days61to90.map((a) => a.title)).toEqual(["F", "Novo 3a", "Novo 3b"]);
    expect(result.plan.plan90Days.days31to60[2]).toMatchObject({
      actionType: "content_blog",
      title: "Novo post mês 2",
      richMaterialBrief: null,
      landingPageBrief: null,
      playbookBrief: null,
    });
    expect(result).toMatchObject({ inputTokens: 100, outputTokens: 200, latencyMs: 300 });
  });
});
