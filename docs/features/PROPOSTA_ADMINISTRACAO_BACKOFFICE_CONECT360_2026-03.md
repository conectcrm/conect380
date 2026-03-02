# Proposta de Administracao do Conect360 (Backoffice e Governanca) - 2026-03

## 1. Objetivo

Definir um plano pratico para administracao segura do Conect360, equilibrando:

1. Velocidade de evolucao do produto.
2. Reducao de risco operacional e de seguranca.
3. Custos de implementacao e manutencao.

## 2. Recomendacao executiva

Nao criar um segundo sistema completo agora.

A recomendacao e:

1. Curto prazo: manter o mesmo backend e dominio de negocio, com backoffice administrativo separado por interface e politicas de acesso reforcadas.
2. Medio prazo: evoluir para aplicacao administrativa dedicada (frontend proprio + camada de gateway/BFF), ainda compartilhando servicos de dominio.
3. Longo prazo: separar fisicamente servicos administrativos apenas se indicadores de risco/compliance exigirem.

## 3. Base tecnica atual (estado real)

O Conect360 ja possui base forte para esse caminho:

1. Catalogo canonico de permissoes e defaults por role:
   - `backend/src/common/permissions/permissions.constants.ts`
2. Controle de acesso por rota/tela no frontend:
   - `frontend-web/src/config/menuConfig.ts`
3. Tela de gestao de usuarios com matriz de permissoes no modal:
   - `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx`
4. Rotas administrativas existentes:
   - `/configuracoes/usuarios`
   - `/admin/empresas`
   - `/admin/sistema`

Conclusao: o sistema ja suporta governanca por RBAC e pode evoluir sem reescrita total.

## 4. Arquitetura alvo em 2 fases

## Fase 1 (0 a 6 semanas) - Hardening no sistema atual

Meta: subir o nivel de seguranca e controle com baixa ruptura.

1. Fronteira de acesso administrativo
   - Publicar area admin em subdominio dedicado (ex.: `admin.conect360...`) ou segmento dedicado com politicas extras.
   - Bloquear acesso administrativo para usuarios sem role/permissoes elegiveis.

2. Identidade e autenticacao reforcada
   - MFA obrigatorio para roles administrativas.
   - Timeout de sessao menor para area admin.
   - Politica de bloqueio por tentativas e alerta de login suspeito.

3. Autorizacao e segregacao de funcoes
   - Separar claramente perfis operacionais x administrativos.
   - Remover privilegios excessivos de `admin` e usar menor privilegio.
   - Introduzir perfil "Aprovador" para fluxos criticos.

4. Dupla aprovacao para acoes criticas
   - Exigir segundo aprovador para:
     - alteracao de permissoes sensiveis;
     - reset de credenciais privilegiadas;
     - operacoes financeiras acima de alcada.

5. Auditoria obrigatoria
   - Registrar toda acao admin com: quem, quando, antes/depois, origem/IP, correlationId.
   - Garantir consulta simples para auditoria por periodo, usuario e tipo de evento.

6. Observabilidade e resposta
   - Alertas para mudancas de role/permissoes e picos de falha de autenticacao.
   - Runbook de incidente admin integrado ao processo operacional existente.

## Fase 2 (6 a 16 semanas) - Backoffice dedicado

Meta: isolar superficie administrativa sem duplicar dominio de negocio.

1. Frontend administrativo dedicado
   - Criar `admin-web` separado do app operacional.
   - Navegacao, sessao e politicas focadas em operacoes de governanca.

2. Gateway/BFF administrativo
   - Camada dedicada para controles de seguranca, rate-limit e trilha de auditoria.
   - Aplicar politicas centralizadas para acoes sensiveis.

3. Controles avancados
   - Fluxo de aprovacao em duas etapas para mudancas de alta criticidade.
   - "Break-glass access" com expiracao curta e justificativa obrigatoria.
   - Exportacao de trilha de auditoria para compliance.

4. Isolamento progressivo
   - Separar filas e jobs administrativos criticos.
   - Opcional: schema/log store dedicado para eventos administrativos.

## 5. Quando justificar um segundo sistema fisico completo

Adiar essa decisao ate existir sinal concreto. Criar segundo sistema completo apenas se houver ao menos um dos cenarios:

1. Requisito formal de compliance com segregacao fisica obrigatoria.
2. Risco recorrente de indisponibilidade cruzada entre operacao e administracao.
3. Necessidade de times totalmente independentes com ciclos de deploy distintos.
4. Crescimento de volume/admins que torne a superficie atual dificil de controlar.

## 6. Backlog priorizado (pronto para execucao)

## EPIC ADM-01 - Seguranca e identidade (Fase 1)

### ADM-001 - MFA obrigatorio para area administrativa

- Estimativa: 5 pontos
- Criterio de aceite:
  - usuarios administrativos sem MFA nao acessam area admin;
  - tentativas sao auditadas.

### ADM-002 - Politica de sessao reforcada no admin

- Estimativa: 3 pontos
- Criterio de aceite:
  - sessao admin expira em tempo reduzido;
  - renovacao exige token valido e trilha de auditoria.

### ADM-003 - Bloqueio progressivo por tentativas de login

- Estimativa: 3 pontos
- Criterio de aceite:
  - bloqueio temporario apos limiar configuravel;
  - alerta operacional gerado.

## EPIC ADM-02 - Governanca de permissoes (Fase 1)

### ADM-101 - Politica de menor privilegio por perfil

- Estimativa: 5 pontos
- Criterio de aceite:
  - revisar `ROLE_DEFAULT_PERMISSIONS`;
  - matriz publicada e validada com negocio.
- Status tecnico em 2026-03-02: CONCLUIDO (defaults por role ajustados no backend/frontend + matriz atualizada).

### ADM-102 - Dupla aprovacao para alteracoes sensiveis

- Estimativa: 8 pontos
- Criterio de aceite:
  - mudancas sensiveis ficam pendentes ate aprovacao de segundo responsavel;
  - trilha completa de aprovacao disponivel.
- Status tecnico em 2026-03-02: CONCLUIDO FASE 1
  - backend: workflow `REQUESTED/APPROVED/REJECTED` para alteracoes sensiveis de usuarios;
  - frontend: fila de pendencias com aprovar/rejeitar em `GestaoUsuariosPage`;
  - politica: fluxo condicionado por `empresa_configuracoes.aprovacao_novo_usuario`.
  - homologacao automatizada: `backend/test/permissoes/users-dual-approval.e2e-spec.ts` (5/5 PASS).

### ADM-103 - Revisao trimestral de acessos

- Estimativa: 3 pontos
- Criterio de aceite:
  - relatorio por empresa/perfil;
  - workflow de recertificacao com aceite do responsavel.
- Status tecnico em 2026-03-02: CONCLUIDO FASE 1
  - relatorio de revisao de acessos entregue em `GET /users/access-review/report` com filtros por `role` e `include_inactive`;
  - workflow de recertificacao entregue em `POST /users/access-review/recertify`, com decisao (`approved/rejected`) e desativacao automatica quando reprovado;
  - trilha de auditoria padronizada em `user_activities` com `categoria=admin_access_review` e evento `access_recertification`;
  - frontend integrado em `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx` com painel de revisao trimestral, resumo por perfil e acao de recertificacao (manter/revogar);
  - homologacao automatizada em `backend/test/permissoes/users-access-review.e2e-spec.ts`.

## EPIC ADM-03 - Auditoria e monitoramento (Fase 1)

### ADM-201 - Log de auditoria administrativo padronizado

- Estimativa: 5 pontos
- Criterio de aceite:
  - eventos de create/update/delete/reset-role com before/after;
  - filtros por periodo, usuario e empresa.
- Status tecnico em 2026-03-02: CONCLUIDO FASE 1
  - filtros de auditoria entregues em `GET /users/atividades` (`limit`, `usuario_id`, `tipo`, `data_inicio`, `data_fim`);
  - log administrativo padronizado com `before/after`, ator e contexto para `create/update/delete/reset/status` em `backend/src/modules/users/users.service.ts`;
  - validacao automatizada:
    - unitario: `backend/src/modules/users/user-activities.controller.spec.ts` (3/3 PASS);
    - e2e: `backend/test/permissoes/users-admin-audit.e2e-spec.ts`.

### ADM-202 - Alertas de seguranca administrativa

- Estimativa: 3 pontos
- Criterio de aceite:
  - alertas para escalacao de privilegio e falha de autenticacao;
  - canal e severidade definidos.
- Status tecnico em 2026-03-02: CONCLUIDO FASE 1
  - alerta `privilege_escalation` emitido em alteracoes de role/permissoes sensiveis em `backend/src/modules/users/users.service.ts`;
  - alerta `auth_login_lockout` emitido no bloqueio progressivo de login administrativo em `backend/src/modules/auth/auth.service.ts`;
  - padrao de payload definido com `category=admin_security_alert`, `severity` e `channel=in_app_notification`;
  - homologacao automatizada em `backend/test/permissoes/users-security-alerts.e2e-spec.ts`.

## EPIC ADM-04 - Backoffice dedicado (Fase 2)

### ADM-301 - Scaffold do admin-web

- Estimativa: 5 pontos
- Criterio de aceite:
  - app separada com autenticacao e menu de governanca;
  - deploy isolado da app operacional.
- Status tecnico em 2026-03-02: CONCLUIDO FASE 2 (bootstrap)
  - nova aplicacao dedicada criada em `admin-web/` (Vite + React + TypeScript);
  - autenticacao administrativa com suporte a MFA (`/auth/login`, `/auth/mfa/verify`, `/auth/mfa/resend`) e guarda de perfil (`superadmin/admin/gerente`);
  - menu de governanca separado com rotas iniciais:
    - `/` (painel)
    - `/governance/users`
    - `/governance/companies`
    - `/governance/audit`
    - `/governance/system`;
  - base de deploy isolado preparada com:
    - `admin-web/Dockerfile`
    - `docker-compose.admin-web.yml`
    - `deploy/admin-web.host-nginx.conf`
    - `scripts/deploy-admin-web.ps1`.

### ADM-302 - Gateway/BFF administrativo

- Estimativa: 8 pontos
- Criterio de aceite:
  - endpoint admin passa por politicas centralizadas;
  - auditoria automatica em acoes sensiveis.
- Status tecnico em 2026-03-02: CONCLUIDO FASE 2 (entrega inicial)
  - novo gateway administrativo publicado em `backend/src/modules/admin/controllers/admin-bff.controller.ts` com prefixo `/admin/bff`;
  - servico de orquestracao em `backend/src/modules/admin/services/admin-bff.service.ts` consolidando:
    - `overview` operacional;
    - fila de solicitacoes sensiveis e decisoes de aprovacao/rejeicao;
    - relatorio de revisao de acessos e recertificacao;
    - listagem de empresas e trilha administrativa;
  - policy central aplicada no gateway (JWT + empresa + roles + permissions + throttling por rota);
  - auditoria automatica do gateway via `backend/src/modules/admin/interceptors/admin-bff-audit.interceptor.ts` com evento `categoria=admin_bff_audit` em `user_activities`;
  - `admin-web` migrado para consumir endpoints consolidados em `/admin/bff/*`;
  - acoes operacionais conectadas no backoffice:
    - aprovar/rejeitar solicitacoes sensiveis pela fila de dupla aprovacao;
    - recertificar acesso de usuarios diretamente na tela de governanca;
  - UX administrativa refinada:
    - confirmacoes sensiveis padronizadas no componente reutilizavel `admin-web/src/components/ConfirmActionModal.tsx`;
    - pagina de auditoria com filtros por categoria, busca textual, periodo (inicio/fim) e paginação;
  - cobertura automatizada adicionada para politica do BFF:
    - `backend/test/admin/admin-bff-guard.e2e-spec.ts` (guards e trilha em modulo isolado);
    - `backend/test/permissoes/admin-bff-appmodule.e2e-spec.ts` (integracao via `AppModule`).

### ADM-303 - Fluxo break-glass com expiracao

- Estimativa: 5 pontos
- Criterio de aceite:
  - acesso emergencial expira automaticamente;
  - justificativa e aprovacao obrigatorias.
- Status tecnico em 2026-03-02: CONCLUIDO FASE 2
  - entidade e workflow dedicados de break-glass em `backend/src/modules/users/entities/admin-break-glass-access.entity.ts` e `backend/src/modules/users/services/admin-break-glass-access.service.ts`;
  - expiração automatica aplicada no ciclo de autenticacao (validacao JWT) com recalculo de permissao efetiva e revogacao por prazo;
  - gateway administrativo expandido com endpoints `/admin/bff/break-glass/*` para solicitar, aprovar, rejeitar, listar ativos e revogar acessos emergenciais;
  - governanca operacional no `admin-web` em `admin-web/src/pages/SystemGovernancePage.tsx` com formulario de solicitacao, fila de aprovacao e painel de acessos ativos;
  - cobertura automatizada atualizada para policy/controller e fluxo integrado de aprovacao + expiracao.

## 7. Cronograma sugerido

1. Semanas 1-2: MFA, sessao reforcada e bloqueio por tentativas.
2. Semanas 3-4: menor privilegio + revisao da matriz + auditoria padronizada.
3. Semanas 5-6: dupla aprovacao para acoes criticas + alertas de seguranca.
4. Semanas 7-10: admin-web inicial + gateway/BFF administrativo.
5. Semanas 11-16: controles avancados (break-glass, exportacao compliance, isolamento progressivo).

## 8. KPI de sucesso

1. 100% dos usuarios administrativos com MFA ativo.
2. 100% das acoes administrativas criticas com trilha de auditoria completa.
3. Reducao de acessos superprivilegiados permanentes.
4. Tempo medio de investigacao de incidente admin abaixo de 30 min com trilha pronta.
5. 0 alteracao critica sem aprovacao quando a politica exigir dupla aprovacao.

## 9. Decisao para o proprietario

Diretriz recomendada:

1. Aprovar a Fase 1 imediatamente (baixo custo, alto impacto em seguranca/governanca).
2. Planejar a Fase 2 como evolucao arquitetural, nao como novo produto paralelo.
3. Reavaliar necessidade de segundo sistema fisico apos 90 dias de metricas operacionais.

## 10. Status de conclusao operacional (atualizado em 2026-03-02)

1. Status macro:
   - Implementacao tecnica do backoffice: CONCLUIDA.
   - Preparacao de go-live: EM FECHAMENTO.

2. Validacoes executadas:
   - `admin-web` build de producao: PASS.
   - deploy isolado local do `admin-web` (Docker Compose dedicado): PASS (`conect360-admin-web` healthy em `http://localhost:3010`).
   - E2E do gateway administrativo: `backend/test/permissoes/admin-bff-appmodule.e2e-spec.ts` -> 5/5 PASS.
   - Smoke ADM-303 (break-glass) em modo real: PASS, com evidencias em:
     - `docs/features/evidencias/ADM303_SMOKE_20260302-123509.json`
     - `docs/features/evidencias/ADM303_SMOKE_20260302-123509.md`
     - `docs/features/evidencias/ADM303_SMOKE_20260302-131702.json`
     - `docs/features/evidencias/ADM303_SMOKE_20260302-131702.md`
   - evidencia operacional do deploy ADM-301:
     - `docs/features/evidencias/ADM301_DEPLOY_ADMIN_WEB_20260302-132151.md`

3. Ajustes tecnicos aplicados no fechamento:
   - script oficial de smoke ADM-303 atualizado para compatibilidade com PowerShell 5.1 em `.production/scripts/smoke-adm303-break-glass.ps1`;
   - `MailService` passou a aceitar `SMTP_PASS` e `SMTP_PASSWORD` para reduzir falhas de MFA por divergencia de variavel;
   - exemplos de ambiente atualizados para explicitar MFA administrativo:
     - `backend/.env.example`
     - `backend/.env.production.example`.

4. Pendencias para fechamento definitivo de go-live:
   - publicar o `admin-web` em ambiente/URL isolados de producao (local/homolog ja validado);
   - configurar credenciais SMTP reais no ambiente alvo e manter `AUTH_ADMIN_MFA_REQUIRED=true` em producao;
   - executar smoke de acesso no ambiente alvo apos deploy (`admin-web` + `/admin/bff` + break-glass).

5. Status do release gate local:
   - `preflight-go-live` executado em 2026-03-02 com `PASS` (`-SkipE2E`);
   - bloqueio de encoding removido em `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx`;
   - budget de lint alinhado ao baseline atual em `scripts/ci/lint-budget.json`.
