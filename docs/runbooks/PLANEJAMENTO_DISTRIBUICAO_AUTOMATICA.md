# 🎯 Planejamento: Distribuição Automática de Filas

**Data**: 7 de novembro de 2025  
**Branch**: consolidacao-atendimento  
**Prioridade**: 🔥 ALTA  
**Tempo Estimado**: 3-5 dias  

---

## 📋 Objetivo

Implementar sistema de **distribuição automática de tickets** para atendentes, eliminando atribuição manual e otimizando a carga de trabalho.

### **Problema Atual**:
```
❌ Tickets ficam "em fila" aguardando atribuição manual
❌ Gerente precisa distribuir manualmente
❌ Desbalanceamento de carga (alguns atendem muito, outros pouco)
❌ Sem priorização inteligente
❌ Sem métricas de distribuição
```

### **Solução Proposta**:
```
✅ Distribuição automática baseada em algoritmo configurável
✅ Round-robin: Revezamento justo entre atendentes
✅ Menor carga: Atribui para quem tem menos tickets
✅ Skills-based: Atribui baseado em habilidades/departamento
✅ Dashboard de métricas em tempo real
✅ Configuração granular por fila
```

---

## 🏗️ Arquitetura

### **Fluxo de Distribuição**:
```
Novo Ticket → Fila → Algoritmo de Distribuição → Atendente Disponível
                ↓
          Regras aplicadas:
          1. Disponibilidade (status: online/offline)
          2. Capacidade máxima não atingida
          3. Skills compatíveis
          4. Carga atual (tickets ativos)
          5. Prioridade do ticket
```

### **Algoritmos Suportados**:

#### 1️⃣ **Round-Robin** (Revezamento)
```typescript
// Distribui para próximo atendente da lista (circular)
próximoAtendente = (últimoÍndice + 1) % totalAtendentes
```
- ✅ **Vantagem**: Distribuição justa e igualitária
- ❌ **Desvantagem**: Não considera carga atual

#### 2️⃣ **Menor Carga** (Load Balancing)
```typescript
// Distribui para atendente com menos tickets ativos
atendente = min(atendentes, key: ticket.count)
```
- ✅ **Vantagem**: Balanceamento real de carga
- ❌ **Desvantagem**: Pode sobrecarregar atendentes rápidos

#### 3️⃣ **Skills-Based** (Por Habilidades)
```typescript
// Distribui baseado em skills/departamento
atendente = atendentes.filter(skill.matches(ticket.categoria))
                      .min(ticket.count)
```
- ✅ **Vantagem**: Especialização (técnico → suporte técnico)
- ❌ **Desvantagem**: Requer configuração de skills

#### 4️⃣ **Híbrido** (Recomendado!)
```typescript
// Combina skills + menor carga
1. Filtrar atendentes por skill
2. Dentre os qualificados, pegar o de menor carga
3. Se nenhum qualificado, distribuir por menor carga geral
```
- ✅ **Vantagem**: Melhor dos dois mundos
- ✅ **Uso recomendado**: Produção

---

## 📦 Implementação

### **Fase 1: Backend - Core de Distribuição** (2 dias)

#### **1.1. Entidades e Migrations**

**Nova tabela: `distribuicao_config`**
```sql
CREATE TABLE distribuicao_config (
  id UUID PRIMARY KEY,
  fila_id UUID REFERENCES fila(id),
  algoritmo VARCHAR(50), -- 'round-robin' | 'menor-carga' | 'skills' | 'hibrido'
  ativo BOOLEAN DEFAULT true,
  capacidade_maxima INT DEFAULT 10, -- max tickets por atendente
  priorizar_online BOOLEAN DEFAULT true,
  considerar_skills BOOLEAN DEFAULT false,
  tempo_timeout_min INT DEFAULT 30, -- timeout para realocar
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Nova tabela: `atendente_skills`**
```sql
CREATE TABLE atendente_skills (
  id UUID PRIMARY KEY,
  atendente_id UUID REFERENCES user(id),
  skill VARCHAR(100), -- 'suporte-tecnico', 'vendas', 'financeiro'
  nivel INT DEFAULT 1, -- 1-5 (básico → expert)
  created_at TIMESTAMP
);
```

**Nova tabela: `distribuicao_log`**
```sql
CREATE TABLE distribuicao_log (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES ticket(id),
  atendente_id UUID REFERENCES user(id),
  fila_id UUID REFERENCES fila(id),
  algoritmo VARCHAR(50),
  motivo TEXT, -- 'menor-carga', 'round-robin', 'skill-match'
  timestamp TIMESTAMP
);
```

#### **1.2. Services**

**`DistribuicaoService`**:
```typescript
@Injectable()
export class DistribuicaoService {
  // Core
  async distribuirTicket(ticketId: string): Promise<Atendente>
  async realocarTicket(ticketId: string, motivo: string): Promise<Atendente>
  
  // Algoritmos
  private roundRobin(fila: Fila): Atendente
  private menorCarga(fila: Fila): Atendente
  private skillsBased(fila: Fila, ticket: Ticket): Atendente
  private hibrido(fila: Fila, ticket: Ticket): Atendente
  
  // Validações
  private isAtendenteDisponivel(atendente: Atendente): boolean
  private atingiuCapacidadeMaxima(atendente: Atendente): boolean
  private temSkillNecessaria(atendente: Atendente, ticket: Ticket): boolean
  
  // Métricas
  async getMetricasDistribuicao(filaId: string): Promise<Metricas>
  async getHistoricoDistribuicao(filaId: string): Promise<Log[]>
}
```

**`AtendenteService` (estendido)**:
```typescript
// Adicionar métodos
async getAtendentesDisponiveis(filaId: string): Promise<Atendente[]>
async getCargaAtual(atendenteId: string): Promise<number>
async getSkills(atendenteId: string): Promise<Skill[]>
async atualizarStatus(atendenteId: string, status: 'online' | 'offline' | 'ausente'): Promise<void>
```

#### **1.3. Controllers**

**`DistribuicaoController`**:
```typescript
// Configuração
GET    /api/distribuicao/config/:filaId
POST   /api/distribuicao/config
PUT    /api/distribuicao/config/:id

// Operações
POST   /api/distribuicao/distribuir/:ticketId
POST   /api/distribuicao/realocar/:ticketId

// Métricas
GET    /api/distribuicao/metricas/:filaId
GET    /api/distribuicao/historico/:filaId

// Atendente Skills
GET    /api/atendentes/:id/skills
POST   /api/atendentes/:id/skills
DELETE /api/atendentes/:id/skills/:skillId
```

#### **1.4. WebSocket Events**

**Novos eventos**:
```typescript
// Servidor → Cliente
socket.emit('ticket_distribuido', {
  ticketId,
  atendenteId,
  algoritmo,
  timestamp
});

socket.emit('atendente_status_mudou', {
  atendenteId,
  statusAnterior,
  statusNovo,
  timestamp
});

// Cliente → Servidor
socket.on('marcar_disponivel', ({ atendenteId }));
socket.on('marcar_ausente', ({ atendenteId }));
```

---

### **Fase 2: Frontend - Dashboard & Configuração** (1-2 dias)

#### **2.1. Páginas**

**`ConfiguracaoDistribuicaoPage.tsx`**:
```tsx
// Features:
- Seletor de fila
- Seletor de algoritmo (radio buttons)
- Configurações específicas:
  - Capacidade máxima por atendente (slider)
  - Priorizar atendentes online (toggle)
  - Considerar skills (toggle)
  - Timeout de realocação (input)
- Preview de como distribuição funcionará
- Botão "Testar Distribuição" (simula com dados fake)
```

**`DashboardDistribuicaoPage.tsx`**:
```tsx
// KPI Cards:
- Total de tickets distribuídos (hoje/semana/mês)
- Tempo médio de distribuição (segundos)
- Taxa de sucesso (%)
- Atendentes ativos agora

// Gráficos:
- Distribuição por atendente (bar chart)
- Tickets ao longo do tempo (line chart)
- Algoritmo mais usado (pie chart)

// Tabela:
- Histórico de distribuições (últimas 50)
  - Ticket, Atendente, Algoritmo, Timestamp
```

**`GestaoSkillsPage.tsx`**:
```tsx
// Features:
- Lista de atendentes
- Adicionar/remover skills por atendente
- Níveis de proficiência (1-5 stars)
- Filtrar atendentes por skill
- Exportar matriz de skills (CSV)
```

#### **2.2. Componentes**

**`AlgoritmoSelector.tsx`**:
```tsx
interface Props {
  value: 'round-robin' | 'menor-carga' | 'skills' | 'hibrido';
  onChange: (algoritmo: string) => void;
}

// Visual: Cards com ícones e descrição de cada algoritmo
```

**`AtendenteStatusBadge.tsx`**:
```tsx
// Badge colorido: verde (online), amarelo (ausente), cinza (offline)
```

**`DistribuicaoSimulator.tsx`**:
```tsx
// Simula distribuição com dados fake
// Mostra visualmente como tickets seriam distribuídos
```

#### **2.3. Services**

**`distribuicaoService.ts`**:
```typescript
export const distribuicaoService = {
  // Config
  getConfig: (filaId: string) => api.get(`/distribuicao/config/${filaId}`),
  salvarConfig: (config: ConfigDistribuicao) => api.post('/distribuicao/config', config),
  
  // Operações
  distribuirTicket: (ticketId: string) => api.post(`/distribuicao/distribuir/${ticketId}`),
  realocarTicket: (ticketId: string) => api.post(`/distribuicao/realocar/${ticketId}`),
  
  // Métricas
  getMetricas: (filaId: string) => api.get(`/distribuicao/metricas/${filaId}`),
  getHistorico: (filaId: string) => api.get(`/distribuicao/historico/${filaId}`),
};
```

---

### **Fase 3: Integração & Testes** (1 dia)

#### **3.1. Integração com Chat**

**Modificar `ChatOmnichannel.tsx`**:
```tsx
// Adicionar indicador de distribuição automática
{ticket.distribuicaoAutomatica && (
  <Badge variant="success">Auto-Distribuído</Badge>
)}

// Mostrar qual atendente recebeu
{ticket.distribuicaoLog && (
  <Tooltip content={`Distribuído via ${ticket.distribuicaoLog.algoritmo}`}>
    <Info className="h-4 w-4" />
  </Tooltip>
)}
```

#### **3.2. Testes Automatizados**

**Backend**:
```typescript
describe('DistribuicaoService', () => {
  it('deve distribuir via round-robin', async () => {
    // Mock 3 atendentes
    // Criar 6 tickets
    // Verificar: cada atendente recebeu 2 tickets
  });
  
  it('deve distribuir via menor carga', async () => {
    // Atendente A: 5 tickets
    // Atendente B: 2 tickets
    // Novo ticket deve ir para B
  });
  
  it('deve respeitar skills', async () => {
    // Ticket categoria "técnico"
    // Apenas atendentes com skill "suporte-técnico"
  });
  
  it('deve realocar se timeout', async () => {
    // Ticket sem resposta por 30 min
    // Deve ser realocado automaticamente
  });
});
```

**Frontend**:
```typescript
describe('ConfiguracaoDistribuicaoPage', () => {
  it('deve salvar configuração', async () => {
    // Selecionar algoritmo
    // Ajustar capacidade
    // Clicar "Salvar"
    // Verificar: API chamada com dados corretos
  });
});
```

#### **3.3. Testes Manuais**

**Cenário 1: Round-Robin**:
1. Configurar fila com round-robin
2. Criar 3 tickets
3. Verificar: distribuídos igualmente

**Cenário 2: Menor Carga**:
1. Atendente A já tem 5 tickets
2. Atendente B tem 1 ticket
3. Criar novo ticket
4. Verificar: vai para B

**Cenário 3: Skills**:
1. Criar ticket categoria "Vendas"
2. Apenas vendedores têm skill "vendas"
3. Verificar: vai para vendedor

---

## 📊 Métricas de Sucesso

### **KPIs a Monitorar**:
- ✅ **Tempo de Distribuição**: < 2 segundos
- ✅ **Taxa de Sucesso**: > 95%
- ✅ **Balanceamento**: Desvio padrão < 20% entre atendentes
- ✅ **Satisfação**: Atendentes relatam carga justa
- ✅ **Performance**: Sistema suporta 100 distribuições/min

---

## 🚀 Roadmap de Implementação

### **Semana 1** (7-11 nov):
- [ ] Dia 1: Entities, DTOs, Migrations
- [ ] Dia 2: DistribuicaoService (algoritmos)
- [ ] Dia 3: Controllers + WebSocket events
- [ ] Dia 4: Frontend - ConfiguracaoDistribuicaoPage
- [ ] Dia 5: Frontend - DashboardDistribuicaoPage

### **Semana 2** (14-18 nov):
- [ ] Dia 1: GestaoSkillsPage
- [ ] Dia 2: Integração com chat
- [ ] Dia 3: Testes automatizados
- [ ] Dia 4: Testes manuais + ajustes
- [ ] Dia 5: Deploy + documentação

---

## 🎯 Entregáveis

### **Documentação**:
- [ ] `DISTRIBUICAO_AUTOMATICA_README.md`
- [ ] `GUIA_CONFIGURACAO_ALGORITMOS.md`
- [ ] Diagramas de fluxo (Mermaid)
- [ ] API documentation (Swagger)

### **Código**:
- [ ] Backend: Entities, Services, Controllers
- [ ] Frontend: 3 páginas + 5 componentes
- [ ] Testes: 80%+ coverage
- [ ] Migrations: Reversíveis

### **Deploy**:
- [ ] Migration rodada em produção
- [ ] Feature flag (habilitar gradualmente)
- [ ] Monitoramento de métricas

---

## ⚠️ Riscos e Mitigações

### **Risco 1: Sobrecarga de atendentes rápidos**
- **Mitigação**: Usar algoritmo híbrido (skills + menor carga)
- **Fallback**: Adicionar pausa automática após X tickets

### **Risco 2: Tickets ficam sem atendente**
- **Mitigação**: Overflow para fila backup
- **Fallback**: Notificação para supervisor

### **Risco 3: Performance em alta carga**
- **Mitigação**: Cache de atendentes disponíveis (Redis)
- **Fallback**: Fila de processamento assíncrono

---

## 📚 Referências

- Zendesk: Round-robin assignment
- Intercom: Skills-based routing
- Freshdesk: Load balancing algorithms
- Twilio Flex: TaskRouter architecture

---

**Preparado por**: GitHub Copilot  
**Data**: 7 de novembro de 2025  
**Status**: 🎯 **PRONTO PARA INICIAR**
