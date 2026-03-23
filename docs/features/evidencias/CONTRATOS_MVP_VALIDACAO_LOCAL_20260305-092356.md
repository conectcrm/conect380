# Evidencia - Contratos MVP (validacao local) - 2026-03-05 09:23:56

## Objetivo

Confirmar que a etapa de fechamento via contratos esta operacional no pacote MVP local.

## Validacoes executadas

1. Backend E2E de contratos:

```bash
npm --prefix backend run test:e2e -- ./propostas/contratos-fluxo.e2e-spec.ts
```

Resultado: PASS (3/3)
- fluxo de contrato com PDF e assinatura publica;
- validacao de token expirado na assinatura publica;
- bloqueio de criacao de contrato com proposta nao aprovada.

2. Frontend escopo MVP para rota de contratos:

```powershell
$env:CI='true'; npm --prefix frontend-web test -- --runTestsByPath src/config/__tests__/mvpScope.test.ts --runInBand --watch=false
```

Resultado: PASS (4/4)
- confirma `getMvpBlockedRouteInfo('/contratos/123') === null` com `REACT_APP_MVP_MODE=true`.

## Conclusao

- Contratos estao cobertos e validados no ambiente local (API + regra de roteamento MVP).
- Pendencia remanescente de contratos: apenas evidencia operacional no ambiente alvo (homolog/producao), conforme checklist de smoke manual.
