# Checklist Operacional - Fiscal por Empresa (Multi-CNPJ)

Data: 22/03/2026

## Objetivo
Validar que cada empresa (tenant) consegue usar configuracao fiscal propria sem depender apenas de `.env` global.

## 1) Banco de dados
1. Executar migration:
   - `npm --prefix backend run migration:run`
2. Confirmar que a migration foi aplicada:
   - `npm --prefix backend run migration:show`
   - Esperado: `AddFiscalProviderConfigToEmpresaConfiguracoes1809002000000` com `[X]`.
   - Esperado: `AddFiscalRuntimeOverridesToEmpresaConfiguracoes1809003000000` com `[X]`.

## 2) Configuracao por empresa (UI)
Tela: `Configuracoes da Empresa` -> aba `Fiscal`.

Preencher:
1. `Provider fiscal da empresa` (`fiscal_oficial` para provedor real).
2. `Integracao HTTP oficial habilitada` = ativo.
3. `URL base do provider oficial`.
4. `Token de API oficial`.
5. `Segredo do webhook fiscal`.
6. `Exigir provider oficial` (recomendado em producao real).
7. `Validacao estrita de contrato` (recomendado ativo).
8. `Webhook sem assinatura` apenas para contingencia controlada.
9. `Header de correlacao` (ex.: `X-Correlation-Id`).
10. Salvar alteracoes.

## 3) Diagnostico tecnico na propria aba
Na aba `Fiscal`:
1. Clicar em `Atualizar diagnostico`.
2. Clicar em `Testar conectividade`.
3. Clicar em `Executar preflight`.

Esperado:
1. Status sem bloqueios (`ok`) para emissao oficial.
2. Sem bloqueio de `FISCAL_OFFICIAL_BASE_URL`.
3. Sem bloqueio de `FISCAL_OFFICIAL_WEBHOOK_SECRET`.
4. Provider efetivo condizente com o provider da empresa.
5. Origem das configuracoes indicando `empresa` para campos que nao devem depender do global.

## 4) Smoke de emissao por tenant
1. Criar/abrir fatura de uma empresa piloto.
2. Emitir documento fiscal.
3. Atualizar status fiscal.
4. Validar historico fiscal da fatura (request/correlation/status).

## 5) Criterio de aceite
1. Empresa A com configuracao A e Empresa B com configuracao B sem interferencia.
2. Emissao oficial funciona para tenant configurado.
3. Tenant sem configuracao dedicada continua com fallback global.
4. Webhook fiscal respeita o override por empresa para validacao de assinatura.

## 6) Rollback rapido
Se houver erro:
1. Voltar `fiscalProvider` para vazio na empresa afetada (usa fallback global).
2. Desativar `Integracao HTTP oficial` temporariamente.
3. Executar novamente `preflight` para confirmar estado de contingencia.
