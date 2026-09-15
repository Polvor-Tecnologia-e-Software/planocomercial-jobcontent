import { describe, expect, it } from "vitest";

import {
  siteAnalysisEvidenceSchema,
  siteAnalysisResultSchema,
} from "@/lib/ai/site-analysis-schema";

const validEvidence = {
  field: "segment" as const,
  page_url: "https://acme.com.br/sobre",
  excerpt: "Desenvolvemos software sob medida para empresas de tecnologia.",
  confidence: "high" as const,
};

const validResult = {
  company_name: "Acme",
  description: "Software sob medida",
  segment: "software_sob_medida",
  products_services: ["Desenvolvimento de sistemas"],
  main_offer: "Desenvolvimento de sistemas sob medida",
  apparent_target_audience: "Gestores de tecnologia",
  probable_business_model: "Venda consultiva",
  value_proposition: "Digitalizar processos",
  differentiators: [],
  commercial_proofs: [],
  calls_to_action: [],
  contact_channels: [],
  conversion_assets: [],
  main_findings: [],
  evidence: [validEvidence],
  confidence: "high" as const,
};

describe("siteAnalysisResultSchema", () => {
  it("aceita um resultado completo e válido", () => {
    expect(siteAnalysisResultSchema.safeParse(validResult).success).toBe(true);
  });

  it("aceita campos textuais nulos (não inventar quando não há evidência)", () => {
    const result = siteAnalysisResultSchema.safeParse({
      ...validResult,
      company_name: null,
      segment: null,
      apparent_target_audience: null,
      probable_business_model: null,
    });

    expect(result.success).toBe(true);
  });

  it("preenche listas ausentes com array vazio (default)", () => {
    const withoutDifferentiators: Partial<typeof validResult> = { ...validResult };
    delete withoutDifferentiators.differentiators;
    const result = siteAnalysisResultSchema.safeParse(withoutDifferentiators);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.differentiators).toEqual([]);
    }
  });

  it("REJEITA campos inesperados (schema estrito)", () => {
    const result = siteAnalysisResultSchema.safeParse({
      ...validResult,
      campo_que_a_ia_inventou: "algo",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita confidence fora do enum permitido", () => {
    const result = siteAnalysisResultSchema.safeParse({
      ...validResult,
      confidence: "certeza_total",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita quando confidence está ausente", () => {
    const withoutConfidence: Partial<typeof validResult> = { ...validResult };
    delete withoutConfidence.confidence;
    const result = siteAnalysisResultSchema.safeParse(withoutConfidence);
    expect(result.success).toBe(false);
  });
});

describe("siteAnalysisEvidenceSchema", () => {
  it("aceita uma evidência válida", () => {
    expect(siteAnalysisEvidenceSchema.safeParse(validEvidence).success).toBe(true);
  });

  it("exige que page_url seja uma URL válida", () => {
    const result = siteAnalysisEvidenceSchema.safeParse({
      ...validEvidence,
      page_url: "não é uma url",
    });

    expect(result.success).toBe(false);
  });

  it("exige que field seja um dos campos conhecidos", () => {
    const result = siteAnalysisEvidenceSchema.safeParse({
      ...validEvidence,
      field: "campo_desconhecido",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita trechos de evidência muito longos", () => {
    const result = siteAnalysisEvidenceSchema.safeParse({
      ...validEvidence,
      excerpt: "a".repeat(500),
    });

    expect(result.success).toBe(false);
  });

  it("REJEITA campos inesperados na evidência (schema estrito)", () => {
    const result = siteAnalysisEvidenceSchema.safeParse({
      ...validEvidence,
      raciocinio_interno: "texto que a IA não deveria expor",
    });

    expect(result.success).toBe(false);
  });
});
