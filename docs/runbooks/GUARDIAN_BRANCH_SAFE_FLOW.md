# Fluxo Seguro de Branches do Guardian

## Problema

A branch `chore/mvp-effective-change-gate-20260218` nao e uma branch curta baseada em `main`.
Ela funciona como branch de integracao e deriva de uma linha mais antiga/sincronizada com `develop`.

Quando alguem tenta:

1. criar branch limpa a partir de `origin/main`
2. fazer `switch`/`checkout` no mesmo workspace que executa o sistema
3. extrair PR no mesmo diretorio ativo

o checkout local pode parecer "voltar versao" em partes do sistema.

## Regra operacional

1. O workspace principal `c:\Projetos\conect360` deve permanecer na branch ativa do sistema.
2. Nao usar esse mesmo diretorio para extracao de PR baseada em `main`.
3. Toda extracao limpa deve acontecer em `git worktree` separado.

## Script padrao

Use:

```powershell
powershell -File .\scripts\git\new-isolated-worktree.ps1 -BranchName feat\guardian-ajuste-x
```

Exemplo com nome valido para Git:

```powershell
powershell -File .\scripts\git\new-isolated-worktree.ps1 -BranchName feat/guardian-runtime-governance-clean
```

## Resultado esperado

O script cria um diretorio separado, derivado de `origin/main`, sem tocar no checkout principal.

## Regra para agentes

Se o objetivo for:

1. abrir PR limpo
2. cherry-pickar commits sobre `main`
3. comparar escopo contra `main`

entao a operacao deve ser feita no worktree isolado, nunca no workspace principal.
