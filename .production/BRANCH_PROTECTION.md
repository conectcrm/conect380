# Branch Protection

Este guia cobre 2 caminhos:
- automatizado via API GitHub (`configure-branch-protection.ps1`)
- manual pela UI do GitHub

## 1) Modo automatizado (recomendado)

Script:
- `.production/scripts/configure-branch-protection.ps1`

### Pre-requisitos
- Token com permissao de administracao no repositorio
- Variavel de ambiente `GITHUB_TOKEN` definida

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

## Observacao

Se nome de workflow/check mudar, atualize a lista de checks obrigatorios neste arquivo e no script.


