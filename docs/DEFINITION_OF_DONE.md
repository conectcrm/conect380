# ✅ Definição de Pronto (DoD) — ConectCRM

> Objetivo: garantir padrão de entrega consistente (estilo “empresa grande”), sem regressões de segurança, multi-tenant e UX.

## Obrigatório para qualquer entrega

- **Escopo fechado**: PR descreve objetivo e o que não faz.
- **Sem duplicações**: sem rota/import/menu duplicado.
- **Sem credenciais**: nada hardcoded; usar `.env`/ConfigService.

## Backend (NestJS)

- **Multi-tenant**
  - Entidade/tabela de negócio tem `empresa_id`/`empresaId`.
  - Migration (se aplicável) tem RLS + policy `tenant_isolation_*` + índice em `empresa_id`.
  - Controller protegido por padrão; endpoint público só com `@Public()` + justificativa.

- **Validação e erros**
  - DTO com `class-validator`.
  - Tratamento de erro coerente (sem mascarar 401/403/4xx com fallback).

- **Verificação**
  - Build/test (quando aplicável) e smoke `scripts/verify-backend.ps1` passando.

## Frontend (React)

- **Tema e layout**
  - Tema Crevasse mantido.
  - Layout correto (Chat/Kanban/Dashboard/List) conforme `ARQUITETURA_LAYOUTS.md`.

- **Estados obrigatórios**
  - Loading + Error + Empty + Success.
  - Confirmação de ações destrutivas com `ConfirmationModal`/`useConfirmation`.
  - Feedback com `react-hot-toast`.

- **Integração**
  - Service espelha as rotas do backend (não inventar endpoints).

## Referências

- Regras e guardrails do projeto: `.github/copilot-instructions.md`
- Roadmap/handbook: `docs/handbook/ROADMAP_SPRINT_2.md` (há uma seção de DoD lá também)
