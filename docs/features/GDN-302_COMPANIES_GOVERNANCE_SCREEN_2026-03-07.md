# GDN-302 - Implement companies governance screen

## Data
- 2026-03-07

## Objetivo
- Entregar tela de governanca de empresas no `guardian-web` com listagem, alteracao de status, alteracao de plano e ajuste de limites por modulo.

## Implementacao
- Tela publicada em `guardian-web/src/pages/CompaniesGovernancePage.tsx`.
- Operacoes habilitadas na UI:
  - Listagem via `GET /guardian/bff/companies`.
  - Suspensao via `PATCH /guardian/empresas/:id/suspender`.
  - Reativacao via `PATCH /guardian/empresas/:id/reativar`.
  - Mudanca de plano via `PATCH /guardian/empresas/:id/plano`.
  - Atualizacao de limite por modulo via `PATCH /guardian/empresas/:id/modulos/:modulo`.
- Feedback operacional e tratamento de erro padronizados na tela.

## Validacao executada
- `npm --prefix guardian-web run type-check`
- `npm --prefix guardian-web run build`
