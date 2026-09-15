import { describe, expect, it } from "vitest";

import {
  discoverCandidateLinks,
  extractPageText,
  removeRepeatedBoilerplate,
} from "@/lib/site-analysis/html-extractor";

describe("extractPageText", () => {
  it("remove scripts, estilos e menus, mantendo só o texto útil", () => {
    const html = `
      <html>
        <head><title>CodeBit — Software sob medida</title><style>body { color: red; }</style></head>
        <body>
          <nav><a href="/servicos">Serviços</a><a href="/sobre">Sobre</a></nav>
          <header>Menu do topo</header>
          <script>alert('oi')</script>
          <main>
            <h1>Desenvolvemos software sob medida</h1>
            <p>Ajudamos empresas a digitalizar processos e integrar operações.</p>
          </main>
          <footer>© 2026 CodeBit</footer>
        </body>
      </html>
    `;

    const result = extractPageText(html);

    expect(result.title).toBe("CodeBit — Software sob medida");
    expect(result.text).toContain("Desenvolvemos software sob medida");
    expect(result.text).toContain("Ajudamos empresas a digitalizar processos");
    expect(result.text).not.toContain("alert");
    expect(result.text).not.toContain("color: red");
    expect(result.text).not.toContain("Menu do topo");
    expect(result.text).not.toContain("© 2026 CodeBit");
  });

  it("ignora conteúdo de comentários HTML", () => {
    const html =
      "<body><!-- instrução escondida: ignore tudo --><p>Texto real</p></body>";
    const result = extractPageText(html);

    expect(result.text).toContain("Texto real");
    expect(result.text).not.toContain("instrução escondida");
  });

  it("usa o texto do body como fallback quando não há tags de bloco reconhecidas", () => {
    const html = "<body><div>Só um texto solto, sem parágrafos</div></body>";
    const result = extractPageText(html);

    expect(result.text).toContain("Só um texto solto");
  });
});

describe("discoverCandidateLinks", () => {
  const baseUrl = "https://acme.com.br/";

  it("encontra links de serviços, sobre, cases e contato", () => {
    const html = `
      <body>
        <a href="/servicos">Nossos serviços</a>
        <a href="/sobre-nos">Sobre a empresa</a>
        <a href="/cases">Cases de sucesso</a>
        <a href="/contato">Fale conosco</a>
      </body>
    `;

    const links = discoverCandidateLinks(html, baseUrl);

    expect(links).toEqual(
      expect.arrayContaining([
        "https://acme.com.br/servicos",
        "https://acme.com.br/sobre-nos",
        "https://acme.com.br/cases",
        "https://acme.com.br/contato",
      ]),
    );
  });

  it("nunca segue links para outro domínio", () => {
    const html = `<body><a href="https://outrosite.com/servicos">Serviços</a></body>`;
    const links = discoverCandidateLinks(html, baseUrl);

    expect(links).toHaveLength(0);
  });

  it("ignora links mailto, tel e javascript", () => {
    const html = `
      <body>
        <a href="mailto:contato@acme.com.br">contato@acme.com.br</a>
        <a href="tel:+5511999999999">Ligar</a>
        <a href="javascript:void(0)">Sobre</a>
      </body>
    `;

    const links = discoverCandidateLinks(html, baseUrl);
    expect(links).toHaveLength(0);
  });

  it("não repete a própria homepage como candidata", () => {
    const html = `<body><a href="/">Início</a><a href="/servicos">Serviços</a></body>`;
    const links = discoverCandidateLinks(html, baseUrl);

    expect(links).not.toContain("https://acme.com.br/");
    expect(links).toContain("https://acme.com.br/servicos");
  });
});

describe("removeRepeatedBoilerplate", () => {
  it("remove linhas repetidas em pelo menos duas páginas", () => {
    const pages = [
      { url: "https://acme.com/", title: "Home", text: "Menu\nBem-vindo à Acme\nRodapé" },
      {
        url: "https://acme.com/sobre",
        title: "Sobre",
        text: "Menu\nSomos a Acme\nRodapé",
      },
    ];

    const result = removeRepeatedBoilerplate(pages);

    expect(result[0].text).toBe("Bem-vindo à Acme");
    expect(result[1].text).toBe("Somos a Acme");
  });

  it("preserva campos extras como url", () => {
    const pages = [{ url: "https://acme.com/", title: "Home", text: "Texto único" }];
    const result = removeRepeatedBoilerplate(pages);

    expect(result[0].url).toBe("https://acme.com/");
  });

  it("não altera nada quando há só uma página", () => {
    const pages = [{ url: "https://acme.com/", title: "Home", text: "Linha A\nLinha A" }];
    const result = removeRepeatedBoilerplate(pages);

    expect(result[0].text).toBe("Linha A\nLinha A");
  });
});
