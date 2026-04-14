# GDN-213 - Evidencia de endurecimento do billing legado (Guardian)

## Data
- 2026-03-08

## Objetivo desta execucao
- Remover exposicao de aliases administrativos legados no bundle do cliente.
- Ajustar discovery de endpoint Guardian para fluxo MFA obrigatorio.
- Validar cadeia de checks operacionais e de seguranca apos as alteracoes.

## Alteracoes aplicadas
- `frontend-web/src/App.tsx`
  - Removidos aliases legados de rota admin no cliente (`/admin/*` e `/nuclei/administracao`).
  - Mantido relay explicito de operacao para `/sistema/backup` -> Guardian.
- `frontend-web/src/config/menuConfig.ts`
  - Removidas regras de permissao e aliases de navegacao para rotas admin legadas.
  - Adicionado bloqueio explicito de prefixos legados no cliente (`/admin` e equivalente de nucleo administrativo).
- `frontend-web/src/features/admin/system-branding/SystemBrandingPage.tsx`
  - Removida referencia de retorno para rota legada administrativa.
- `frontend-web/src/config/__tests__/menuConfig.permissions.test.ts`
  - Teste atualizado para garantir bloqueio dos aliases admin legados no cliente.
- `e2e/billing-admin-guardian-redirects.spec.ts`
  - Suite atualizada para validar lockdown de aliases admin no cliente.
  - Mantido teste de relay explicito para Guardian em `/sistema/backup`.
- `scripts/ci/guardian-endpoint-discovery-check.ps1`
  - Discovery passou a tratar `MFA_REQUIRED` com `dev_fallback` (`challengeId` + `devCode`) e validar endpoint apos `auth/mfa/verify`.

## Validacoes executadas
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-go-live-preflight-check.ps1`: PASS
  - Evidencia: `docs/features/evidencias/GDN501_GO_LIVE_PREFLIGHT_20260308-164914.md`
- GDN-511..GDN-516 (final acceptance checks): PASS
  - Evidencias geradas entre `20260308-164955` e `20260308-165100`
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-go-live-window-check.ps1`: PASS
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-hypercare-check.ps1`: PASS
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-pilot-cohort-readiness-check.ps1`: PASS
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-production-readiness-dryrun-check.ps1`: PASS
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-legacy-read-only-freeze-check.ps1`: PASS
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-legacy-decommission-phases-check.ps1`: PASS
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-post-golive-retro-check.ps1`: PASS
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-endpoint-discovery-check.ps1 -Email admin@conect360.com.br -Senha admin123`: PASS
  - Evidencia: `docs/features/evidencias/GUARDIAN_ENDPOINT_DISCOVERY_20260308-165603.md`
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-exposure-scan.ps1`: PASS
  - Resultado: sem exposicao de `/admin/empresas`, `/admin/sistema`, `/admin/branding`, `/nuclei/administracao` no bundle (revalidado apos ajuste final de string legado).
- `npm run test:e2e:billing:critical` com `TEST_E2E_AUTH_MODE=mock`: PASS (7 testes)

## Observacoes
- Tentativa de disparo remoto do workflow `CI - Testes e Build` via `gh workflow run` bloqueada porque o workflow ainda nao possui `workflow_dispatch` no branch remoto.
- O ajuste local para `workflow_dispatch` foi aplicado em `.github/workflows/ci.yml`, mas requer push para habilitar disparo manual remoto.

## Conclusao da etapa
- Endurecimento do billing legado no cliente concluido com sucesso.
- Cadeia local de validacoes operacionais/suporte/go-live e seguranca executada e aprovada.
