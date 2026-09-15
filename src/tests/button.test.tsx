import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renderiza o texto informado", () => {
    render(<Button>Criar meu plano comercial</Button>);

    expect(
      screen.getByRole("button", { name: "Criar meu plano comercial" }),
    ).toBeInTheDocument();
  });

  it("aplica o atributo disabled quando solicitado", () => {
    render(<Button disabled>Enviando...</Button>);

    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
  });
});
