import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PlanMonthDetail } from "@/components/result/plan-month-detail";
import type { ActionType, CommercialPlan90Days, PlanAction, PlanPhaseSummaries } from "@/schemas/commercial-plan";

const PHASE_SUMMARIES: PlanPhaseSummaries = {
  days1to30: { goal: "Meta do mês 1.", milestone: "Marco do mês 1." },
  days31to60: { goal: "Meta do mês 2.", milestone: "Marco do mês 2." },
  days61to90: { goal: "Meta do mês 3.", milestone: "Marco do mês 3." },
};

const COMPANY_NAME = "CodeBit";
const COMPANY_WEBSITE = "codebit.com.br";

function makeAction(actionType: ActionType, overrides: Partial<PlanAction> = {}): PlanAction {
  return {
    title: "Ação",
    objective: "Objetivo",
    actionType,
    details: ["Detalhe 1", "Detalhe 2"],
    blogBrief: null,
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
    ...overrides,
  };
}

function emptyPlan(): CommercialPlan90Days {
  return { days1to30: [], days31to60: [], days61to90: [] };
}

describe("PlanMonthDetail — abas de mês", () => {
  it("começa com o Mês 1 selecionado e mostra as ações desse mês", () => {
    const plan = emptyPlan();
    plan.days1to30 = [makeAction("sales_process", { title: "Ação do mês 1" })];
    plan.days31to60 = [makeAction("sales_process", { title: "Ação do mês 2" })];
    render(<PlanMonthDetail plan={plan} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);

    expect(screen.getByText("Ação do mês 1")).toBeInTheDocument();
    expect(screen.queryByText("Ação do mês 2")).not.toBeInTheDocument();
  });

  it("troca o conteúdo exibido ao clicar na aba de outro mês", async () => {
    const user = userEvent.setup();
    const plan = emptyPlan();
    plan.days1to30 = [makeAction("sales_process", { title: "Ação do mês 1" })];
    plan.days31to60 = [makeAction("sales_process", { title: "Ação do mês 2" })];
    render(<PlanMonthDetail plan={plan} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);

    await user.click(screen.getByRole("button", { name: "Selecionar Mês 2" }));

    expect(screen.queryByText("Ação do mês 1")).not.toBeInTheDocument();
    expect(screen.getByText("Ação do mês 2")).toBeInTheDocument();
  });

  it("reflete o mês selecionado no teaser de sugestões bloqueadas", async () => {
    const user = userEvent.setup();
    render(<PlanMonthDetail plan={emptyPlan()} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);

    expect(screen.getByText("Mais 6 sugestões para o Mês 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Selecionar Mês 3" }));
    expect(screen.getByText("Mais 6 sugestões para o Mês 3")).toBeInTheDocument();
  });

  it("mostra o post de blog por completo, sem esconder atrás de um clique", () => {
    const plan = emptyPlan();
    plan.days1to30 = [
      makeAction("content_blog", {
        title: "5 sinais de dependência de indicação",
        blogBrief: {
          subtitle: "O gancho do post.",
          sections: [
            { heading: "Primeiro H2", body: "Parágrafo do primeiro H2." },
            { heading: "Segundo H2", body: "Parágrafo do segundo H2." },
          ],
        },
      }),
    ];
    render(<PlanMonthDetail plan={plan} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);

    expect(screen.getByText("5 sinais de dependência de indicação")).toBeInTheDocument();
    expect(screen.getByText("O gancho do post.")).toBeInTheDocument();
    expect(screen.getByText("Primeiro H2")).toBeInTheDocument();
    expect(screen.getByText("Parágrafo do primeiro H2.")).toBeInTheDocument();
    expect(screen.getByText("1 posts de blog")).toBeInTheDocument();
  });

  it("mostra o material rico com o mockup padrão (só formato + título) e o detalhamento ao lado", () => {
    const plan = emptyPlan();
    plan.days1to30 = [
      makeAction("rich_material", {
        title: "Guia de Especificação de Válvulas",
        richMaterialBrief: {
          format: "ebook",
          subtitle: "Proposta de valor do material.",
          sections: [
            { title: "Capítulo 1", description: "O que tem aqui." },
            { title: "Capítulo 2", description: "O que tem aqui." },
            { title: "Capítulo 3", description: "O que tem aqui." },
          ],
          coverIdea: "Capa azul, minimalista.",
        },
      }),
    ];
    render(<PlanMonthDetail plan={plan} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);

    expect(screen.getByText("Material rico do mês")).toBeInTheDocument();
    expect(screen.getByText("ebook")).toBeInTheDocument();
    expect(screen.getAllByText("Guia de Especificação de Válvulas").length).toBeGreaterThan(0);
    expect(screen.getByText("Proposta de valor do material.")).toBeInTheDocument();
    expect(screen.getByText("Capítulo 1")).toBeInTheDocument();
    expect(screen.getByText("Capa azul, minimalista.")).toBeInTheDocument();
    expect(screen.getByText(COMPANY_NAME)).toBeInTheDocument();
  });

  it("mostra a landing page com o mockup padrão (só URL + headline) e o detalhamento ao lado", () => {
    const plan = emptyPlan();
    plan.days1to30 = [
      makeAction("landing_page", {
        landingPageBrief: {
          name: "Orçamento técnico",
          url: "/orcamento-tecnico",
          goal: "Capturar leads prontos para orçamento.",
          heroHeadline: "Receba um orçamento técnico em 24h",
          heroSubheadline: "Fale com um especialista sem compromisso.",
          formFields: ["Nome", "WhatsApp", "Segmento da empresa"],
          buttonText: "Quero meu orçamento técnico",
          sections: [
            { title: "Como funciona", description: "Passo a passo." },
            { title: "FAQ", description: "Perguntas frequentes." },
            { title: "Prova social", description: "Depoimentos." },
            { title: "Diferenciais", description: "O que nos diferencia." },
          ],
        },
      }),
    ];
    render(
      <PlanMonthDetail
        plan={plan}
        phaseSummaries={PHASE_SUMMARIES}
        companyName={COMPANY_NAME}
        companyWebsite={COMPANY_WEBSITE}
      />,
    );

    expect(screen.getByText("Landing page do mês · sugestão de hero")).toBeInTheDocument();
    expect(screen.getByText("Orçamento técnico")).toBeInTheDocument();
    expect(screen.getByText("/orcamento-tecnico")).toBeInTheDocument();
    expect(screen.getByText(`${COMPANY_WEBSITE}/orcamento-tecnico`)).toBeInTheDocument();
    expect(screen.getByText("Receba um orçamento técnico em 24h")).toBeInTheDocument();
    expect(screen.getByText("Fale com um especialista sem compromisso.")).toBeInTheDocument();
    expect(screen.getByText("Capturar leads prontos para orçamento.")).toBeInTheDocument();
    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Quero meu orçamento técnico")).toBeInTheDocument();
    expect(screen.getByText("1. Como funciona")).toBeInTheDocument();
  });

  it("some a linha de domínio no mockup de hero da LP quando a empresa não informou site, sem inventar um", () => {
    const plan = emptyPlan();
    plan.days1to30 = [
      makeAction("landing_page", {
        landingPageBrief: {
          name: "Orçamento técnico",
          url: "/orcamento-tecnico",
          goal: "Capturar leads prontos para orçamento.",
          heroHeadline: "Receba um orçamento técnico em 24h",
          heroSubheadline: "Fale com um especialista sem compromisso.",
          formFields: ["Nome", "WhatsApp", "Segmento da empresa"],
          buttonText: "Quero meu orçamento técnico",
          sections: [
            { title: "Como funciona", description: "Passo a passo." },
            { title: "FAQ", description: "Perguntas frequentes." },
            { title: "Prova social", description: "Depoimentos." },
            { title: "Diferenciais", description: "O que nos diferencia." },
          ],
        },
      }),
    ];
    render(
      <PlanMonthDetail
        plan={plan}
        phaseSummaries={PHASE_SUMMARIES}
        companyName={COMPANY_NAME}
        companyWebsite={null}
      />,
    );

    expect(screen.queryByText(`${COMPANY_WEBSITE}/orcamento-tecnico`)).not.toBeInTheDocument();
    expect(screen.getAllByText("/orcamento-tecnico").length).toBeGreaterThan(0);
  });

  it("mostra o anúncio de tráfego pago por completo nas sugestões de conteúdo (sempre presente, qualquer objetivo) — pedido explícito", () => {
    const plan = emptyPlan();
    plan.days1to30 = [
      makeAction("paid_traffic", {
        title: "Campanha de remarketing",
        paidTrafficBrief: {
          primaryText: "Texto de apoio do anúncio.",
          headline: "Título do criativo",
          subheadline: "Linha de apoio do anúncio",
          ctaText: "Saiba mais",
        },
      }),
    ];
    render(
      <PlanMonthDetail
        plan={plan}
        phaseSummaries={PHASE_SUMMARIES}
        companyName={COMPANY_NAME}
        companyWebsite={COMPANY_WEBSITE}
      />,
    );

    expect(screen.getByText("Anúncio para Meta Ads")).toBeInTheDocument();
    expect(screen.getByText("Patrocinado")).toBeInTheDocument();
    expect(screen.getAllByText(COMPANY_NAME).length).toBeGreaterThan(0);
    expect(screen.getByText(COMPANY_WEBSITE)).toBeInTheDocument();
    expect(screen.getByText("Anúncio de tráfego pago")).toBeInTheDocument();
    expect(screen.getAllByText("Texto de apoio do anúncio.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Título do criativo").length).toBeGreaterThan(0);
    expect(screen.getByText("Linha de apoio do anúncio")).toBeInTheDocument();
    expect(screen.getAllByText("Saiba mais").length).toBeGreaterThan(0);
    expect(screen.getByText("1 anúncio")).toBeInTheDocument();
  });

  it("mostra a cadência de 5 dias (canais + objetivo por dia, sem copy) no cartão de ações comerciais", () => {
    const plan = emptyPlan();
    plan.days1to30 = [
      makeAction("crm_pipeline", {
        cadenceBrief: {
          days: [
            { channels: ["email", "whatsapp"], goal: "Primeiro contato" },
            { channels: ["phone", "whatsapp"], goal: "Qualificar a necessidade" },
            { channels: ["linkedin"], goal: "Gerar valor" },
            { channels: ["phone"], goal: "Tratar objeção" },
            { channels: ["email"], goal: "Encerrar ou agendar" },
          ],
        },
      }),
    ];
    render(<PlanMonthDetail plan={plan} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);

    expect(screen.getByText("Cadência de 5 dias")).toBeInTheDocument();
    expect(screen.getByText("Dia 01")).toBeInTheDocument();
    expect(screen.getByText("E-mail + WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Telefone + WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Dia 05")).toBeInTheDocument();
  });

  it("mostra o passo a passo de como montar o playbook numa ação de processo de vendas", () => {
    const plan = emptyPlan();
    plan.days1to30 = [
      makeAction("sales_process", {
        playbookBrief: {
          steps: [
            { title: "Mapear o cliente ideal", howTo: "Liste os 10 melhores clientes e o que têm em comum." },
            { title: "Escrever o roteiro de qualificação", howTo: "Defina as perguntas de cada etapa." },
            { title: "Listar objeções", howTo: "Reúna o time e registre as respostas que funcionam." },
            { title: "Documentar e treinar", howTo: "Centralize num documento único e treine o time." },
          ],
          adoptionTip: "Revise o playbook todo mês na reunião comercial.",
        },
      }),
    ];
    render(<PlanMonthDetail plan={plan} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);

    expect(screen.getByText("Como montar o playbook")).toBeInTheDocument();
    expect(screen.getByText("Mapear o cliente ideal")).toBeInTheDocument();
    expect(screen.getByText("Revise o playbook todo mês na reunião comercial.")).toBeInTheDocument();
  });

  it("não mostra o cartão de sugestões de conteúdo quando o mês não tem blog/material/LP", () => {
    const plan = emptyPlan();
    plan.days1to30 = [makeAction("sales_process")];
    render(<PlanMonthDetail plan={plan} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);
    expect(screen.queryByText("Sugestões de conteúdo")).not.toBeInTheDocument();
  });

  it("não mostra o cartão de ações comerciais quando o mês só tem conteúdo", () => {
    const plan = emptyPlan();
    plan.days1to30 = [
      makeAction("content_blog", {
        blogBrief: { subtitle: "x", sections: [{ heading: "a", body: "b" }, { heading: "c", body: "d" }] },
      }),
    ];
    render(<PlanMonthDetail plan={plan} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);
    expect(screen.queryByText("Ações comerciais")).not.toBeInTheDocument();
  });

  it("mostra o banner do mês com a meta e o marco de sucesso de phaseSummaries, e troca ao mudar de aba", async () => {
    const user = userEvent.setup();
    render(<PlanMonthDetail plan={emptyPlan()} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);

    expect(screen.getByText("Meta do mês 1.")).toBeInTheDocument();
    expect(screen.getByText("Marco do mês 1.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Selecionar Mês 2" }));

    expect(screen.getByText("Meta do mês 2.")).toBeInTheDocument();
    expect(screen.getByText("Marco do mês 2.")).toBeInTheDocument();
    expect(screen.queryByText("Meta do mês 1.")).not.toBeInTheDocument();
  });

  it("mostra a matriz frente x mês com os itens reais de details e a entrega de completionCriteria", () => {
    const plan = emptyPlan();
    plan.days1to30 = [
      makeAction("sales_process", {
        details: ["Script com 5 perguntas", "Critério de MQL documentado"],
        completionCriteria: "Script aplicado por 2 semanas seguidas",
      }),
    ];
    render(<PlanMonthDetail plan={plan} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);

    // "Script com 5 perguntas" aparece duas vezes de propósito: uma vez no
    // cartão de ações comerciais (details) e outra na matriz (mesmo dado,
    // reorganizado) — é a mesma informação em duas visualizações.
    expect(screen.getAllByText("Script com 5 perguntas").length).toBeGreaterThan(0);
    expect(screen.getByText("Entrega: Script aplicado por 2 semanas seguidas")).toBeInTheDocument();
  });

  it("a matriz muda de mês em destaque ao clicar no cabeçalho da coluna, sincronizado com as abas", async () => {
    const user = userEvent.setup();
    const plan = emptyPlan();
    plan.days1to30 = [makeAction("sales_process", { title: "Ação do mês 1" })];
    plan.days31to60 = [makeAction("sales_process", { title: "Ação do mês 2" })];
    render(<PlanMonthDetail plan={plan} phaseSummaries={PHASE_SUMMARIES} companyName={COMPANY_NAME} companyWebsite={COMPANY_WEBSITE} />);

    expect(screen.getByText("Ação do mês 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Selecionar Mês 2 na matriz" }));

    expect(screen.queryByText("Ação do mês 1")).not.toBeInTheDocument();
    expect(screen.getAllByText("Ação do mês 2").length).toBeGreaterThan(0);
  });
});
