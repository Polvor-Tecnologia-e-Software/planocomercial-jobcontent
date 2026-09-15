import type { CompanyProfileFields } from "@/server/confirm-site-analysis";

/**
 * Converte uma lista de strings em texto de textarea (uma por linha) —
 * usado para exibir/editar campos de lista (diferenciais, provas,
 * mecanismos de conversão) num único campo de texto simples.
 */
export function listToLines(values: string[]): string {
  return values.join("\n");
}

/**
 * Converte o texto de um textarea (uma linha por item) de volta para uma
 * lista de strings, removendo linhas vazias e espaços nas pontas.
 */
export function linesToList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Converte um campo de texto simples do FormData em string ou null (nunca string vazia). */
export function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Extrai os campos do perfil da empresa (Tela 3) a partir do FormData
 * enviado pelo formulário de confirmação/edição. Mantido separado da
 * Server Action para ser testável sem precisar montar um FormData real
 * de um form submetido pelo navegador.
 */
export function parseCompanyProfileFieldsFromForm(formData: FormData): CompanyProfileFields {
  return {
    description: toNullableString(formData.get("description")),
    segment: toNullableString(formData.get("segment")),
    mainOffer: toNullableString(formData.get("mainOffer")),
    targetAudience: toNullableString(formData.get("targetAudience")),
    businessModel: toNullableString(formData.get("businessModel")),
    differentiators: linesToList(formData.get("differentiators")),
    commercialProofs: linesToList(formData.get("commercialProofs")),
    conversionMechanisms: linesToList(formData.get("conversionMechanisms")),
  };
}
