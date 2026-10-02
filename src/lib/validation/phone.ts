import { z } from "zod";

/**
 * Telefone brasileiro (obrigatório na etapa que libera o diagnóstico — ver
 * src/components/result/phone-gate.tsx). Tolerante a máscara: só confere
 * que sobram 10 (fixo) ou 11 (celular) dígitos depois de remover tudo que
 * não é número. A máscara é aplicada no cliente por formatBrazilianPhone.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Informe seu telefone com DDD.")
  .max(20, "Esse telefone está muito longo.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 10 || digits.length === 11;
  }, "Informe um telefone válido com DDD (ex.: (11) 98765-4321).");

/**
 * Máscara progressiva enquanto a pessoa digita: (XX) XXXX-XXXX (fixo) ou
 * (XX) XXXXX-XXXX (celular). Sempre reextrai os dígitos do valor atual, o
 * que funciona tanto para digitar quanto para apagar.
 */
export function formatBrazilianPhone(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
