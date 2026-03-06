# Guia de Sincronizacao Segura do Repositorio

## Objetivo
Evitar regressao de telas e reintroducao de implementacoes antigas durante sincronizacao com `origin/main`.

## Causa raiz observada (incidente de 2026-03-06)
1. Branch funcional ficou defasada em relacao a `origin/main`.
2. Foi tentado `merge` direto com alta sobreposicao de arquivos.
3. A resolucao de conflitos misturou blocos de versoes diferentes de UI.
4. Resultado: telas com visual antigo reapareceram parcialmente.

## Regras obrigatorias
1. Nao usar `git pull` sem auditoria.
2. Nao usar `git merge origin/main` em branch de feature longa.
3. Sempre auditar risco antes de sincronizar.
4. Sincronizar por `rebase`, nunca por merge de manutencao.

## Fluxo padrao
### 1) Aplicar hardening local (uma vez por maquina/repo)
```bash
npm run sync:harden
```

### 2) Auditar branch antes de sincronizar
```bash
npm run sync:audit
```

O relatorio mostra:
- `ahead` / `behind`
- quantidade de arquivos alterados na branch e na base
- `overlap_count` (arquivos alterados em ambos os lados)
- classificacao de risco (`LOW`, `MEDIUM`, `HIGH`)

### 3) Sincronizar somente quando seguro
```bash
npm run sync:apply
```

Se o risco for `HIGH`, o script bloqueia por padrao.

## Procedimento para branch com risco HIGH
Nao forcar merge/rebase cego.

Passos:
1. Criar branch limpa a partir de `origin/main`.
2. Reaplicar apenas commits necessarios (cherry-pick seletivo).
3. Resolver conflitos preservando arquitetura atual e router atual.
4. Rodar validacoes (`type-check`, `build`, smoke de tela).
5. Atualizar PR.

## Comandos proibidos (sem auditoria previa)
```bash
git pull
git merge origin/main
```

## Comandos permitidos
```bash
git fetch origin
npm run sync:audit
npm run sync:apply
```

## Saude das branches (rotina semanal)
Gerar status de saude local/remoto:
```bash
npm run branch:health:prune
npm run branch:remote-health:prune
```

Criticos comuns:
- `UPSTREAM_GONE`: branch local aponta para remoto removido.
- `BehindMain` muito alto: branch defasada com risco de conflito massivo.
- `AgeDays` alto: branch stale com alto risco de regressao na reconciliacao.
- `DELETE_SAFE`: branch remota sem branch local e sem diferenca util contra a `main`.
- `REVIEW`: branch remota com commits proprios ainda fora da `main`.

Acao recomendada para branch critica:
1. Nao fazer merge direto.
2. Criar branch limpa de `origin/main`.
3. Reaplicar somente commits necessarios.
4. Validar router/menu/telas antes de push.

## Higiene remota (rotina semanal)
1. Rodar `npm run branch:remote-health:prune`.
2. Remover primeiro tudo que vier como `DELETE_SAFE`.
3. Revisar itens `REVIEW` olhando PR, branch local associada e utilidade funcional.
4. Nao deletar `dependabot/*` sem checar se o PR correspondente esta aberto ou fechado.

## Checklist rapido antes de push
1. Router principal sem rotas de exemplo/legado reintroduzidas.
2. Sidebar/menu sem links para telas antigas.
3. `npm run type-check` do frontend.
4. `npm run build` do backend.
5. PR com diff coerente e sem arquivos regressivos.
