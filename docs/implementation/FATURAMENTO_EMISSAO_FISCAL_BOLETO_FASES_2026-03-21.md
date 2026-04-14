# Plano Faseado - Emissao Fiscal e Boleto (Faturamento)

Data: 21/03/2026
Escopo: fechar o fluxo operacional de faturamento para emissao de documento fiscal e cobranca (boleto/link), com rastreabilidade.

## Objetivo
Garantir que a tela de faturamento opere com fluxo consistente entre:
- cadastro/edicao de fatura,
- emissao fiscal,
- cobranca ao cliente,
- conciliacao de pagamento.

## Fase 1 - Numeracao e Documento Financeiro (concluida)
Status: CONCLUIDA

Entregas:
- endpoint para gerar numero de documento financeiro por tipo (`/faturamento/faturas/documento/gerar-numero`);
- suporte de tipos (`fatura`, `recibo`, `folha_pagamento`, `outro`) com prefixo e sequencial anual;
- bloqueio explicito para `nfe`/`nfse` no fluxo manual de numeracao;
- botao "Gerar numero" no modal de fatura para tipos nao fiscais.

Validacao executada:
- compilacao/type-check backend e frontend;
- validacao funcional do fluxo no modal (preenchimento automatico do numero).

## Fase 2 - Cobranca Digital (link/boleto) (MVP concluido)
Status: CONCLUIDA (MVP)

Entregas executadas:
- endpoint backend para gerar link de pagamento por fatura;
- persistencia do link na fatura;
- restricao de metodo para boleto quando forma preferida for boleto;
- ajuste no frontend para parar de usar placeholder e consumir endpoint real.

Criterio de aceite:
- botao "Gerar link" da tela de faturamento retorna URL valida;
- URL e persistida na fatura;
- tentativa em fatura paga/cancelada e bloqueada com mensagem clara.

## Fase 3 - Emissao Fiscal de Producao (SEFAZ/Prefeitura)
Status: PARCIAL (hardening + fluxo assincrono local concluido; integracao oficial pendente)

Entregas concluidas nesta fase:
- bloqueio de emissao fiscal quando o ambiente exige provedor oficial (`FISCAL_REQUIRE_OFFICIAL_PROVIDER=true`) e o provider atual e stub;
- bloqueio de emissao/sincronizacao fiscal em modo estrito quando o provider oficial estiver sem integracao ativa (exige `FISCAL_OFFICIAL_HTTP_ENABLED=true` e `FISCAL_OFFICIAL_BASE_URL`);
- resolucao de provider por configuracao de ambiente (`FISCAL_PROVIDER`) com fallback seguro;
- teste automatizado para validar o bloqueio em modo estrito.
- suporte de emissao em lote (`modoProcessamento=lote`) com status `pendente_emissao`, lote e codigo de retorno;
- suporte a modo de contingencia no payload fiscal (`contingencia=true`) com rastreio no estado fiscal;
- consulta ativa de status fiscal (`?sincronizar=true`) para o botao de atualizar status sincronizar com provider e registrar auditoria.
- painel de detalhes da fatura atualizado para expor modo de emissao, contingencia, codigo de retorno e referencia externa do provider.
- adaptador HTTP oficial implementado para emissao, consulta de status e operacao final (cancelamento/inutilizacao), com timeout, token Bearer opcional e paths configuraveis por ambiente.
- normalizacao resiliente de retorno do provider oficial (aliases de status, codigos de retorno e formatos alternativos de payload), reduzindo acoplamento com fornecedor.
- correlacao de requisicoes com header configuravel (`FISCAL_OFFICIAL_CORRELATION_HEADER`) para rastreabilidade ponta a ponta.
- metodo HTTP configuravel por operacao (`FISCAL_OFFICIAL_EMIT_METHOD`, `FISCAL_OFFICIAL_STATUS_METHOD`, `FISCAL_OFFICIAL_FINALIZE_METHOD`) para aderencia ao contrato do fornecedor.
- retries automáticos para falhas transientes (rede/timeout/429/5xx) com controle por ambiente (`FISCAL_OFFICIAL_MAX_RETRIES`, `FISCAL_OFFICIAL_RETRY_DELAY_MS`).
- endpoint publico de callback fiscal oficial com assinatura e idempotencia por evento (`POST /faturamento/documento-fiscal/webhooks/oficial/:empresaId`).
- webhook fiscal com seguranca por HMAC (`FISCAL_OFFICIAL_WEBHOOK_SECRET`) e flag explicita para modo inseguro somente em dev (`FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE`).
- trilha de auditoria fiscal reforcada no historico da fatura com metadados oficiais (`codigoRetorno`, `correlationId`, `requestId`, `httpStatus`, hash do payload e operacao).
- validacao de contrato minimo de resposta do provider oficial com modo estrito configuravel (`FISCAL_OFFICIAL_STRICT_RESPONSE`).
- aliases de campos do retorno oficial configuraveis por ambiente (`FISCAL_OFFICIAL_RESPONSE_*_KEYS`), incluindo suporte a paths aninhados para reduzir acoplamento com fornecedor.
- envelope raiz do payload oficial tambem configuravel (`FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS`) para provedores que retornam estruturas mais profundas.
- endpoint de diagnostico da configuracao fiscal (`GET /faturamento/documento-fiscal/configuracao`) para validacao operacional de readiness.
- diagnostico fiscal agora inclui `readyForOfficialEmission`, `blockers`, `warnings` e `recommendations` para facilitar go-live.
- endpoint de teste ativo de conectividade com provider fiscal oficial (`GET /faturamento/documento-fiscal/conectividade`), com status HTTP, latencia, request/correlation id e mensagem operacional.
- configuracao de health-check por ambiente (`FISCAL_OFFICIAL_HEALTH_PATH`, `FISCAL_OFFICIAL_HEALTH_METHOD`).
- endpoint de preflight fiscal unificado (`GET /faturamento/documento-fiscal/preflight`) com consolidacao de readiness, bloqueios/alertas e resultado operacional (ok/alerta/bloqueio).

Entregas pendentes:
- substituir provider local (`fiscal_stub_local`) por provider homologado;
- homologar contrato final de payload/retorno com o fornecedor oficial e preencher `FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS` + `FISCAL_OFFICIAL_RESPONSE_*_KEYS` conforme layout real do parceiro;

Atualizacao pendencias:
- lote/contingencia/consulta agora existem no fluxo interno e auditoria local;
- resta conectar o provider oficial para codigos e protocolos realmente homologados.

Criterio de aceite:
- emissao/cancelamento/inutilizacao com protocolo oficial;
- status fiscal sincronizado sem dependencia de mock.

## Fase 4 - Conciliacao Automatica de Cobranca
Status: CONCLUIDA (MVP)

Entregas executadas:
- vinculo de referencia de cobranca ao pagamento financeiro ao gerar link;
- registro automatico de pagamento pendente com `gatewayTransacaoId` para conciliacao;
- pipeline de webhook mantida para atualizar pagamento/fatura sem acao manual.
- webhook Mercado Pago agora reconhece `external_reference` de fatura (`fatura:<empresaId>:<faturaId>`) e delega o processamento ao `PagamentoService` (reuso da regra de negocio oficial);
- bloqueio de reprocessamento para webhook duplicado de fatura (evita baixa duplicada e ruido de auditoria);
- fallback automatico: se webhook chegar sem registro de pagamento pendente, o sistema cria o pagamento tecnico e reprocesa o evento.

Criterio de aceite:
- pagamento confirmado no gateway atualiza status financeiro automaticamente;
- divergencias entram em alerta operacional e trilha de auditoria.

## Checklist de Testes por Fase
- Fase 1: gerar numero para `recibo` e `outro`; validar incremento sequencial.
- Fase 2: gerar link para fatura pendente; validar persistencia e copia do link.
- Fase 3: emitir/cancelar/inutilizar em homologacao e producao com retorno oficial.
- Fase 4: simular webhook aprovado/recusado e conferir atualizacao de fatura/pagamento.
