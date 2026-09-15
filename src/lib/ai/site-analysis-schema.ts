import { z } from "zod";

/**
 * Schema da saída estruturada da IA para a análise de site (seção 5.3 e
 * Anexo A do BRD). A IA só pode retornar exatamente estes campos — nada
 * de HTML bruto, nada além do que foi pedido.
 *
 * ".strict()" é o que faz o schema REJEITAR (e não apenas descartar em
 * silêncio) qualquer campo que a IA inventar além do combinado — sem
 * isso, o Zod por padrão apenas ignora chaves desconhecidas.
 */
const analysisFieldName = z.enum([
  "company_name",
  "description",
  "segment",
  "products_services",
  "main_offer",
  "apparent_target_audience",
  "probable_business_model",
  "value_proposition",
  "differentiators",
  "commercial_proofs",
  "calls_to_action",
  "contact_channels",
  "conversion_assets",
  "main_findings",
]);

const confidenceLevel = z.enum(["low", "medium", "high"]);

/**
 * Cada evidência aponta exatamente para onde a informação foi
 * encontrada (seção 5.3 do BRD: "Saída: JSON validado por schema, com
 * fatos, inferências, evidências, URLs e confiança").
 */
export const siteAnalysisEvidenceSchema = z
  .object({
    field: analysisFieldName,
    page_url: z.url("page_url precisa ser uma URL válida."),
    // Trecho curto — nunca o texto inteiro da página (mantém o registro
    // compacto e barato em tokens de saída).
    excerpt: z
      .string()
      .max(180, "O trecho de evidência deve ser curto (até 180 caracteres)."),
    confidence: confidenceLevel,
  })
  .strict();

export const siteAnalysisResultSchema = z
  .object({
    company_name: z.string().nullable(),
    description: z.string().nullable(),
    segment: z.string().nullable(),
    products_services: z.array(z.string()).default([]),
    main_offer: z.string().nullable(),
    apparent_target_audience: z.string().nullable(),
    probable_business_model: z.string().nullable(),
    value_proposition: z.string().nullable(),
    differentiators: z.array(z.string()).default([]),
    commercial_proofs: z.array(z.string()).default([]),
    calls_to_action: z.array(z.string()).default([]),
    contact_channels: z.array(z.string()).default([]),
    conversion_assets: z.array(z.string()).default([]),
    main_findings: z.array(z.string()).default([]),
    evidence: z.array(siteAnalysisEvidenceSchema).default([]),
    confidence: confidenceLevel,
  })
  .strict();

export type SiteAnalysisResult = z.infer<typeof siteAnalysisResultSchema>;
export type SiteAnalysisEvidence = z.infer<typeof siteAnalysisEvidenceSchema>;
export type SiteAnalysisFieldName = z.infer<typeof analysisFieldName>;
export type ConfidenceLevel = z.infer<typeof confidenceLevel>;
