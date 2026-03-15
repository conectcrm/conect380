# Catalogo Flexivel - Smoke Tenant Codexa

Data: 2026-03-10 15:30:22 (America/Sao_Paulo)

## Tenant alvo

- Nome: `Codexa sistemas LTDA`
- Empresa ID: `250cc3ac-617b-4d8b-be6e-b14901e4edde`

## Configuracao de rollout (frontend)

Arquivo: `frontend-web/.env`

- `REACT_APP_CATALOGO_API_ENABLED=true`
- `REACT_APP_CATALOGO_API_TENANTS=250cc3ac-617b-4d8b-be6e-b14901e4edde`

## Validacao tecnica executada

Comandos:

```powershell
npm --prefix backend run test:e2e:catalogo:smoke
npm --prefix frontend-web run build
```

Resultado:

- `catalogo-flex.e2e`: 6/6 passed
- `vehicle-inventory.e2e`: 1/1 passed
- `vendas e2e`: 22/22 passed
- frontend build: sucesso

## Ajuste de infraestrutura identificado no banco ativo

Problema encontrado durante smoke funcional do tenant:

- endpoint `POST /vehicle-inventory/items` retornando `500`.

Causa:

- tabela `vehicle_inventory_items` inexistente no banco ativo.

Acao aplicada:

- schema de `vehicle_inventory_items` provisionado no banco (equivalente a migration `1808300000000-CreateVehicleInventoryItems`).

## Smoke funcional no tenant Codexa (API real)

Fluxo executado com usuario temporario da propria empresa:

1. login/autorizacao no tenant.
2. listagem de templates `/catalog/templates`.
3. cadastro de modulo e plano em `/catalog/items`.
4. composicao oficial do plano em `/catalog/items/:id/components`.
5. criacao de proposta com snapshot de composicao em `/propostas`.
6. historico com enriquecimento em `/propostas/:id/historico`.
7. preview PDF com composicao em `/propostas/pdf/preview/comercial`.
8. fluxo completo de veiculos: criar -> atualizar status -> remover -> restaurar.

Resultado final:

```json
{
  "ok": true,
  "tenantId": "250cc3ac-617b-4d8b-be6e-b14901e4edde",
  "tenantNome": "Codexa sistemas LTDA",
  "checks": {
    "templates": true,
    "catalogComposition": true,
    "propostaSnapshotHistorico": true,
    "pdfPreviewComposition": true,
    "vehicleInventoryFlow": true
  }
}
```

Observacao:

- todos os dados de smoke (usuario/itens/proposta/veiculo) foram removidos ao final do teste.

## Validacao de gate frontend por tenant (2026-03-10)

Comando executado:

```powershell
$env:CI='true'; npm --prefix frontend-web run test -- --runTestsByPath src/services/__tests__/produtosService.catalogGate.test.ts --watch=false
```

Resultado:

- suite `produtosService.catalogGate`: 3/3 passed

Cobertura validada:

- tenant na allowlist usa endpoint novo (`/catalog/items`).
- tenant fora da allowlist permanece no endpoint legado (`/produtos`).
- flag global desligada forca fallback legado (`/produtos/estatisticas`).

## Higienizacao de dados temporarios

Pendencia do teste interrompido foi tratada em 2026-03-10:

- usuarios temporarios de gate removidos:
  - `gate.allowed.1773167809576@conectcrm.local`
  - `gate.blocked.1773167809576@conectcrm.local`
  - `gate.codexaAllowed.1773167699507@conectcrm.local`
- validacao final no banco: `remaining = 0` para padrao `gate.%@conectcrm.local`.

## Endurecimento de pipeline (2026-03-10)

Acao aplicada:

- workflow `.github/workflows/ci.yml` atualizado para executar automaticamente o teste de gate tenant de catalogo no job `frontend`.

Comando integrado no CI:

```bash
npm --prefix frontend-web run test -- --runTestsByPath src/services/__tests__/produtosService.catalogGate.test.ts --watch=false --runInBand
```

Reexecucao local apos integracao:

- `PASS` em 3/3 testes.
