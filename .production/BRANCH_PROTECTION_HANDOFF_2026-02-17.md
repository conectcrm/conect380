# Branch Protection Handoff (conectcrm/conect380)

Data: 2026-02-18

## Contexto atual
- Repositorio remoto confirmado: `https://github.com/conectcrm/conect380.git`
- Branch remota existente: `main`
- Branch remota existente: `develop`
- Tentativa com token admin executada em `2026-02-18`
- Resultado GitHub API: `HTTP 403` com mensagem:
  - `Upgrade to GitHub Pro or make this repository public to enable this feature.`

## Acao necessaria (organizacao/repositorio)
1. Habilitar plano/condicao que permita branch protection no repositorio privado:
   - tornar o repositorio publico, ou
   - migrar para plano GitHub que permita branch protection em privado.
2. Depois, exportar token com permissao admin no repositorio:
```powershell
$env:GITHUB_TOKEN = "ghp_admin_token"
```
3. Aplicar branch protection em `main` e `develop`:
```powershell
.\.production\scripts\configure-branch-protection.ps1 `
  -Owner conectcrm `
  -Repo conect380 `
  -Branches @('main','develop') `
  -FailOnMissingBranch
```

## Pos-validacao
Executar readiness real da sessao:
```powershell
.\.production\scripts\assess-mvp-pilot-readiness.ps1 `
  -RunDir ".production\pilot-runs\20260217-174413-piloto-comercial-lote-1-full" `
  -BranchProtectionStatus Applied
```
