# Branch Protection

Este guia cobre 2 caminhos:
- automatizado via API GitHub (`configure-branch-protection.ps1`)
- manual pela UI do GitHub

## 1) Modo automatizado (recomendado)

Script:
- `.production/scripts/configure-branch-protection.ps1`

### Pre-requisitos
- Token com permissao de administracao no repositorio (`admin=true`)
- Variavel de ambiente `GITHUB_TOKEN` definida
- Branch alvo existente no repositorio remoto

Exemplo PowerShell:
```powershell
$env:GITHUB_TOKEN = "ghp_xxx"
.\.production\scripts\configure-branch-protection.ps1 `
  -Owner conectcrm `
  -Repo conect380
```

Teste sem alterar nada:
```powershell
.\.production\scripts\configure-branch-protection.ps1 -DryRun
```

Aplicar somente em `main` (quando `develop` ainda nao existe):
```powershell
.\.production\scripts\configure-branch-protection.ps1 `
  -Owner conectcrm `
  -Repo conect380 `
  -Branches main
```

Modo estrito para falhar se qualquer branch alvo estiver ausente:
```powershell
.\.production\scripts\configure-branch-protection.ps1 `
  -Owner conectcrm `
  -Repo conect380 `
  -FailOnMissingBranch
```

## 2) Regras aplicadas

- Pull request obrigatorio para merge
- Minimo de 1 aprovacao
- Dismiss stale reviews
- Conversation resolution obrigatoria
- Branches atualizadas antes de merge (`strict=true` em status checks)
- Force push bloqueado
- Delete de branch bloqueado
- Admins tambem obrigados a seguir as regras

## 3) Status checks obrigatorios

- `PR Template Guardrails`
- `Multi-tenant Guardrails`
- `Lint Budget Guardrails`
- `Backend - Testes e Build`
- `Frontend - Testes e Build`
- `Status Final do CI`

## 4) Fallback manual (UI GitHub)

Se nao for possivel usar token/API:

1. Abra `https://github.com/conectcrm/conect380/settings/branches`
2. Configure regras para `main` e `develop`
3. Marque os checks obrigatorios listados acima

## 5) Erro comum de plano (HTTP 403)

Se a API retornar:
- `Upgrade to GitHub Pro or make this repository public to enable this feature.`

Significa que o plano/repositorio atual nao permite branch protection via endpoint para este caso.

Acoes:
1. Tornar o repositorio publico, ou migrar para plano que permita branch protection em privado.
2. Reexecutar `configure-branch-protection.ps1`.

## Observacao

Se nome de workflow/check mudar, atualize a lista de checks obrigatorios neste arquivo e no script.
Se o script retornar `admin=False`, a aplicacao deve ser executada por um maintainer/admin do repositorio.


