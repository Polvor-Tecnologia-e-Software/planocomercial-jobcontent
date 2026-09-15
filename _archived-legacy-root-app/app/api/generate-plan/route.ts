/**
 * POST /api/generate-plan
 *
 * Accepts the Score Engine's AIPayload and streams back SSE events.
 * The client receives: status → progress → chunks → done (or error).
 *
 * Never touches raw diagnostic answers — only the pre-computed AIPayload.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { generatePlanStreaming } from "@/services/ai";
import type { StreamEvent } from "@/services/ai/types";

// ─── Request validation schema ────────────────────────────────────────────────
const AIPayloadSchema = z.object({
  company: z.object({
    stage:           z.string().max(50),
    team_size:       z.string().max(20),
    avg_ticket:      z.string().max(20),
    monthly_leads:   z.string().max(20),
    conversion_rate: z.string().max(20),
  }),
  scores: z.object({
    overall:   z.number().int().min(0).max(100),
    demanda:   z.number().int().min(0).max(100),
    conversao: z.number().int().min(0).max(100),
    escala:    z.number().int().min(0).max(100),
    level:     z.string().max(20),
  }),
  main_bottleneck: z.object({
    type:        z.string().max(30),
    severity:    z.string().max(20),
    description: z.string().max(400),
  }),
  top_priorities: z.array(z.object({
    pillar:       z.string().max(20),
    title:        z.string().max(100),
    time_horizon: z.string().max(5),
  })).max(3),
  funnel: z.object({
    main_leak:        z.string().max(30),
    lost_revenue_pct: z.number().min(0).max(100),
    health:           z.string().max(20),
  }),
  archetype: z.string().max(30),
});

const RequestSchema = z.object({
  company_name:  z.string().min(1).max(200),
  diagnostic_id: z.string().uuid().optional(),
  ai_payload:    AIPayloadSchema,
});

// ─── SSE helpers ──────────────────────────────────────────────────────────────
function encodeEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function createSSEStream(): {
  stream:    ReadableStream<Uint8Array>;
  enqueue:   (event: StreamEvent) => void;
  close:     () => void;
} {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) { controller = c; },
  });

  return {
    stream,
    enqueue: (event: StreamEvent) => {
      try {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      } catch {
        // Stream already closed
      }
    },
    close: () => {
      try { controller.close(); } catch { /* already closed */ }
    },
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Parse and validate body
  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(
      encodeEvent({ type: "error", message: "Body inválido", code: "UNKNOWN" }),
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      encodeEvent({
        type:    "error",
        message: "Dados inválidos: " + parsed.error.flatten().fieldErrors ? Object.values(parsed.error.flatten().fieldErrors).flat().join(", ") : "inválido",
        code:    "UNKNOWN",
      }),
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const { company_name, diagnostic_id, ai_payload } = parsed.data;

  // 2. Create SSE stream
  const { stream, enqueue, close } = createSSEStream();

  // 3. Start generation (non-blocking)
  generatePlanStreaming(
    {
      company_name,
      diagnostic_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ai_payload: ai_payload as any,
    },
    (event: StreamEvent) => {
      enqueue(event);
      if (event.type === "done" || event.type === "error") {
        // Small delay so the client receives the final event before close
        setTimeout(() => close(), 50);
      }
    }
  );

  // 4. Return the stream immediately
  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // disable Nginx buffering
    },
  });
}
