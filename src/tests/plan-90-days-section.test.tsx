import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Plan90DaysSection } from "@/components/result/plan-90-days-section";
import type { CommercialPlan90Days, PlanAction } from "@/schemas/commercial-plan";

function makeAction(overrides: Partial<PlanAction> = {}): PlanAction {
  return {
    title: "Ação",
    objective: "Objetivo",
    actionType: "sales_process",
    details: ["Detalhe 1", "Detalhe 2"],
    blogBrief: null,
    richMaterialBrief: null,
    paidTrafficBrief: null,
    cadenceBrief: null,
    suggestedOwner: "Vendas",
    deadline: "Semana 1",
    indicator: "Indicador",
    completionCriteria: "Critério",
    relatedPriority: 1,
    ...overrides,
  };
}

function makePlan(action: PlanAction): CommercialPlan90Days {
  return {
    days1to30: [action],
    days31to60: [makeAction({ relatedPriority: 2 })],
    days61to90: [makeAction({ relatedPriority: 3 })],
  };
}

describe("Plan90DaysSection — briefs de conteúdo (blogBrief/richMaterialBrief/paidTrafficBrief)", () => {
  it("não mostra nenhum brief expansível quando a ação não é de conteúdo", () => {
    render(<Plan90DaysSection plan={makePlan(makeAction())} />);
    expect(screen.queryByText(/Ver desenvolvimento completo/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ver sumário completo/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ver copy completo/)).not.toBeInTheDocument();
  });

  it("mostra o desenvolvimento completo de um post de blog (subtítulo + seções H2)", () => {
    const action = makeAction({
      actionType: "content_blog",
      blogBrief: {
        subtitle: "O gancho do post.",
        sections: [
          { heading: "Primeiro H2", body: "Parágrafo do primeiro H2." },
          { heading: "Segundo H2", body: "Parágrafo do segundo H2." },
        ],
      },
    });
    render(<Plan90DaysSection plan={makePlan(action)} />);

    expect(screen.getByText("Ver desenvolvimento completo do post")).toBeInTheDocument();
    expect(screen.getByText("O gancho do post.")).toBeInTheDocument();
    expect(screen.getByText("Primeiro H2")).toBeInTheDocument();
    expect(screen.getByText("Parágrafo do primeiro H2.")).toBeInTheDocument();
    expect(screen.getByText("Segundo H2")).toBeInTheDocument();
  });

  it("mostra o sumário completo de um material rico (seções numeradas + ideia de capa), com o formato no resumo", () => {
    const action = makeAction({
      actionType: "rich_material",
      richMaterialBrief: {
        format: "quiz interativo",
        subtitle: "A proposta de valor do material.",
        sections: [
          { title: "Pergunta 1", description: "O que tem aqui." },
          { title: "Pergunta 2", description: "O que tem aqui." },
          { title: "Pergunta 3", description: "O que tem aqui." },
        ],
        coverIdea: "Capa azul, minimalista.",
      },
    });
    render(<Plan90DaysSection plan={makePlan(action)} />);

    expect(screen.getByText("Ver sumário completo do material (quiz interativo)")).toBeInTheDocument();
    expect(screen.getByText("1. Pergunta 1")).toBeInTheDocument();
    expect(screen.getByText("2. Pergunta 2")).toBeInTheDocument();
    expect(screen.getByText("3. Pergunta 3")).toBeInTheDocument();
    expect(screen.getByText("Ideia de capa")).toBeInTheDocument();
    expect(screen.getByText("Capa azul, minimalista.")).toBeInTheDocument();
  });

  it("mostra o copy completo de um anúncio de tráfego pago (headline + subheadline)", () => {
    const action = makeAction({
      actionType: "paid_traffic",
      paidTrafficBrief: {
        headline: "Título do criativo",
        subheadline: "Linha de apoio do anúncio",
      },
    });
    render(<Plan90DaysSection plan={makePlan(action)} />);

    expect(screen.getByText("Ver copy completo do anúncio")).toBeInTheDocument();
    expect(screen.getByText("Título do criativo")).toBeInTheDocument();
    expect(screen.getByText("Linha de apoio do anúncio")).toBeInTheDocument();
  });

  it("mostra o copy completo de uma cadência de follow-up (toques com momento + canal + copy)", () => {
    const action = makeAction({
      actionType: "crm_pipeline",
      cadenceBrief: {
        touchpoints: [
          { moment: "D+2", channel: "E-mail", copy: "Oi [Nome], só reforçando a proposta que te enviei." },
          { moment: "D+5", channel: "WhatsApp", copy: "Ficou alguma dúvida sobre a proposta?" },
        ],
      },
    });
    render(<Plan90DaysSection plan={makePlan(action)} />);

    expect(screen.getByText("Ver copy completo da cadência")).toBeInTheDocument();
    expect(screen.getByText("D+2 · E-mail")).toBeInTheDocument();
    expect(screen.getByText("Oi [Nome], só reforçando a proposta que te enviei.")).toBeInTheDocument();
    expect(screen.getByText("D+5 · WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Ficou alguma dúvida sobre a proposta?")).toBeInTheDocument();
  });
});
