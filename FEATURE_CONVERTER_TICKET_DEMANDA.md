# 🎫➡️📋 Feature: Conversão de Ticket para Demanda

## ✅ Implementação Concluída

**Data**: Dezembro 2025  
**Status**: Backend completo, frontend pendente

---

## 📋 Objetivo

Permitir que tickets de atendimento sejam convertidos em demandas, criando um registro estruturado que pode ser acompanhado, atribuído e gerenciado no sistema de gestão de demandas.

---

## 🎯 Casos de Uso

1. **Escalonamento**: Ticket requer ação técnica/comercial/financeira → Converter em demanda
2. **Rastreamento**: Cliente solicita algo que precisa follow-up → Criar demanda vinculada
3. **SLA**: Tickets complexos que excedem SLA de atendimento → Escalonar para demanda
4. **Histórico**: Manter contexto completo do ticket na demanda criada

---

## 🔧 Implementação Backend

### 1. Service: DemandaService

**Arquivo**: `backend/src/modules/atendimento/services/demanda.service.ts`

#### Método Principal: `converterTicketEmDemanda()`

```typescript
async converterTicketEmDemanda(
  ticketId: string,
  dto: Partial<CreateDemandaDto>,
  autorId: string,
): Promise<Demanda>
```

**Fluxo**:
1. ✅ Busca ticket com relações (cliente, fila, mensagens)
2. ✅ Valida se ticket existe
3. ✅ Verifica se já existe demanda para este ticket (evita duplicação)
4. ✅ Extrai contexto:
   - Última mensagem do cliente
   - Número do ticket
   - Fila de origem
   - Cliente associado
   - Status e timestamps
5. ✅ Infere tipo de demanda (se não fornecido):
   - Técnica: palavras-chave como "erro", "bug", "falha"
   - Suporte: "ajuda", "dúvida", "como"
   - Financeira: "pagamento", "fatura", "boleto"
   - Comercial: "venda", "proposta", "orçamento"
   - Reclamação: "reclamação", "insatisfeito", "problema"
   - Solicitação: "solicito", "preciso", "gostaria"
   - **Default**: suporte
6. ✅ Infere prioridade (se não fornecida):
   - **Urgente**: SLA vencido
   - **Alta**: SLA < 2h ou ticket aberto > 3 dias
   - **Default**: média
7. ✅ Cria demanda com:
   - Título: do DTO ou "Demanda do ticket #XXXX"
   - Descrição: última mensagem + contexto completo do ticket
   - ticketId: vincula à origem
   - clienteId: do ticket
   - responsavelId: atendente do ticket (se houver)
   - empresaId: do ticket
8. ✅ Retorna demanda com relações carregadas

#### Métodos Auxiliares

```typescript
// Monta descrição formatada com contexto do ticket
private montarDescricaoDoTicket(ticket: Ticket, ultimaMensagem: string): string

// Analisa mensagem e classifica tipo baseado em keywords
private inferirTipoDemanda(ticket: Ticket, ultimaMensagem: string): Demanda['tipo']

// Calcula prioridade baseado em SLA e tempo de ticket aberto
private inferirPrioridade(ticket: Ticket): Demanda['prioridade']
```

**Keywords por Tipo**:
- **Técnica**: erro, bug, falha, não funciona, problema técnico, travou, sistema
- **Suporte**: ajuda, dúvida, como, tutorial, auxílio, suporte
- **Financeira**: pagamento, fatura, boleto, cobrança, preço, valor, financeiro
- **Comercial**: venda, proposta, orçamento, plano, upgrade, contrato
- **Reclamação**: reclamação, insatisfeito, problema, ruim, péssimo, cancelar
- **Solicitação**: solicito, preciso, gostaria, quero, necessito

---

### 2. Controller: DemandaController

**Arquivo**: `backend/src/modules/atendimento/controllers/demanda.controller.ts`

#### Endpoint: POST `/demandas/converter-ticket/:ticketId`

```typescript
@Post('converter-ticket/:ticketId')
@ApiOperation({ 
  summary: 'Converter ticket em demanda', 
  description: 'Cria uma demanda a partir de um ticket de atendimento...' 
})
async converterTicket(
  @Param('ticketId') ticketId: string,
  @Body() dto: Partial<CreateDemandaDto>,
  @Request() req,
)
```

**Parâmetros**:
- `ticketId` (path): UUID do ticket
- `dto` (body - OPCIONAL):
  ```json
  {
    "titulo": "string (opcional)",
    "descricao": "string (opcional)",
    "tipo": "tecnica | suporte | financeira | comercial | reclamacao | solicitacao | outros (opcional)",
    "prioridade": "baixa | media | alta | urgente (opcional)",
    "responsavelId": "uuid (opcional)",
    "dataVencimento": "ISO 8601 (opcional)"
  }
  ```

**Resposta** (200 OK):
```json
{
  "id": "uuid",
  "titulo": "Demanda do ticket #12345",
  "descricao": "**Última mensagem do cliente:**\nPreciso de ajuda...\n\n---\n**Contexto do Ticket:**\n- Número: #12345...",
  "tipo": "suporte",
  "prioridade": "media",
  "status": "aberta",
  "ticketId": "uuid-do-ticket",
  "clienteId": "uuid-do-cliente",
  "responsavelId": "uuid-do-atendente",
  "autorId": "uuid-do-usuario",
  "empresaId": "uuid-da-empresa",
  "createdAt": "2025-12-23T...",
  "updatedAt": "2025-12-23T...",
  "autor": { ... },
  "responsavel": { ... },
  "cliente": { ... }
}
```

**Erros**:
- **404 Not Found**: Ticket não existe
- **409 Conflict**: Ticket já possui demanda (retorna demanda existente)

---

## 🧪 Como Testar

### Backend (Postman/Thunder Client)

1. **Autenticar**:
   ```
   POST http://localhost:3001/auth/login
   Body: {
     "email": "admin@conectsuite.com.br",
     "password": "admin123"
   }
   ```
   → Copiar token JWT

2. **Converter ticket (inferência automática)**:
   ```
   POST http://localhost:3001/demandas/converter-ticket/{ticketId}
   Headers: { "Authorization": "Bearer {token}" }
   Body: {} // vazio = inferência automática
   ```

3. **Converter ticket (customizado)**:
   ```
   POST http://localhost:3001/demandas/converter-ticket/{ticketId}
   Headers: { "Authorization": "Bearer {token}" }
   Body: {
     "titulo": "Problema técnico no sistema de vendas",
     "tipo": "tecnica",
     "prioridade": "alta",
     "dataVencimento": "2025-12-30T23:59:59Z"
   }
   ```

4. **Verificar demandas do ticket**:
   ```
   GET http://localhost:3001/demandas/ticket/{ticketId}
   Headers: { "Authorization": "Bearer {token}" }
   ```

### Validações Esperadas

- ✅ Primeira conversão: cria demanda nova
- ✅ Segunda conversão do mesmo ticket: retorna demanda existente (não duplica)
- ✅ Ticket inválido: 404 Not Found
- ✅ Inferência de tipo: analisa mensagem e classifica
- ✅ Inferência de prioridade: considera SLA e tempo de abertura
- ✅ Contexto preservado: descrição contém dados completos do ticket

---

## 📱 Frontend (Pendente)

### 1. Componente: TicketDetailPage

**Localização**: `frontend-web/src/pages/TicketDetailPage.tsx`

**Adicionar**:
```tsx
// Botão "Converter em Demanda" no header do ticket
<button
  onClick={() => setShowConvertModal(true)}
  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium"
  disabled={ticket.status === 'fechado'}
>
  <FileText className="h-4 w-4" />
  Converter em Demanda
</button>

// Badge se ticket já tem demanda
{ticket.demandaId && (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    Demanda #{ticket.demandaId.substring(0, 8)}
  </span>
)}
```

### 2. Modal: ConvertTicketModal

**Criar**: `frontend-web/src/components/modals/ConvertTicketModal.tsx`

**Campos**:
- Título (input text, prefilled com "Demanda do ticket #XXXX")
- Tipo (dropdown: técnica, suporte, financeira, comercial, reclamação, solicitação, outros)
- Prioridade (dropdown: baixa, média, alta, urgente)
- Data Vencimento (date picker, opcional)
- Descrição (textarea, prefilled com última mensagem)

**Actions**:
- Botão "Cancelar" (fecha modal)
- Botão "Criar Demanda" (submit)

### 3. Service: demandaService.ts

**Adicionar**:
```typescript
export const converterTicketEmDemanda = async (
  ticketId: string,
  dto?: Partial<CreateDemandaDto>
): Promise<Demanda> => {
  const response = await api.post(`/demandas/converter-ticket/${ticketId}`, dto || {});
  return response.data;
};
```

### 4. UX Flow

1. Usuário abre ticket detail
2. Clica em "Converter em Demanda"
3. Modal abre com campos preenchidos (inferência automática como preview)
4. Usuário pode customizar tipo, prioridade, título, descrição
5. Clica em "Criar Demanda"
6. Loading state
7. Success:
   - Toast: "Demanda criada com sucesso!"
   - Badge aparece no ticket: "Demanda #XXXX"
   - Botão muda para "Ver Demanda" (link para /demandas/:id)
8. Error:
   - Se 409 (já existe): "Ticket já possui demanda. Ver demanda?"
   - Se 404: "Ticket não encontrado"

---

## 🔄 Integração com Redmine (Futura)

Quando o sistema de Redmine estiver ativo:

1. **Após criar demanda**: Se empresa tem Redmine habilitado, chamar `redmineService.criarIssueParaDemanda()`
2. **Sincronização bidirecional**: Cron job atualiza demanda quando issue muda no Redmine
3. **Badge adicional**: "Vinculado ao Redmine #123" com link externo

---

## 📊 Métricas

Adicionar ao Dashboard de Atendimento:

- Total de tickets convertidos em demandas (hoje, semana, mês)
- Taxa de conversão: (tickets convertidos / total tickets) %
- Tempo médio entre abertura do ticket e conversão
- Tipos de demanda mais comuns por conversão

---

## 🚀 Próximos Passos

1. ✅ **Backend completo** (implementado)
2. ⏳ **Frontend**:
   - [ ] Botão "Converter em Demanda" em TicketDetailPage
   - [ ] Modal ConvertTicketModal
   - [ ] Service method converterTicketEmDemanda()
   - [ ] Badge de demanda vinculada
   - [ ] Toast notifications
3. ⏳ **Testes**:
   - [ ] Testes unitários do service
   - [ ] Testes de integração do endpoint
   - [ ] Testes E2E (Playwright)
4. ⏳ **Documentação**:
   - [ ] Adicionar ao manual do usuário
   - [ ] Criar video tutorial
5. ⏳ **Melhorias futuras**:
   - [ ] Converter múltiplos tickets em batch
   - [ ] Template de conversão por tipo de fila
   - [ ] Automação: auto-converter tickets com keywords específicas

---

## 📚 Referências

- **Entity**: `backend/src/modules/atendimento/entities/demanda.entity.ts`
- **Service**: `backend/src/modules/atendimento/services/demanda.service.ts` (linha 260+)
- **Controller**: `backend/src/modules/atendimento/controllers/demanda.controller.ts` (linha 60+)
- **Design Guidelines**: `frontend-web/DESIGN_GUIDELINES.md`
- **Padrão de Modals**: `frontend-web/src/components/modals/*`

---

**Atualizado**: 23/12/2025  
**Próxima revisão**: Após implementação do frontend
