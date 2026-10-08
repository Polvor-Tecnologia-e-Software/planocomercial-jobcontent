# lib/rd-station

Integração com o RD Station Marketing — endpoint oficial de Conversão
(CDP), via API Key (nunca OAuth para esta integração).
https://developers.rdstation.com/reference/conversao

- `config.ts` — endpoint, os dois `conversion_identifier` e os nomes dos cookies de rastreamento da RD, centralizados.
- `field-map.ts` — únicos nomes de campo (nativos e `cf_*`) usados no payload.
- `payload.ts` — `buildRdStationConversionPayload()`, o único lugar que decide o formato enviado (incluindo a regra de origem).
- `client.ts` — `sendConversion()`, a chamada HTTP crua e classificada (sucesso/validação/autenticação/rate limit/5xx/timeout/rede).

Duas conversões, orquestradas em `src/server/send-rd-station-conversion.ts`
(consentimento, idempotência por diagnóstico + evento, tentativas):

| Identificador | Quando | Chamada a partir de |
|---|---|---|
| `plano-comercial-90-dias-captura` | envio do formulário inicial | `start-diagnostic-action.ts` (em `after()`, sem atrasar a pessoa) |
| `plano-comercial-90-dias-realizado` | plano de 90 dias pronto | `generate-commercial-plan-action.ts` |

Origem (em todas as conversões): com o cookie `__trf.src` do código de
monitoramento da RD, vai só ele em `traffic_source` (a RD exige
medium/campaign/value vazios nesse caso); sem o cookie, vão os UTMs da
URL. O cookie `_rdtrk` vai em `client_tracking_id`. Os dois cookies são
lidos no envio do formulário inicial e gravados no lead.

Ver `docs/CHECKLIST-RD-STATION.md` para configuração manual (API Key,
campos personalizados no painel do RD Station, como testar).
