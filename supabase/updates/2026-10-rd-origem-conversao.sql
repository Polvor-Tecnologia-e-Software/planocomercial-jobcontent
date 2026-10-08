-- Atualização para bancos JÁ criados com supabase/schema.sql (projeto novo
-- não precisa: o schema.sql já inclui estas colunas).
-- Rode uma vez no Supabase SQL Editor. Pode rodar de novo sem problema.
--
-- Guarda os cookies do código de monitoramento da RD Station lidos no
-- envio do formulário inicial, para informar a origem das conversões
-- (traffic_source) e ligar a conversão ao histórico do lead na RD
-- (client_tracking_id).

alter table leads add column if not exists rd_traffic_source text;
alter table leads add column if not exists rd_client_tracking_id text;
