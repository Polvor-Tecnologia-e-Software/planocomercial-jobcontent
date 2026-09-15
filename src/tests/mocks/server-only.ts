// Mock de teste para o pacote "server-only".
//
// O pacote real sempre lança um erro ao ser importado fora da condição
// de bundling "react-server" do Next.js — o que inclui o ambiente do
// Vitest. Este mock permite testar módulos de servidor (env.server.ts,
// clientes Supabase, etc.) sem precisar rodar o bundler do Next.
// Ver alias em vitest.config.ts.
export {};
