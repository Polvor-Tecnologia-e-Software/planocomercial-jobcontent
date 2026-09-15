/**
 * Seção 5: simulação de mudança de taxa de conversão.
 *
 * Função pura, autocontida — não lê nada do banco nem de outras partes da
 * engine. Só executa os valores explicitamente fornecidos pelo chamador;
 * não decide sozinha qual taxa "deveria" melhorar (isso é decisão de quem
 * chama — uma tela, ou futuramente a IA interpretando o resultado, nunca
 * este módulo).
 */
import { isValidFiniteNonNegative, isValidRate } from "@/lib/calculations/rounding";
import type {
  SimulateConversionChangeInput,
  SimulateConversionChangeResult,
} from "@/lib/calculations/types";

export class InvalidSimulationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSimulationInputError";
  }
}

function validateInput(input: SimulateConversionChangeInput): void {
  if (!isValidRate(input.currentRate)) {
    throw new InvalidSimulationInputError("currentRate deve ser um número finito entre 0 e 1.");
  }
  if (!isValidRate(input.simulatedRate)) {
    throw new InvalidSimulationInputError("simulatedRate deve ser um número finito entre 0 e 1.");
  }
  if (!isValidFiniteNonNegative(input.currentVolume)) {
    throw new InvalidSimulationInputError("currentVolume deve ser um número finito, não-negativo e razoável.");
  }
}

export function simulateConversionChange(
  input: SimulateConversionChangeInput,
): SimulateConversionChangeResult {
  validateInput(input);

  const currentVolumeOut = Math.round(input.currentVolume * input.currentRate);
  const simulatedVolumeOut = Math.round(input.currentVolume * input.simulatedRate);

  const assumptions = [
    "O volume de entrada do estágio (currentVolume) é mantido igual em ambos os cenários — a simulação isola o efeito de mudar só a taxa.",
    "Volumes de saída são arredondados ao inteiro mais próximo (não é possível ter uma fração de oportunidade/reunião/proposta/venda).",
  ];

  return {
    stage: input.stage,
    currentScenario: { rate: input.currentRate, volumeIn: input.currentVolume, volumeOut: currentVolumeOut },
    simulatedScenario: {
      rate: input.simulatedRate,
      volumeIn: input.currentVolume,
      volumeOut: simulatedVolumeOut,
    },
    variableChanged: "rate",
    valuesKept: { volumeIn: input.currentVolume },
    delta: {
      volumeOut: simulatedVolumeOut - currentVolumeOut,
      percentChange:
        currentVolumeOut === 0
          ? null
          : Math.round(((simulatedVolumeOut - currentVolumeOut) / currentVolumeOut) * 1000) / 10,
    },
    assumptions,
  };
}
