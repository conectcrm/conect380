# Relatório de Prontidão para Produção (Frontend + Backend + Multi-Tenant)

**Data da avaliação:** 16 de fevereiro de 2026  
**Projeto:** ConectCRM  
**Status final:** **NO-GO para produção**

## 1. Escopo avaliado

- Backend NestJS com foco em isolamento multi-tenant (especialmente módulo `atendimento`).
- Endpoints críticos de tickets, mensagens, canais, SLA, templates e webhook autenticado.
- Módulo de assinaturas (`planos/assinaturas`) com risco de acesso cruzado por `empresaId` em rota.
- Build de produção do frontend React.

## 2. Correções aplicadas nesta rodada

### 2.1 Hardening de controllers (tenant pelo JWT)

Foi padronizado `@UseGuards(JwtAuthGuard, EmpresaGuard)` + `@EmpresaId()` em controllers críticos:

- `backend/src/modules/atendimento/controllers/atendentes.controller.ts`
- `backend/src/modules/atendimento/controllers/analytics.controller.ts`
- `backend/src/modules/atendimento/controllers/canais.controller.ts`
- `backend/src/modules/atendimento/controllers/filas.controller.ts`
- `backend/src/modules/atendimento/controllers/mensagens.controller.ts`
- `backend/src/modules/atendimento/controllers/message-template.controller.ts`
- `backend/src/modules/atendimento/controllers/niveis-atendimento.controller.ts`
- `backend/src/modules/atendimento/controllers/sla.controller.ts`
- `backend/src/modules/atendimento/controllers/status-customizados.controller.ts`
- `backend/src/modules/atendimento/controllers/test-canais.controller.ts`
- `backend/src/modules/atendimento/controllers/ticket.controller.ts`
- `backend/src/modules/atendimento/controllers/tickets.controller.ts`
- `backend/src/modules/atendimento/controllers/tipos-servico.controller.ts`
- `backend/src/modules/atendimento/controllers/whatsapp-webhook.controller.ts`

Resultado: no módulo `atendimento`, endpoints autenticados agora estão com guard tenant consistente (exceção intencional: `dlq` com `RolesGuard` admin).

### 2.2 Correções de vazamento por ID/escopo

- `tickets.controller.ts`: leitura de mensagens por ticket agora filtra por `empresaId`.
- `tickets.controller.ts`: associação de tags ao criar ticket filtra por `empresaId`.
- `mensagens.controller.ts`: listagem por ticket filtra por `empresaId` e criação/upload grava `empresaId`.
- `whatsapp-webhook.controller.ts`: endpoint autenticado `:empresaId/enviar` ignora empresa da URL e força empresa do JWT.
- `ticket.controller.ts`: ações por `id` (status, prioridade, escalar, transferir, encerrar, reabrir etc.) agora validam propriedade do ticket pela empresa autenticada antes de executar.
- `planos/assinaturas.controller.ts`: rotas com `empresaId` no path agora usam `@EmpresaId()` para impedir troca de tenant via URL.

### 2.3 Serviços ajustados

- `backend/src/modules/atendimento/services/mensagem.service.ts`
  - `salvar(...)` passou a aceitar `empresaId` opcional para validação de ticket no tenant certo.
  - gravação de mensagem agora seta `empresaId`.
- `backend/src/modules/atendimento/services/whatsapp-webhook.service.ts`
  - chamadas para `mensagemService.salvar(...)` passam `empresaId`.
- `backend/src/modules/atendimento/services/niveis-atendimento.service.ts`
- `backend/src/modules/atendimento/services/status-customizados.service.ts`
- `backend/src/modules/atendimento/services/tipos-servico.service.ts`
  - `buscarPorId` agora exige `empresaId` e filtra por tenant.

## 3. Validações executadas

### 3.1 Backend

- `npm run type-check` ✅
- `npm run build` ✅
- `npm run test -- --runInBand src/modules/atendimento/services/ticket.service.spec.ts` ✅ (22 testes passando)

### 3.2 Frontend

- `npm run build` em `frontend-web` ✅ (build de produção gerado com sucesso)

### 3.3 E2E Multi-tenant

- `npm run test:e2e -- --runInBand --detectOpenHandles --forceExit test/multi-tenancy.e2e-spec.ts` ❌
- Bloqueio de ambiente: falha de autenticação no PostgreSQL de teste para usuário `postgres`.
- Consequência: sem evidência E2E confiável de isolamento ponta a ponta no ambiente atual.

## 4. Riscos residuais (bloqueadores de Go-Live)

1. **Sem validação E2E multi-tenant executável em ambiente de teste**  
   Sem isso, não há prova operacional de isolamento fim-a-fim antes da produção.

2. **Ainda existem controllers fora de `atendimento` sem `EmpresaGuard`**  
   Há módulos que precisam auditoria/normalização final de tenant guard e filtros por empresa (ex.: alguns controllers em `triagem`, `propostas`, `dashboard`, `users`, `ia`, `metas`, etc.).

3. **Cobertura RLS no banco não foi revalidada nesta rodada**  
   Como o E2E está bloqueado por banco, a verificação real de políticas RLS em todas as tabelas com `empresa_id` permanece pendente.

## 5. Decisão de prontidão

**Decisão atual: NO-GO para produção.**

O núcleo crítico de atendimento foi significativamente fortalecido, mas sem:

- E2E multi-tenant rodando com banco de teste funcional;
- auditoria final dos módulos restantes sem `EmpresaGuard`;
- checklist de RLS confirmado em banco;

não é seguro afirmar que o sistema está 100% pronto para produção multi-tenant.

## 6. Próximos passos recomendados (P0)

1. Corrigir credenciais/config do banco de testes E2E e executar suíte multi-tenant completa.
2. Fechar auditoria dos controllers fora de `atendimento` sem `EmpresaGuard`.
3. Rodar checklist SQL de cobertura RLS em todas as tabelas com `empresa_id` e anexar evidências.
4. Repetir build + smoke tests frontend/backend + E2E e emitir decisão final Go/No-Go.

## 7. Atualizacao tecnica (16/02/2026 - etapa seguinte)

### 7.1 E2E legado atualizado

- `backend/test/isolamento-multi-tenant.e2e-spec.ts` foi atualizado para contrato atual de login/response.
- O bloqueio inicial por setup legado (`users.perfil`, hash dummy e payload antigo) foi removido.

### 7.2 Novos bloqueadores encontrados

1. **Falha estrutural em autenticacao JWT no runtime E2E**
- Login passou a funcionar, mas validacao de token em requests autenticadas estoura erro interno do TypeORM.
- Erro observado: `Cannot read properties of undefined (reading 'length')` em `SelectQueryBuilder.executeEntitiesAndRawResults`.
- Impacto: endpoints protegidos retornam `500`, inviabilizando validacao multi-tenant.

2. **Drift entre entity e schema em clientes**
- Entity estava apontando `cpf_cnpj`, enquanto o banco de teste possui coluna `documento`.
- Isso gera SQL incompat�vel em operacoes de cliente e agrava instabilidade dos E2E.

3. **Dependencia de funcao SQL `set_current_tenant` ausente no banco de teste**
- Foi aplicado ajuste para usar `set_config('app.current_tenant_id', ...)` no patcher/middleware.
- Mesmo assim, o ambiente de banco continuou degradando durante execucoes repetidas.

4. **Infra de banco de teste degradada**
- Multiplas sessoes PostgreSQL ficaram presas por longos periodos.
- Apos intervencao para limpeza, o PostgreSQL de teste em `localhost:5434` ficou indisponivel.
- O servico `com.docker.service` permaneceu parado no contexto atual.

### 7.3 Decisao permanece

- **Status continua NO-GO para producao.**
- Alem dos riscos anteriores, ha bloqueio de infraestrutura de teste e erros internos em fluxo autenticado que impedem evidencia E2E confiavel.

## 7.4 Atualizacao tecnica (16/02/2026 - apos restart dos containers)

### 7.4.1 Ambiente de teste recuperado

- Containers de banco/cache foram reiniciados e voltaram a responder.
- Conexao em `conectcrm_test` (Postgres `localhost:5434`) foi revalidada antes dos testes.

### 7.4.2 Correcao aplicada em propostas (isolamento por tenant)

Arquivos alterados:
- `backend/src/modules/propostas/propostas.controller.ts`
- `backend/src/modules/propostas/propostas.service.ts`

Ajustes realizados:
- Rotas autenticadas de propostas passaram a receber `empresa_id` via `@EmpresaId()`.
- Service de propostas passou a filtrar por `empresaId` em:
  - listagem (`listarPropostas`)
  - busca por id (`obterProposta`)
  - alteracao de status (`atualizarStatus` / `atualizarStatusComValidacao`)
  - remocao (`removerProposta`)
  - operacoes auxiliares (`marcarComoVisualizada`, `registrarEnvioEmail`, `marcarComoEnviada`)
- Criacao de proposta passou a persistir `empresaId` da sessao autenticada.

### 7.4.3 Evidencia de testes (rodada atual)

1. `npm run type-check` -> OK
2. `test/isolamento-multi-tenant.e2e-spec.ts` -> **PASS (9/9)**
   - isolamento de `clientes` e `propostas` validado
3. `test/multi-tenancy.e2e-spec.ts` -> **FAIL (23 passed / 15 failed)**

Falhas remanescentes do suite amplo (nao relacionadas ao modulo `propostas`):
- `oportunidades`:
  - coluna ausente `data_fechamento_prevista`
  - coluna ausente `oportunidade.usuario_id`
- `produtos`:
  - conflito `409` na criacao
  - coluna ausente `Produto.codigo` na listagem
- `contratos`:
  - coluna ausente `Contrato__Contrato_assinaturas.empresa_id`
- `faturamento/pagamentos`:
  - fluxo de criacao/processamento retornando `400/404` no cenario esperado

### 7.4.4 Decisao de prontidao apos esta rodada

- **Status permanece NO-GO para producao.**
- Houve avanco real no isolamento de propostas, mas ainda existem bloqueadores estruturais de schema/contrato em modulos criticos (oportunidades, produtos, contratos, faturamento/pagamentos) que impedem declarar prontidao multi-tenant de ponta a ponta.

### 7.4.5 Build status complementar desta rodada

- `npm run build` (backend) -> OK
- `npm run build` (frontend-web) -> OK
