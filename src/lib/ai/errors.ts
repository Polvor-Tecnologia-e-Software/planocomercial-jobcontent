/**
 * Erro lançado quando a resposta da IA não pode ser validada — seja por
 * não ser um JSON/tool-use válido, seja por não corresponder ao schema
 * esperado (campo faltando, tipo errado ou campo inesperado). Guarda a
 * resposta bruta para log/depuração, sem expor isso ao usuário final.
 */
export class AiResponseValidationError extends Error {
  constructor(
    message: string,
    readonly raw: unknown,
  ) {
    super(message);
    this.name = "AiResponseValidationError";
  }
}
