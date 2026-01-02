# 📚 Guia Completo - Sistema de Filas

**Versão**: 1.0.0  
**Data**: Novembro 2025  
**Autor**: Equipe ConectCRM

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estratégias de Distribuição](#estratégias-de-distribuição)
4. [Guia de Configuração](#guia-de-configuração)
5. [Gestão de Capacidade](#gestão-de-capacidade)
6. [Dashboard de Métricas](#dashboard-de-métricas)
7. [Integração com ChatOmnichannel](#integração-com-chatomnichannel)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

---

## 🎯 Visão Geral

O **Sistema de Filas** é um módulo completo de gerenciamento e distribuição automática de atendimentos (tickets) entre atendentes, com suporte a **3 estratégias de distribuição** e **métricas em tempo real**.

### Principais Funcionalidades

✅ **Gestão de Filas**
- Criar, editar e deletar filas
- Ativar/desativar filas
- Configurar estratégia de distribuição
- Habilitar/desabilitar distribuição automática

✅ **Gestão de Atendentes**
- Adicionar/remover atendentes da fila
- Definir capacidade máxima por atendente
- Configurar prioridade (para estratégia POR_PRIORIDADE)
- Visualizar disponibilidade em tempo real

✅ **Distribuição Inteligente**
- **ROUND_ROBIN**: Distribuição circular equitativa
- **MENOR_CARGA**: Prioriza atendente com menos tickets
- **POR_PRIORIDADE**: Distribui por nível de expertise

✅ **Métricas e Monitoramento**
- Total de atendentes na fila
- Atendentes disponíveis
- Capacidade total vs utilizada
- Percentual de utilização
- Tempo médio de atendimento

✅ **Integração ChatOmnichannel**
- Selecionar fila para ticket
- Auto-distribuição ao selecionar fila
- Indicador visual da fila no header
- Remover fila do ticket

---

## 🏗️ Arquitetura

### Stack Tecnológico

**Backend**:
- NestJS (Framework)
- TypeORM (ORM)
- PostgreSQL (Banco de dados)
- Class-validator (Validação de DTOs)

**Frontend**:
- React 18 (Framework)
- TypeScript (Tipagem)
- Zustand (State management)
- Tailwind CSS (Estilização)
- Lucide React (Ícones)

### Estrutura de Entidades

```
┌─────────────────┐
│      Fila       │
├─────────────────┤
│ id              │ UUID
│ nome            │ string
│ descricao       │ string
│ estrategia      │ enum
│ autoDistribuir  │ boolean
│ ativo           │ boolean
│ empresaId       │ UUID
└────────┬────────┘
         │ 1:N
         │
         ▼
┌─────────────────────────┐
│   FilaAtendente         │
├─────────────────────────┤
│ id                      │ UUID
│ filaId                  │ UUID (FK)
│ atendenteId             │ UUID (FK)
│ capacidadeMaxima        │ number
│ prioridade              │ number
│ atendimentosAtuais      │ number
└───────────┬─────────────┘
            │ N:1
            │
            ▼
     ┌────────────┐
     │   Ticket   │
     ├────────────┤
     │ id         │ UUID
     │ filaId     │ UUID (FK)
     │ atendente  │ Atendente
     └────────────┘
```

### Fluxo de Distribuição

```
┌──────────────────────────────────────────────────────┐
│ 1. Ticket criado ou fila atribuída                  │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│ 2. Verificar se distribuicaoAutomatica = true       │
└─────────────────────┬────────────────────────────────┘
                      │ Sim
                      ▼
┌──────────────────────────────────────────────────────┐
│ 3. FilaService.distribuirTicket()                   │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
            ┌─────────┴──────────┐
            │                    │
            ▼                    ▼
    ┌───────────────┐    ┌───────────────┐
    │ ROUND_ROBIN   │    │ MENOR_CARGA   │
    └───────┬───────┘    └───────┬───────┘
            │                    │
            └─────────┬──────────┘
                      │
                      ▼
            ┌──────────────────┐
            │ POR_PRIORIDADE   │
            └─────────┬────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│ 4. Atualizar ticket.atendenteId                      │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│ 5. Notificar atendente (WebSocket)                  │
└──────────────────────────────────────────────────────┘
```

---

## 🎲 Estratégias de Distribuição

### 1. ROUND_ROBIN (Distribuição Circular)

**Descrição**: Distribui tickets de forma circular e equitativa entre todos os atendentes disponíveis.

**Como Funciona**:
1. Mantém índice do último atendente que recebeu ticket
2. Próximo ticket vai para o próximo atendente na lista
3. Ao chegar no fim da lista, volta para o primeiro

**Quando Usar**:
- ✅ Todos os atendentes têm a mesma capacidade técnica
- ✅ Todos os tickets têm complexidade similar
- ✅ Objetivo é balanceamento simples e justo

**Exemplo**:
```
Atendentes: [A, B, C]

Ticket 1 → A
Ticket 2 → B
Ticket 3 → C
Ticket 4 → A (volta ao início)
Ticket 5 → B
Ticket 6 → C
```

**Configuração**:
```typescript
{
  estrategiaDistribuicao: 'ROUND_ROBIN',
  distribuicaoAutomatica: true
}
```

---

### 2. MENOR_CARGA (Balanceamento por Carga)

**Descrição**: Prioriza o atendente que está com **menos atendimentos atuais**.

**Como Funciona**:
1. Conta atendimentos ativos de cada atendente
2. Ordena atendentes por carga (menor → maior)
3. Atribui ticket ao primeiro com menor carga

**Quando Usar**:
- ✅ Atendentes têm capacidades diferentes
- ✅ Tickets têm tempos de resolução variados
- ✅ Objetivo é evitar sobrecarga

**Exemplo**:
```
Estado Inicial:
Atendente A: 3 tickets
Atendente B: 1 ticket
Atendente C: 2 tickets

Novo Ticket → B (menor carga: 1)

Estado Após:
Atendente A: 3 tickets
Atendente B: 2 tickets ✅ (recebeu novo)
Atendente C: 2 tickets
```

**Configuração**:
```typescript
{
  estrategiaDistribuicao: 'MENOR_CARGA',
  distribuicaoAutomatica: true
}
```

---

### 3. POR_PRIORIDADE (Expertise)

**Descrição**: Distribui tickets com base na **prioridade do atendente** (nível de senioridade/expertise).

**Como Funciona**:
1. Cada atendente tem uma prioridade (1=baixa, 5=alta)
2. Ordena atendentes por prioridade (maior → menor)
3. Atribui ticket ao atendente de maior prioridade disponível

**Quando Usar**:
- ✅ Equipe com diferentes níveis de senioridade
- ✅ Tickets complexos devem ir para seniores
- ✅ Objetivo é otimizar qualidade do atendimento

**Exemplo**:
```
Atendentes:
Senior (prioridade: 5, capacidade: 10)
Pleno (prioridade: 3, capacidade: 15)
Júnior (prioridade: 1, capacidade: 20)

Ticket 1 → Senior ✅
Ticket 2 → Senior ✅
...
(Quando Senior atingir capacidade)
Ticket N → Pleno ✅
```

**Configuração**:
```typescript
{
  estrategiaDistribuicao: 'POR_PRIORIDADE',
  distribuicaoAutomatica: true,
  atendentes: [
    { atendenteId: 'uuid-1', prioridade: 5, capacidadeMaxima: 10 }, // Senior
    { atendenteId: 'uuid-2', prioridade: 3, capacidadeMaxima: 15 }, // Pleno
    { atendenteId: 'uuid-3', prioridade: 1, capacidadeMaxima: 20 }  // Júnior
  ]
}
```

---

## ⚙️ Guia de Configuração

### Passo 1: Criar Fila

**Acesso**: Menu → **Atendimento** → **Gestão de Filas**  
**URL**: `/nuclei/atendimento/filas`

1. Clicar em **"Nova Fila"**
2. Preencher formulário:
   - **Nome**: Ex: "Suporte Técnico"
   - **Descrição**: Ex: "Fila para atendimentos técnicos"
   - **Estratégia**: Selecionar uma das 3 opções
   - **Distribuição Automática**: ✅ (recomendado)
   - **Status**: Ativo
3. Clicar em **"Salvar"**

**Resultado**: Fila criada e visível na lista.

---

### Passo 2: Adicionar Atendentes

1. Clicar no card da fila
2. Clicar em **"Adicionar Atendente"**
3. Preencher:
   - **Atendente**: Selecionar da lista
   - **Capacidade Máxima**: Ex: 10 (tickets simultâneos)
   - **Prioridade**: Ex: 3 (apenas para estratégia POR_PRIORIDADE)
4. Clicar em **"Adicionar"**

**Resultado**: Atendente adicionado à fila com configurações definidas.

---

### Passo 3: Configurar Capacidades

**Capacidade Máxima** define quantos atendimentos simultâneos um atendente pode ter.

**Recomendações**:
- **Júnior**: 5-8 tickets
- **Pleno**: 8-12 tickets
- **Senior**: 10-15 tickets

**Como ajustar**:
1. Clicar no atendente na lista
2. Editar campo "Capacidade Máxima"
3. Salvar

---

### Passo 4: Testar Distribuição

1. Ir para **ChatOmnichannel**
2. Criar novo atendimento
3. Clicar no botão **Users** (ícone) no header
4. Selecionar a fila criada
5. Escolher **"Distribuir Automaticamente"**
6. Confirmar

**Resultado**: Ticket distribuído automaticamente conforme estratégia configurada.

---

## 📊 Gestão de Capacidade

### KPI Cards

A página de Filas exibe 4 KPI cards principais:

1. **Total de Filas**
   - Soma de todas as filas (ativas + inativas)
   
2. **Filas Ativas**
   - Filas com status = Ativo
   
3. **Filas Inativas**
   - Filas com status = Inativo
   
4. **Total de Atendentes**
   - Soma de atendentes em todas as filas

### Métricas da Fila

Cada fila exibe métricas individuais:

```typescript
interface MetricasFila {
  totalAtendentes: number;           // Total de atendentes na fila
  atendentesDisponiveis: number;     // Atendentes abaixo da capacidade
  ticketsNaFila: number;             // Tickets aguardando distribuição
  capacidadeTotal: number;           // Soma de capacidadeMaxima de todos
  capacidadeUtilizada: number;       // Soma de atendimentosAtuais
  percentualUtilizacao: number;      // (utilizada / total) * 100
  tempoMedioAtendimento: number;     // Em segundos
}
```

### Semáforo de Capacidade

- 🟢 **Verde** (0-70%): Capacidade OK
- 🟡 **Amarelo** (71-90%): Próximo do limite
- 🔴 **Vermelho** (91-100%): Capacidade esgotada

---

## 📈 Dashboard de Métricas

### Endpoint de Métricas

**GET** `/api/filas/:id/metricas`

**Response**:
```json
{
  "totalAtendentes": 5,
  "atendentesDisponiveis": 3,
  "ticketsNaFila": 12,
  "capacidadeTotal": 50,
  "capacidadeUtilizada": 28,
  "percentualUtilizacao": 56.0,
  "tempoMedioAtendimento": 240
}
```

### Visualização no Frontend

As métricas são exibidas em **cards limpos** no estilo Crevasse:

```
┌─────────────────────────┐
│ TOTAL ATENDENTES        │
│         5               │
│ 3 disponíveis           │
└─────────────────────────┘

┌─────────────────────────┐
│ CAPACIDADE              │
│       56%               │
│ 28/50 tickets           │
└─────────────────────────┘
```

---

## 🔗 Integração com ChatOmnichannel

### Fluxo Completo

1. **Usuário cria ticket** (sem fila)
2. **Botão "Selecionar Fila"** aparece no header (ícone Users)
3. **Clicar no botão** abre `SelecionarFilaModal`
4. **Selecionar fila** e escolher:
   - "Distribuir Automaticamente" (recomendado)
   - OU selecionar atendente manualmente
5. **Confirmar**: Ticket recebe `filaId` + `atendenteId`
6. **FilaIndicator** aparece no header (badge)
7. **Hover no badge**: Tooltip com detalhes
8. **Clicar no X**: Remove fila do ticket

### Componentes

#### SelecionarFilaModal

**Props**:
```typescript
interface SelecionarFilaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  onFilaSelecionada?: (fila: Fila, atendenteId: string) => void;
}
```

**Funcionalidades**:
- Lista filas ativas
- Mostra atendentes disponíveis por fila
- Opção de auto-distribuição
- Validação de capacidade

#### FilaIndicator

**Props**:
```typescript
interface FilaIndicatorProps {
  filaId: string;
  onRemove?: () => void;
}
```

**Funcionalidades**:
- Badge com nome da fila
- Tooltip com detalhes (atendente, estratégia)
- Botão remover (X)

---

## ✅ Best Practices

### 1. Escolha da Estratégia

| Cenário | Estratégia Recomendada |
|---------|------------------------|
| Equipe homogênea | ROUND_ROBIN |
| Capacidades variadas | MENOR_CARGA |
| Diferentes níveis de senioridade | POR_PRIORIDADE |

### 2. Configuração de Capacidades

- **Não sobrecarregar**: Deixar 20% de margem de segurança
- **Monitorar regularmente**: Ajustar conforme desempenho real
- **Considerar complexidade**: Tickets complexos exigem menor capacidade

### 3. Auto-Distribuição

✅ **Sempre habilitar** para:
- Atendimentos 24/7
- Alto volume de tickets
- Necessidade de SLA rígido

❌ **Desabilitar** quando:
- Tickets exigem análise prévia
- Atendentes devem escolher tickets manualmente
- Período de treinamento

### 4. Monitoramento

- **Diário**: Verificar percentual de utilização
- **Semanal**: Ajustar capacidades conforme necessário
- **Mensal**: Revisar estratégia de distribuição

### 5. Performance

- **Limite de atendentes**: Máximo 20 por fila
- **Limite de filas**: Máximo 50 ativas simultaneamente
- **Cache de métricas**: Calcular a cada 5 minutos (não em tempo real)

---

## 🐛 Troubleshooting

### Problema: Distribuição não está funcionando

**Sintomas**: Tickets não recebem atendente automaticamente

**Soluções**:
1. ✅ Verificar se `distribuicaoAutomatica = true`
2. ✅ Verificar se fila está ativa
3. ✅ Verificar se há atendentes na fila
4. ✅ Verificar se atendentes têm capacidade disponível

---

### Problema: Atendente não aparece como disponível

**Sintomas**: Atendente com capacidade livre não recebe tickets

**Soluções**:
1. ✅ Verificar `capacidadeMaxima` configurada
2. ✅ Verificar `atendimentosAtuais` (pode estar desatualizado)
3. ✅ Forçar recalcular métricas: GET `/api/filas/:id/metricas`

---

### Problema: Erro 400 "Nenhum atendente disponível"

**Sintomas**: Ao distribuir ticket, retorna erro

**Soluções**:
1. ✅ Adicionar mais atendentes à fila
2. ✅ Aumentar `capacidadeMaxima` dos atendentes existentes
3. ✅ Encerrar atendimentos antigos para liberar capacidade

---

### Problema: Métricas desatualizadas

**Sintomas**: Números nos KPI cards não batem com realidade

**Soluções**:
1. ✅ Recarregar página (F5)
2. ✅ Verificar conexão WebSocket (tempo real)
3. ✅ Limpar cache do navegador

---

### Problema: Fila não aparece em SelecionarFilaModal

**Sintomas**: Modal não mostra fila criada

**Soluções**:
1. ✅ Verificar se fila está ativa
2. ✅ Verificar se fila tem ao menos 1 atendente
3. ✅ Verificar se `empresaId` da fila corresponde ao usuário logado

---

## 📚 API Reference

### Endpoints

#### Filas

```
POST   /api/filas                    Criar fila
GET    /api/filas                    Listar filas (com paginação)
GET    /api/filas/:id                Buscar fila por ID
PATCH  /api/filas/:id                Atualizar fila
DELETE /api/filas/:id                Deletar fila
GET    /api/filas/:id/metricas       Obter métricas da fila
```

#### Atendentes na Fila

```
POST   /api/filas/:id/atendentes                   Adicionar atendente
GET    /api/filas/:id/atendentes                   Listar atendentes da fila
PATCH  /api/filas/:id/atendentes/:atendenteId     Atualizar capacidade/prioridade
DELETE /api/filas/:id/atendentes/:atendenteId     Remover atendente
```

#### Distribuição

```
POST   /api/filas/:id/distribuir    Distribuir ticket para atendente
```

---

## 🎓 Exemplos de Código

### Exemplo 1: Criar Fila via API

```typescript
// Frontend - filaService.ts
const fila = await filaService.criar({
  nome: 'Suporte Premium',
  descricao: 'Atendimento para clientes VIP',
  estrategiaDistribuicao: 'POR_PRIORIDADE',
  distribuicaoAutomatica: true,
  ativo: true,
  empresaId: 'uuid-empresa'
});

console.log('Fila criada:', fila.id);
```

### Exemplo 2: Adicionar Atendente

```typescript
// Frontend - filaService.ts
await filaService.adicionarAtendente('fila-uuid', {
  atendenteId: 'atendente-uuid',
  capacidadeMaxima: 12,
  prioridade: 4
});
```

### Exemplo 3: Distribuir Ticket

```typescript
// Backend - fila.service.ts
const resultado = await filaService.distribuirTicket({
  filaId: 'fila-uuid',
  ticketId: 'ticket-uuid',
  distribuicaoAutomatica: true
});

console.log('Ticket distribuído para:', resultado.atendenteId);
```

---

## 📞 Suporte

**Dúvidas ou Problemas?**

- 📧 Email: suporte@conectcrm.com
- 💬 Chat: ChatOmnichannel interno
- 📚 Docs: [docs.conectcrm.com](https://docs.conectcrm.com)

---

**Última Atualização**: Novembro 2025  
**Versão do Sistema**: 1.0.0  
**Desenvolvido por**: Equipe ConectCRM
