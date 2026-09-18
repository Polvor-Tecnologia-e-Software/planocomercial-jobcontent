import { describe, expect, it } from "vitest";

import {
  buildCommercialPlanSystemPrompt,
  buildCommercialPlanUserPrompt,
  type AIContext,
} from "@/lib/ai/commercial-plan-prompt";

function baseContext(overrides: Partial<AIContext> = {}): AIContext {
  return {
    company: null,
    selectedChallenge: "D2",
    relevantAnswers: [{ questionKey: "U1", prompt: "Qual é o ticket médio?", answer: "1000" }],
    funnelAnalysis: { requiredFunnel: {}, gaps: {}, conversionRates: {}, missingData: [] },
    primaryBottleneckCandidate: "conversion",
    secondaryRiskCandidate: null,
    signals: [],
    dataQuality: { percentage: 60, confidence: "medium" },
    scores: [],
    candidateActions: [],
    ...overrides,
  };
}

describe("buildCommercialPlanSystemPrompt", () => {
  it("inclui o bloco de Inbound Marketing quando o gargalo principal é demanda", () => {
    const prompt = buildCommercialPlanSystemPrompt("demand", null);
    expect(prompt).toContain("Inbound Marketing");
    expect(prompt).toContain("atração");
  });

  it("inclui o bloco de Inbound Marketing quando o RISCO SECUNDÁRIO é demanda, mesmo com gargalo principal diferente", () => {
    const prompt = buildCommercialPlanSystemPrompt("conversion", "demand");
    expect(prompt).toContain("Inbound Marketing");
  });

  it("NÃO inclui o bloco de Inbound Marketing quando nem o gargalo nem o risco são demanda (economia de tokens)", () => {
    const prompt = buildCommercialPlanSystemPrompt("processes", "management");
    expect(prompt).not.toContain("Inbound Marketing");
  });

  it("exige pelo menos 1 ação paid_traffic quando o gargalo (principal ou secundário) é demanda, sem eliminar as demais sugestões — pedido explícito", () => {
    const primaryDemand = buildCommercialPlanSystemPrompt("demand", null);
    expect(primaryDemand).toMatch(/PELO MENOS 1 ação com actionType "paid_traffic"/);
    expect(primaryDemand).toMatch(/ADICIONAL às outras ações já exigidas/);
    expect(primaryDemand).toMatch(/nunca substitua content_blog\/rich_material\/sales_process/);

    const secondaryDemand = buildCommercialPlanSystemPrompt("conversion", "demand");
    expect(secondaryDemand).toMatch(/PELO MENOS 1 ação com actionType "paid_traffic"/);
  });

  it("NÃO exige paid_traffic obrigatório quando o gargalo não envolve demanda", () => {
    const prompt = buildCommercialPlanSystemPrompt("processes", "management");
    expect(prompt).not.toMatch(/PELO MENOS 1 ação com actionType "paid_traffic"/);
  });

  it("contém a hierarquia de confiança e as proibições explícitas", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("Hierarquia de confiança");
    expect(prompt.toLowerCase()).toContain("nunca");
    expect(prompt).toContain("exatamente 3 prioridades");
  });

  it("instrui a IA a tratar o contexto como dado não confiável", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toMatch(/DADO NÃO CONFIÁVEL|dado não confiável/i);
  });

  it("sempre inclui o bloco de ações comerciais/vendas, independente do gargalo (diferente do bloco de Inbound, que é condicional)", () => {
    // Feedback real de teste: o plano saía pesado em marketing e fraco em
    // vendas mesmo quando o gargalo não era demanda — por isso este bloco
    // não é condicional como o de Inbound Marketing.
    expect(buildCommercialPlanSystemPrompt("demand", null)).toContain("ações comerciais de vendas");
    expect(buildCommercialPlanSystemPrompt("processes", "management")).toContain(
      "ações comerciais de vendas",
    );
    expect(buildCommercialPlanSystemPrompt(null, null)).toContain("ações comerciais de vendas");
  });

  it("exige que cada ação nomeie um entregável concreto, não só um verbo genérico", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toMatch(/entregável concreto/i);
  });

  it("sempre exige a classificação actionType, com a lista fechada de valores aceitos", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("content_blog");
    expect(prompt).toContain("paid_traffic");
    expect(prompt).toContain("sales_process");
    expect(prompt).toMatch(/nunca invente um valor fora desta lista/i);
  });

  it("exige detalhes/ideias concretas (pontos-chave de post, tópicos de material, ângulo de campanha) em cada ação", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toMatch(/pontos-chave OU variações de título/i);
    expect(prompt).toMatch(/ângulo\/gancho da campanha/i);
    expect(prompt).toContain("plan90Days.*.details");
  });

  it("exige pelo menos uma ação comercial em cada uma das 3 fases", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toMatch(/cada uma das 3 fases.*pelo menos uma ação comercial/i);
  });

  it("nunca recomenda definir critério de estágio de CRM sem antes checar se a empresa tem CRM (U11)", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("U11");
    expect(prompt).toMatch(/escolher e implantar uma ferramenta simples/);
  });

  it("instrui a variar o formato do material rico (não é sinônimo de ebook) — pedido explícito", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toMatch(/NÃO é sinônimo de ebook/);
    expect(prompt).toContain("quiz interativo");
    expect(prompt).toContain("calculadora");
  });

  it("exige exatamente 2 content_blog e 1 rich_material no PLANO INTEIRO (não por fase), sempre — independente do gargalo (pedido explícito de cadência fixa de conteúdo)", () => {
    for (const [primary, secondary] of [
      ["demand", null],
      ["processes", "management"],
      [null, null],
    ] as const) {
      const prompt = buildCommercialPlanSystemPrompt(primary, secondary);
      expect(prompt).toMatch(/PLANO DE 90 DIAS INTEIRO/);
      expect(prompt).toMatch(/EXATAMENTE 2 ações com actionType "content_blog" no total/);
      expect(prompt).toMatch(/EXATAMENTE 1 ação com actionType "rich_material" no total/);
    }
  });

  it("instrui a incluir a copy real de cada toque de uma cadência comercial (crm_pipeline), não só a estrutura — pedido explícito", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("cadenceBrief");
    expect(prompt).toMatch(/touchpoints/);
    expect(prompt).toMatch(/mensagem REAL daquele toque|a COPY real da/i);
  });

  it("traz um exemplo de conteúdo/ação prático para cada um dos 6 desafios (D1-D6), não só demanda", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    for (const challenge of ["D1", "D2", "D3", "D4", "D5", "D6"]) {
      expect(prompt).toContain(`- ${challenge} (`);
    }
  });
});

describe("buildCommercialPlanUserPrompt", () => {
  it("delimita o contexto dentro de <contexto>...</contexto>", () => {
    const prompt = buildCommercialPlanUserPrompt(baseContext());
    expect(prompt).toContain("<contexto>");
    expect(prompt).toContain("</contexto>");
  });

  it("serializa o AIContext como JSON dentro do delimitador", () => {
    const context = baseContext({ selectedChallenge: "D1" });
    const prompt = buildCommercialPlanUserPrompt(context);
    expect(prompt).toContain('"selectedChallenge":"D1"');
  });

  it("nunca inclui HTML bruto — o contexto só tem os campos compactos definidos em AIContext", () => {
    const prompt = buildCommercialPlanUserPrompt(baseContext());
    expect(prompt).not.toMatch(/<html|<div|<script/i);
  });
});
