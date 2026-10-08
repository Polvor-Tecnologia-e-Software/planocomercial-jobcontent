"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  appendUtmParams,
  hasUtmParams,
  pickUtmParams,
  serializeUtmParams,
  UTM_COOKIE_NAME,
} from "@/lib/utm";

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((entry) => entry.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return null;
  }
}

/**
 * Mantém os UTMs da campanha em todas as páginas até o fim da jornada
 * (ver src/lib/utm.ts). Em toda navegação:
 * - a URL tem UTMs -> guarda num cookie de sessão (uma campanha nova
 *   substitui a anterior);
 * - a URL não tem UTMs, mas o cookie tem -> recoloca na URL sem
 *   recarregar a página (history.replaceState, integrado ao roteador do
 *   Next.js), para GTM/GA lerem os UTMs em qualquer tela.
 * Não desenha nada.
 */
export function UtmPersistence() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromUrl = pickUtmParams(new URLSearchParams(searchParams.toString()));

    if (hasUtmParams(fromUrl)) {
      document.cookie = `${UTM_COOKIE_NAME}=${encodeURIComponent(serializeUtmParams(fromUrl))}; path=/; SameSite=Lax`;
      return;
    }

    const stored = pickUtmParams(readCookie(UTM_COOKIE_NAME));
    if (!hasUtmParams(stored)) return;

    const currentQuery = searchParams.toString();
    const current = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    const withUtm = appendUtmParams(current, stored);
    if (withUtm !== current) {
      window.history.replaceState(window.history.state, "", `${withUtm}${window.location.hash}`);
    }
  }, [pathname, searchParams]);

  return null;
}
