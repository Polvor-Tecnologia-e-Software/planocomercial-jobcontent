/**
 * /services/ai/validator.ts
 *
 * Validates the raw string returned by the model.
 * Applies coercion and repair before surfacing errors.
 *
 * Strategy:
 *  1. Strip any markdown wrapping (model sometimes ignores instructions)
 *  2. Try JSON.parse
 *  3. Validate required keys exist
 *  4. Coerce each field into the correct shape with fallbacks
 *  5. Never throw — return { valid: false, errors } instead
 */

import type { GrowthPlan, GrowthPlanRaw, PlanItem, ContentItem, RichMaterialItem, CadenceItem, CadenceStep } from "./types";

export interface ValidationResult {
  valid: boolean;
  plan?: GrowthPlan;
  errors: string[];
  repaired: boolean; // true if we had to fix something
}

// ─── Top-level validator ──────────────────────────────────────────────────────
export function validateAndParsePlan(rawText: string): ValidationResult {
  const errors: string[] = [];
  let repaired = false;

  // Step 1: Strip markdown fences
  const stripped = stripMarkdown(rawText);
  if (stripped !== rawText) repaired = true;

  // Step 2: Parse JSON
  let raw: GrowthPlanRaw;
  try {
    raw = JSON.parse(stripped);
  } catch (e) {
    // Try to recover a partial JSON object
    const recovered = tryRecoverJSON(stripped);
    if (!recovered) {
      return {
        valid: false,
        errors: [`JSON parse failed: ${e instanceof Error ? e.message : String(e)}`],
        repaired: false,
      };
    }
    raw = recovered;
    repaired = true;
  }

  // Step 3: Validate required keys
  const requiredKeys: (keyof GrowthPlanRaw)[] = [
    "diagnostico",
    "plano30dias",
    "plano60dias",
    "plano90dias",
    "conteudos",
    "materiaisRicos",
    "cadenciaEmail",
    "cadenciaWhatsapp",
  ];

  for (const key of requiredKeys) {
    if (!(key in raw)) {
      errors.push(`Missing required key: ${key}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, repaired };
  }

  // Step 4: Coerce each field
  const plan: GrowthPlan = {
    diagnostico:     coerceDiagnostico(raw.diagnostico),
    plano30dias:     coercePlanArray(raw.plano30dias,     "plano30dias",     errors),
    plano60dias:     coercePlanArray(raw.plano60dias,     "plano60dias",     errors),
    plano90dias:     coercePlanArray(raw.plano90dias,     "plano90dias",     errors),
    conteudos:       coerceContentArray(raw.conteudos,   errors),
    materiaisRicos:  coerceMaterialArray(raw.materiaisRicos, errors),
    cadenciaEmail:   coerceCadenceArray(raw.cadenciaEmail,   "cadenciaEmail",    errors),
    cadenciaWhatsapp:coerceCadenceArray(raw.cadenciaWhatsapp,"cadenciaWhatsapp", errors),
  };

  // Step 5: Quantity checks (warn, don't fail)
  if (plan.plano30dias.length < 3)     errors.push(`plano30dias has only ${plan.plano30dias.length} items (expected 4-5)`);
  if (plan.conteudos.length < 3)       errors.push(`conteudos has only ${plan.conteudos.length} items (expected 5)`);
  if (plan.cadenciaEmail.length < 1)   errors.push(`cadenciaEmail is empty`);

  // If there are structural errors, the plan is still usable but flagged
  const valid = !errors.some((e) => e.startsWith("Missing required key"));

  return { valid, plan, errors, repaired };
}

// ─── Coerce helpers ───────────────────────────────────────────────────────────

function coerceDiagnostico(raw: unknown): string {
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  return "Diagnóstico não disponível. Por favor, tente gerar o plano novamente.";
}

function coercePlanArray(raw: unknown, field: string, errors: string[]): PlanItem[] {
  if (!Array.isArray(raw)) {
    errors.push(`${field} is not an array`);
    return [];
  }

  return raw
    .filter((item) => item !== null && typeof item === "object")
    .map((item, i): PlanItem => {
      const obj = item as Record<string, unknown>;
      return {
        titulo:       coerceString(obj.titulo,       `${field}[${i}].titulo`,       "Ação comercial", errors),
        descricao:    coerceString(obj.descricao,    `${field}[${i}].descricao`,    "Implementar conforme orientação.", errors),
        prioridade:   coerceEnum(obj.prioridade,     ["alta", "media", "baixa"],    "alta") as PlanItem["prioridade"],
        esforco:      coerceEnum(obj.esforco,        ["baixo", "medio", "alto"],    "medio") as PlanItem["esforco"],
        responsavel:  coerceString(obj.responsavel,  `${field}[${i}].responsavel`,  "Time comercial", errors),
        kpis:         coerceStringArray(obj.kpis,    `${field}[${i}].kpis`),
      };
    });
}

function coerceContentArray(raw: unknown, errors: string[]): ContentItem[] {
  if (!Array.isArray(raw)) {
    errors.push("conteudos is not an array");
    return [];
  }

  return raw
    .filter((item) => item !== null && typeof item === "object")
    .map((item, i): ContentItem => {
      const obj = item as Record<string, unknown>;
      return {
        titulo:   coerceString(obj.titulo,   `conteudos[${i}].titulo`,   "Conteúdo estratégico", errors),
        formato:  coerceString(obj.formato,  `conteudos[${i}].formato`,  "post",    errors),
        canal:    coerceString(obj.canal,    `conteudos[${i}].canal`,    "LinkedIn", errors),
        objetivo: coerceString(obj.objetivo, `conteudos[${i}].objetivo`, "awareness",errors),
      };
    });
}

function coerceMaterialArray(raw: unknown, errors: string[]): RichMaterialItem[] {
  if (!Array.isArray(raw)) {
    errors.push("materiaisRicos is not an array");
    return [];
  }

  return raw
    .filter((item) => item !== null && typeof item === "object")
    .map((item, i): RichMaterialItem => {
      const obj = item as Record<string, unknown>;
      return {
        titulo:      coerceString(obj.titulo,     `materiaisRicos[${i}].titulo`,      "Material rico", errors),
        tipo:        coerceString(obj.tipo,        `materiaisRicos[${i}].tipo`,        "e-book",        errors),
        descricao:   coerceString(obj.descricao,   `materiaisRicos[${i}].descricao`,   "Material educativo.", errors),
        etapa_funil: coerceEnum(obj.etapa_funil,   ["topo", "meio", "fundo"],          "meio") as RichMaterialItem["etapa_funil"],
      };
    });
}

function coerceCadenceArray(raw: unknown, field: string, errors: string[]): CadenceItem[] {
  if (!Array.isArray(raw)) {
    errors.push(`${field} is not an array`);
    return [];
  }

  return raw
    .filter((item) => item !== null && typeof item === "object")
    .map((item, i): CadenceItem => {
      const obj = item as Record<string, unknown>;
      return {
        nome:     coerceString(obj.nome,    `${field}[${i}].nome`,    "Cadência comercial", errors),
        gatilho:  coerceString(obj.gatilho, `${field}[${i}].gatilho`, "Novo lead",          errors),
        passos:   coerceCadenceSteps(obj.passos, `${field}[${i}].passos`, errors),
      };
    });
}

function coerceCadenceSteps(raw: unknown, field: string, errors: string[]): CadenceStep[] {
  if (!Array.isArray(raw)) {
    errors.push(`${field} is not an array`);
    return [];
  }

  return raw
    .filter((item) => item !== null && typeof item === "object")
    .map((item, i): CadenceStep => {
      const obj = item as Record<string, unknown>;
      return {
        dia:      typeof obj.dia === "number" ? obj.dia : (parseInt(String(obj.dia), 10) || i + 1),
        acao:     coerceString(obj.acao,    `${field}[${i}].acao`,    "Contato",       errors),
        mensagem: coerceString(obj.mensagem,`${field}[${i}].mensagem`,"Olá, tudo bem?",errors),
      };
    });
}

// ─── Primitive coercers ───────────────────────────────────────────────────────

function coerceString(
  raw: unknown,
  field: string,
  fallback: string,
  errors: string[]
): string {
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  errors.push(`${field}: expected string, got ${typeof raw} — using fallback`);
  return fallback;
}

function coerceEnum<T extends string>(
  raw: unknown,
  allowed: T[],
  fallback: T
): T {
  if (typeof raw === "string" && allowed.includes(raw as T)) return raw as T;
  return fallback;
}

function coerceStringArray(raw: unknown, _field: string): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((i) => typeof i === "string").map((i) => String(i).trim());
  }
  if (typeof raw === "string") return [raw];
  return [];
}

// ─── JSON repair helpers ──────────────────────────────────────────────────────

function stripMarkdown(text: string): string {
  // Remove ```json ... ``` or ``` ... ```
  return text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
}

function tryRecoverJSON(text: string): GrowthPlanRaw | null {
  // Try to extract the first { ... } block
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
