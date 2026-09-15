# lib/rd-station

Integração com o RD Station Marketing — endpoint oficial de Conversão
(CDP), via API Key (nunca OAuth para esta integração).
https://developers.rdstation.com/reference/conversao

- `config.ts` — endpoint e `conversion_identifier` ("plano-comercial-90-dias"), centralizados.
- `field-map.ts` — únicos nomes de campo (nativos e `cf_*`) usados no payload.
- `payload.ts` — `buildRdStationConversionPayload()`, o único lugar que decide o formato enviado.
- `client.ts` — `sendConversion()`, a chamada HTTP crua e classificada (sucesso/validação/autenticação/rate limit/5xx/timeout/rede).

O orquestrador (quem decide *quando* enviar, checa consentimento e
idempotência) fica em `src/server/send-rd-station-conversion.ts`, chamado
a partir de `src/server/actions/generate-commercial-plan-action.ts` assim
que o plano comercial de 90 dias fica pronto — nunca a cada etapa do quiz.

Ver `docs/CHECKLIST-RD-STATION.md` para configuração manual (API Key,
campos personalizados no painel do RD Station, como testar).
