import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/actions/confirm-site-analysis-action", () => ({
  confirmSiteAnalysisAction: vi.fn(),
}));
vi.mock("@/server/actions/reject-site-analysis-action", () => ({
  rejectSiteAnalysisAction: vi.fn(),
}));
vi.mock("@/server/actions/continue-without-analysis-action", () => ({
  continueWithoutAnalysisAction: vi.fn(),
}));

const { SiteAnalysisConfirmation } = await import(
  "@/components/diagnostic/site-analysis-confirmation"
);

const baseResult = {
  company_name: "ACME Tecnologia",
  description: "Plataforma de automação comercial B2B.",
  segment: "Tecnologia",
  products_services: ["Automação de vendas"],
  main_offer: "Automação de vendas",
  apparent_target_audience: "Empresas B2B de médio porte",
  probable_business_model: "SaaS por assinatura",
  value_proposition: "Vender mais gastando menos tempo",
  differentiators: ["Suporte 24/7", "Integração com ERP"],
  commercial_proofs: ["+500 clientes ativos"],
  calls_to_action: ["Fale com um especialista"],
  contact_channels: ["WhatsApp"],
  conversion_assets: ["Formulário de contato"],
  main_findings: ["O site não menciona preços publicamente."],
  evidence: [],
  confidence: "high" as const,
};

const baseProps = {
  diagnosticId: "diagnostic-1",
  companyId: "company-1",
  siteAnalysisId: "site-analysis-1",
  result: baseResult,
};

describe("SiteAnalysisConfirmation", () => {
  it("exibe os campos principais entendidos sobre a empresa", () => {
    render(<SiteAnalysisConfirmation {...baseProps} />);

    expect(screen.getByText("Foi isso que entendemos sobre sua empresa")).toBeInTheDocument();
    expect(
      screen.getByText("Plataforma de automação comercial B2B."),
    ).toBeInTheDocument();
    expect(screen.getByText("Tecnologia")).toBeInTheDocument();
    expect(screen.getByText("Automação de vendas")).toBeInTheDocument();
    expect(screen.getByText("Empresas B2B de médio porte")).toBeInTheDocument();
    expect(screen.getByText("SaaS por assinatura")).toBeInTheDocument();
  });

  it("exibe diferenciais, provas e mecanismos de conversão", () => {
    render(<SiteAnalysisConfirmation {...baseProps} />);

    expect(screen.getByText("Suporte 24/7")).toBeInTheDocument();
    expect(screen.getByText("Integração com ERP")).toBeInTheDocument();
    expect(screen.getByText("+500 clientes ativos")).toBeInTheDocument();
    // Mesclado de calls_to_action + conversion_assets, sem duplicar:
    expect(screen.getByText("Fale com um especialista")).toBeInTheDocument();
    expect(screen.getByText("Formulário de contato")).toBeInTheDocument();
  });

  it("mostra claramente que é inferência e o nível de confiança", () => {
    render(<SiteAnalysisConfirmation {...baseProps} />);

    expect(screen.getByText("Confiança alta")).toBeInTheDocument();
    expect(screen.getByText(/Isso é uma inferência automática/i)).toBeInTheDocument();
  });

  it("não exibe conteúdo bruto do site, só o resumo estruturado", () => {
    render(<SiteAnalysisConfirmation {...baseProps} />);

    expect(screen.queryByText(/<html|<body|<script/i)).not.toBeInTheDocument();
  });

  it("oferece as quatro ações da Tela 3", () => {
    render(<SiteAnalysisConfirmation {...baseProps} />);

    expect(screen.getByRole("button", { name: "Sim, continuar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quero ajustar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Não está correto" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continuar sem usar esses dados" }),
    ).toBeInTheDocument();
  });

  it("permite editar os campos sem sobrescrever nada até confirmar", async () => {
    const user = userEvent.setup();
    render(<SiteAnalysisConfirmation {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "Quero ajustar" }));

    const descriptionField = screen.getByLabelText("Descrição");
    expect(descriptionField).toHaveValue("Plataforma de automação comercial B2B.");

    await user.clear(descriptionField);
    await user.type(descriptionField, "Descrição ajustada pela pessoa.");

    expect(
      screen.getByRole("button", { name: "Salvar e continuar" }),
    ).toBeInTheDocument();
    // O valor original só existiria de novo se a pessoa cancelar o ajuste
    // — nada é submetido/sobrescrito automaticamente ao digitar.
    expect(descriptionField).toHaveValue("Descrição ajustada pela pessoa.");
  });
});
