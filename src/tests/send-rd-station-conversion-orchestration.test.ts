import { beforeEach, describe, expect, it, vi } from "vitest";

const getDiagnosticById = vi.fn();
const completeDiagnostic = vi.fn();
const getCompanyById = vi.fn();
const getLeadById = vi.fn();
const findIntegrationByEvent = vi.fn();
const createIntegrationIfAbsent = vi.fn();
const markIntegrationSent = vi.fn();
const markIntegrationFailed = vi.fn();
const markIntegrationPermanentlyFailed = vi.fn();
const getCommercialPlanResult = vi.fn();
const sendConversion = vi.fn();

// vi.hoisted: a factory de vi.mock roda antes de qualquer "let" normal do
// arquivo — precisamos de um objeto mutável que já exista nesse momento
// para poder ligar/desligar RD_STATION_API_KEY por teste (caso
// "not_configured").
const envState = vi.hoisted(() => ({ rdApiKey: "chave-de-teste" as string | undefined }));

vi.mock("@/config/env.server", () => ({
  parseServerEnv: () => ({
    AI_API_KEY: "x",
    AI_MODEL: "x",
    SUPABASE_SERVICE_ROLE_KEY: "x",
    APP_URL: "https://quiz.jobcontent.com.br/",
    RD_STATION_API_KEY: envState.rdApiKey,
  }),
}));

vi.mock("@/lib/database", () => ({
  diagnostics: { getDiagnosticById, completeDiagnostic },
  companies: { getCompanyById },
  leads: { getLeadById },
  rdIntegrations: {
    findIntegrationByEvent,
    createIntegrationIfAbsent,
    markIntegrationSent,
    markIntegrationFailed,
    markIntegrationPermanentlyFailed,
  },
}));

vi.mock("@/server/get-commercial-plan-result", () => ({ getCommercialPlanResult }));
vi.mock("@/lib/rd-station/client", () => ({ sendConversion }));

const { sendRdStationCaptureConversion, sendRdStationCompletedConversion: sendRdStationConversion } = await import(
  "@/server/send-rd-station-conversion",
);

function diagnostic(overrides: Record<string, unknown> = {}) {
  return {
    id: "diagnostic-1",
    company_id: "company-1",
    lead_id: "lead-1",
    status: "prediagnosis_ready",
    selected_challenge: "D2",
    primary_bottleneck: "conversion",
    secondary_risk: null,
    data_quality_percentage: 60,
    confidence_level: "medium",
    ...overrides,
  };
}

function company(overrides: Record<string, unknown> = {}) {
  return { id: "company-1", company_name: "CodeBit", website: null, segment: null, ...overrides };
}

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead-1",
    company_id: "company-1",
    email: "pessoa@empresa.com.br",
    name: null,
    phone: null,
    job_title: null,
    consent_given: true,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    rd_traffic_source: null,
    rd_client_tracking_id: null,
    ...overrides,
  };
}

function completedPlanResult(overrides: Record<string, unknown> = {}) {
  return { status: "completed" as const, diagnosticId: "diagnostic-1", companyName: "CodeBit", ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  envState.rdApiKey = "chave-de-teste";
  getDiagnosticById.mockResolvedValue(diagnostic());
  completeDiagnostic.mockResolvedValue(diagnostic({ status: "completed" }));
  getCompanyById.mockResolvedValue(company());
  getLeadById.mockResolvedValue(lead());
  getCommercialPlanResult.mockResolvedValue(completedPlanResult());
  findIntegrationByEvent.mockResolvedValue(null);
  createIntegrationIfAbsent.mockResolvedValue({
    row: { id: "integration-1", attempts: 0, created_at: new Date().toISOString() },
    created: true,
  });
  markIntegrationSent.mockResolvedValue({});
  markIntegrationFailed.mockResolvedValue({});
  markIntegrationPermanentlyFailed.mockResolvedValue({});
  sendConversion.mockResolvedValue({ kind: "success", httpStatus: 200, latencyMs: 10, eventUuid: "abc" });
});

describe("sendRdStationConversion — pré-condições", () => {
  it("skipped (not_configured) quando RD_STATION_API_KEY não está definida — nunca chama o banco", async () => {
    envState.rdApiKey = undefined;
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "skipped", reason: "not_configured" });
    expect(getDiagnosticById).not.toHaveBeenCalled();
  });

  it("skipped (diagnostic_not_found) quando o diagnóstico não existe", async () => {
    getDiagnosticById.mockResolvedValue(null);
    const result = await sendRdStationConversion("inexistente");
    expect(result).toEqual({ status: "skipped", reason: "diagnostic_not_found" });
  });

  it("skipped (plan_not_ready) quando o plano ainda não foi gerado", async () => {
    getCommercialPlanResult.mockResolvedValue({ status: "not_generated" });
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "skipped", reason: "plan_not_ready" });
    expect(sendConversion).not.toHaveBeenCalled();
  });

  it("skipped (missing_email) quando o lead não tem e-mail", async () => {
    getLeadById.mockResolvedValue(lead({ email: null }));
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "skipped", reason: "missing_email" });
    expect(sendConversion).not.toHaveBeenCalled();
  });
});

describe("sendRdStationConversion — LGPD", () => {
  it("skipped (consent_missing) quando o lead não deu consentimento — nunca envia", async () => {
    getLeadById.mockResolvedValue(lead({ consent_given: false }));
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "skipped", reason: "consent_missing" });
    expect(sendConversion).not.toHaveBeenCalled();
    expect(createIntegrationIfAbsent).not.toHaveBeenCalled();
  });

  it("com consentimento dado, prossegue e envia normalmente", async () => {
    getLeadById.mockResolvedValue(lead({ consent_given: true }));
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "sent" });
    expect(sendConversion).toHaveBeenCalledTimes(1);
  });
});

describe("sendRdStationConversion — conclusão do diagnóstico", () => {
  it("marca o diagnóstico como completed quando o plano está pronto, mesmo que o envio ao RD falhe depois", async () => {
    sendConversion.mockResolvedValue({ kind: "server_error", httpStatus: 500, latencyMs: 5 });
    await sendRdStationConversion("diagnostic-1");
    expect(completeDiagnostic).toHaveBeenCalledWith("diagnostic-1");
  });

  it("não chama completeDiagnostic de novo se o status já é completed", async () => {
    getDiagnosticById.mockResolvedValue(diagnostic({ status: "completed" }));
    await sendRdStationConversion("diagnostic-1");
    expect(completeDiagnostic).not.toHaveBeenCalled();
  });
});

describe("sendRdStationConversion — sucesso e payload", () => {
  it("envio bem-sucedido marca a integração como sent e retorna status sent", async () => {
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "sent" });
    expect(markIntegrationSent).toHaveBeenCalledWith("integration-1");
  });

  it("envia o link do diagnóstico (APP_URL + /diagnostico/{id}) em cf_link_plano_comercial", async () => {
    await sendRdStationConversion("diagnostic-1");
    const [payloadArg] = sendConversion.mock.calls[0];
    expect(payloadArg.cf_link_plano_comercial).toBe("https://quiz.jobcontent.com.br/diagnostico/diagnostic-1");
  });

  it("a conversão de captura também leva o link do diagnóstico", async () => {
    await sendRdStationCaptureConversion("diagnostic-1");
    const [payloadArg] = sendConversion.mock.calls[0];
    expect(payloadArg.cf_link_plano_comercial).toBe("https://quiz.jobcontent.com.br/diagnostico/diagnostic-1");
  });
});

describe("sendRdStationConversion — idempotência / geração duplicada", () => {
  it("já enviado (status sent em rd_integrations) -> already_sent, sem chamar o RD Station de novo", async () => {
    findIntegrationByEvent.mockResolvedValue({ id: "integration-1", status: "sent", attempts: 1 });
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "already_sent" });
    expect(sendConversion).not.toHaveBeenCalled();
  });

  it("diagnóstico já enviado com falha permanente -> failed, sem nova tentativa automática", async () => {
    findIntegrationByEvent.mockResolvedValue({ id: "integration-1", status: "failed", attempts: 2 });
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "failed", reason: "validation_error" });
    expect(sendConversion).not.toHaveBeenCalled();
  });

  it("duplo clique / chamadas paralelas: a segunda chamada reaproveita a linha criada pela primeira (sem duplicar)", async () => {
    // Simula createIntegrationIfAbsent devolvendo a MESMA linha para duas
    // chamadas concorrentes (comportamento real de created:false na 2ª).
    createIntegrationIfAbsent.mockResolvedValue({
      row: { id: "integration-1", attempts: 0, created_at: new Date().toISOString() },
      created: false,
    });
    const [r1, r2] = await Promise.all([
      sendRdStationConversion("diagnostic-1"),
      sendRdStationConversion("diagnostic-1"),
    ]);
    expect(r1).toEqual({ status: "sent" });
    expect(r2).toEqual({ status: "sent" });
  });
});

describe("sendRdStationConversion — retry e classificação de erro", () => {
  it("erro de validação (400) -> failed permanente, não elegível a retry automático", async () => {
    sendConversion.mockResolvedValue({ kind: "validation_error", httpStatus: 400, latencyMs: 5 });
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "failed", reason: "validation_error" });
    expect(markIntegrationPermanentlyFailed).toHaveBeenCalledWith("integration-1", "validation_error");
  });

  it("erro de autenticação (401/403) -> failed permanente", async () => {
    sendConversion.mockResolvedValue({ kind: "auth_error", httpStatus: 401, latencyMs: 5 });
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "failed", reason: "auth_error" });
  });

  it("429 (rate limit) -> retrying, elegível a nova tentativa", async () => {
    sendConversion.mockResolvedValue({ kind: "rate_limited", httpStatus: 429, latencyMs: 5 });
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "retrying" });
    expect(markIntegrationFailed).toHaveBeenCalledWith("integration-1", "rate_limited");
  });

  it("500 -> retrying", async () => {
    sendConversion.mockResolvedValue({ kind: "server_error", httpStatus: 500, latencyMs: 5 });
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "retrying" });
  });

  it("timeout -> retrying", async () => {
    sendConversion.mockResolvedValue({ kind: "timeout", latencyMs: 10000 });
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "retrying" });
  });

  it("esgotadas as tentativas -> failed (too_many_attempts), sem nova chamada ao RD Station", async () => {
    findIntegrationByEvent.mockResolvedValue({ id: "integration-1", status: "retrying", attempts: 3 });
    const result = await sendRdStationConversion("diagnostic-1");
    expect(result).toEqual({ status: "failed", reason: "too_many_attempts" });
    expect(sendConversion).not.toHaveBeenCalled();
    expect(markIntegrationPermanentlyFailed).toHaveBeenCalledWith("integration-1", "too_many_attempts");
  });
});

describe("sendRdStationCompletedConversion — identificador e origem", () => {
  it("envia com o identificador plano-comercial-90-dias-realizado e registra esse evento", async () => {
    await sendRdStationConversion("diagnostic-1");
    const [payloadArg] = sendConversion.mock.calls[0];
    expect(payloadArg.conversion_identifier).toBe("plano-comercial-90-dias-realizado");
    expect(findIntegrationByEvent).toHaveBeenCalledWith("diagnostic-1", "plano-comercial-90-dias-realizado");
  });

  it("envia a origem pelo cookie da RD quando existe, e o client_tracking_id", async () => {
    getLeadById.mockResolvedValue(
      lead({ rd_traffic_source: "encoded_src", rd_client_tracking_id: "trk-1", utm_source: "google", utm_medium: "cpc" }),
    );
    await sendRdStationConversion("diagnostic-1");
    const [payloadArg] = sendConversion.mock.calls[0];
    expect(payloadArg.traffic_source).toBe("encoded_src");
    expect(payloadArg.traffic_medium).toBeUndefined();
    expect(payloadArg.client_tracking_id).toBe("trk-1");
  });
});

describe("sendRdStationCaptureConversion — envio do formulário inicial", () => {
  it("envia com o identificador plano-comercial-90-dias-captura, sem exigir plano pronto", async () => {
    getCommercialPlanResult.mockResolvedValue({ status: "not_generated" });
    getLeadById.mockResolvedValue(lead({ name: "Maria", utm_source: "google", utm_medium: "cpc" }));

    const result = await sendRdStationCaptureConversion("diagnostic-1");

    expect(result).toEqual({ status: "sent" });
    const [payloadArg] = sendConversion.mock.calls[0];
    expect(payloadArg.conversion_identifier).toBe("plano-comercial-90-dias-captura");
    expect(payloadArg.name).toBe("Maria");
    expect(payloadArg.traffic_source).toBe("google");
    expect(payloadArg.traffic_medium).toBe("cpc");
    expect(payloadArg.cf_desafio_principal).toBeUndefined();
    expect(completeDiagnostic).not.toHaveBeenCalled();
    expect(createIntegrationIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({ event_name: "plano-comercial-90-dias-captura" }),
    );
  });

  it("não envia sem consentimento nem sem API Key", async () => {
    getLeadById.mockResolvedValue(lead({ consent_given: false }));
    expect(await sendRdStationCaptureConversion("diagnostic-1")).toEqual({
      status: "skipped",
      reason: "consent_missing",
    });
    envState.rdApiKey = undefined;
    expect(await sendRdStationCaptureConversion("diagnostic-1")).toEqual({
      status: "skipped",
      reason: "not_configured",
    });
    expect(sendConversion).not.toHaveBeenCalled();
  });

  it("idempotente: já enviada -> already_sent", async () => {
    findIntegrationByEvent.mockResolvedValue({ id: "integration-1", status: "sent", attempts: 1 });
    expect(await sendRdStationCaptureConversion("diagnostic-1")).toEqual({ status: "already_sent" });
    expect(sendConversion).not.toHaveBeenCalled();
  });
});
