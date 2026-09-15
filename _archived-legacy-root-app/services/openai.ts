import OpenAI from "openai";
import type { AIInputPayload, AIReport } from "@/types";
import { buildGrowthPlannerPrompt } from "@/prompts/growth-planner";

// Server-side only — never import this in client components
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateGrowthPlan(
  payload: AIInputPayload
): Promise<AIReport> {
  const prompt = buildGrowthPlannerPrompt(payload);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Cost-effective for structured output
    max_tokens: 3500,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Você é um consultor comercial B2B sênior. Responda sempre em JSON válido, sem markdown.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response");

  try {
    const parsed = JSON.parse(content);
    return parsed as AIReport;
  } catch {
    throw new Error("Failed to parse OpenAI JSON response");
  }
}

// Estimate cost before calling
export function estimateTokenCost(payload: AIInputPayload): {
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimated_cost_usd: number;
} {
  const inputStr = JSON.stringify(payload);
  const inputTokens = Math.ceil(inputStr.length / 4) + 800; // prompt overhead
  const outputTokens = 3000;

  // gpt-4o-mini: $0.15/1M input, $0.60/1M output
  const cost =
    (inputTokens * 0.00000015) + (outputTokens * 0.0000006);

  return {
    estimated_input_tokens: inputTokens,
    estimated_output_tokens: outputTokens,
    estimated_cost_usd: cost,
  };
}
