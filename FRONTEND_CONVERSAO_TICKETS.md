# 🎨 Frontend: Implementação Conversão Ticket → Demanda

## 📋 Checklist de Implementação

- [ ] 1. Criar `demandaService.ts`
- [ ] 2. Criar `ConvertTicketModal.tsx`
- [ ] 3. Atualizar `TicketDetailPage.tsx`
- [ ] 4. Adicionar rota `/demandas` no `App.tsx`
- [ ] 5. Adicionar menu "Demandas" no `menuConfig.ts`
- [ ] 6. Criar `DemandasPage.tsx` (listagem)
- [ ] 7. Testar fluxo completo

---

## 📂 Estrutura de Arquivos

```
frontend-web/src/
├── services/
│   └── demandaService.ts          ← CRIAR (Passo 1)
├── components/
│   └── modals/
│       └── ConvertTicketModal.tsx ← CRIAR (Passo 2)
├── pages/
│   ├── TicketDetailPage.tsx       ← ATUALIZAR (Passo 3)
│   └── DemandasPage.tsx           ← CRIAR (Passo 6)
├── App.tsx                        ← ATUALIZAR (Passo 4)
└── config/
    └── menuConfig.ts              ← ATUALIZAR (Passo 5)
```

---

## 🔧 Passo 1: Criar Service

### Arquivo: `frontend-web/src/services/demandaService.ts`

```typescript
import api from './api';

export interface Demanda {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: 'tecnica' | 'comercial' | 'suporte' | 'financeira' | 'integracao' | 'treinamento' | 'outra';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'aberta' | 'em_andamento' | 'em_espera' | 'concluida' | 'cancelada';
  ticketId?: string;
  clienteId?: string;
  contatoTelefone?: string;
  dataAbertura: string;
  dataVencimento?: string;
  dataConclusao?: string;
  autorId: string;
  responsavelId?: string;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConvertTicketDto {
  tipo?: Demanda['tipo'];
  prioridade?: Demanda['prioridade'];
  titulo?: string;
  descricao?: string;
  dataVencimento?: string;
  clienteId?: string;
}

export interface CreateDemandaDto {
  titulo: string;
  descricao?: string;
  tipo: Demanda['tipo'];
  prioridade: Demanda['prioridade'];
  clienteId?: string;
  contatoTelefone?: string;
  dataVencimento?: string;
  ticketId?: string;
}

export const demandaService = {
  /**
   * Converte um ticket existente em demanda
   */
  async converterTicketEmDemanda(
    ticketId: string, 
    dto: ConvertTicketDto = {}
  ): Promise<Demanda> {
    const response = await api.post(`/demandas/converter-ticket/${ticketId}`, dto);
    return response.data;
  },

  /**
   * Cria uma nova demanda
   */
  async criar(data: CreateDemandaDto): Promise<Demanda> {
    const response = await api.post('/demandas', data);
    return response.data;
  },

  /**
   * Lista todas as demandas da empresa
   */
  async listar(): Promise<Demanda[]> {
    const response = await api.get('/demandas');
    return response.data;
  },

  /**
   * Busca demanda por ID
   */
  async buscarPorId(id: string): Promise<Demanda> {
    const response = await api.get(`/demandas/${id}`);
    return response.data;
  },

  /**
   * Busca demanda vinculada a um ticket
   */
  async buscarPorTicket(ticketId: string): Promise<Demanda> {
    const response = await api.get(`/demandas/ticket/${ticketId}`);
    return response.data;
  },

  /**
   * Lista demandas de um cliente
   */
  async listarPorCliente(clienteId: string): Promise<Demanda[]> {
    const response = await api.get(`/demandas/cliente/${clienteId}`);
    return response.data;
  },

  /**
   * Lista demandas por telefone
   */
  async listarPorTelefone(telefone: string): Promise<Demanda[]> {
    const response = await api.get(`/demandas/telefone/${telefone}`);
    return response.data;
  },

  /**
   * Filtra demandas por status
   */
  async listarPorStatus(status: Demanda['status']): Promise<Demanda[]> {
    const response = await api.get(`/demandas/status/${status}`);
    return response.data;
  },

  /**
   * Atualiza demanda
   */
  async atualizar(id: string, data: Partial<CreateDemandaDto>): Promise<Demanda> {
    const response = await api.patch(`/demandas/${id}`, data);
    return response.data;
  },

  /**
   * Atribui responsável
   */
  async atribuirResponsavel(id: string, responsavelId: string): Promise<Demanda> {
    const response = await api.patch(`/demandas/${id}/responsavel`, { responsavelId });
    return response.data;
  },

  /**
   * Altera status
   */
  async alterarStatus(id: string, status: Demanda['status']): Promise<Demanda> {
    const response = await api.patch(`/demandas/${id}/status`, { status });
    return response.data;
  },

  /**
   * Inicia atendimento (status → em_andamento)
   */
  async iniciar(id: string): Promise<Demanda> {
    const response = await api.patch(`/demandas/${id}/iniciar`);
    return response.data;
  },

  /**
   * Conclui demanda (status → concluida)
   */
  async concluir(id: string): Promise<Demanda> {
    const response = await api.patch(`/demandas/${id}/concluir`);
    return response.data;
  },

  /**
   * Cancela demanda (status → cancelada)
   */
  async cancelar(id: string): Promise<Demanda> {
    const response = await api.patch(`/demandas/${id}/cancelar`);
    return response.data;
  },

  /**
   * Deleta demanda
   */
  async deletar(id: string): Promise<void> {
    await api.delete(`/demandas/${id}`);
  },

  /**
   * Conta demandas de um cliente
   */
  async contarPorCliente(clienteId: string): Promise<{ total: number }> {
    const response = await api.get(`/demandas/cliente/${clienteId}/count`);
    return response.data;
  }
};

/**
 * Helpers para UI
 */
export const demandaHelpers = {
  /**
   * Retorna cor do badge de tipo
   */
  getCorTipo(tipo: Demanda['tipo']): string {
    const cores: Record<Demanda['tipo'], string> = {
      tecnica: 'bg-blue-100 text-blue-800',
      comercial: 'bg-green-100 text-green-800',
      suporte: 'bg-purple-100 text-purple-800',
      financeira: 'bg-yellow-100 text-yellow-800',
      integracao: 'bg-indigo-100 text-indigo-800',
      treinamento: 'bg-pink-100 text-pink-800',
      outra: 'bg-gray-100 text-gray-800'
    };
    return cores[tipo];
  },

  /**
   * Retorna cor do badge de prioridade
   */
  getCorPrioridade(prioridade: Demanda['prioridade']): string {
    const cores: Record<Demanda['prioridade'], string> = {
      baixa: 'bg-gray-100 text-gray-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-orange-100 text-orange-800',
      critica: 'bg-red-100 text-red-800'
    };
    return cores[prioridade];
  },

  /**
   * Retorna cor do badge de status
   */
  getCorStatus(status: Demanda['status']): string {
    const cores: Record<Demanda['status'], string> = {
      aberta: 'bg-blue-100 text-blue-800',
      em_andamento: 'bg-yellow-100 text-yellow-800',
      em_espera: 'bg-gray-100 text-gray-800',
      concluida: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    return cores[status];
  },

  /**
   * Formata label do tipo
   */
  getLabelTipo(tipo: Demanda['tipo']): string {
    const labels: Record<Demanda['tipo'], string> = {
      tecnica: 'Técnica',
      comercial: 'Comercial',
      suporte: 'Suporte',
      financeira: 'Financeira',
      integracao: 'Integração',
      treinamento: 'Treinamento',
      outra: 'Outra'
    };
    return labels[tipo];
  },

  /**
   * Formata label da prioridade
   */
  getLabelPrioridade(prioridade: Demanda['prioridade']): string {
    const labels: Record<Demanda['prioridade'], string> = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      critica: 'Crítica'
    };
    return labels[prioridade];
  },

  /**
   * Formata label do status
   */
  getLabelStatus(status: Demanda['status']): string {
    const labels: Record<Demanda['status'], string> = {
      aberta: 'Aberta',
      em_andamento: 'Em Andamento',
      em_espera: 'Em Espera',
      concluida: 'Concluída',
      cancelada: 'Cancelada'
    };
    return labels[status];
  }
};
```

---

## 🎨 Passo 2: Criar Modal

### Arquivo: `frontend-web/src/components/modals/ConvertTicketModal.tsx`

**Ver código completo em `PROGRESSO_CONVERSAO_TICKETS.md` seção "Frontend → Modal"**

---

## 🔗 Passo 3: Integrar no Ticket Detail

### Arquivo: `frontend-web/src/pages/TicketDetailPage.tsx`

**Modificações:**

1. **Adicionar imports:**
```typescript
import { useState, useEffect } from 'react';
import { FileCheck, RefreshCw } from 'lucide-react';
import { ConvertTicketModal } from '../components/modals/ConvertTicketModal';
import { demandaService } from '../services/demandaService';
```

2. **Adicionar states:**
```typescript
const [showConvertModal, setShowConvertModal] = useState(false);
const [demandaVinculada, setDemandaVinculada] = useState<string | null>(null);
const [loadingDemanda, setLoadingDemanda] = useState(false);
```

3. **Verificar se ticket já tem demanda (dentro do useEffect principal):**
```typescript
useEffect(() => {
  const checkDemanda = async () => {
    if (!ticket?.id) return;
    
    try {
      setLoadingDemanda(true);
      const demanda = await demandaService.buscarPorTicket(ticket.id);
      setDemandaVinculada(demanda.id);
    } catch (err) {
      // Ticket ainda não foi convertido
      setDemandaVinculada(null);
    } finally {
      setLoadingDemanda(false);
    }
  };
  
  checkDemanda();
}, [ticket?.id]);
```

4. **Adicionar botão no header da página:**
```tsx
{/* Após os outros botões do header */}
<div className="flex gap-3">
  {loadingDemanda ? (
    <div className="px-4 py-2 bg-gray-100 rounded-lg animate-pulse">
      Verificando...
    </div>
  ) : demandaVinculada ? (
    <a 
      href={`/demandas/${demandaVinculada}`}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
    >
      <FileCheck className="h-4 w-4" />
      Ver Demanda Vinculada
    </a>
  ) : (
    <button
      onClick={() => setShowConvertModal(true)}
      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Converter em Demanda
    </button>
  )}
</div>
```

5. **Adicionar modal antes do return final:**
```tsx
<ConvertTicketModal
  ticketId={ticket.id}
  ticketNumero={ticket.numero}
  ticketAssunto={ticket.assunto}
  isOpen={showConvertModal}
  onClose={() => setShowConvertModal(false)}
  onSuccess={(demandaId) => {
    setDemandaVinculada(demandaId);
    setShowConvertModal(false);
    // Opcional: mostrar toast
    alert(`Ticket convertido com sucesso! Demanda ID: ${demandaId}`);
  }}
/>
```

---

## 🗺️ Passo 4: Adicionar Rota

### Arquivo: `frontend-web/src/App.tsx`

```tsx
import DemandasPage from './pages/DemandasPage';

// Dentro de <Routes>:
<Route path="/demandas" element={<DemandasPage />} />
<Route path="/demandas/:id" element={<DemandaDetailPage />} />
```

---

## 📱 Passo 5: Adicionar Menu

### Arquivo: `frontend-web/src/config/menuConfig.ts`

```typescript
import { FileText } from 'lucide-react';

// Dentro do módulo Atendimento:
{
  id: 'atendimento-demandas',
  title: 'Demandas',
  icon: FileText,
  path: '/demandas',
  description: 'Gestão de demandas convertidas de tickets'
}
```

---

## 📄 Passo 6: Criar Página de Listagem

### Arquivo: `frontend-web/src/pages/DemandasPage.tsx`

**Template Base**: Copiar `_TemplateWithKPIsPage.tsx`

```powershell
Copy-Item frontend-web/src/pages/_TemplateWithKPIsPage.tsx frontend-web/src/pages/DemandasPage.tsx
```

**Modificações:**

1. **Substituir imports:**
```typescript
import { demandaService, Demanda, demandaHelpers } from '../services/demandaService';
```

2. **Atualizar KPI cards:**
```tsx
{/* Total de Demandas */}
<div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
        Total de Demandas
      </p>
      <p className="mt-2 text-3xl font-bold text-[#002333]">
        {demandas.length}
      </p>
    </div>
    <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center">
      <FileText className="h-6 w-6 text-[#159A9C]" />
    </div>
  </div>
</div>

{/* Demandas Abertas */}
<div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
        Abertas
      </p>
      <p className="mt-2 text-3xl font-bold text-[#002333]">
        {demandas.filter(d => d.status === 'aberta').length}
      </p>
    </div>
    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
      <AlertCircle className="h-6 w-6 text-blue-600" />
    </div>
  </div>
</div>

{/* Em Andamento */}
<div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
        Em Andamento
      </p>
      <p className="mt-2 text-3xl font-bold text-[#002333]">
        {demandas.filter(d => d.status === 'em_andamento').length}
      </p>
    </div>
    <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
      <Clock className="h-6 w-6 text-yellow-600" />
    </div>
  </div>
</div>

{/* Críticas */}
<div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
        Críticas
      </p>
      <p className="mt-2 text-3xl font-bold text-[#002333]">
        {demandas.filter(d => d.prioridade === 'critica').length}
      </p>
    </div>
    <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
      <AlertTriangle className="h-6 w-6 text-red-600" />
    </div>
  </div>
</div>
```

3. **Renderizar cards de demandas:**
```tsx
{demandas.map((demanda) => (
  <div 
    key={demanda.id}
    className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-6"
  >
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-[#002333] mb-2">
          {demanda.titulo}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {demanda.descricao || 'Sem descrição'}
        </p>
      </div>
    </div>

    {/* Badges */}
    <div className="flex flex-wrap gap-2 mb-4">
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${demandaHelpers.getCorTipo(demanda.tipo)}`}>
        {demandaHelpers.getLabelTipo(demanda.tipo)}
      </span>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${demandaHelpers.getCorPrioridade(demanda.prioridade)}`}>
        {demandaHelpers.getLabelPrioridade(demanda.prioridade)}
      </span>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${demandaHelpers.getCorStatus(demanda.status)}`}>
        {demandaHelpers.getLabelStatus(demanda.status)}
      </span>
    </div>

    {/* Info */}
    <div className="flex items-center justify-between text-sm text-gray-500">
      <span>Aberta em {new Date(demanda.dataAbertura).toLocaleDateString('pt-BR')}</span>
      {demanda.ticketId && (
        <span className="flex items-center gap-1">
          <FileCheck className="h-4 w-4" />
          Convertida de Ticket
        </span>
      )}
    </div>

    {/* Actions */}
    <div className="mt-4 flex gap-2">
      <a
        href={`/demandas/${demanda.id}`}
        className="flex-1 px-4 py-2 bg-[#159A9C] text-white text-center rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
      >
        Ver Detalhes
      </a>
    </div>
  </div>
))}
```

---

## ✅ Passo 7: Testar

### Checklist de Testes:

1. **Listagem de Tickets**
   - [ ] Acesse `/tickets`
   - [ ] Clique em um ticket para abrir detalhes

2. **Conversão**
   - [ ] Clique em "Converter em Demanda"
   - [ ] Teste modo automático (sem preencher campos)
   - [ ] Teste modo manual (preencher tipo e prioridade)
   - [ ] Verifique que modal fecha após sucesso

3. **Idempotência**
   - [ ] Tente converter o mesmo ticket novamente
   - [ ] Botão deve mudar para "Ver Demanda Vinculada"

4. **Listagem de Demandas**
   - [ ] Acesse `/demandas`
   - [ ] Verifique KPI cards (total, abertas, em andamento, críticas)
   - [ ] Veja se demanda convertida aparece na lista

5. **Detalhes da Demanda**
   - [ ] Clique em "Ver Detalhes" em uma demanda
   - [ ] Verifique se mostra link para o ticket original

---

## 🐛 Troubleshooting Frontend

### Erro: "Cannot read property 'map' of undefined"
- Inicialize state com array vazio: `const [demandas, setDemandas] = useState<Demanda[]>([]);`

### Erro: "Network Error"
- Verifique se backend está rodando: `http://localhost:3001`
- Confirme que `api.ts` tem `baseURL: 'http://localhost:3001'`

### Modal não abre
- Verifique state `showConvertModal`
- Confirme prop `isOpen={showConvertModal}`

### Botão não muda após conversão
- Verifique se `onSuccess` chama `setDemandaVinculada(demandaId)`
- Confirme que `useEffect` busca demanda ao carregar página

---

## 📊 Resultado Esperado

Após implementar tudo:

1. ✅ Botão "Converter em Demanda" aparece em tickets sem demanda
2. ✅ Modal permite conversão automática ou manual
3. ✅ Após converter, botão muda para "Ver Demanda Vinculada"
4. ✅ Página `/demandas` lista todas as demandas com KPIs
5. ✅ Cards de demanda mostram badges de tipo, prioridade e status
6. ✅ Click em "Ver Detalhes" abre página da demanda específica

---

**Tempo Estimado Total**: 4-6 horas  
**Complexidade**: Média  
**Prioridade**: Alta (Feature completa backend→frontend)

---

**Data**: 23/12/2025  
**Status**: Aguardando implementação  
**Backend**: ✅ Pronto para uso
