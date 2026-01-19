# 🧭 Mapa do Sistema (para IA e novos devs)

> Objetivo: reduzir ambiguidade em um repositório grande e manter consistência com padrões de times de alta maturidade.

## 1) Onde olhar primeiro

- **Frontend (React)**: `frontend-web/`
  - Páginas: `frontend-web/src/pages/`
  - Features: `frontend-web/src/features/`
  - Services (API): `frontend-web/src/services/`

- **Backend (NestJS + TypeORM)**: `backend/`
  - Módulos: `backend/src/modules/`
  - Migrations: `backend/src/migrations/`
  - Config DB: `backend/src/config/`

- **Docs**: `docs/`
  - Guia central: `docs/INDICE_DOCUMENTACAO.md`
  - Credenciais (dev local): `docs/CREDENCIAIS_PADRAO.md`

## 2) Regras inegociáveis (ConectCRM)

- **Multi-tenant SEMPRE**
  - Entidades de negócio: `empresa_id`/`empresaId` obrigatório.
  - Banco: RLS + policy `tenant_isolation_*` + índice `idx_*_empresa_id`.
  - Controllers: protegidos por padrão (JWT guard). Endpoints públicos só com `@Public()` + justificativa.

- **Tema fixo (Crevasse)**
  - Não criar “tema por módulo”. O que muda é o layout/template.

## 3) Fluxo de trabalho recomendado (padrão mercado)

1. **Checagem de contexto antes de editar**
   - Buscar por símbolo/rota antes de criar algo novo.
   - Ler o arquivo inteiro antes de modificar.

2. **Mudança pequena e verificável**
   - Preferir 1–3 arquivos por etapa.
   - Validar com scripts/tasks (smoke/health-check) ao final.

3. **Não duplicar**
   - Se for adicionar rota, menu item ou import, sempre procurar ocorrência antes.

## 4) Como rodar (dev local)

- Backend (porta 3001): `cd backend && npm run start:dev`
- Frontend (porta 3000): `cd frontend-web && npm start`

## 5) Testes e validação mínima

- Backend: `cd backend && npm test`
- Smoke: `scripts/verify-backend.ps1` (login + faturas)

## 6) Dicas para não “se perder”

- Priorizar as pastas “vivas”: `frontend-web/src/**`, `backend/src/modules/**`, `scripts/**`, `docs/**`.
- Tratar `archived/**` como histórico (não é referência de arquitetura atual).
- Se algo parece “desconectado”, procure o controller no backend e espelhe o service do frontend.
