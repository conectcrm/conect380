# Implementação: Conversão de Tickets em Demandas

**Data**: 23 de dezembro de 2025  
**Status**: Proposta de Implementação  
**Objetivo**: Permitir que tickets de atendimento sejam convertidos em demandas (tarefas) para acompanhamento posterior

---

## 📊 Análise da Situação Atual

### ✅ O Que Já Existe

#### 1. **Entity Demanda** (Completa e Funcional)
- **Localização**: `backend/src/modules/atendimento/entities/demanda.entity.ts`
- **Campos Principais**:
  - `id`: UUID único
  - `clienteId`: Vinculação com cliente (opcional)
  - `ticketId`: **Vinculação com ticket (já existe!)**
  - `contatoTelefone`: Fallback quando não há cliente cadastrado
  - `empresaId`: Multi-tenant
  - `titulo`: Título resumido (max 200 chars)
  - `descricao`: Descrição detalhada
  - `tipo`: tecnica | comercial | financeira | suporte | reclamacao | solicitacao | outros
  - `prioridade`: baixa | media | alta | urgente
  - `status`: aberta | em_andamento | aguardando | concluida | cancelada
  - `dataVencimento`: Prazo opcional
  - `dataConclusao`: Data de finalização
  - `responsavelId`: Quem resolve a demanda
  - `autorId`: Quem criou

#### 2. **Service Demanda** (CRUD Completo)
- **Localização**: `backend/src/modules/atendimento/services/demanda.service.ts`
- **Métodos Disponíveis**:
  - ✅ `criar(dto, autorId, empresaId)`: Cria nova demanda
  - ✅ `buscarPorId(id)`: Busca uma demanda
  - ✅ `buscarPorCliente(clienteId)`: Todas as demandas de um cliente
  - ✅ `buscarPorTelefone(telefone)`: Demandas por telefone
  - ✅ `buscarPorTicket(ticketId)`: **Demandas de um ticket específico**
  - ✅ `buscarPorStatus(status)`: Filtrar por status
  - ✅ `atualizar(id, dto)`: Atualizar demanda
  - ✅ `atribuirResponsavel(id, responsavelId)`: Atribuir responsável
  - ✅ `iniciarAndamento(id)`: Mudar status para em_andamento
  - ✅ `concluir(id)`: Marcar como concluída
  - ✅ `cancelar(id)`: Cancelar demanda

#### 3. **Frontend: Hook useDemandas** (Integração Pronta)
- **Localização**: `frontend-web/src/hooks/useDemandas.ts`
- **Usado em**: `ChatOmnichannel.tsx` (painel direito do atendimento)
- **Funções**:
  - `carregarDemandas({ clienteId, ticketId, telefone })`
  - `criarDemanda(novaDemanda)`
  - `atualizarDemanda(id, dados)`
  - `deletarDemanda(id)`

#### 4. **Frontend: Modal AbrirDemandaModal**
- **Localização**: `frontend-web/src/features/atendimento/omnichannel/modals/AbrirDemandaModal.tsx`
- **Já Usado**: Chat Omnichannel (botão "Abrir Demanda")

---

## 🎯 O Que Falta Implementar

### 1. **Backend: Método de Conversão no TicketService**

#### Arquivo: `backend/src/modules/atendimento/services/ticket.service.ts`

**Novo método**:

```typescript
/**
 * Converter ticket em demanda
 * 
 * Cria uma demanda vinculada ao ticket, preservando:
 * - Cliente/telefone do ticket
 * - Assunto do ticket como título
 * - Resumo do histórico como descrição
 * - Prioridade do ticket
 * - Atendente atual como responsável (ou autor se não houver atendente)
 * 
 * @param ticketId - ID do ticket a ser convertido
 * @param userId - ID do usuário que está fazendo a conversão (autor)
 * @param dadosAdicionais - Dados opcionais para customizar a demanda
 * @returns Demanda criada
 */
async converterEmDemanda(
  ticketId: string,
  userId: string,
  dadosAdicionais?: {
    titulo?: string;           // Sobrescrever título (default: assunto do ticket)
    tipo?: 'tecnica' | 'comercial' | 'financeira' | 'suporte' | 'reclamacao' | 'solicitacao' | 'outros';
    dataVencimento?: Date;     // Definir prazo
    descricao?: string;        // Adicionar descrição customizada
    responsavelId?: string;    // Forçar responsável específico
  },
): Promise<Demanda> {
  this.logger.log(`🔄 Convertendo ticket ${ticketId} em demanda`);

  // 1. Buscar ticket com todas as relações necessárias
  const ticket = await this.ticketRepository.findOne({
    where: { id: ticketId },
    relations: ['atendente', 'cliente'],
  });

  if (!ticket) {
    throw new NotFoundException(`Ticket ${ticketId} não encontrado`);
  }

  // 2. Buscar histórico de mensagens do ticket (últimas 10 para resumo)
  const mensagens = await this.mensagemRepository.find({
    where: { ticketId },
    order: { createdAt: 'DESC' },
    take: 10,
  });

  // 3. Montar descrição com resumo do atendimento
  let descricaoBase = `**Demanda criada a partir do Ticket #${ticket.numero}**\n\n`;
  descricaoBase += `**Assunto Original**: ${ticket.assunto}\n`;
  descricaoBase += `**Canal**: ${ticket.origem}\n`;
  descricaoBase += `**Data do Ticket**: ${ticket.createdAt.toLocaleString('pt-BR')}\n\n`;
  
  if (mensagens.length > 0) {
    descricaoBase += `**Resumo do Histórico** (últimas ${mensagens.length} mensagens):\n`;
    mensagens.reverse().forEach((msg, idx) => {
      const remetente = msg.fromAgent ? 'Atendente' : 'Cliente';
      descricaoBase += `${idx + 1}. [${remetente}] ${msg.content?.substring(0, 100)}${msg.content?.length > 100 ? '...' : ''}\n`;
    });
  }

  // 4. Adicionar descrição customizada se fornecida
  if (dadosAdicionais?.descricao) {
    descricaoBase += `\n**Observações Adicionais**:\n${dadosAdicionais.descricao}`;
  }

  // 5. Mapear prioridade do ticket para demanda
  const prioridadeMap: Record<PrioridadeTicket, Demanda['prioridade']> = {
    [PrioridadeTicket.BAIXA]: 'baixa',
    [PrioridadeTicket.MEDIA]: 'media',
    [PrioridadeTicket.ALTA]: 'alta',
    [PrioridadeTicket.URGENTE]: 'urgente',
  };

  // 6. Inferir tipo de demanda baseado no tipo de ticket
  const tipoInferido = dadosAdicionais?.tipo || this.inferirTipoDemanda(ticket);

  // 7. Definir responsável: prioridade para dadosAdicionais > atendente do ticket > autor
  const responsavelId = 
    dadosAdicionais?.responsavelId || 
    ticket.atendenteId || 
    userId;

  // 8. Criar demanda via DemandaService
  const demandaDto: CreateDemandaDto = {
    titulo: dadosAdicionais?.titulo || ticket.assunto || 'Demanda do Ticket',
    descricao: descricaoBase,
    tipo: tipoInferido,
    prioridade: prioridadeMap[ticket.prioridade] || 'media',
    status: 'aberta',
    clienteId: ticket.clienteId,
    ticketId: ticket.id,
    contatoTelefone: ticket.clienteId ? undefined : ticket.telefone, // Fallback
    empresaId: ticket.empresaId,
    dataVencimento: dadosAdicionais?.dataVencimento,
    responsavelId,
  };

  const demanda = await this.demandaService.criar(demandaDto, userId, ticket.empresaId);

  // 9. Adicionar nota no ticket informando a conversão
  await this.notaService.criar({
    ticketId,
    conteudo: `🔄 Ticket convertido em demanda: "${demanda.titulo}" (ID: ${demanda.id})`,
    autorId: userId,
  });

  this.logger.log(`✅ Ticket ${ticketId} convertido em demanda ${demanda.id}`);

  return demanda;
}

/**
 * Inferir tipo de demanda baseado no contexto do ticket
 * Helper privado
 */
private inferirTipoDemanda(ticket: Ticket): Demanda['tipo'] {
  const assuntoLower = ticket.assunto?.toLowerCase() || '';
  
  // Palavras-chave por tipo
  if (assuntoLower.includes('bug') || assuntoLower.includes('erro') || assuntoLower.includes('sistema')) {
    return 'tecnica';
  }
  if (assuntoLower.includes('venda') || assuntoLower.includes('proposta') || assuntoLower.includes('orçamento')) {
    return 'comercial';
  }
  if (assuntoLower.includes('fatura') || assuntoLower.includes('pagamento') || assuntoLower.includes('cobrança')) {
    return 'financeira';
  }
  if (assuntoLower.includes('dúvida') || assuntoLower.includes('ajuda') || assuntoLower.includes('suporte')) {
    return 'suporte';
  }
  if (assuntoLower.includes('reclamação') || assuntoLower.includes('problema') || assuntoLower.includes('insatisfeito')) {
    return 'reclamacao';
  }
  if (assuntoLower.includes('solicita') || assuntoLower.includes('pedido') || assuntoLower.includes('preciso')) {
    return 'solicitacao';
  }
  
  // Default
  return 'outros';
}
```

---

### 2. **Backend: Endpoint no TicketController**

#### Arquivo: `backend/src/modules/atendimento/controllers/ticket.controller.ts`

**Novo endpoint**:

```typescript
/**
 * POST /tickets/:id/converter-em-demanda
 * Converter ticket em demanda para acompanhamento posterior
 */
@Post(':id/converter-em-demanda')
@ApiOperation({ summary: 'Converter ticket em demanda' })
@ApiParam({ name: 'id', description: 'ID do ticket', type: 'string' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      titulo: { type: 'string', description: 'Título customizado (opcional)' },
      tipo: {
        type: 'string',
        enum: ['tecnica', 'comercial', 'financeira', 'suporte', 'reclamacao', 'solicitacao', 'outros'],
        description: 'Tipo da demanda (opcional, inferido se não fornecido)',
      },
      dataVencimento: { type: 'string', format: 'date-time', description: 'Prazo (opcional)' },
      descricao: { type: 'string', description: 'Observações adicionais (opcional)' },
      responsavelId: { type: 'string', format: 'uuid', description: 'Responsável (opcional)' },
    },
  },
})
@ApiResponse({ status: 201, description: 'Demanda criada com sucesso' })
@ApiResponse({ status: 404, description: 'Ticket não encontrado' })
async converterEmDemanda(
  @Param('id') ticketId: string,
  @Body() body: {
    titulo?: string;
    tipo?: 'tecnica' | 'comercial' | 'financeira' | 'suporte' | 'reclamacao' | 'solicitacao' | 'outros';
    dataVencimento?: string;
    descricao?: string;
    responsavelId?: string;
  },
  @Request() req,
) {
  const userId = req.user.sub; // ID do usuário logado

  const dadosAdicionais = {
    ...body,
    dataVencimento: body.dataVencimento ? new Date(body.dataVencimento) : undefined,
  };

  const demanda = await this.ticketService.converterEmDemanda(
    ticketId,
    userId,
    dadosAdicionais,
  );

  return {
    message: 'Ticket convertido em demanda com sucesso',
    demanda,
  };
}
```

---

### 3. **Backend: DTO para Conversão (Opcional - Validação)**

#### Arquivo: `backend/src/modules/atendimento/dto/converter-ticket-demanda.dto.ts` (NOVO)

```typescript
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConverterTicketEmDemandaDto {
  @ApiPropertyOptional({ description: 'Título customizado da demanda' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Tipo da demanda (inferido automaticamente se não fornecido)',
    enum: ['tecnica', 'comercial', 'financeira', 'suporte', 'reclamacao', 'solicitacao', 'outros'],
  })
  @IsOptional()
  @IsEnum(['tecnica', 'comercial', 'financeira', 'suporte', 'reclamacao', 'solicitacao', 'outros'])
  tipo?: 'tecnica' | 'comercial' | 'financeira' | 'suporte' | 'reclamacao' | 'solicitacao' | 'outros';

  @ApiPropertyOptional({ description: 'Data de vencimento da demanda (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dataVencimento?: string;

  @ApiPropertyOptional({ description: 'Observações adicionais para a demanda' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descricao?: string;

  @ApiPropertyOptional({ description: 'ID do responsável pela demanda (UUID)' })
  @IsOptional()
  @IsUUID()
  responsavelId?: string;
}
```

---

### 4. **Frontend: Botão "Converter em Demanda" no Chat**

#### Arquivo: `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx`

**Localização**: Adicionar no painel direito (InfoCliente) ou na toolbar do ticket

**Código a adicionar**:

```typescript
// 1. State para modal de conversão
const [showModalConverterDemanda, setShowModalConverterDemanda] = useState(false);

// 2. Função de conversão
const handleConverterEmDemanda = async (dados?: {
  titulo?: string;
  tipo?: string;
  dataVencimento?: Date;
  descricao?: string;
  responsavelId?: string;
}) => {
  if (!ticketAtivo?.id) {
    toast.error('Nenhum ticket selecionado');
    return;
  }

  try {
    setSalvando(true);

    const response = await api.post(`/tickets/${ticketAtivo.id}/converter-em-demanda`, dados);

    toast.success('✅ Ticket convertido em demanda com sucesso!');
    
    // Recarregar demandas no painel direito
    if (clienteAtivo?.id) {
      carregarDemandas({ clienteId: clienteAtivo.id });
    } else if (ticketAtivo.id) {
      carregarDemandas({ ticketId: ticketAtivo.id });
    }

    setShowModalConverterDemanda(false);
  } catch (err: unknown) {
    console.error('Erro ao converter ticket em demanda:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erro ao converter ticket';
    toast.error(errorMessage);
  } finally {
    setSalvando(false);
  }
};

// 3. Botão na toolbar do ticket (adicionar ao lado de "Encerrar Ticket")
<button
  onClick={() => setShowModalConverterDemanda(true)}
  disabled={!ticketAtivo || ticketAtivo.status === 'ENCERRADO'}
  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
  title="Converter este ticket em uma demanda para acompanhamento"
>
  <FileText className="h-4 w-4" />
  Converter em Demanda
</button>

// 4. Modal de conversão (opcional - permite customizar antes de converter)
{showModalConverterDemanda && (
  <ModalConverterDemanda
    ticketId={ticketAtivo?.id}
    tituloOriginal={ticketAtivo?.assunto}
    onConfirm={handleConverterEmDemanda}
    onClose={() => setShowModalConverterDemanda(false)}
  />
)}
```

---

### 5. **Frontend: Modal de Conversão (Opcional)**

#### Arquivo: `frontend-web/src/features/atendimento/omnichannel/modals/ModalConverterDemanda.tsx` (NOVO)

```typescript
import React, { useState } from 'react';
import { X, FileText, Calendar, User } from 'lucide-react';

interface ModalConverterDemandaProps {
  ticketId?: string;
  tituloOriginal?: string;
  onConfirm: (dados?: {
    titulo?: string;
    tipo?: string;
    dataVencimento?: Date;
    descricao?: string;
    responsavelId?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const ModalConverterDemanda: React.FC<ModalConverterDemandaProps> = ({
  ticketId,
  tituloOriginal,
  onConfirm,
  onClose,
}) => {
  const [formState, setFormState] = useState({
    titulo: tituloOriginal || '',
    tipo: 'outros' as const,
    dataVencimento: '',
    descricao: '',
    responsavelId: '',
  });
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    const dados = {
      titulo: formState.titulo.trim() || undefined,
      tipo: formState.tipo,
      dataVencimento: formState.dataVencimento ? new Date(formState.dataVencimento) : undefined,
      descricao: formState.descricao.trim() || undefined,
      responsavelId: formState.responsavelId || undefined,
    };

    await onConfirm(dados);
    setSalvando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#159A9C]/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#159A9C]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#002333]">Converter em Demanda</h2>
              <p className="text-sm text-[#002333]/60">Criar demanda a partir deste ticket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#002333]/60 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Título da Demanda
            </label>
            <input
              type="text"
              value={formState.titulo}
              onChange={(e) => setFormState({ ...formState, titulo: e.target.value })}
              placeholder="Deixe vazio para usar o assunto do ticket"
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm"
            />
            <p className="text-xs text-[#002333]/60 mt-1">
              {formState.titulo ? formState.titulo : `Será usado: "${tituloOriginal}"`}
            </p>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Tipo da Demanda
            </label>
            <select
              value={formState.tipo}
              onChange={(e) => setFormState({ ...formState, tipo: e.target.value as any })}
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm"
            >
              <option value="outros">Outros</option>
              <option value="tecnica">Técnica</option>
              <option value="comercial">Comercial</option>
              <option value="financeira">Financeira</option>
              <option value="suporte">Suporte</option>
              <option value="reclamacao">Reclamação</option>
              <option value="solicitacao">Solicitação</option>
            </select>
          </div>

          {/* Data de Vencimento */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data de Vencimento (opcional)
            </label>
            <input
              type="date"
              value={formState.dataVencimento}
              onChange={(e) => setFormState({ ...formState, dataVencimento: e.target.value })}
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Observações Adicionais (opcional)
            </label>
            <textarea
              value={formState.descricao}
              onChange={(e) => setFormState({ ...formState, descricao: e.target.value })}
              placeholder="Adicione informações extras sobre esta demanda..."
              rows={4}
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ O histórico completo do ticket será incluído na descrição da demanda automaticamente.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Convertendo...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Converter em Demanda
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## 🎯 Fluxo de Uso Completo

### Cenário 1: Conversão Rápida (1 clique)

```
1. Atendente está no Chat Omnichannel com ticket aberto
2. Percebe que o assunto requer acompanhamento futuro
3. Clica em "Converter em Demanda" (sem modal)
4. Sistema cria demanda automaticamente:
   - Título: Assunto do ticket
   - Tipo: Inferido do conteúdo
   - Responsável: Atendente atual
   - Descrição: Resumo do histórico
5. Demanda aparece no painel direito
6. Nota adicionada no ticket informando conversão
```

### Cenário 2: Conversão Customizada (com modal)

```
1. Atendente clica em "Converter em Demanda"
2. Modal abre com campos pré-preenchidos
3. Atendente ajusta:
   - Título: "Implementar nova funcionalidade de relatórios"
   - Tipo: Técnica
   - Prazo: 31/12/2025
   - Observações: "Cliente precisa urgente para fechamento do ano"
4. Confirma conversão
5. Sistema cria demanda com dados customizados
6. Demanda aparece no painel direito
```

### Cenário 3: Ticket Encerrado → Demanda Posterior

```
1. Ticket foi encerrado ontem
2. Cliente retorna hoje com nova solicitação relacionada
3. Atendente abre histórico do ticket antigo
4. Clica "Converter em Demanda" (disponível mesmo em tickets encerrados)
5. Sistema cria demanda vinculada ao ticket antigo
6. Novo ticket de hoje pode referenciar a demanda
```

---

## 📋 Checklist de Implementação

### Backend

- [ ] **Implementar método `converterEmDemanda` no TicketService**
  - Buscar ticket com relações
  - Montar descrição com histórico
  - Inferir tipo automaticamente
  - Mapear prioridade
  - Criar demanda via DemandaService
  - Adicionar nota no ticket

- [ ] **Criar endpoint POST /tickets/:id/converter-em-demanda**
  - Validar ticketId
  - Extrair userId do JWT
  - Chamar service
  - Retornar demanda criada

- [ ] **Criar DTO ConverterTicketEmDemandaDto (opcional)**
  - Validações com class-validator
  - Documentação Swagger

- [ ] **Adicionar testes unitários**
  - TicketService.converterEmDemanda
  - Casos: com/sem cliente, com/sem atendente, diferentes tipos

- [ ] **Adicionar testes E2E**
  - POST /tickets/:id/converter-em-demanda
  - Validar criação da demanda
  - Validar nota no ticket

### Frontend

- [ ] **Adicionar botão "Converter em Demanda" no ChatOmnichannel**
  - Toolbar do ticket (ao lado de Encerrar)
  - Estado disabled se ticket não selecionado

- [ ] **Implementar função handleConverterEmDemanda**
  - Chamar endpoint POST
  - Recarregar demandas após conversão
  - Toast de sucesso/erro

- [ ] **Criar ModalConverterDemanda (opcional)**
  - Form com campos customizáveis
  - Pre-fill com dados do ticket
  - Validação de campos

- [ ] **Atualizar service demandaService**
  - Método converterTicket(ticketId, dados)

- [ ] **Adicionar ícone visual nas demandas convertidas**
  - Badge "Ticket #123" na lista de demandas
  - Link de volta para o ticket original

### Banco de Dados

- [ ] **Verificar índices existentes**
  - `atendimento_demandas.ticket_id` (já deve existir)
  - Criar se necessário: `CREATE INDEX idx_demandas_ticket_id ON atendimento_demandas(ticket_id);`

### Documentação

- [ ] **Atualizar README do módulo Atendimento**
  - Documentar funcionalidade de conversão
  - Exemplos de uso

- [ ] **Criar vídeo/GIF demonstrativo**
  - Mostrar fluxo completo
  - Incluir no manual do usuário

---

## 🚀 Prioridade de Implementação

### **FASE 1 - MVP (4-6 horas)**
1. Método `converterEmDemanda` no TicketService (2h)
2. Endpoint no TicketController (1h)
3. Botão no frontend + função de conversão (1h)
4. Testes básicos (1h)

### **FASE 2 - Refinamento (2-3 horas)**
5. Modal customizado (2h)
6. Melhorias na inferência de tipo (30min)
7. Testes E2E (30min)

### **FASE 3 - Polish (1-2 horas)**
8. Badge visual nas demandas (30min)
9. Link de volta para ticket original (30min)
10. Documentação completa (1h)

---

## 💡 Sugestões de Melhorias Futuras

### 1. **Conversão em Lote**
```typescript
POST /tickets/converter-em-demandas-lote
Body: {
  ticketIds: ['uuid1', 'uuid2', ...],
  dadosComuns: { tipo: 'tecnica', responsavelId: 'uuid' }
}
```

### 2. **Regras Automáticas de Conversão**
- Configurar: "Tickets do tipo X com prioridade Y converter automaticamente ao encerrar"
- Exemplo: "Tickets de suporte técnico com prioridade ALTA → demanda técnica automática"

### 3. **Template de Conversão por Tipo**
- Definir templates por empresa
- Exemplo: Template "Bug Report" → tipo=tecnica, prazo=7dias

### 4. **Workflow de Aprovação**
- Conversões acima de prioridade ALTA requerem aprovação do supervisor
- Notificação automática

### 5. **Relatório de Demandas Geradas**
- Dashboard: "Demandas criadas a partir de tickets"
- Métricas: taxa de conversão, tempo médio de resolução

---

## 🎓 Considerações Importantes

### **Multi-Tenant**
✅ Já contemplado - tanto Ticket quanto Demanda têm `empresaId`

### **Permissões**
- Quem pode converter? → Atendentes com permissão `atendimento:tickets:write`
- Adicionar permissão específica? → `atendimento:demandas:create` (já deve existir)

### **Rastreabilidade**
- ✅ Demanda guarda `ticketId` → link direto
- ✅ Nota no ticket informa conversão
- ✅ `autorId` registra quem converteu

### **Reversão**
- Deletar demanda NÃO deve deletar ticket (relação opcional)
- Considerar flag `demandaGeradaDeTicket` para filtros

### **Performance**
- Conversão deve ser rápida (~500ms)
- Histórico limitado a 10 mensagens (ajustável)
- Cache de inferência de tipo

---

## 📚 Referências de Código

### Estruturas Existentes
- **Entity Demanda**: `backend/src/modules/atendimento/entities/demanda.entity.ts`
- **Service Demanda**: `backend/src/modules/atendimento/services/demanda.service.ts`
- **DTO Create Demanda**: `backend/src/modules/atendimento/dto/create-demanda.dto.ts`
- **Hook useDemandas**: `frontend-web/src/hooks/useDemandas.ts`
- **Modal Abrir Demanda**: `frontend-web/src/features/atendimento/omnichannel/modals/AbrirDemandaModal.tsx`

### Arquivos a Modificar
- `backend/src/modules/atendimento/services/ticket.service.ts` - adicionar método converterEmDemanda
- `backend/src/modules/atendimento/controllers/ticket.controller.ts` - adicionar endpoint
- `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx` - adicionar botão + função

### Arquivos a Criar
- `backend/src/modules/atendimento/dto/converter-ticket-demanda.dto.ts` - DTO de conversão
- `frontend-web/src/features/atendimento/omnichannel/modals/ModalConverterDemanda.tsx` - Modal customizado

---

**Última atualização**: 23 de dezembro de 2025  
**Status**: Aguardando aprovação para implementação
