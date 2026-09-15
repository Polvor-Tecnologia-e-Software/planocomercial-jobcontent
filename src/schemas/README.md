# schemas

Schemas Zod que validam a saída estruturada da IA.

Implementado: `commercial-plan.ts` — o plano comercial de 90 dias gerado
por IA (etapa 3): `EvidenceSchema`, `RootCauseSchema`, `PrioritySchema`
(exatamente 3 no schema principal), `PlanActionSchema`/`PlanPhaseSchema`
(no máximo 5 ações por fase), `WeeklyAgendaItemSchema`, `IndicatorSchema`,
`ConsultativeCtaSchema` e o `CommercialPlanSchema` que os agrupa. Todo
objeto usa `.strict()` — a IA nunca consegue colar um campo extra sem que
a validação rejeite. Ver `src/lib/ai/commercial-plan.ts` (chamada de IA) e
`src/server/generate-commercial-plan.ts` (orquestração/cache/persistência).

Ainda não implementado: schema de saída da tela de resultado (é o mesmo
`CommercialPlan`, só falta a camada de apresentação).
