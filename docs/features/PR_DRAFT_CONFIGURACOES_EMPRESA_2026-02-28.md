# PR Draft - Configuracoes da Empresa

## Titulo sugerido
feat(empresas): finalizar configuracoes da empresa (backend + frontend + cobertura e2e)

## Contexto
A tela de Configuracoes da Empresa tinha partes funcionais e partes incompletas, com mocks no frontend e lacunas no backend.
Tambem havia risco de permissao no endpoint `PUT /empresas/:id`.

## Objetivo
- Fechar os fluxos de configuracao da empresa ponta a ponta.
- Alinhar contrato frontend/backend.
- Garantir controle de permissao consistente com a tela.
- Cobrir cenarios criticos com e2e.

## Commits desta entrega
- `39e23c9` feat(empresas): concluir backend de configuracoes da empresa
- `afb08b4` feat(frontend): finalizar tela de configuracoes da empresa
- `7cd773b` docs(empresas): adicionar checklist de homologacao da tela

## O que mudou

### Backend
- Expandido `UpdateEmpresaConfigDto` com campos faltantes da tela.
- Ajustado `logoUrl` para aceitar string/base64.
- Adicionado DTO para teste SMTP.
- Implementado teste SMTP real (`nodemailer`) com validacao.
- Implementado backup de snapshot e historico de backups.
- Expandido reset para defaults em todos os blocos relevantes.
- Ajustado parsing/persistencia de `ipWhitelist`.
- Endpoints adicionados:
- `POST /empresas/config/smtp/test`
- `POST /empresas/config/backup/execute`
- `GET /empresas/config/backup/history`
- Endurecida autorizacao de `PUT /empresas/:id`:
- `JwtAuthGuard + RolesGuard + PermissionsGuard`
- Roles: `superadmin`, `admin`
- Permission: `config.empresa.update`

### Frontend
- Corrigido unwrap da resposta de `PUT /empresas/:id` (`data.data` vs `data`).
- Atualizado `empresaConfigService` com tipos/metodos novos:
- `testSMTP`
- `executeBackup`
- `getBackupHistory`
- Tela `ConfiguracaoEmpresaPage` conectada com APIs reais:
- remove mocks de SMTP/backup
- card de ultimo backup dinamico
- historico funcional
- bloqueio de escrita por permissao (`somente leitura`)
- estados disabled coerentes em botoes/acoes

### Testes
- Novo e2e dedicado:
- `backend/test/empresas/configuracao-empresa.e2e-spec.ts`
- Cobre:
- leitura para gerente
- update para admin
- bloqueio de escrita para gerente
- erro de validacao SMTP sem campos obrigatorios
- backup + historico

### Documentacao
- Checklist manual de homologacao da tela:
- `docs/features/CHECKLIST_HOMOLOGACAO_CONFIGURACOES_EMPRESA_2026-02-28.md`

## Validacao executada
- Backend:
- `npm run -s type-check`
- `npm run -s build`
- `npm run -s test:e2e` (15/15 suites, 169 testes passados)
- Frontend:
- `npm run -s type-check`
- `npm run -s build`

## Risco e impacto
- Baixo para medio.
- Impacto principal em `empresas/config` e no controle de permissao de update da empresa.
- Mudanca de seguranca intencional: usuarios sem role/permissao adequadas passam a receber `403` em `PUT /empresas/:id`.

## Rollout sugerido
1. Deploy backend.
2. Deploy frontend.
3. Executar checklist manual de homologacao.
4. Monitorar logs de `403` em `PUT /empresas/:id` e erros de SMTP/backup.

## Rollback
- Reverter commits:
- `7cd773b`
- `afb08b4`
- `39e23c9`

## Notas
- O repositorio possui outras alteracoes nao relacionadas no workspace.
- Esta PR deve conter somente os commits acima.
