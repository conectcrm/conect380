# Consolidação — Auditoria do Módulo CRM

_Data: 28/11/2025_

## 1. Escopo Atual Mapeado

### Backend (NestJS + TypeORM)
- **Leads** (`backend/src/modules/leads/*`): captura pública, CRUD autenticado, estatísticas, conversão para oportunidades, importação CSV, score dinâmico.
- **Oportunidades** (`backend/src/modules/oportunidades/*`): CRUD, métricas, dados de pipeline e atividades; guarda dependências com usuários/atividades.
- **Propostas** (`backend/src/modules/propostas/*`): APIs para listar/criar/status, mais controladores auxiliares para PDF (`propostas/pdf`), portal público (`api/portal`) e e-mail (`/email`). Persistência ainda majoritariamente mock.

### Frontend (React + Tailwind)
- **Gestão de Leads** (`frontend-web/src/pages/LeadsPage.tsx` + `services/leadsService.ts`): UI completa com estatísticas, filtros, modal de criação, conversão e import CSV.
- **Pipeline de Oportunidades** (`frontend-web/src/features/oportunidades/*`): vistas Kanban/lista/calendar, hooks personalizados e `oportunidadesService.ts` com axios próprio.
- **Propostas** (`frontend-web/src/features/propostas/PropostasPage.tsx` + `services/propostasService.ts`): dashboard com filtros, modais, geração de PDF/email ainda simulada.

## 2. Integrações Backend/Frontend

| Domínio | Endpoints Backend Disponíveis | Consumo Frontend Atual | Observações |
| --- | --- | --- | --- |
| Leads | `/leads`, `/leads/estatisticas`, `/leads/:id`, `/leads/:id/converter`, `/leads/import`, `/leads/capture` | `leadsService` usa CRUD + estatísticas + conversão + import; UI invoca `recalcular-score` inexistente | Captura pública usa client autenticado ⇒ bloqueia uso anônimo.
| Oportunidades | `/oportunidades`, `/oportunidades/pipeline`, `/oportunidades/metricas`, `/oportunidades/:id/atividades (GET/POST)` | `oportunidadesService` chama rotas extras (`/mover`, `/buscar`, `/tags`, `/responsaveis`, `/clonar`, `/exportar`, delete de atividade) que não existem | Service usa axios custom, fora dos interceptors globais.
| Propostas | `/propostas` (listar/criar/obter/remover/status), `/propostas/pdf/*`, `/email/*`, `/api/portal/*` | `propostasService` utiliza rotas inexistentes (`PUT`, `/duplicate`, `/cliente/:id`, `/estatisticas`, etc.) e mantém mocks para produtos/estatísticas | Backend ainda não persiste propostas em banco.

## 3. Gaps e Pendências

1. **Endpoints ausentes versus UI**
   - Leads: ausência de `POST /leads/:id/recalcular-score` apesar de botão na tela.
   - Oportunidades: múltiplas rotas chamadas no front não estão implementadas (mover estágio, busca, tags, responsáveis, clonagem, exportação, delete atividade).
   - Propostas: UI depende de operações inexistentes (editar, duplicar, PDF direto, estatísticas, envio e-mail). Backend extra (portal/email/pdf) não é consumido.

2. **Clientes HTTP e autenticação**
   - `oportunidadesService` ignora wrapper `api`, duplicando lógica de token e baseURL.
   - `leadsService.capturarPublico` deveria usar client sem JWT para permitir formulários públicos.

3. **Persistência incompleta**
   - `PropostasService` opera com dados mock/in-memory; sem entities/migrations, pipeline e métricas são fictícios.
   - Conversão Lead→Oportunidade não usa DTO compartilhado; risco de divergência camelCase x snake_case.

4. **Funcionalidades backend não expostas**
   - Portal público, geração de PDF e envio de e-mail integrados já existem mas não são conectados ao frontend.

5. **Observabilidade/Testes**
   - Ausência de testes de integração cobrindo o funil completo.
   - Logging limitado a `console.log`, sem rastreabilidade estruturada.

## 4. Recomendações e Próximos Passos

1. **Equalizar contratos API/UI (Curto prazo)**
   - Criar `POST /leads/:id/recalcular-score` ou remover botão correspondente.
   - Revisar `oportunidadesService`: alinhar endpoints (usar `PATCH /:id/estagio`) ou implementar rotas necessárias conforme backlog priorizado.
   - Ajustar `leadsService.capturarPublico` para usar axios público; documentar uso em landing pages.

2. **Padronizar camadas de acesso**
   - Migrar `oportunidadesService` para o wrapper `api` para herdar interceptors e baseURL.
   - Criar `apiPublic` dedicado a rotas sem autenticação.

3. **Evoluir Propostas para dados reais (Médio prazo)**
   - Definir entities TypeORM e migrations (propostas, itens, tokens portal, logs).
   - Reescrever `PropostasService` com repositórios reais e integrar endpoints existentes (`/propostas/pdf`, `/email/*`, `/api/portal/*`).
   - Só reativar features (duplicar, estatísticas, envio) após APIs concretas.

4. **Integração portal/email/pdf (Médio prazo)**
   - Expor botões no frontend que chamem `POST /email/enviar-proposta` e `/propostas/pdf/gerar/:tipo`.
   - Criar tela simplificada para tokens do portal público, usando `PortalController`.

5. **Observabilidade e QA (Contínuo)**
   - Implementar testes unitários/e2e para o fluxo Lead→Oportunidade→Proposta.
   - Adicionar logger estruturado (ex.: `Logger` Nest) e tracing básico nas integrações externas.
   - Monitorar endpoints públicos (`/leads/capture`, `/api/portal/...`) com rate-limit e métricas.

## 5. Status das Tarefas

- ✔️ Escopo mapeado (backend + frontend).
- ✔️ Integrações backend/frontend auditadas.
- ✔️ Gaps e pendências identificados.
- 📌 Recomendações consolidadas neste documento (passo atual concluído).

## 6. Execução Recente — 28/11/2025

- 🔄 **Equalizar contratos – Propostas:** serviço de features passou a delegar CRUD ao `frontend-web/src/services/propostasService.ts`, eliminando `fetch` duplicado e garantindo respostas normalizadas.
- 🧩 **Modais/Páginas alinhadas:** `ModalNovaProposta*` e `NovaPropostaPage*` agora exibem mensagens reais vindas do backend, facilitando troubleshooting de criação.
- 🧪 **Verificação manual:** endpoint `GET /propostas` testado (curl) após refatoração para assegurar que o backend continua respondendo `success: true` com 12 registros.

---
Responsável: Assistente IA (GPT-5.1-Codex)
