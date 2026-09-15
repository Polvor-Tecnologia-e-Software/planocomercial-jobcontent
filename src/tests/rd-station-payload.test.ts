import { describe, expect, it } from "vitest";

import { RD_CONVERSION_IDENTIFIER } from "@/lib/rd-station/config";
import { RD_CUSTOM_FIELDS, RD_NATIVE_FIELDS } from "@/lib/rd-station/field-map";
import { buildRdStationConversionPayload, type BuildRdStationConversionPayloadInput } from "@/lib/rd-station/payload";

function baseInput(overrides: Partial<BuildRdStationConversionPayloadInput> = {}): BuildRdStationConversionPayloadInput {
  return {
    lead: {
      email: "pessoa@empresa.com.br",
      name: null,
      personalPhone: null,
      mobilePhone: null,
      jobTitle: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
    },
    company: {
      companyName: "CodeBit Tecnologia",
      website: null,
      segment: null,
    },
    diagnostic: {
      diagnosticId: "diagnostic-1",
      challengeLabel: null,
      primaryBottleneckLabel: null,
      confidenceLevel: null,
    },
    pdf: null,
    ...overrides,
  };
}

describe("buildRdStationConversionPayload — base", () => {
  it("sempre inclui conversion_identifier e email", () => {
    const payload = buildRdStationConversionPayload(baseInput());
    expect(payload.conversion_identifier).toBe(RD_CONVERSION_IDENTIFIER);
    expect(payload.email).toBe("pessoa@empresa.com.br");
  });

  it("sempre inclui company_name e o id do diagnóstico", () => {
    const payload = buildRdStationConversionPayload(baseInput());
    expect(payload[RD_NATIVE_FIELDS.companyName]).toBe("CodeBit Tecnologia");
    expect(payload[RD_CUSTOM_FIELDS.diagnosticId]).toBe("diagnostic-1");
  });

  it("omite campos opcionais ausentes em vez de enviar null/vazio", () => {
    const payload = buildRdStationConversionPayload(baseInput());
    expect(payload[RD_NATIVE_FIELDS.name]).toBeUndefined();
    expect(payload[RD_NATIVE_FIELDS.website]).toBeUndefined();
    expect(payload[RD_NATIVE_FIELDS.trafficSource]).toBeUndefined();
    expect(payload[RD_CUSTOM_FIELDS.pdfLink]).toBeUndefined();
  });
});

describe("buildRdStationConversionPayload — UTMs", () => {
  it("com todas as UTMs presentes, mapeia para os nomes nativos corretos do RD Station", () => {
    const payload = buildRdStationConversionPayload(
      baseInput({
        lead: {
          ...baseInput().lead,
          utmSource: "google",
          utmMedium: "cpc",
          utmCampaign: "plano_comercial",
          utmContent: "criativo_industria",
          utmTerm: "geracao_de_leads",
        },
      }),
    );

    expect(payload[RD_NATIVE_FIELDS.trafficSource]).toBe("google");
    expect(payload[RD_NATIVE_FIELDS.trafficMedium]).toBe("cpc");
    expect(payload[RD_NATIVE_FIELDS.trafficCampaign]).toBe("plano_comercial");
    // utm_term vira traffic_value (não existe traffic_term documentado).
    expect(payload[RD_NATIVE_FIELDS.trafficValue]).toBe("geracao_de_leads");
    // utm_content não tem campo nativo — vai como campo personalizado.
    expect(payload[RD_CUSTOM_FIELDS.utmContent]).toBe("criativo_industria");
  });

  it("sem nenhuma UTM, nenhum campo de tráfego aparece no payload", () => {
    const payload = buildRdStationConversionPayload(baseInput());
    expect(payload[RD_NATIVE_FIELDS.trafficSource]).toBeUndefined();
    expect(payload[RD_NATIVE_FIELDS.trafficMedium]).toBeUndefined();
    expect(payload[RD_NATIVE_FIELDS.trafficCampaign]).toBeUndefined();
    expect(payload[RD_NATIVE_FIELDS.trafficValue]).toBeUndefined();
    expect(payload[RD_CUSTOM_FIELDS.utmContent]).toBeUndefined();
  });

  it("com apenas utm_source e utm_campaign, só esses dois aparecem", () => {
    const payload = buildRdStationConversionPayload(
      baseInput({
        lead: { ...baseInput().lead, utmSource: "google", utmCampaign: "plano_comercial" },
      }),
    );

    expect(payload[RD_NATIVE_FIELDS.trafficSource]).toBe("google");
    expect(payload[RD_NATIVE_FIELDS.trafficCampaign]).toBe("plano_comercial");
    expect(payload[RD_NATIVE_FIELDS.trafficMedium]).toBeUndefined();
    expect(payload[RD_NATIVE_FIELDS.trafficValue]).toBeUndefined();
  });

  it("uma UTM em branco (string vazia/só espaço) nunca sobrescreve com vazio — é omitida, não enviada como ''", () => {
    const payload = buildRdStationConversionPayload(
      baseInput({ lead: { ...baseInput().lead, utmSource: "   ", utmMedium: "" } }),
    );
    expect(payload[RD_NATIVE_FIELDS.trafficSource]).toBeUndefined();
    expect(payload[RD_NATIVE_FIELDS.trafficMedium]).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(payload, RD_NATIVE_FIELDS.trafficSource)).toBe(false);
  });
});

describe("buildRdStationConversionPayload — dados do contato (quando disponíveis)", () => {
  it("inclui nome, telefones e cargo quando presentes", () => {
    const payload = buildRdStationConversionPayload(
      baseInput({
        lead: {
          ...baseInput().lead,
          name: "Maria Souza",
          personalPhone: "+55 11 90000-0000",
          mobilePhone: "+55 11 98888-8888",
          jobTitle: "Diretora Comercial",
        },
      }),
    );

    expect(payload[RD_NATIVE_FIELDS.name]).toBe("Maria Souza");
    expect(payload[RD_NATIVE_FIELDS.personalPhone]).toBe("+55 11 90000-0000");
    expect(payload[RD_NATIVE_FIELDS.mobilePhone]).toBe("+55 11 98888-8888");
    expect(payload[RD_NATIVE_FIELDS.jobTitle]).toBe("Diretora Comercial");
  });

  it("funciona normalmente sem nenhum desses campos (estado real hoje: nunca capturados)", () => {
    const payload = buildRdStationConversionPayload(baseInput());
    expect(payload.email).toBeTruthy();
    expect(payload[RD_NATIVE_FIELDS.name]).toBeUndefined();
  });
});

describe("buildRdStationConversionPayload — dados comerciais do diagnóstico", () => {
  it("inclui gargalo, confiança e segmento como campos personalizados", () => {
    const payload = buildRdStationConversionPayload(
      baseInput({
        company: { companyName: "CodeBit", website: "codebit.com.br", segment: "Tecnologia" },
        diagnostic: {
          diagnosticId: "diagnostic-1",
          challengeLabel: "Geramos leads, mas poucos avançam",
          primaryBottleneckLabel: "Conversão",
          confidenceLevel: "medium",
        },
        pdf: null,
      }),
    );

    expect(payload[RD_CUSTOM_FIELDS.challenge]).toBe("Geramos leads, mas poucos avançam");
    expect(payload[RD_CUSTOM_FIELDS.primaryBottleneck]).toBe("Conversão");
    expect(payload[RD_CUSTOM_FIELDS.confidenceLevel]).toBe("medium");
    expect(payload[RD_CUSTOM_FIELDS.segment]).toBe("Tecnologia");
    expect(payload[RD_NATIVE_FIELDS.website]).toBe("codebit.com.br");
  });

  it("não envia mais risco secundário, qualidade dos dados ou status do diagnóstico ao RD Station", () => {
    const payload = buildRdStationConversionPayload(baseInput());
    expect("cf_risco_secundario" in payload).toBe(false);
    expect("cf_qualidade_dados" in payload).toBe(false);
    expect("cf_status_diagnostico" in payload).toBe(false);
  });

  it("inclui o link do PDF quando disponível", () => {
    const payload = buildRdStationConversionPayload(
      baseInput({ pdf: { url: "https://storage.example/signed-pdf-url" } }),
    );
    expect(payload[RD_CUSTOM_FIELDS.pdfLink]).toBe("https://storage.example/signed-pdf-url");
  });

  it("não bloqueia nem inventa link quando o PDF ainda não existe", () => {
    const payload = buildRdStationConversionPayload(baseInput({ pdf: null }));
    expect(payload[RD_CUSTOM_FIELDS.pdfLink]).toBeUndefined();
  });
});

describe("buildRdStationConversionPayload — segurança/robustez", () => {
  it("trunca campos de texto muito longos em vez de enviá-los inteiros", () => {
    const longName = "A".repeat(1000);
    const payload = buildRdStationConversionPayload(baseInput({ lead: { ...baseInput().lead, name: longName } }));
    expect(String(payload[RD_NATIVE_FIELDS.name]).length).toBeLessThanOrEqual(300);
  });

  it("nunca inclui campos que não fazem parte do mapeamento centralizado (sem strings soltas)", () => {
    const payload = buildRdStationConversionPayload(baseInput());
    const allowedKeys = new Set([
      "conversion_identifier",
      "email",
      ...Object.values(RD_NATIVE_FIELDS),
      ...Object.values(RD_CUSTOM_FIELDS),
    ]);
    for (const key of Object.keys(payload)) {
      expect(allowedKeys.has(key)).toBe(true);
    }
  });
});
