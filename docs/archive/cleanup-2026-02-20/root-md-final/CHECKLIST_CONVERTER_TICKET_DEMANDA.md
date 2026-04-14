# ✅ Checklist: Implementação da Feature Converter Ticket em Demanda

## 📋 Visão Geral

**Feature**: Conversão de Ticket para Demanda  
**Status Backend**: ✅ Concluído (23/12/2025)  
**Status Frontend**: ⏳ Pendente  
**Documentação**: FEATURE_CONVERTER_TICKET_DEMANDA.md

---

## ✅ Backend - Concluído

### Service (DemandaService)

- [x] Método `converterTicketEmDemanda()` implementado
- [x] Busca ticket com relações (cliente, fila, mensagens)
- [x] Validação: ticket existe
- [x] Validação: evita duplicação (retorna demanda existente)
- [x] Extração de contexto do ticket
- [x] Inferência automática de tipo (7 categorias com keywords)
- [x] Inferência automática de prioridade (baseado em SLA e tempo)
- [x] Montagem de descrição formatada com contexto completo
- [x] Criação de demanda com vinculação ao ticket
- [x] Logs estruturados (início, fim, warnings)
- [x] Injeção do repositório Ticket no construtor

### Controller (DemandaController)

- [x] Endpoint POST `/demandas/converter-ticket/:ticketId` criado
- [x] Decoradores @ApiOperation com descrição completa
- [x] Parâmetros: ticketId (path), dto (body opcional)
- [x] Extração de autorId do req.user
- [x] Logs de ação do usuário

### Testes Unitários

- [x] Arquivo `demanda.service.spec.ts` criado
- [x] Teste: conversão com inferência automática
- [x] Teste: inferência de tipo "tecnica" por keywords
- [x] Teste: inferência de prioridade "alta" (ticket > 3 dias)
- [x] Teste: inferência de prioridade "urgente" (SLA vencido)
- [x] Teste: override de tipo/prioridade via DTO
- [x] Teste: NotFoundException para ticket inexistente
- [x] Teste: retorna demanda existente (evita duplicação)
- [x] Teste: descrição inclui contexto completo
- [x] Teste: vinculação correta (ticket, cliente, responsável)
- [x] Testes de inferência para todos os 7 tipos

### Documentação

- [x] FEATURE_CONVERTER_TICKET_DEMANDA.md criado
- [x] Documentação completa do fluxo
- [x] Exemplos de teste (Postman/Thunder Client)
- [x] Especificação de endpoint (request/response)
- [x] Lista de keywords por tipo de demanda
- [x] Lógica de inferência de prioridade documentada

---

## ⏳ Frontend - Pendente

### 1. Service Layer (demandaService.ts)

**Arquivo**: `frontend-web/src/services/demandaService.ts`

- [ ] Adicionar interface `ConvertTicketDto`:
  ```typescript
  export interface ConvertTicketDto {
    titulo?: string;
    descricao?: string;
    tipo?: 'tecnica' | 'suporte' | 'financeira' | 'comercial' | 'reclamacao' | 'solicitacao' | 'outros';
    prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
    responsavelId?: string;
    dataVencimento?: string; // ISO 8601
  }
  ```

- [ ] Adicionar método `converterTicketEmDemanda`:
  ```typescript
  export const converterTicketEmDemanda = async (
    ticketId: string,
    dto?: ConvertTicketDto
  ): Promise<Demanda> => {
    const response = await api.post(`/demandas/converter-ticket/${ticketId}`, dto || {});
    return response.data;
  };
  ```

- [ ] Adicionar error handling específico:
  - 404: "Ticket não encontrado"
  - 409: "Ticket já possui demanda" (opcional: auto-redirecionar para demanda existente)
  - 500: "Erro ao converter ticket"

### 2. Modal Component (ConvertTicketModal.tsx)

**Arquivo**: `frontend-web/src/components/modals/ConvertTicketModal.tsx`

#### Props Interface

- [ ] Interface definida:
  ```typescript
  interface ConvertTicketModalProps {
    ticket: Ticket;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (demanda: Demanda) => void;
  }
  ```

#### Estado

- [ ] `titulo` (string, prefilled com "Demanda do ticket #XXXX")
- [ ] `descricao` (string, prefilled com última mensagem do ticket)
- [ ] `tipo` (dropdown, default inferido)
- [ ] `prioridade` (dropdown, default inferido)
- [ ] `dataVencimento` (date picker, opcional)
- [ ] `loading` (boolean)
- [ ] `error` (string | null)

#### UI Elements

- [ ] Header com título "Converter Ticket em Demanda"
- [ ] Botão X para fechar (canto superior direito)
- [ ] Input texto: Título (obrigatório)
- [ ] Textarea: Descrição (opcional, autosize)
- [ ] Dropdown: Tipo de Demanda (7 opções + ícones)
- [ ] Dropdown: Prioridade (4 níveis com badges coloridos)
- [ ] Date Picker: Data Vencimento (opcional)
- [ ] Badge informativo: "Contexto do ticket será preservado na demanda"
- [ ] Footer com botões:
  - [ ] Botão "Cancelar" (secundário, fecha modal)
  - [ ] Botão "Criar Demanda" (primário #159A9C, com loading spinner)

#### Validações

- [ ] Título: mínimo 3 caracteres
- [ ] Tipo: obrigatório (default "suporte")
- [ ] Prioridade: obrigatória (default "media")
- [ ] Data Vencimento: não pode ser no passado (se fornecida)

#### Ações

- [ ] `handleSubmit()`: chama `converterTicketEmDemanda()`
- [ ] Success: 
  - [ ] Toast: "Demanda criada com sucesso!"
  - [ ] Callback `onSuccess(demanda)`
  - [ ] Fecha modal
- [ ] Error:
  - [ ] Exibe mensagem de erro abaixo do formulário
  - [ ] Se 409 (já existe): oferece link "Ver demanda existente"

#### Estilo

- [ ] Seguir DESIGN_GUIDELINES.md (tema Crevasse)
- [ ] Cores: #159A9C (primário), #002333 (texto), #DEEFE7 (background secundário)
- [ ] Responsividade: mobile-first
- [ ] Animações: fade-in/fade-out ao abrir/fechar

### 3. Ticket Detail Page (TicketDetailPage.tsx)

**Arquivo**: `frontend-web/src/pages/TicketDetailPage.tsx`

#### Estado Adicional

- [ ] `showConvertModal` (boolean)
- [ ] `demandaVinculada` (Demanda | null) - carregada via `demandaService.buscarPorTicket()`

#### Header Actions

- [ ] Botão "Converter em Demanda":
  ```typescript
  <button
    onClick={() => setShowConvertModal(true)}
    disabled={ticket.status === 'fechado' || demandaVinculada !== null}
    className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
  >
    <FileText className="h-4 w-4" />
    {demandaVinculada ? 'Demanda Criada' : 'Converter em Demanda'}
  </button>
  ```

- [ ] Tooltip: "Converte este ticket em uma demanda rastreável"

#### Badge de Status

- [ ] Se `demandaVinculada !== null`:
  ```typescript
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    <FileText className="h-3 w-3 mr-1" />
    Demanda #{demandaVinculada.id.substring(0, 8)}
  </span>
  ```

- [ ] Clicar no badge: redireciona para `/demandas/${demandaVinculada.id}`

#### Modal

- [ ] Componente `<ConvertTicketModal>` incluído
- [ ] Props: `ticket`, `isOpen={showConvertModal}`, `onClose`, `onSuccess`

#### Callback onSuccess

- [ ] Atualiza `demandaVinculada` com demanda retornada
- [ ] Fecha modal
- [ ] Opcional: mostra confetti animation 🎉

### 4. Ticket List Page (TicketListPage.tsx)

**Opcional**: Adicionar ação rápida na lista

- [ ] Botão de ação "..." (dropdown)
- [ ] Opção: "Converter em Demanda"
- [ ] Abre modal direto sem entrar no detail

### 5. Demanda Detail Page (DemandaDetailPage.tsx)

**Mostrar ticket de origem**

- [ ] Se `demanda.ticketId` existe:
  ```typescript
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
    <h3 className="text-sm font-medium text-gray-700 mb-2">
      <Ticket className="h-4 w-4 inline mr-2" />
      Ticket de Origem
    </h3>
    <Link 
      to={`/tickets/${demanda.ticketId}`}
      className="text-[#159A9C] hover:underline flex items-center gap-2"
    >
      Ver Ticket #{demanda.ticketId.substring(0, 8)}
      <ExternalLink className="h-3 w-3" />
    </Link>
  </div>
  ```

---

## 🧪 Testes Frontend

### 1. Testes Unitários (Jest + React Testing Library)

**Arquivo**: `ConvertTicketModal.test.tsx`

- [ ] Renderiza modal com ticket fornecido
- [ ] Preenche campos automaticamente (título, descrição)
- [ ] Submete formulário com dados válidos
- [ ] Exibe loading durante submit
- [ ] Mostra toast de sucesso após criação
- [ ] Exibe erro se conversão falhar
- [ ] Fecha modal ao clicar em "Cancelar"
- [ ] Desabilita botão "Criar" se título vazio
- [ ] Valida data vencimento não pode ser passado

### 2. Testes de Integração (Playwright E2E)

**Arquivo**: `e2e/converter-ticket-demanda.spec.ts`

- [ ] Cenário 1: Conversão com inferência automática
  - [ ] Login como atendente
  - [ ] Abrir ticket existente
  - [ ] Clicar em "Converter em Demanda"
  - [ ] Modal abre com campos preenchidos
  - [ ] Clicar em "Criar Demanda"
  - [ ] Verificar toast de sucesso
  - [ ] Verificar badge "Demanda #XXX" aparece
  - [ ] Clicar no badge → redireciona para demanda detail

- [ ] Cenário 2: Conversão customizada
  - [ ] Abrir modal
  - [ ] Alterar tipo para "Técnica"
  - [ ] Alterar prioridade para "Alta"
  - [ ] Editar título
  - [ ] Adicionar data vencimento
  - [ ] Submit
  - [ ] Verificar demanda criada com valores customizados

- [ ] Cenário 3: Tentativa de converter ticket já convertido
  - [ ] Ticket já tem demanda
  - [ ] Botão "Converter em Demanda" desabilitado
  - [ ] Badge mostra demanda existente

- [ ] Cenário 4: Erro - Ticket não encontrado
  - [ ] Ticket inválido
  - [ ] Modal exibe erro 404
  - [ ] Botão de retry ou fechar modal

---

## 📊 Validação Final

### Checklist de Aceitação

- [ ] **Backend**:
  - [ ] Endpoint responde em < 500ms (performance)
  - [ ] Testes unitários passam (100% cobertura do método de conversão)
  - [ ] Logs aparecem corretamente no console
  - [ ] Nenhum erro no TypeScript build

- [ ] **Frontend**:
  - [ ] Modal abre/fecha suavemente (animação)
  - [ ] Campos prefill com dados corretos do ticket
  - [ ] Dropdown de tipo com ícones intuitivos
  - [ ] Prioridade com badges coloridos
  - [ ] Toast aparece após sucesso
  - [ ] Badge de demanda vinculada aparece
  - [ ] Link para demanda funciona
  - [ ] Responsivo em mobile (375px)
  - [ ] Sem erros no console do browser

- [ ] **Integração**:
  - [ ] Fluxo completo funciona: ticket → conversão → demanda criada → visualização
  - [ ] Evita duplicação (mesmo ticket convertido 2x = mesma demanda)
  - [ ] Inferência de tipo/prioridade funciona corretamente
  - [ ] Contexto do ticket aparece na descrição da demanda

- [ ] **UX**:
  - [ ] Usuário entende como converter ticket
  - [ ] Feedback visual claro em todas as etapas
  - [ ] Mensagens de erro são compreensíveis
  - [ ] Ações são reversíveis (pode fechar modal sem salvar)

---

## 🚀 Deploy

### Pre-Deploy Checklist

- [ ] Backend:
  - [ ] Testes unitários passando (`npm test`)
  - [ ] Build sem erros (`npm run build`)
  - [ ] Documentação atualizada (Swagger)

- [ ] Frontend:
  - [ ] Testes E2E passando
  - [ ] Build de produção sem warnings (`npm run build`)
  - [ ] Lighthouse score > 90 (performance, accessibility)

- [ ] Database:
  - [ ] Migration de Redmine postponed (não bloqueia esta feature)
  - [ ] Nenhuma migration pendente crítica

### Post-Deploy Validation

- [ ] Smoke test: converter 1 ticket em produção
- [ ] Monitoramento: nenhum erro 500 nos logs
- [ ] Métricas: taxa de conversão ticket→demanda > 0
- [ ] Feedback de usuários: nenhum bug crítico reportado em 24h

---

## 📚 Documentação Final

- [ ] Atualizar README.md (mencionar nova feature)
- [ ] Criar video tutorial (screencast 2-3 min)
- [ ] Adicionar ao manual do usuário
- [ ] Comunicar equipe de suporte (training)
- [ ] Release notes (changelog)

---

**Status Atual**: ✅ Backend completo, ⏳ Frontend pendente  
**Próxima Ação**: Implementar frontend (Service → Modal → Page)  
**Estimativa**: 6-8 horas de desenvolvimento frontend + 2h testes

**Última atualização**: 23/12/2025
