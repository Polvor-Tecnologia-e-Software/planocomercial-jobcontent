import type { StartDiagnosticActionState } from "@/server/actions/start-diagnostic-action";

/**
 * Estado inicial de useActionState(startDiagnosticAction, ...) — mora num
 * arquivo separado (sem "use server") de propósito: um arquivo "use
 * server" só pode exportar funções async, e este é um valor comum
 * (violaria a regra se ficasse em start-diagnostic-action.ts — erro real
 * encontrado ao rodar `next dev` pela primeira vez: "A 'use server' file
 * can only export async functions, found object.").
 */
export const initialStartDiagnosticState: StartDiagnosticActionState = {
  status: "idle",
};
