import { AiResponseValidationError } from "@/lib/ai/errors";
import {
  siteAnalysisResultSchema,
  type SiteAnalysisResult,
} from "@/lib/ai/site-analysis-schema";

/**
 * Valida um valor qualquer (resposta fresca da IA ou result_json vindo
 * do cache) contra o schema estrito da análise de site. Mantida como
 * função própria — separada da chamada de IA — para que qualquer lugar
 * do código que precise confiar em um "SiteAnalysisResult" (inclusive ao
 * reler do banco) passe pelo mesmo portão de validação.
 *
 * Lança AiResponseValidationError com o motivo detalhado em caso de
 * campo inesperado, campo faltando ou tipo incompatível — nunca retorna
 * um resultado parcialmente válido.
 */
export function validateSiteAnalysisResult(raw: unknown): SiteAnalysisResult {
  const parsed = siteAnalysisResultSchema.safeParse(raw);

  if (!parsed.success) {
    throw new AiResponseValidationError(
      `A resposta não corresponde ao schema da análise de site: ${parsed.error.message}`,
      raw,
    );
  }

  return parsed.data;
}
