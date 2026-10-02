import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PlanFrontsMatrix } from "@/components/result/plan-fronts-matrix";
import { buildPlanFronts } from "@/lib/plan-timeline";
import type { ActionType, CommercialPlan90Days, PlanAction } from "@/schemas/commercial-plan";

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

describe("PlanFrontsMatrix", () => {
  it("não renderiza nada quando não há nenhuma frente", () => {
    const { container } = render(<PlanFrontsMatrix fronts={[]} selected={0} onSelect={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra os itens de details e a entrega de completionCriteria em cada célula, sem inventar nenhum dado novo", () => {
    const plan: CommercialPlan90Days = {
      days1to30: [
        makeAction("seo", {
          details: ["Auditoria técnica completa", "Mapa de 60 palavras-chave"],
          completionCriteria: "Relatório de auditoria entregue",
        }),
      ],
      days31to60: [],
      days61to90: [],
    };
    render(<PlanFrontsMatrix fronts={buildPlanFronts(plan)} selected={0} onSelect={() => {}} />);

    expect(screen.getByText("SEO")).toBeInTheDocument();
    expect(screen.getByText("Auditoria técnica completa")).toBeInTheDocument();
    expect(screen.getByText("Mapa de 60 palavras-chave")).toBeInTheDocument();
    expect(screen.getByText("Entrega: Relatório de auditoria entregue")).toBeInTheDocument();
  });

  it("deixa a célula de um mês sem ações vazia, sem fabricar um item", () => {
    const plan: CommercialPlan90Days = {
      days1to30: [makeAction("seo")],
      days31to60: [],
      days61to90: [],
    };
    render(<PlanFrontsMatrix fronts={buildPlanFronts(plan)} selected={0} onSelect={() => {}} />);
    // Só o mês 1 tem ação de SEO — os meses 2 e 3 não devem ganhar nenhum
    // selo "Entrega" inventado pra preencher a célula vazia.
    expect(screen.getAllByText(/Entrega:/)).toHaveLength(1);
  });

  it("chama onSelect com o índice do mês ao clicar num cabeçalho da coluna", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const plan: CommercialPlan90Days = {
      days1to30: [makeAction("seo")],
      days31to60: [],
      days61to90: [],
    };
    render(<PlanFrontsMatrix fronts={buildPlanFronts(plan)} selected={0} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Selecionar Mês 3 na matriz" }));

    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
