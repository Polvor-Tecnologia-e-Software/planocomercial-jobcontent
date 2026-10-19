import "server-only";

/**
 * Nomes de campo do endpoint de Conversão (RD Station Marketing — CDP),
 * conferidos em https://developers.rdstation.com/reference/conversao antes
 * de escrever este arquivo. Únicos usados em todo o payload — nunca repita
 * um nome de campo do RD Station em outro lugar do código.
 */

/**
 * Campos nativos de contato/tráfego — nomes exatamente como documentados
 * pelo RD Station (não são os nomes usuais de UTM: o RD usa
 * "traffic_source/medium/campaign/value", não "utm_source/medium/campaign/term").
 */
export const RD_NATIVE_FIELDS = {
  conversionIdentifier: "conversion_identifier",
  email: "email",
  name: "name",
  personalPhone: "personal_phone",
  mobilePhone: "mobile_phone",
  jobTitle: "job_title",
  companyName: "company_name",
  website: "website",
  trafficSource: "traffic_source",
  trafficMedium: "traffic_medium",
  trafficCampaign: "traffic_campaign",
  /** Não existe "traffic_term" documentado — o RD usa "traffic_value" para o equivalente de UTM term. */
  trafficValue: "traffic_value",
  /** Valor do cookie _rdtrk — liga a conversão ao histórico de navegação do visitante na RD. */
  clientTrackingId: "client_tracking_id",
} as const;

/**
 * Campos personalizados (prefixo cf_, exigido pelo RD Station). Precisam
 * existir no RD Station ANTES de o envio funcionar de verdade — ver
 * docs/CHECKLIST-RD-STATION.md para os nomes e como criá-los no painel.
 */
export const RD_CUSTOM_FIELDS = {
  /** Não existe campo nativo para utm_content no endpoint de Conversão — só traffic_source/medium/campaign/value. */
  utmContent: "cf_utm_content",
  diagnosticId: "cf_diagnostico_id",
  challenge: "cf_desafio_principal",
  primaryBottleneck: "cf_gargalo_principal",
  confidenceLevel: "cf_nivel_confianca",
  segment: "cf_segmento_empresa",
  /** Link público da tela do diagnóstico/plano da pessoa (ex.: https://quiz.jobcontent.com.br/diagnostico/{id}). */
  planLink: "cf_link_plano_comercial",
  /** Todas as respostas do quiz em texto ("Pergunta: resposta", uma por linha) — campo do tipo área de texto. */
  quizAnswersSummary: "cf_respostas_quiz",
} as const;

/**
 * Um campo por pergunta do quiz (pedido explícito: todas as perguntas de
 * todos os objetivos), para segmentar no RD. Universais (as mesmas para
 * qualquer desafio) e as específicas de cada desafio (prefixo cf_dN_,
 * preenchidas só para quem escolheu aquele desafio). Ver
 * challenge-config.ts para os enunciados.
 */
export const RD_QUIZ_FIELDS: Record<string, string> = {
  // Universais
  U1: "cf_ticket_medio",
  U2: "cf_ciclo_vendas_dias",
  U3: "cf_vendedores_ativos",
  U4: "cf_meta_faturamento_mensal",
  U5: "cf_vendas_por_mes",
  U10: "cf_faturamento_mensal_atual",
  U6: "cf_leads_por_mes",
  U7: "cf_oportunidades_por_mes",
  U8: "cf_reunioes_por_mes",
  U9: "cf_propostas_por_mes",
  U11: "cf_uso_crm",
  // D1 — Precisamos gerar mais oportunidades
  D1_Q1: "cf_d1_origem_leads",
  D1_Q3: "cf_d1_registro_origem_leads",
  // D2 — Geramos leads, mas poucos avançam
  D2_Q1: "cf_d2_criterio_qualificacao",
  D2_Q2: "cf_d2_taxa_lead_oportunidade",
  D2_Q3: "cf_d2_dificuldade_criterio",
  // D3 — Temos propostas, mas fechamos pouco
  D3_Q1: "cf_d3_motivo_perda",
  D3_Q2: "cf_d3_dias_proposta_parada",
  D3_Q3: "cf_d3_registro_motivo_perda",
  // D4 — O processo depende demais dos vendedores
  D4_Q1: "cf_d4_tem_playbook",
  D4_Q2: "cf_d4_impacto_saida_vendedor",
  D4_Q3: "cf_d4_dificuldade_padronizar",
  // D5 — Não sabemos onde estamos perdendo vendas
  D5_Q1: "cf_d5_relatorio_funil",
  D5_Q2: "cf_d5_visibilidade_etapas",
  D5_Q3: "cf_d5_gestao_funil",
  // D6 — Queremos crescer sem aumentar a equipe
  D6_Q1: "cf_d6_trabalho_manual",
  D6_Q2: "cf_d6_ferramenta_automacao",
  D6_Q3: "cf_d6_tarefa_manual",
};
