import { beforeEach, describe, expect, it, vi } from "vitest";

const updateDiagnostic = vi.fn();
const trackEvent = vi.fn();

vi.mock("@/lib/database", () => ({
  diagnostics: { updateDiagnostic },
  analyticsEvents: { trackEvent },
}));

const { selectChallenge } = await import("@/server/select-challenge");

beforeEach(() => {
  vi.clearAllMocks();
  updateDiagnostic.mockResolvedValue({
    id: "diagnostic-1",
    status: "challenge_selected",
    selected_challenge: "D1",
  });
  trackEvent.mockResolvedValue({ id: "event-1" });
});

describe("selectChallenge", () => {
  it("grava selected_challenge e avança o status para 'challenge_selected'", async () => {
    await selectChallenge({ diagnosticId: "diagnostic-1", challenge: "D3" });

    expect(updateDiagnostic).toHaveBeenCalledWith("diagnostic-1", {
      status: "challenge_selected",
      selected_challenge: "D3",
    });
  });

  it("registra o evento challenge_selected com a dimensão provável e o tamanho da rota", async () => {
    await selectChallenge({ diagnosticId: "diagnostic-1", challenge: "D3" });

    expect(trackEvent).toHaveBeenCalledWith({
      diagnostic_id: "diagnostic-1",
      event_name: "challenge_selected",
      event_data: {
        challenge: "D3",
        probable_dimension: "conversion",
        question_route_length: expect.any(Number),
      },
    });
  });

  it("rejeita um código de desafio fora do catálogo sem gravar nada", async () => {
    await expect(
      selectChallenge({
        diagnosticId: "diagnostic-1",
        // @ts-expect-error -- testando entrada inválida de propósito
        challenge: "D9",
      }),
    ).rejects.toThrow();

    expect(updateDiagnostic).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it.each(["D1", "D2", "D3", "D4", "D5", "D6"] as const)(
    "funciona para todos os 6 desafios (%s)",
    async (challenge) => {
      await expect(
        selectChallenge({ diagnosticId: "diagnostic-1", challenge }),
      ).resolves.toBeDefined();
    },
  );
});
