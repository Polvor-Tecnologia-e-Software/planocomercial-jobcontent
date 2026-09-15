import { describe, expect, it } from "vitest";

import { DatabaseError, unwrap, unwrapMaybe } from "@/lib/database/errors";

describe("unwrap", () => {
  it("retorna os dados quando não há erro", () => {
    const result = unwrap(
      { data: { id: "1" }, error: null },
      { table: "companies", operation: "select" },
    );

    expect(result).toEqual({ id: "1" });
  });

  it("lança DatabaseError quando result.error está presente", () => {
    expect(() =>
      unwrap(
        { data: null, error: { message: "falha de conexão", code: "500" } },
        { table: "companies", operation: "select" },
      ),
    ).toThrow(DatabaseError);
  });

  it("lança DatabaseError quando data é null sem erro explícito", () => {
    expect(() =>
      unwrap({ data: null, error: null }, { table: "companies", operation: "insert" }),
    ).toThrow(DatabaseError);
  });

  it("inclui a tabela e a operação na mensagem de erro", () => {
    try {
      unwrap(
        { data: null, error: { message: "algo deu errado" } },
        { table: "leads", operation: "update" },
      );
      throw new Error("deveria ter lançado DatabaseError");
    } catch (error) {
      expect(error).toBeInstanceOf(DatabaseError);
      expect((error as DatabaseError).table).toBe("leads");
      expect((error as DatabaseError).operation).toBe("update");
      expect((error as DatabaseError).message).toContain("[leads.update]");
    }
  });
});

describe("unwrapMaybe", () => {
  it("retorna null quando não há erro nem dado (ex.: registro não encontrado)", () => {
    const result = unwrapMaybe(
      { data: null, error: null },
      { table: "companies", operation: "findByWebsite" },
    );

    expect(result).toBeNull();
  });

  it("lança DatabaseError quando result.error está presente", () => {
    expect(() =>
      unwrapMaybe(
        { data: null, error: { message: "falha de conexão" } },
        { table: "companies", operation: "findByWebsite" },
      ),
    ).toThrow(DatabaseError);
  });
});
