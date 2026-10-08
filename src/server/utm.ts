import "server-only";

import { cookies } from "next/headers";

import { appendUtmParams, pickUtmParams, UTM_COOKIE_NAME, type UtmParams } from "@/lib/utm";

/** UTMs da campanha guardados no cookie de sessão (ver src/lib/utm.ts). */
export async function readStoredUtmParams(): Promise<UtmParams> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(UTM_COOKIE_NAME)?.value;
  if (!raw) return {};
  try {
    return pickUtmParams(decodeURIComponent(raw));
  } catch {
    return {};
  }
}

/** Caminho interno + UTMs guardados — usar em todo redirect() de Server Action. */
export async function withStoredUtm(path: string): Promise<string> {
  return appendUtmParams(path, await readStoredUtmParams());
}
