/**
 * Número de WhatsApp da Job Content usado pelos CTAs "Falar com um
 * especialista" na tela de resultado — centralizado aqui para nunca
 * repetir o número em vários arquivos. Não é um segredo (é o número
 * comercial público da empresa), então fica direto no código-fonte, sem
 * precisar de variável de ambiente.
 */
const WHATSAPP_NUMBER = "554998280798";

/**
 * Monta o link wa.me com uma mensagem pré-preenchida — abre o WhatsApp
 * (app ou web) já com o texto pronto, a pessoa só confirma o envio.
 */
export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
