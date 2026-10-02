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

  it("exige EXATAMENTE 1 ação paid_traffic em TODA fase, pra qualquer gargalo — pedido explícito: 'inclua sempre sugestão de anúncio de tráfego pago, seja qual for o objetivo'", () => {
    for (const [primary, secondary] of [
      ["demand", null],
      ["processes", "management"],
      [null, null],
    ] as const) {
      const prompt = buildCommercialPlanSystemPrompt(primary, secondary);
      expect(prompt).toMatch(/EXATAMENTE 1 ação com actionType "paid_traffic"/);
      expect(prompt).toMatch(/SEMPRE, mesmo quando o gargalo não é demanda/);
      expect(prompt).toMatch(/ADITIVAS, uma nunca substitui a outra/);
    }
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

  it("exige cadência fixa de conteúdo e mídia POR FASE (2 content_blog + 1 rich_material + 1 landing_page + 1 paid_traffic em cada uma das 3 fases), sempre — independente do gargalo (pedido explícito de cadência previsível por mês)", () => {
    for (const [primary, secondary] of [
      ["demand", null],
      ["processes", "management"],
      [null, null],
    ] as const) {
      const prompt = buildCommercialPlanSystemPrompt(primary, secondary);
      expect(prompt).toMatch(/TODAS as 3 fases/);
      expect(prompt).toMatch(/EXATAMENTE 2 ações com actionType "content_blog"/);
      expect(prompt).toMatch(/EXATAMENTE 1 ação com actionType "rich_material"/);
      expect(prompt).toMatch(/EXATAMENTE 1 ação com actionType "landing_page"/);
      expect(prompt).toMatch(/EXATAMENTE 1 ação com actionType "paid_traffic"/);
    }
  });

  it("inclui o tipo landing_page na lista fechada de actionType, com a distinção de seo e rich_material", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("landing_page");
    expect(prompt).toMatch(/diferente de "seo".*"rich_material"/);
  });

  it("instrui a landing_page do mês a promover prioritariamente o rich_material do mesmo mês", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("promover prioritariamente o rich_material do MESMO mês");
  });

  it("exige o preenchimento de landingPageBrief (name, url, hero, formFields, buttonText, sections) só quando actionType é landing_page", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("landingPageBrief");
    expect(prompt).toMatch(/preencha SÓ landingPageBrief/);
    expect(prompt).toContain("formFields");
    expect(prompt).toContain("buttonText");
  });

  it("exige o preenchimento de paidTrafficBrief (primaryText, headline, subheadline, ctaText) e que o anúncio leve pra mesma oferta da landing_page do mês", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("paidTrafficBrief");
    expect(prompt).toMatch(/preencha SÓ paidTrafficBrief/);
    expect(prompt).toContain("primaryText");
    expect(prompt).toContain("ctaText");
    expect(prompt).toMatch(/MESMA oferta da landing_page do mês/);
  });

  it("traz um exemplo de paid_traffic pra cada um dos 6 desafios (D1-D6), não só demanda — pedido explícito", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    for (const challenge of ["D1", "D2", "D3", "D4", "D5", "D6"]) {
      const line = new RegExp(`- ${challenge} \\([^\\n]*paid_traffic`);
      expect(prompt).toMatch(line);
    }
  });

  it("exige goal e milestone pra cada uma das 3 fases em phaseSummaries, SEM NENHUM número em nenhum dos dois campos — bug real: a IA interpolou um valor 'razoável' entre o atual e a meta (ex.: 22 -> 35 -> 45) que nunca existiu no contexto", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("phaseSummaries");
    expect(prompt).toMatch(/goal e um milestone PARA CADA UMA das 3 fases/);
    expect(prompt).toMatch(/NUNCA cite nenhum número em goal nem em milestone/);
    expect(prompt).toMatch(/progressão lógica \(estruturar -> ativar -> escalar\)/);
  });

  it("preenche strategicSummary com mediaBudgetPriority qualitativo (alta/media/baixa/teste), nunca um número ou porcentagem", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("strategicSummary");
    expect(prompt).toContain("mediaBudgetPriority");
    expect(prompt).toMatch(/NUNCA um número ou porcentagem/);
  });

  it("pede a cadência como ESTRUTURA de 5 dias (canais + objetivo por dia), nunca a copy — pedido explícito", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("cadenceBrief");
    expect(prompt).toMatch(/cadência de EXATAMENTE 5 dias/);
    expect(prompt).toMatch(/NUNCA a copy das mensagens/);
    expect(prompt).toMatch(/Dia 01 email \+ whatsapp, Dia 02 phone \+ whatsapp/);
  });

  it("pede o passo a passo de como montar o playbook nas ações sales_process — pedido explícito", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("playbookBrief");
    expect(prompt).toMatch(/COMO a empresa monta o playbook/);
    expect(prompt).toContain("adoptionTip");
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
