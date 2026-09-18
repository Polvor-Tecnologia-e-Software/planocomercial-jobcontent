# schemas

Schemas Zod que validam a saída estruturada da IA.

Implementado: `commercial-plan.ts` — o plano comercial de 90 dias gerado
por IA (etapa 3): `EvidenceSchema`, `RootCauseSchema`, `PrioritySchema`
(exatamente 3 no schema principal), `PlanActionSchema`/`PlanPhaseSchema`
(no máximo 5 ações por fase — cadência fixa de 2 content_blog + 1
rich_material no plano INTEIRO (não por fase), cada uma com
`BlogBriefSchema`/`RichMaterialBriefSchema`/`PaidTrafficBriefSchema`
desenvolvido por completo quando aplicável; ações "crm_pipeline" que são
de fato uma cadência de follow-up também podem trazer `CadenceBriefSchema`
— a copy real de cada toque, não só a estrutura da cadência),
`WeeklyAgendaItemSchema`, `IndicatorSchema`,
`ConsultativeCtaSchema` e o `CommercialPlanSchema` que os agrupa. Todo
objeto usa `.strict()` — a IA nunca consegue colar um campo extra sem que
a validação rejeite. Ver `src/lib/ai/commercial-plan.ts` (chamada de IA) e
`src/server/generate-commercial-plan.ts` (orquestração/cache/persistência).

Ainda não implementado: schema de saída da tela de resultado (é o mesmo
`CommercialPlan`, só falta a camada de apresentação).
