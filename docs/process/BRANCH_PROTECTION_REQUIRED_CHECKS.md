# Branch Protection - Required Checks

## Objetivo

Garantir que PR com violacao de arquitetura, template incompleto ou regressao de negocio nunca seja mergeado.

## Regra recomendada para `main` e `develop`

No GitHub, em `Settings -> Branches -> Branch protection rules`, configure:

1. `Require a pull request before merging`: **enabled**
2. `Require approvals`: **enabled** (minimo 1)
3. `Require status checks to pass before merging`: **enabled**
4. `Require branches to be up to date before merging`: **enabled**
5. `Require conversation resolution before merging`: **enabled**
6. `Do not allow bypassing the above settings`: **enabled**

## Required status checks (minimo)

Marque os checks abaixo como obrigatorios:

1. `CI - Testes e Build / Status Final do CI`
2. `PR Template Guardrails / PR Template Guardrails`

## Importante

O check `Status Final do CI` agora inclui:

- guardrails de encoding;
- guardrails de release flags;
- **guardrails de arquitetura** (`validate:architecture`);
- suites de backend/frontend/e2e ja existentes.

Ou seja, ao exigir `Status Final do CI`, a arquitetura tambem vira bloqueio de merge.

## Verificacao rapida apos configurar

1. Abra um PR de teste com mudanca pequena.
2. Confirme que os checks obrigatorios aparecem como `Required`.
3. Confirme que o merge fica bloqueado enquanto algum check estiver `pending` ou `failed`.

## Automacao opcional via script

Com `GITHUB_TOKEN` configurado (token com permissao admin no repo), voce pode aplicar a regra via script:

```bash
# dry-run via npm (owner repo branch approvals dryrun)
npm run branch:protection:required-checks -- <org-ou-user> <repo> main 1 dryrun

# aplicar de fato
npm run branch:protection:required-checks -- <org-ou-user> <repo> main

# aplicar incluindo administradores (enforce admins)
npm run branch:protection:required-checks -- <org-ou-user> <repo> main 1 enforceadmins
```

Script: `scripts/git/configure-branch-protection-required-checks.ps1`

Opcao com parametros nomeados (PowerShell direto):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/git/configure-branch-protection-required-checks.ps1 `
  -Owner <org-ou-user> -Repo <repo> -Branch main -DryRun
```

## Pre-requisito de plano (importante)

Se o repositorio for privado e a API retornar:

`Upgrade to GitHub Pro or make this repository public to enable this feature`

entao o bloqueio e de plano/licenciamento da conta/organizacao (nao de token).
Nesse caso, para habilitar branch protection sera necessario:

1. Upgrade para GitHub Pro/Team/Enterprise, ou
2. Tornar o repositorio publico.
