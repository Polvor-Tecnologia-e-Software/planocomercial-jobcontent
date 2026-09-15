/**
 * /services/ai/sanitizer.ts
 *
 * Defensive layer that runs BEFORE the prompt is built.
 * All user-controlled strings pass through here.
 *
 * Attacks we defend against:
 *  1. Direct injection  — "Ignore all instructions and..."
 *  2. Role hijacking    — "You are now DAN..."
 *  3. JSON breakout     — injecting closing braces / quotes to corrupt the prompt
 *  4. Unicode tricks    — look-alike chars, zero-width spaces
 *  5. Excessive length  — fields that balloon the context
 */

// ─── Patterns that signal injection attempts ──────────────────────────────────
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /you\s+are\s+now\s+\w+/i,
  /system\s*:\s*/i,
  /\[system\]/i,
  /\[user\]/i,
  /\[assistant\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /####\s*(instruction|system|prompt)/i,
  /act\s+as\s+(a|an)\s+(different|new|alternative)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /forget\s+(everything|all)\s+(you|your)/i,
  /disregard\s+(your|all)\s+(training|instructions)/i,
  /jailbreak/i,
  /dan\s+mode/i,
  /developer\s+mode/i,
];

// ─── Characters that could break JSON structure ────────────────────────────────
const DANGEROUS_CHARS_RE = /[`\\${}]/g;

// ─── Zero-width and invisible unicode ─────────────────────────────────────────
const INVISIBLE_UNICODE_RE = /[\u200B-\u200D\uFEFF\u00AD\u034F\u115F\u1160]/g;

// ─── Result of a sanitisation pass ────────────────────────────────────────────
export interface SanitizeResult {
  safe: boolean;
  value: string;
  reason?: string;
}

/**
 * Sanitise a single user-controlled string.
 * Returns { safe: false } if injection is detected.
 * Returns { safe: true, value } with cleaned string otherwise.
 */
export function sanitizeString(input: unknown, maxLength = 200): SanitizeResult {
  // Type coerce
  if (input === null || input === undefined) {
    return { safe: true, value: "" };
  }

  const raw = String(input);

  // 1. Check for injection patterns before any transformation
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(raw)) {
      return {
        safe: false,
        value: "",
        reason: `Injection pattern detected: ${pattern}`,
      };
    }
  }

  // 2. Remove invisible unicode
  let clean = raw.replace(INVISIBLE_UNICODE_RE, "");

  // 3. Replace dangerous chars with safe equivalents
  clean = clean.replace(DANGEROUS_CHARS_RE, (c) => {
    const map: Record<string, string> = {
      "`": "'",
      "\\": "/",
      "$": "",
      "{": "(",
      "}": ")",
    };
    return map[c] ?? "";
  });

  // 4. Normalise whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  // 5. Enforce length
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength) + "…";
  }

  return { safe: true, value: clean };
}

/**
 * Sanitise the entire AIPayload's string fields.
 * Throws if any field fails the injection check.
 */
export function sanitizeAIPayload(
  companyName: string,
  payload: Record<string, unknown>
): { company_name: string; payload_json: string } {
  // Sanitise company name (appears in the prompt)
  const nameResult = sanitizeString(companyName, 100);
  if (!nameResult.safe) {
    throw new Error(`Prompt injection detected in company_name: ${nameResult.reason}`);
  }

  // Deep-sanitise all string values in the payload
  const sanitised = deepSanitize(payload);

  return {
    company_name: nameResult.value,
    payload_json: JSON.stringify(sanitised, null, 2),
  };
}

/**
 * Recursively sanitise all string values in an object.
 * Non-string values pass through unchanged.
 */
function deepSanitize(obj: unknown, depth = 0): unknown {
  // Guard against circular refs / excessive depth
  if (depth > 8) return "[truncated]";

  if (typeof obj === "string") {
    const r = sanitizeString(obj, 300);
    if (!r.safe) return "[redacted]";
    return r.value;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepSanitize(item, depth + 1));
  }

  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      // Sanitise the key too
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 50);
      result[safeKey] = deepSanitize(val, depth + 1);
    }
    return result;
  }

  // numbers, booleans, null — pass through
  return obj;
}
