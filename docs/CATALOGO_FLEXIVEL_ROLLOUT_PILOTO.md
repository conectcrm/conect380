# Catalogo Flexivel - Rollout Piloto

## Objetivo

Ativar o catalogo flexivel por tenant, com baixo risco, mantendo fallback para o fluxo legado.

## Controle de ativacao (frontend)

Arquivo: `frontend-web/.env`

Variaveis:

- `REACT_APP_CATALOGO_API_ENABLED=true`
- `REACT_APP_CATALOGO_API_TENANTS=<empresa_id_1>,<empresa_id_2>`

Regras:

- Se `REACT_APP_CATALOGO_API_ENABLED=false`, todo tenant segue no legado (`/produtos`).
- Se `REACT_APP_CATALOGO_API_ENABLED=true` e a allowlist estiver vazia, libera para todos.
- Para piloto seguro, sempre preencher `REACT_APP_CATALOGO_API_TENANTS` com os tenants homologados.

## Sequencia recomendada de rollout

1. Homologacao interna:
   - ativar apenas 1 tenant interno.
   - validar cadastro/edicao de itens por nicho (software, servicos, automotivo).
2. Piloto controlado:
   - adicionar 1-2 tenants reais.
   - acompanhar uso por 3-5 dias.
3. Escala:
   - ampliar allowlist gradualmente.
   - liberar global somente apos estabilidade.

## Pre-requisito de banco (antes do piloto)

Garantir existencia da tabela especializada de veiculos:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'vehicle_inventory_items';
```

Se nao existir, aplicar estrutura equivalente a migration
`1808300000000-CreateVehicleInventoryItems` no ambiente alvo antes do smoke.

## Smoke tecnico (backend)

Executar:

```powershell
npm --prefix backend run test:e2e:catalogo:smoke
```

Este comando valida:

- catalogo flexivel (`catalog_items`, templates, composicao, historico)
- vehicle inventory (entidade especializada para lojas de veiculos)
- fluxo de vendas/propostas critico

## Smoke tecnico (frontend gate por tenant)

Executar:

```powershell
$env:CI='true'; npm --prefix frontend-web run test -- --runTestsByPath src/services/__tests__/produtosService.catalogGate.test.ts --watch=false --runInBand
```

Este comando valida:

- tenant permitido pela allowlist usa endpoint novo (`/catalog/items`)
- tenant fora da allowlist permanece no endpoint legado (`/produtos`)
- flag global desativada forca fallback legado

## Checklist funcional do piloto

- Plano SaaS com composicao de modulos e add-ons.
- Servico avulso e pacote de servico.
- Peca/acessorio automotivo com atributos de compatibilidade.
- Veiculo cadastrado no modulo especializado (sem usar produto generico).
- Proposta com snapshot de composicao + preview PDF coerente.
- Gate frontend por tenant validado (teste automatizado de endpoint novo vs legado).

## Rollback rapido

1. Definir `REACT_APP_CATALOGO_API_ENABLED=false`.
2. Rebuild/deploy do frontend.
3. Operacao retorna imediatamente ao fluxo legado de `produtos`.
