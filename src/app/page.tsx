import { redirect } from "next/navigation";

import { withStoredUtm } from "@/server/utm";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * A raiz do site aponta diretamente para o início da jornada do
 * diagnóstico. Mantida como redirect (em vez de duplicar a Tela 1 aqui)
 * para haver uma única fonte de verdade sobre "onde a jornada começa".
 * Repassa a query string (UTMs de campanha) — sem isso, quem chegava em
 * "/?utm_source=..." perdia a origem no redirecionamento.
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.append(key, value);
    else if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
  }
  const queryString = query.toString();
  // Sem query (ex.: clique no logo), recoloca os UTMs guardados na sessão.
  redirect(queryString ? `/diagnostico?${queryString}` : await withStoredUtm("/diagnostico"));
}
