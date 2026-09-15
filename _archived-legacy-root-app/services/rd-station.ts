import type { RDPayload } from "@/types";

const RD_API_BASE = "https://api.rd.services";

interface RDContact {
  email: string;
  name?: string;
  job_title?: string;
  mobile_phone?: string;
  website?: string;
  cf_company?: string;
  legal_bases?: RDLegalBase[];
  [key: string]: unknown;
}

interface RDLegalBase {
  category: string;
  type: string;
  status: string;
}

// Server-side only — token never leaves server
export async function upsertRDContact(payload: RDPayload): Promise<string> {
  const token = process.env.RD_STATION_TOKEN;
  if (!token) throw new Error("RD_STATION_TOKEN not configured");

  const contact: RDContact = {
    email: payload.email,
    name: payload.company_name,
    job_title: payload.job_title,
    mobile_phone: payload.phone,
    website: payload.website,
    cf_company: payload.company_name,
    cf_growth_score: payload.cf_growth_score,
    cf_score_demanda: payload.cf_score_demanda,
    cf_score_conversao: payload.cf_score_conversao,
    cf_score_escala: payload.cf_score_escala,
    cf_gargalo_principal: payload.cf_gargalo_principal,
    cf_link_plano_comercial: payload.cf_link_plano_comercial,
    legal_bases: payload.legal_bases.map((lb) => ({
      category: lb.category,
      type: lb.type,
      status: lb.status,
    })),
  };

  const response = await fetch(`${RD_API_BASE}/platform/contacts`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contact }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RD Station error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.uuid || payload.email;
}

export async function sendConversionEvent(
  email: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const token = process.env.RD_STATION_TOKEN;
  if (!token) throw new Error("RD_STATION_TOKEN not configured");

  await fetch(`${RD_API_BASE}/platform/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: eventType,
      event_family: "CDP",
      payload: {
        email,
        ...payload,
      },
    }),
  });
}
