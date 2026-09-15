import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// @testing-library/react só registra o cleanup automático via um hook
// global "afterEach" — como não habilitamos "globals: true" no Vitest
// (preferimos importar describe/it/expect explicitamente), registramos
// o cleanup manualmente aqui. Sem isso, componentes de um teste ficam
// no DOM e vazam para o teste seguinte (ex.: botões duplicados).
afterEach(() => {
  cleanup();
});

// jsdom não implementa window.matchMedia. Necessário para o Framer Motion
// (MotionConfig reducedMotion="user", usado na tela inicial) checar
// "prefers-reduced-motion" sem lançar em teste. Guardado por
// "!window.matchMedia" para nunca sobrescrever uma implementação real.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
