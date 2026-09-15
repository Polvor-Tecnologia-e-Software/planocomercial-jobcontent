import type { DiagnosticQuestion } from "@/types";

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  // ─── Módulo 1: Momento Atual ──────────────────────────────────────────────
  {
    id: "m1_q1",
    module: "momento_atual",
    order: 1,
    text: "Como você classificaria o momento atual da sua operação comercial?",
    description: "Seja honesto — isso determina o ponto de partida do seu plano.",
    type: "single_choice",
    pillar: "escala",
    weight: 2,
    options: [
      { value: "estruturando", label: "Ainda estamos estruturando o time e processo", score: 2, icon: "🔧" },
      { value: "funcionando", label: "Temos processo, mas resultados são inconsistentes", score: 5, icon: "📊" },
      { value: "crescendo", label: "Crescemos, mas queremos acelerar", score: 7, icon: "📈" },
      { value: "escalando", label: "Operamos bem e buscamos escala real", score: 10, icon: "🚀" },
    ],
  },
  {
    id: "m1_q2",
    module: "momento_atual",
    order: 2,
    text: "Quantas pessoas atuam diretamente em vendas (SDR, Closer, Account Executive)?",
    type: "single_choice",
    pillar: "escala",
    weight: 1,
    options: [
      { value: "1", label: "Apenas 1 (fundador ou vendedor solo)", score: 2 },
      { value: "2_3", label: "2 a 3 pessoas", score: 5 },
      { value: "4_8", label: "4 a 8 pessoas", score: 7 },
      { value: "9+", label: "9 ou mais pessoas", score: 10 },
    ],
  },
  {
    id: "m1_q3",
    module: "momento_atual",
    order: 3,
    text: "Qual é o ticket médio mensal das suas vendas B2B?",
    type: "single_choice",
    pillar: "escala",
    weight: 1,
    options: [
      { value: "ate_2k", label: "Até R$ 2.000", score: 3 },
      { value: "2k_10k", label: "R$ 2.000 a R$ 10.000", score: 6 },
      { value: "10k_50k", label: "R$ 10.000 a R$ 50.000", score: 8 },
      { value: "50k+", label: "Acima de R$ 50.000", score: 10 },
    ],
  },

  // ─── Módulo 2: Meta Comercial ─────────────────────────────────────────────
  {
    id: "m2_q1",
    module: "meta_comercial",
    order: 4,
    text: "Sua empresa possui meta de receita recorrente para os próximos 90 dias?",
    type: "single_choice",
    pillar: "escala",
    weight: 2,
    options: [
      { value: "nao", label: "Não temos meta definida", score: 0 },
      { value: "informal", label: "Temos uma ideia, mas não é formalizada", score: 3 },
      { value: "definida", label: "Sim, meta definida mas sem plano claro", score: 6 },
      { value: "documentada", label: "Sim, meta documentada com plano de ação", score: 10 },
    ],
  },
  {
    id: "m2_q2",
    module: "meta_comercial",
    order: 5,
    text: "Como é feito o acompanhamento dos resultados comerciais?",
    type: "single_choice",
    pillar: "escala",
    weight: 2,
    options: [
      { value: "nenhum", label: "Não acompanhamos formalmente", score: 0 },
      { value: "reunioes", label: "Reuniões periódicas sem dados estruturados", score: 3 },
      { value: "planilha", label: "Planilhas e controles manuais", score: 5 },
      { value: "crm", label: "CRM com dashboards e acompanhamento regular", score: 10 },
    ],
  },

  // ─── Módulo 3: Demanda ────────────────────────────────────────────────────
  {
    id: "m3_q1",
    module: "demanda",
    order: 6,
    text: "Qual é sua principal fonte de geração de leads hoje?",
    type: "single_choice",
    pillar: "demanda",
    weight: 3,
    options: [
      { value: "indicacao", label: "Indicações e network (somente)", score: 2, icon: "👥" },
      { value: "inbound_basico", label: "Site + redes sociais (sem estratégia clara)", score: 4, icon: "📱" },
      { value: "misto", label: "Mix de inbound e outbound estruturado", score: 7, icon: "🎯" },
      { value: "multicanal", label: "Múltiplos canais com ICP bem definido", score: 10, icon: "⚡" },
    ],
  },
  {
    id: "m3_q2",
    module: "demanda",
    order: 7,
    text: "Quantos leads qualificados (MQL/SQL) sua empresa gera por mês em média?",
    type: "single_choice",
    pillar: "demanda",
    weight: 3,
    options: [
      { value: "0_10", label: "Menos de 10 leads/mês", score: 1 },
      { value: "10_50", label: "10 a 50 leads/mês", score: 4 },
      { value: "50_200", label: "50 a 200 leads/mês", score: 7 },
      { value: "200+", label: "Mais de 200 leads/mês", score: 10 },
    ],
  },
  {
    id: "m3_q3",
    module: "demanda",
    order: 8,
    text: "Seu ICP (Ideal Customer Profile) está documentado e é usado ativamente pelo time?",
    type: "single_choice",
    pillar: "demanda",
    weight: 2,
    options: [
      { value: "nao_conhece", label: "Não sei o que é ICP", score: 0 },
      { value: "informal", label: "Temos uma ideia, não documentado", score: 3 },
      { value: "documentado", label: "Documentado, mas pouco utilizado", score: 6 },
      { value: "ativo", label: "Documentado e usado ativamente em prospecção", score: 10 },
    ],
  },
  {
    id: "m3_q4",
    module: "demanda",
    order: 9,
    text: "Com que frequência seu time realiza prospecção ativa (outbound)?",
    type: "single_choice",
    pillar: "demanda",
    weight: 2,
    options: [
      { value: "nunca", label: "Não fazemos outbound", score: 0 },
      { value: "esporadico", label: "Esporadicamente, sem processo", score: 2 },
      { value: "semanal", label: "Semanalmente, com algum processo", score: 6 },
      { value: "diario", label: "Diariamente, com cadência definida", score: 10 },
    ],
  },

  // ─── Módulo 4: Conversão ──────────────────────────────────────────────────
  {
    id: "m4_q1",
    module: "conversao",
    order: 10,
    text: "Qual é a taxa de conversão de leads em clientes (estimada)?",
    type: "single_choice",
    pillar: "conversao",
    weight: 3,
    options: [
      { value: "abaixo_5", label: "Abaixo de 5%", score: 2 },
      { value: "5_15", label: "5% a 15%", score: 5 },
      { value: "15_30", label: "15% a 30%", score: 8 },
      { value: "acima_30", label: "Acima de 30%", score: 10 },
    ],
  },
  {
    id: "m4_q2",
    module: "conversao",
    order: 11,
    text: "Sua empresa tem um processo de vendas documentado com etapas claras?",
    type: "single_choice",
    pillar: "conversao",
    weight: 3,
    options: [
      { value: "nao", label: "Não, cada vendedor faz do seu jeito", score: 0 },
      { value: "basico", label: "Processo básico, mas sem padronização", score: 3 },
      { value: "documentado", label: "Documentado, seguido parcialmente", score: 6 },
      { value: "otimizado", label: "Processo robusto, seguido e em melhoria contínua", score: 10 },
    ],
  },
  {
    id: "m4_q3",
    module: "conversao",
    order: 12,
    text: "Como é feito o follow-up com leads que não fecharam?",
    type: "single_choice",
    pillar: "conversao",
    weight: 2,
    options: [
      { value: "nenhum", label: "Não fazemos follow-up sistemático", score: 0 },
      { value: "manual", label: "Follow-up manual quando lembramos", score: 2 },
      { value: "agendado", label: "Agendado no CRM, mas sem cadência", score: 5 },
      { value: "cadencia", label: "Cadência automatizada com múltiplos touchpoints", score: 10 },
    ],
  },
  {
    id: "m4_q4",
    module: "conversao",
    order: 13,
    text: "Você tem materiais de apoio à venda (cases, proposta padrão, comparativos)?",
    type: "single_choice",
    pillar: "conversao",
    weight: 2,
    options: [
      { value: "nao", label: "Não temos materiais estruturados", score: 0 },
      { value: "basico", label: "Proposta básica, sem diferenciação", score: 3 },
      { value: "varios", label: "Proposta + alguns casos de sucesso", score: 6 },
      { value: "completo", label: "Kit completo: cases, ROI, comparativos, onepager", score: 10 },
    ],
  },

  // ─── Módulo 5: Processo e Escala ──────────────────────────────────────────
  {
    id: "m5_q1",
    module: "processo_escala",
    order: 14,
    text: "Sua empresa utiliza CRM ativamente?",
    type: "single_choice",
    pillar: "escala",
    weight: 3,
    options: [
      { value: "nao", label: "Não, usamos planilhas ou e-mail", score: 0 },
      { value: "parcial", label: "Temos CRM, mas poucos usam", score: 3 },
      { value: "usado", label: "CRM em uso, mas sem processo definido", score: 6 },
      { value: "otimizado", label: "CRM central da operação, com processos claros", score: 10 },
    ],
  },
  {
    id: "m5_q2",
    module: "processo_escala",
    order: 15,
    text: "O onboarding de novos vendedores está documentado e estruturado?",
    type: "single_choice",
    pillar: "escala",
    weight: 2,
    options: [
      { value: "nao", label: "Não temos processo de onboarding", score: 0 },
      { value: "informal", label: "Informal, aprende na prática", score: 2 },
      { value: "parcial", label: "Parcialmente documentado", score: 5 },
      { value: "completo", label: "Onboarding completo com ramp-up definido", score: 10 },
    ],
  },
  {
    id: "m5_q3",
    module: "processo_escala",
    order: 16,
    text: "Com que velocidade você consegue replicar o modelo comercial para novos vendedores?",
    type: "single_choice",
    pillar: "escala",
    weight: 2,
    options: [
      { value: "nao_replica", label: "Não conseguimos replicar com consistência", score: 0 },
      { value: "lento", label: "Processo lento (mais de 90 dias para produtividade)", score: 3 },
      { value: "medio", label: "30 a 90 dias para plena produtividade", score: 6 },
      { value: "rapido", label: "Menos de 30 dias para produtividade inicial", score: 10 },
    ],
  },

  // ─── Módulo 6: Inteligência de Mercado ────────────────────────────────────
  {
    id: "m6_q1",
    module: "inteligencia_mercado",
    order: 17,
    text: "Seu time comercial conhece profundamente os concorrentes e o posicionamento da empresa?",
    type: "single_choice",
    pillar: "conversao",
    weight: 2,
    options: [
      { value: "nao", label: "Pouco conhecimento sobre concorrentes", score: 0 },
      { value: "basico", label: "Conhecimento básico, sem estratégia clara", score: 3 },
      { value: "bom", label: "Boa análise, usada em algumas situações", score: 7 },
      { value: "excelente", label: "Battlecards e posicionamento claro e treinado", score: 10 },
    ],
  },
  {
    id: "m6_q2",
    module: "inteligencia_mercado",
    order: 18,
    text: "Como você mensura o custo de aquisição de clientes (CAC) e o LTV?",
    type: "single_choice",
    pillar: "escala",
    weight: 2,
    options: [
      { value: "nao_mensura", label: "Não calculamos CAC ou LTV", score: 0 },
      { value: "estimativa", label: "Temos estimativas, sem precisão", score: 3 },
      { value: "periodico", label: "Calculamos periodicamente", score: 7 },
      { value: "tempo_real", label: "Métricas em tempo real, usadas em decisões", score: 10 },
    ],
  },
];

export function getModuleQuestions(module: string): DiagnosticQuestion[] {
  return DIAGNOSTIC_QUESTIONS.filter((q) => q.module === module);
}

export function getTotalQuestions(): number {
  return DIAGNOSTIC_QUESTIONS.length;
}

export const MODULE_META = {
  momento_atual: {
    title: "Momento Atual",
    description: "Entendendo o estágio da sua operação",
    icon: "📍",
    questions: 3,
  },
  meta_comercial: {
    title: "Meta Comercial",
    description: "Objetivos e acompanhamento de resultados",
    icon: "🎯",
    questions: 2,
  },
  demanda: {
    title: "Geração de Demanda",
    description: "Fontes, volume e qualidade de leads",
    icon: "📥",
    questions: 4,
  },
  conversao: {
    title: "Conversão",
    description: "Processo e eficiência de vendas",
    icon: "⚡",
    questions: 4,
  },
  processo_escala: {
    title: "Processo & Escala",
    description: "Infraestrutura para crescer",
    icon: "⚙️",
    questions: 3,
  },
  inteligencia_mercado: {
    title: "Inteligência de Mercado",
    description: "Conhecimento competitivo e métricas",
    icon: "🧠",
    questions: 2,
  },
} as const;
