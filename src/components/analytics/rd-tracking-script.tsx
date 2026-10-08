import Script from "next/script";

const RD_LOADER_SRC =
  "https://d335luupugsy2.cloudfront.net/js/loader-scripts/515b09f5-30b3-41b4-a568-5887cc45b03c-loader.js";

/**
 * Código de monitoramento da RD Station (pedido explícito: tela inicial,
 * formulário, etapa do telefone e tela final do diagnóstico). Cria os
 * cookies __trf.src e _rdtrk lidos no envio do formulário para informar a
 * origem das conversões (ver src/lib/rd-station/config.ts). O Next.js
 * carrega o script uma vez só por sessão, mesmo renderizado em várias telas.
 */
export function RdTrackingScript() {
  return <Script id="rd-station-loader" src={RD_LOADER_SRC} strategy="afterInteractive" />;
}
