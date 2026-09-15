import type { AIInputPayload } from "@/types";

export function buildGrowthPlannerPrompt(payload: AIInputPayload): string {
  return `Você é um consultor comercial B2B sênior com 15 anos de experiência em crescimento de receita.

DADOS DA EMPRESA:
${JSON.stringify(payload, null, 2)}

Gere um relatório estratégico executivo em JSON com a seguinte estrutura exata:

{
  "executive_diagnosis": "string (3-4 parágrafos estratégicos, tom consultivo, mencione a empresa pelo nome, cite os scores e gargalo principal, seja específico)",
  
  "plan_30_days": {
    "title": "string",
    "focus": "string (foco estratégico do mês)",
    "actions": [
      {
        "title": "string",
        "description": "string (ação específica e prática)",
        "priority": "alta|media|baixa",
        "effort": "baixo|medio|alto",
        "owner": "string (quem executa: CEO, Vendedor, Marketing, etc)"
      }
    ],
    "expected_results": "string",
    "kpis": ["string (KPI mensurável)"]
  },
  
  "plan_60_days": { "mesma estrutura" },
  "plan_90_days": { "mesma estrutura" },
  
  "content_ideas": [
    {
      "title": "string",
      "format": "string (post, artigo, vídeo, webinar, etc)",
      "channel": "string (LinkedIn, blog, Instagram, YouTube, etc)",
      "objective": "string"
    }
  ],
  
  "rich_materials": [
    {
      "title": "string",
      "type": "string (e-book, planilha, template, checklist, etc)",
      "description": "string",
      "funnel_stage": "topo|meio|fundo"
    }
  ],
  
  "email_cadences": [
    {
      "name": "string",
      "trigger": "string (quando usar esta cadência)",
      "steps": [
        {
          "day": number,
          "action": "Email",
          "message_template": "string (template do email, 3-5 linhas)"
        }
      ]
    }
  ],
  
  "whatsapp_cadences": [
    {
      "name": "string",
      "trigger": "string",
      "steps": [
        {
          "day": number,
          "action": "WhatsApp",
          "message_template": "string (template curto, direto, max 3 linhas)"
        }
      ]
    }
  ]
}

REGRAS OBRIGATÓRIAS:
- Responda APENAS o JSON, sem markdown, sem explicações
- Tom estratégico, executivo e consultivo
- Cada plano de 30/60/90 dias deve ter 4-6 ações
- 5 ideias de conteúdo
- 3 materiais ricos
- 2 cadências de email (cada com 4-6 steps)
- 2 cadências de WhatsApp (cada com 3-4 steps)
- Seja ESPECÍFICO para o gargalo: ${payload.bottleneck}
- Mencione métricas reais e acionáveis
- Nunca gere texto genérico`;
}
