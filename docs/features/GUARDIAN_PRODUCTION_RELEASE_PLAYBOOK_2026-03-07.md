# Guardian Production Release Playbook

## Data
- 2026-03-07

## Objetivo
- Executar validacao consolidada de readiness em homologacao/producao sem depender de execucoes manuais isoladas.

## Script consolidado
- `scripts/release/guardian-production-readiness.ps1`

## Modos de execucao
- `dry-run`:
  - valida o pipeline consolidado sem depender de credenciais reais.
- `real`:
  - executa os fluxos de smoke/financeiro com autenticacao real.
  - exige `-Token` ou `-Email/-Senha`.

## Comandos
- Dry-run consolidado:
  - `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-production-readiness-dryrun-check.ps1`
- Real mode com token:
  - `powershell -ExecutionPolicy Bypass -File scripts/release/guardian-production-readiness.ps1 -Mode real -BaseUrl https://api.seu-dominio -Token <jwt_superadmin> -TargetEmpresaId <empresa_uuid>`
- Real mode com email/senha:
  - `powershell -ExecutionPolicy Bypass -File scripts/release/guardian-production-readiness.ps1 -Mode real -BaseUrl https://api.seu-dominio -Email <email_admin> -Senha <senha_admin> -TargetEmpresaId <empresa_uuid>`

## Escopo consolidado
- GDN-506 daily smoke
- GDN-507 daily financial consistency
- GDN-508 critical audit checks
- GDN-509 rollback simulation
- GDN-511 final acceptance entitlement
- GDN-512 final acceptance guardian isolation
- GDN-513 final acceptance webhook reliability
- GDN-514 final acceptance e2e critical suite
- GDN-515 final acceptance runbook readiness
- GDN-516 final acceptance legacy decommission

## Saida esperada
- Relatorio versionado em `docs/features/evidencias/` com status agregado `PASS/FAIL`.
- Em caso de falha, o relatorio indica o step e o output bruto para troubleshooting.
