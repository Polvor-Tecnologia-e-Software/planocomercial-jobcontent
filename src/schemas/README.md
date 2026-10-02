# schemas

Schemas Zod que validam a saída estruturada da IA.

Implementado: `commercial-plan.ts` — o plano comercial de 90 dias gerado
por IA (etapa 3): `EvidenceSchema`, `RootCauseSchema`, `PrioritySchema`
(exatamente 3 no schema principal), `StrategicSummarySchema` (resumo
estratégico único do plano — `mediaBudgetPriority` é sempre qualitativo,
nunca uma porcentagem: a IA escolhe `alta`/`media`/`baixa`/`teste` por
canal, e a % exibida é sempre calculada em `src/lib/plan-media-budget.ts`,
nunca confiada à IA), `PlanActionSchema`/`PlanPhaseSchema` (no máximo 7
ações por fase — cadência fixa POR FASE, em TODAS as 3 fases, pra
QUALQUER objetivo selecionado: 2 content_blog + 1 rich_material + 1
landing_page + 1 paid_traffic (o anúncio não é mais condicionado ao
gargalo ser demanda — pedido explícito: "inclua sempre sugestão de
anúncio de tráfego pago, seja qual for o objetivo"), cada uma com
`BlogBriefSchema`/`RichMaterialBriefSchema`/`LandingPageBriefSchema`/`PaidTrafficBriefSchema`
desenvolvido por completo quando aplicável; ações "crm_pipeline" que são
uma cadência de contato trazem `CadenceBriefSchema` — a ESTRUTURA de
uma cadência de exatamente 5 dias, canais + objetivo por dia, sem copy;
ações "sales_process" trazem `PlaybookBriefSchema` — 4 a 6 passos de
como montar o playbook + uma dica de adoção),
`PlanPhaseSummariesSchema` (goal + milestone de CADA fase — o banner
colorido de cada mês na tela; `milestone` pode citar um número só se ele
já existir no contexto, mesma regra de `goalGapInterpretation`, verificada
por `riskFieldsOf` em `src/lib/ai/numeric-guard.ts`),
`WeeklyAgendaItemSchema`, `IndicatorSchema`,
`ConsultativeCtaSchema` e o `CommercialPlanSchema` que os agrupa. Todo
objeto usa `.strict()` — a IA nunca consegue colar um campo extra sem que
a validação rejeite. Ver `src/lib/ai/commercial-plan.ts` (chamada de IA) e
`src/server/generate-commercial-plan.ts` (orquestração/cache/persistência).

Ainda não implementado: schema de saída da tela de resultado (é o mesmo
`CommercialPlan`, só falta a camada de apresentação).
