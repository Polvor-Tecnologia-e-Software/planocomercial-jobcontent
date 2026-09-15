import { createHash } from "node:crypto";

/**
 * Hash determinístico do conteúdo coletado, usado para cache (seção
 * 16.6 do BRD: "reutilizar a análise enquanto URL, hash... permanecerem
 * compatíveis"). SHA-256 é suficiente aqui — não é um uso criptográfico
 * de segredo, só uma "impressão digital" de conteúdo.
 */
export function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}
