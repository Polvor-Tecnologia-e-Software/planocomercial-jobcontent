import { redirect } from "next/navigation";

/**
 * A raiz do site aponta diretamente para o início da jornada do
 * diagnóstico. Mantida como redirect (em vez de duplicar a Tela 1 aqui)
 * para haver uma única fonte de verdade sobre "onde a jornada começa".
 */
export default function HomePage() {
  redirect("/diagnostico");
}
