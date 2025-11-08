# 📊 Planejamento: SLA Tracking System

**Data**: 8 de novembro de 2025  
**Feature**: Sistema de SLA (Service Level Agreement)  
**Objetivo**: Monitorar e garantir tempos de resposta conforme acordos estabelecidos

---

## 🎯 Visão Geral

Sistema completo de gerenciamento de SLA para atendimento com:
- ✅ Configuração de SLAs por prioridade e canal
- ✅ Cálculo automático de tempo de resposta
- ✅ Alertas de violação em tempo real
- ✅ Dashboard de compliance e métricas
- ✅ Indicadores visuais nos tickets
- ✅ Relatórios e auditoria

---

## 📋 Estrutura de Dados

### Entity 1: `SlaConfig`

```typescript
@Entity('sla_configs')
export class SlaConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  // Prioridade: baixa, normal, alta, urgente
  @Column({ type: 'varchar', length: 20 })
  prioridade: string;

  // Canal: whatsapp, email, chat, telefone, todos
  @Column({ type: 'varchar', length: 50, nullable: true })
  canal: string;

  // Tempos em MINUTOS
  @Column({ type: 'int' })
  tempoRespostaMinutos: number; // Tempo para primeira resposta

  @Column({ type: 'int' })
  tempoResolucaoMinutos: number; // Tempo para resolução completa

  // Horários de funcionamento
  @Column({ type: 'jsonb', nullable: true })
  horariosFuncionamento: {
    segunda: { inicio: string; fim: string; ativo: boolean };
    terca: { inicio: string; fim: string; ativo: boolean };
    quarta: { inicio: string; fim: string; ativo: boolean };
    quinta: { inicio: string; fim: string; ativo: boolean };
    sexta: { inicio: string; fim: string; ativo: boolean };
    sabado: { inicio: string; fim: string; ativo: boolean };
    domingo: { inicio: string; fim: string; ativo: boolean };
  };

  // Configurações de alerta
  @Column({ type: 'int', default: 80 })
  alertaPercentual: number; // Alertar quando atingir X% do tempo

  @Column({ type: 'boolean', default: true })
  notificarEmail: boolean;

  @Column({ type: 'boolean', default: true })
  notificarSistema: boolean;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'uuid' })
  empresaId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Entity 2: `SlaEventLog`

```typescript
@Entity('sla_event_logs')
export class SlaEventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ticketId: string;

  @Column({ type: 'uuid', nullable: true })
  slaConfigId: string;

  // Tipo de evento: violacao, alerta, resolucao_no_prazo, escalacao
  @Column({ type: 'varchar', length: 50 })
  tipoEvento: string;

  // Status: em_risco, violado, cumprido
  @Column({ type: 'varchar', length: 30 })
  status: string;

  @Column({ type: 'int', nullable: true })
  tempoRespostaMinutos: number; // Tempo real que levou para responder

  @Column({ type: 'int', nullable: true })
  tempoResolucaoMinutos: number; // Tempo real para resolver

  @Column({ type: 'int', nullable: true })
  tempoLimiteMinutos: number; // Tempo limite configurado

  @Column({ type: 'int', nullable: true })
  percentualUsado: number; // % do tempo usado (ex: 85%)

  @Column({ type: 'text', nullable: true })
  detalhes: string;

  @Column({ type: 'uuid' })
  empresaId: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 🔧 Backend - Estrutura

### DTOs

**create-sla-config.dto.ts**:
```typescript
export class CreateSlaConfigDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsIn(['baixa', 'normal', 'alta', 'urgente'])
  prioridade: string;

  @IsString()
  @IsOptional()
  canal?: string;

  @IsInt()
  @Min(1)
  tempoRespostaMinutos: number;

  @IsInt()
  @Min(1)
  tempoResolucaoMinutos: number;

  @IsObject()
  @IsOptional()
  horariosFuncionamento?: any;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  alertaPercentual?: number;

  @IsBoolean()
  @IsOptional()
  notificarEmail?: boolean;

  @IsBoolean()
  @IsOptional()
  notificarSistema?: boolean;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
```

### Service - Métodos Principais

**sla.service.ts**:
```typescript
export class SlaService {
  // CRUD
  async criar(dto: CreateSlaConfigDto, empresaId: string): Promise<SlaConfig>
  async listar(empresaId: string): Promise<SlaConfig[]>
  async buscarPorId(id: string, empresaId: string): Promise<SlaConfig>
  async atualizar(id: string, dto: UpdateSlaConfigDto, empresaId: string): Promise<SlaConfig>
  async deletar(id: string, empresaId: string): Promise<void>

  // Cálculos
  async calcularSlaTicket(ticketId: string): Promise<SlaCalculoResult>
  async verificarViolacoes(empresaId: string): Promise<SlaEventLog[]>
  
  // Métricas
  async buscarMetricas(empresaId: string, filtros?: SlaMetricasFilter): Promise<SlaMetricas>
  async buscarHistorico(ticketId: string): Promise<SlaEventLog[]>
  
  // Alertas
  async gerarAlerta(ticketId: string, percentualUsado: number): Promise<void>
  async buscarAlertas(empresaId: string): Promise<SlaEventLog[]>
}
```

**Interfaces de Retorno**:
```typescript
interface SlaCalculoResult {
  ticketId: string;
  prioridade: string;
  canal: string;
  slaConfigId: string;
  tempoDecorridoMinutos: number;
  tempoLimiteMinutos: number;
  percentualUsado: number;
  status: 'cumprido' | 'em_risco' | 'violado';
  tempoRestanteMinutos: number;
  dataLimite: Date;
}

interface SlaMetricas {
  totalTickets: number;
  ticketsCumpridos: number;
  ticketsEmRisco: number;
  ticketsViolados: number;
  percentualCumprimento: number;
  tempoMedioResposta: number;
  tempoMedioResolucao: number;
  violacoesPorPrioridade: {
    baixa: number;
    normal: number;
    alta: number;
    urgente: number;
  };
  violacoesPorCanal: Record<string, number>;
}
```

### Controller - Endpoints

**sla.controller.ts**:
```typescript
// CRUD de Configurações
POST   /atendimento/sla/configs
GET    /atendimento/sla/configs
GET    /atendimento/sla/configs/:id
PUT    /atendimento/sla/configs/:id
DELETE /atendimento/sla/configs/:id

// Cálculos e Monitoramento
GET    /atendimento/sla/tickets/:ticketId/calculo
GET    /atendimento/sla/violacoes
GET    /atendimento/sla/alertas

// Métricas e Relatórios
GET    /atendimento/sla/metricas
GET    /atendimento/sla/metricas/historico
GET    /atendimento/sla/tickets/:ticketId/historico

// Ações
POST   /atendimento/sla/tickets/:ticketId/recalcular
POST   /atendimento/sla/verificar-todos
```

---

## 🎨 Frontend - Estrutura

### Service

**slaService.ts**:
```typescript
export interface SlaConfig {
  id: string;
  nome: string;
  descricao?: string;
  prioridade: string;
  canal?: string;
  tempoRespostaMinutos: number;
  tempoResolucaoMinutos: number;
  horariosFuncionamento?: any;
  alertaPercentual: number;
  notificarEmail: boolean;
  notificarSistema: boolean;
  ativo: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlaCalculoResult {
  ticketId: string;
  status: 'cumprido' | 'em_risco' | 'violado';
  percentualUsado: number;
  tempoRestanteMinutos: number;
  dataLimite: string;
}

// Métodos
listarConfigs(): Promise<SlaConfig[]>
criarConfig(data: CreateSlaConfigDto): Promise<SlaConfig>
atualizarConfig(id: string, data: UpdateSlaConfigDto): Promise<SlaConfig>
deletarConfig(id: string): Promise<void>
calcularSlaTicket(ticketId: string): Promise<SlaCalculoResult>
buscarMetricas(): Promise<SlaMetricas>
buscarViolacoes(): Promise<SlaEventLog[]>
buscarAlertas(): Promise<SlaEventLog[]>
```

### Páginas

#### 1. **ConfiguracaoSLAPage.tsx**

**Funcionalidades**:
- Lista de configurações SLA em cards
- CRUD completo (criar, editar, deletar)
- Modal de formulário com:
  - Nome e descrição
  - Seletor de prioridade (baixa, normal, alta, urgente)
  - Seletor de canal (todos, whatsapp, email, chat)
  - Input de tempo de resposta (em minutos ou horas)
  - Input de tempo de resolução
  - Configurador de horários de funcionamento (7 dias da semana)
  - Slider de percentual de alerta (0-100%)
  - Toggles de notificação (email, sistema)
- Filtros: prioridade, canal, ativo/inativo
- Busca por nome
- Estados: loading, error, empty

**Design**:
- KPI cards: Total de configs, Configs ativas, Prioridade mais restritiva
- Grid responsivo de cards
- Badges de prioridade com cores
- Indicadores de tempo (formato amigável: "2h", "30min", "1d")

#### 2. **DashboardSLAPage.tsx**

**Funcionalidades**:
- KPI Cards principais:
  - Taxa de cumprimento (%)
  - Tickets em risco (com alerta)
  - Tickets violados (com erro)
  - Tempo médio de resposta
- Gráficos:
  - Pizza: Cumpridos vs Em Risco vs Violados
  - Barras: Violações por prioridade
  - Linha: Evolução de cumprimento (últimos 7 dias)
- Tabela de violações recentes:
  - Ticket ID
  - Prioridade
  - Tempo limite
  - Tempo decorrido
  - Status (badge colorido)
  - Ações
- Filtros: período, prioridade, canal
- Exportar relatório (CSV)

**Design**:
- Dashboard executivo clean
- Cores semafóricas:
  - Verde (#16A34A): Cumprido
  - Amarelo (#FBBF24): Em risco (>80%)
  - Vermelho (#DC2626): Violado
- Animações suaves
- Refresh automático a cada 30 segundos

#### 3. **Integração ChatOmnichannel**

**Funcionalidades**:
- Badge SLA no card do ticket:
  - Verde: "No prazo" (0-79%)
  - Amarelo: "Atenção" (80-99%)
  - Vermelho: "Violado" (100%+)
- Tooltip com detalhes:
  - "Faltam 15 minutos para o limite"
  - "Limite excedido em 2 horas"
- Contador regressivo visual
- Alerta sonoro quando entrar em risco

---

## 📊 Lógica de Cálculo de SLA

### 1. Tempo de Resposta
```typescript
// Calcula tempo desde criação até primeira resposta do atendente
tempoResposta = primeiraRespostaDoAtendente - ticketCriadoEm
```

### 2. Tempo de Resolução
```typescript
// Calcula tempo desde criação até status "resolvido"
tempoResolucao = ticketResolvidoEm - ticketCriadoEm
```

### 3. Considerar Horário de Funcionamento
```typescript
// Se horários configurados, considerar apenas horário comercial
// Ex: Ticket criado 18h sexta, SLA conta a partir de 8h segunda
function calcularTempoUtil(inicio: Date, fim: Date, horarios: HorariosFuncionamento): number {
  // Implementar lógica de dias úteis e horários
  // Excluir finais de semana se necessário
  // Excluir horários fora do expediente
}
```

### 4. Status do SLA
```typescript
function determinarStatus(percentualUsado: number): string {
  if (percentualUsado >= 100) return 'violado';
  if (percentualUsado >= 80) return 'em_risco';
  return 'cumprido';
}
```

### 5. Geração de Alertas
```typescript
// Verificar periodicamente (a cada 5 minutos via cron job)
async function verificarSLAs() {
  const ticketsAbertos = await buscarTicketsAbertos();
  
  for (const ticket of ticketsAbertos) {
    const calculo = await calcularSlaTicket(ticket.id);
    
    if (calculo.percentualUsado >= 80 && calculo.percentualUsado < 100) {
      await gerarAlerta(ticket.id, calculo.percentualUsado);
    }
    
    if (calculo.percentualUsado >= 100) {
      await registrarViolacao(ticket.id);
    }
  }
}
```

---

## 🧪 Casos de Teste

### Testes E2E - 20 testes

1. ✅ Visualização inicial da página de configuração
2. ✅ Criar config SLA para prioridade "urgente"
3. ✅ Criar config SLA para prioridade "normal"
4. ✅ Editar tempo de resposta de config existente
5. ✅ Deletar config SLA
6. ✅ Filtrar por prioridade
7. ✅ Buscar por nome
8. ✅ Ativar/desativar config
9. ✅ Configurar horários de funcionamento
10. ✅ Dashboard: visualizar KPI cards
11. ✅ Dashboard: visualizar gráficos
12. ✅ Dashboard: tabela de violações
13. ✅ Cálculo SLA: ticket dentro do prazo (verde)
14. ✅ Cálculo SLA: ticket em risco (amarelo)
15. ✅ Cálculo SLA: ticket violado (vermelho)
16. ✅ Chat: badge SLA aparece no ticket
17. ✅ Chat: tooltip mostra tempo restante
18. ✅ Alertas: lista de tickets em risco
19. ✅ Validação: tempo resposta < tempo resolução
20. ✅ Performance: dashboard com 100+ tickets

---

## 📁 Estrutura de Arquivos

```
Backend:
├── backend/src/modules/atendimento/entities/
│   ├── sla-config.entity.ts ✅ CRIAR
│   └── sla-event-log.entity.ts ✅ CRIAR
├── backend/src/modules/atendimento/dto/sla/
│   ├── create-sla-config.dto.ts ✅ CRIAR
│   ├── update-sla-config.dto.ts ✅ CRIAR
│   └── sla-metricas-filter.dto.ts ✅ CRIAR
├── backend/src/modules/atendimento/services/
│   └── sla.service.ts ✅ CRIAR (400+ linhas)
├── backend/src/modules/atendimento/controllers/
│   └── sla.controller.ts ✅ CRIAR (200+ linhas)
└── backend/src/migrations/
    └── [timestamp]-CreateSlaTables.ts ✅ CRIAR

Frontend:
├── frontend-web/src/services/
│   └── slaService.ts ✅ CRIAR (250+ linhas)
├── frontend-web/src/pages/
│   ├── ConfiguracaoSLAPage.tsx ✅ CRIAR (700+ linhas)
│   └── DashboardSLAPage.tsx ✅ CRIAR (600+ linhas)
└── frontend-web/src/features/atendimento/omnichannel/components/
    └── SLABadge.tsx ✅ CRIAR (componente reutilizável)

Documentação:
├── PLANEJAMENTO_SLA_TRACKING.md ✅ ESTE ARQUIVO
├── CONCLUSAO_SLA_BACKEND.md (após backend completo)
├── CONCLUSAO_SLA_FRONTEND.md (após frontend completo)
└── EXECUCAO_TESTES_SLA.md (após testes E2E)
```

---

## ⏱️ Estimativa de Tempo

| Etapa | Tempo Estimado |
|-------|----------------|
| Planejamento | ✅ 30 min |
| Backend (Entities + DTOs) | 1h |
| Backend (Service) | 3h |
| Backend (Controller) | 1h |
| Migration + Testes backend | 1h |
| Frontend (Service) | 1h |
| Frontend (Config Page) | 2h |
| Frontend (Dashboard) | 2h |
| Integração Chat (Badge SLA) | 1h |
| Rotas + Menu | 30 min |
| Testes E2E | 2h |
| **TOTAL** | **15-17 horas** |

---

## 🎯 Próximos Passos (Ordem de Execução)

1. ✅ **Planejamento** (CONCLUÍDO)
2. ⏳ **Criar Entities** (sla-config.entity.ts, sla-event-log.entity.ts)
3. ⏳ **Criar DTOs** (validações)
4. ⏳ **Implementar Service** (lógica de cálculo)
5. ⏳ **Criar Controller** (endpoints REST)
6. ⏳ **Migration** (tabelas + índices)
7. ⏳ **Registrar no Module**
8. ⏳ **Frontend Service**
9. ⏳ **Página de Configuração**
10. ⏳ **Dashboard SLA**
11. ⏳ **Badge no Chat**
12. ⏳ **Testes E2E**

---

## 💡 Considerações Importantes

### Performance
- Índices em: empresaId, ticketId, prioridade, status, createdAt
- Cache de configs SLA em memória (atualizar a cada 5 min)
- Cron job para verificação periódica (não bloquear requisições)

### Escalabilidade
- Sistema preparado para milhares de tickets simultâneos
- Cálculos em background (não bloquear UI)
- Possibilidade de processar SLA em fila (Bull/Redis)

### UX
- Indicadores visuais claros (cores semafóricas)
- Notificações não invasivas
- Tooltips informativos
- Contadores em tempo real

### Segurança
- Todas as rotas protegidas com JwtAuthGuard
- Validação de empresaId em todas as operações
- Logs de auditoria de violações

---

**Status**: ✅ PLANEJAMENTO CONCLUÍDO  
**Próximo Passo**: Criar Entities do SLA  
**Data**: 8 de novembro de 2025
