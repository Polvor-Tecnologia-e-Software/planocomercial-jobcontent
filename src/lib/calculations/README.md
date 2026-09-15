# lib/calculations

Motores determinísticos de cálculo — a IA nunca calcula nada aqui dentro.
Tudo puro e testável: recebe um `AnswerMap` (ver
`src/lib/challenges/adaptive-engine`) e o desafio selecionado, devolve
números. Nenhum arquivo deste diretório toca o banco ou a IA — a
persistência fica em `src/server/run-deterministic-analysis.ts`.

Implementado:

- `normalize-metrics.ts` — extrai `CommercialMetrics` de `diagnostic_answers`.
- `rates.ts` — taxas de conversão entre estágios do funil.
- `reverse-engineering.ts` — engenharia reversa da meta (clientes,
  propostas, reuniões, oportunidades e leads necessários), parando no
  primeiro dado ausente.
- `gaps.ts` — gap (required - current) por estágio, nunca negativo.
- `simulation.ts` — simulação determinística de mudança de taxa.
- `data-quality.ts` — qualidade dos dados (0-100) e nível de confiança.
- `scoring.ts` — score por dimensão (demanda, conversão, processos,
  gestão, escala, posicionamento digital) e score geral.
- `signals.ts` — engine de sinais determinísticos (reaproveita os códigos
  já declarados em `challenge-config.ts` → `relatedSignals`).
- `bottleneck.ts` — identificação do gargalo provável a partir de score +
  sinais, sem confiar cegamente no desafio escolhido pelo usuário.
- `config.ts` / `rounding.ts` — pesos, limiares e política de
  arredondamento centralizados.
- `index.ts` — `runDeterministicCalculations(answers, selectedChallenge)`,
  o ponto único de entrada puro.

**Catálogo de perguntas**: `monthlyGoal` (U4), `currentMonthlySales`/`salesPerMonth`
(U5) e o volume mensal de cada estágio do funil (`leadsPerMonth` U6,
`opportunitiesPerMonth` U7, `meetingsPerMonth` U8, `proposalsPerMonth` U9)
são perguntas UNIVERSAIS (`src/lib/challenges/challenge-config.ts`) — toda
pessoa responde, independente do desafio escolhido. Isso existe desde uma
etapa posterior à implementação original deste motor: antes disso, nenhuma
dessas perguntas existia, e a engenharia reversa/mapa de vazamento quase
nunca calculavam nada de verdade com dado real (só com dado sintético em
teste). Continua correto e esperado que, mesmo assim, algum estágio fique
com `missingData` quando a pessoa não souber responder uma dessas
perguntas — nunca é preenchido com um benchmark inventado.
