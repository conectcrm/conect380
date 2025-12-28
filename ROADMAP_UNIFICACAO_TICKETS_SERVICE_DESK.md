# 🚀 Roadmap: Unificação Tickets + Demandas → Service Desk Profissional

**Data de Criação**: 28 de dezembro de 2025  
**Objetivo**: Transformar sistema de atendimento em Service Desk profissional (padrão Movidesk)  
**Prazo Estimado**: 4 sprints (8 semanas)  
**Status**: 📋 Planejamento

---

## 🎯 Visão Geral

### Problema Atual
- ❌ **Duplicação**: Tickets E Demandas fazem a mesma coisa
- ❌ **Confusão**: Usuários não sabem quando usar cada um
- ❌ **Limitação**: Falta SLA, categorização, portal do cliente
- ❌ **Não-padrão**: Diferente de Movidesk/Zendesk/Freshdesk

### Solução Proposta
- ✅ **Unificar**: 1 entidade só - Ticket expandido
- ✅ **Categorizar**: Tipos, categorias, prioridades com SLA
- ✅ **Padronizar**: Workflow igual aos líderes de mercado
- ✅ **Expandir**: Portal cliente, base conhecimento, automações

---

## 📊 Sprints Detalhadas

### 🏁 Sprint 0: Preparação e Análise (1 semana)

**Objetivo**: Mapear estado atual e preparar ambiente

#### Tarefas
- [ ] **0.1. Auditoria Completa**
  - [ ] Contar registros: Tickets, Demandas, Relacionamentos
  - [ ] Identificar campos únicos em cada entidade
  - [ ] Mapear dependências (controllers, services, components)
  - [ ] Listar todos os arquivos que usam "Demanda"
  
- [ ] **0.2. Backup de Segurança**
  - [ ] Backup completo do banco de dados
  - [ ] Backup dos arquivos de código (git tag: `pre-unificacao`)
  - [ ] Documentar queries de rollback

- [ ] **0.3. Planejamento Técnico**
  - [ ] Definir estrutura final da entidade `Ticket`
  - [ ] Criar diagrama ER (antes/depois)
  - [ ] Planejar migrations (ordem de execução)
  - [ ] Definir estratégia de testes

#### Entregáveis
- 📄 `AUDITORIA_TICKETS_DEMANDAS.md`
- 🗄️ Backup do banco + tag git
- 📐 Diagrama ER atualizado
- ✅ Plano de rollback documentado

#### Critérios de Aceitação
- [ ] Todos os dados mapeados
- [ ] Backup validado (restore testado)
- [ ] Equipe alinhada no plano

---

### 🔧 Sprint 1: Backend - Nova Estrutura (2 semanas)

**Objetivo**: Expandir entidade Ticket e criar migrations

#### Tarefas Semana 1

**1.1. Expandir Entity Ticket**
```typescript
// backend/src/modules/atendimento/entities/ticket.entity.ts

@Entity('tickets')
export class Ticket {
  // ✅ Campos existentes mantidos
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  numero: string; // #00001
  
  // 🆕 NOVOS CAMPOS
  
  // Classificação (do Movidesk)
  @Column({ type: 'enum', enum: TipoTicket, default: 'incidente' })
  tipo: TipoTicket; // incidente, requisicao, problema, mudanca
  
  @Column({ type: 'enum', enum: CategoriaTicket, default: 'suporte' })
  categoria: CategoriaTicket; // tecnico, comercial, financeiro, suporte
  
  @Column({ nullable: true })
  subcategoria?: string; // customizável
  
  // Conteúdo expandido
  @Column()
  assunto: string; // título curto
  
  @Column({ type: 'text' })
  descricao: string; // detalhamento
  
  @Column({ type: 'text', nullable: true })
  solucao?: string; // quando resolvido
  
  // SLA
  @Column({ type: 'int', default: 240 }) // 4 horas padrão
  slaRespostaMinutos: number;
  
  @Column({ type: 'int', default: 48 }) // 2 dias padrão
  slaResolucaoHoras: number;
  
  @Column({ type: 'timestamp', nullable: true })
  slaVencimento?: Date;
  
  @Column({ type: 'boolean', default: false })
  slaViolado: boolean;
  
  // Origem
  @Column({ type: 'enum', enum: OrigemTicket, default: 'cliente' })
  origem: OrigemTicket; // cliente, interno, automatico
  
  // Campos customizados (JSON)
  @Column({ type: 'jsonb', nullable: true })
  camposCustomizados?: Record<string, any>;
  
  // Timestamps expandidos
  @Column({ type: 'timestamp', nullable: true })
  resolvidoEm?: Date;
  
  @Column({ type: 'timestamp', nullable: true })
  fechadoEm?: Date;
  
  @Column({ type: 'timestamp', nullable: true })
  primeiraRespostaEm?: Date;
}

// Enums
export enum TipoTicket {
  INCIDENTE = 'incidente',       // Problema que precisa correção
  REQUISICAO = 'requisicao',     // Solicitação de serviço
  PROBLEMA = 'problema',         // Causa raiz de incidentes
  MUDANCA = 'mudanca'            // Alteração planejada
}

export enum CategoriaTicket {
  TECNICO = 'tecnico',
  COMERCIAL = 'comercial',
  FINANCEIRO = 'financeiro',
  SUPORTE = 'suporte',
  RH = 'rh',
  OUTROS = 'outros'
}

export enum OrigemTicket {
  CLIENTE = 'cliente',
  INTERNO = 'interno',
  AUTOMATICO = 'automatico'
}
```

**1.2. Criar Migration Expansão**
```typescript
// backend/src/migrations/XXXXXX-expandir-tickets.ts

export class ExpandirTickets1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar novas colunas
    await queryRunner.addColumn('tickets', new TableColumn({
      name: 'tipo',
      type: 'varchar',
      length: '20',
      default: "'incidente'"
    }));
    
    await queryRunner.addColumn('tickets', new TableColumn({
      name: 'categoria',
      type: 'varchar',
      length: '20',
      default: "'suporte'"
    }));
    
    // ... outros campos
    
    // Criar índices para performance
    await queryRunner.createIndex('tickets', new TableIndex({
      name: 'IDX_TICKET_TIPO',
      columnNames: ['tipo']
    }));
    
    await queryRunner.createIndex('tickets', new TableIndex({
      name: 'IDX_TICKET_CATEGORIA',
      columnNames: ['categoria']
    }));
    
    await queryRunner.createIndex('tickets', new TableIndex({
      name: 'IDX_TICKET_SLA_VENCIMENTO',
      columnNames: ['slaVencimento']
    }));
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback completo
    await queryRunner.dropIndex('tickets', 'IDX_TICKET_SLA_VENCIMENTO');
    await queryRunner.dropIndex('tickets', 'IDX_TICKET_CATEGORIA');
    await queryRunner.dropIndex('tickets', 'IDX_TICKET_TIPO');
    
    await queryRunner.dropColumn('tickets', 'tipo');
    await queryRunner.dropColumn('tickets', 'categoria');
    // ... outros campos
  }
}
```

#### Tarefas Semana 2

**1.3. Migration Unificação Demandas**
```typescript
// backend/src/migrations/XXXXXX-migrar-demandas-para-tickets.ts

export class MigrarDemandasParaTickets1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Migrar dados de demandas para tickets
    await queryRunner.query(`
      INSERT INTO tickets (
        id, numero, tipo, categoria, assunto, descricao,
        status, prioridade, contatoId, atendenteId,
        criadoEm, atualizadoEm, resolvidoEm
      )
      SELECT 
        id,
        CONCAT('DEM-', numero) as numero,
        CASE tipo
          WHEN 'tecnica' THEN 'incidente'
          WHEN 'comercial' THEN 'requisicao'
          WHEN 'financeira' THEN 'requisicao'
          ELSE 'incidente'
        END as tipo,
        COALESCE(tipo, 'suporte') as categoria,
        titulo as assunto,
        descricao,
        status,
        prioridade,
        clienteId as contatoId,
        responsavelId as atendenteId,
        criadoEm,
        atualizadoEm,
        CASE WHEN status = 'concluida' THEN atualizadoEm ELSE NULL END
      FROM demandas
      WHERE id NOT IN (
        SELECT COALESCE(demandaId, '00000000-0000-0000-0000-000000000000') 
        FROM tickets 
        WHERE demandaId IS NOT NULL
      );
    `);
    
    // 2. Atualizar tickets existentes com dados de demandas relacionadas
    await queryRunner.query(`
      UPDATE tickets t
      SET 
        tipo = CASE d.tipo
          WHEN 'tecnica' THEN 'incidente'
          WHEN 'comercial' THEN 'requisicao'
          ELSE 'incidente'
        END,
        categoria = COALESCE(d.tipo, 'suporte'),
        assunto = COALESCE(d.titulo, t.numero),
        descricao = COALESCE(d.descricao, t.ultimaMensagem),
        solucao = d.observacoes,
        resolvidoEm = CASE WHEN d.status = 'concluida' THEN d.atualizadoEm ELSE NULL END
      FROM demandas d
      WHERE t.demandaId = d.id;
    `);
    
    // 3. Backup da tabela demandas (não deletar ainda)
    await queryRunner.query(`
      ALTER TABLE demandas RENAME TO demandas_backup_pre_unificacao;
    `);
    
    // 4. Remover foreign key demandaId dos tickets
    await queryRunner.dropColumn('tickets', 'demandaId');
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar demandas
    await queryRunner.query(`
      ALTER TABLE demandas_backup_pre_unificacao RENAME TO demandas;
    `);
    
    // Recriar coluna demandaId
    await queryRunner.addColumn('tickets', new TableColumn({
      name: 'demandaId',
      type: 'uuid',
      isNullable: true
    }));
    
    // Deletar tickets migrados (cuidado!)
    await queryRunner.query(`
      DELETE FROM tickets WHERE numero LIKE 'DEM-%';
    `);
  }
}
```

**1.4. Criar SLA Service**
```typescript
// backend/src/modules/atendimento/services/sla.service.ts

@Injectable()
export class SLAService {
  calcularVencimento(
    prioridade: PrioridadeTicket,
    tipo: TipoTicket,
    categoria: CategoriaTicket
  ): { resposta: Date; resolucao: Date } {
    // Tabela de SLAs (configurável depois)
    const slaConfig = {
      urgente: { resposta: 30, resolucao: 4 },    // 30min, 4h
      alta: { resposta: 120, resolucao: 24 },     // 2h, 1 dia
      normal: { resposta: 240, resolucao: 48 },   // 4h, 2 dias
      baixa: { resposta: 480, resolucao: 120 }    // 8h, 5 dias
    };
    
    const sla = slaConfig[prioridade];
    const agora = new Date();
    
    return {
      resposta: addMinutes(agora, sla.resposta),
      resolucao: addHours(agora, sla.resolucao)
    };
  }
  
  verificarViolacao(ticket: Ticket): boolean {
    if (!ticket.slaVencimento) return false;
    
    const agora = new Date();
    const violado = agora > ticket.slaVencimento;
    
    if (violado && !ticket.slaViolado) {
      // Registrar violação e disparar alertas
      this.registrarViolacao(ticket);
    }
    
    return violado;
  }
  
  async enviarAlertasProximosVencimento(): Promise<void> {
    // Buscar tickets que vencem em 1 hora
    const ticketsEmRisco = await this.ticketRepository.find({
      where: {
        status: In(['novo', 'em_atendimento']),
        slaVencimento: Between(
          new Date(),
          addHours(new Date(), 1)
        )
      }
    });
    
    // Enviar notificações para responsáveis
    for (const ticket of ticketsEmRisco) {
      await this.notificationService.enviarAlertaSLA(ticket);
    }
  }
}
```

**1.5. Atualizar DTOs**
```typescript
// backend/src/modules/atendimento/dto/create-ticket.dto.ts

export class CreateTicketDto {
  @IsEnum(TipoTicket)
  tipo: TipoTicket;
  
  @IsEnum(CategoriaTicket)
  categoria: CategoriaTicket;
  
  @IsString()
  @MinLength(5)
  assunto: string;
  
  @IsString()
  @MinLength(10)
  descricao: string;
  
  @IsEnum(PrioridadeTicket)
  prioridade: PrioridadeTicket;
  
  @IsUUID()
  contatoId: string;
  
  @IsEnum(CanalTipo)
  canal: CanalTipo;
  
  @IsEnum(OrigemTicket)
  @IsOptional()
  origem?: OrigemTicket;
  
  @IsObject()
  @IsOptional()
  camposCustomizados?: Record<string, any>;
}
```

#### Entregáveis Sprint 1
- ✅ Entity `Ticket` expandida
- ✅ 2 Migrations (expansão + unificação)
- ✅ `SLAService` implementado
- ✅ DTOs atualizados
- ✅ Testes unitários (80%+ cobertura)

#### Critérios de Aceitação
- [ ] Migration roda sem erros
- [ ] Dados migrados corretamente (validar manualmente)
- [ ] SLA calculado corretamente
- [ ] Rollback funciona
- [ ] Testes passando

---

### 🎨 Sprint 2: Frontend - UI Atualizada (2 semanas)

**Objetivo**: Atualizar interfaces para novo modelo

#### Tarefas Semana 1

**2.1. Atualizar Types Frontend**
```typescript
// frontend-web/src/types/ticket.ts

export enum TipoTicket {
  INCIDENTE = 'incidente',
  REQUISICAO = 'requisicao',
  PROBLEMA = 'problema',
  MUDANCA = 'mudanca'
}

export enum CategoriaTicket {
  TECNICO = 'tecnico',
  COMERCIAL = 'comercial',
  FINANCEIRO = 'financeiro',
  SUPORTE = 'suporte',
  RH = 'rh',
  OUTROS = 'outros'
}

export interface Ticket {
  id: string;
  numero: string;
  tipo: TipoTicket;
  categoria: CategoriaTicket;
  subcategoria?: string;
  assunto: string;
  descricao: string;
  solucao?: string;
  status: StatusTicket;
  prioridade: PrioridadeTicket;
  canal: CanalTipo;
  origem: OrigemTicket;
  sla: {
    respostaMinutos: number;
    resolucaoHoras: number;
    vencimento?: Date;
    violado: boolean;
    tempoRestante?: number; // em minutos
  };
  contato: Contato;
  atendente?: Atendente;
  equipe?: Equipe;
  camposCustomizados?: Record<string, any>;
  criadoEm: Date;
  atualizadoEm: Date;
  resolvidoEm?: Date;
  fechadoEm?: Date;
  primeiraRespostaEm?: Date;
}
```

**2.2. Criar Helper de Labels e Cores**
```typescript
// frontend-web/src/utils/ticketHelpers.ts

export const tipoTicketLabels: Record<TipoTicket, string> = {
  incidente: 'Incidente',
  requisicao: 'Requisição',
  problema: 'Problema',
  mudanca: 'Mudança'
};

export const tipoTicketColors: Record<TipoTicket, string> = {
  incidente: 'bg-red-100 text-red-800',
  requisicao: 'bg-blue-100 text-blue-800',
  problema: 'bg-yellow-100 text-yellow-800',
  mudanca: 'bg-purple-100 text-purple-800'
};

export const categoriaTicketLabels: Record<CategoriaTicket, string> = {
  tecnico: 'Técnico',
  comercial: 'Comercial',
  financeiro: 'Financeiro',
  suporte: 'Suporte',
  rh: 'RH',
  outros: 'Outros'
};

export const categoriaTicketIcons: Record<CategoriaTicket, React.FC> = {
  tecnico: Wrench,
  comercial: DollarSign,
  financeiro: CreditCard,
  suporte: Headphones,
  rh: Users,
  outros: HelpCircle
};

// Helper para calcular tempo restante de SLA
export const calcularTempoRestanteSLA = (vencimento?: Date): {
  minutos: number;
  formatado: string;
  criticidade: 'ok' | 'atencao' | 'critico' | 'violado';
} => {
  if (!vencimento) return { minutos: 0, formatado: '--', criticidade: 'ok' };
  
  const agora = new Date();
  const diff = vencimento.getTime() - agora.getTime();
  const minutos = Math.floor(diff / 60000);
  
  if (minutos <= 0) {
    return {
      minutos: 0,
      formatado: 'SLA Violado',
      criticidade: 'violado'
    };
  }
  
  if (minutos <= 60) {
    return {
      minutos,
      formatado: `${minutos}min restantes`,
      criticidade: 'critico'
    };
  }
  
  const horas = Math.floor(minutos / 60);
  if (horas <= 4) {
    return {
      minutos,
      formatado: `${horas}h restantes`,
      criticidade: 'atencao'
    };
  }
  
  return {
    minutos,
    formatado: `${horas}h restantes`,
    criticidade: 'ok'
  };
};
```

**2.3. Criar Badge de SLA**
```typescript
// frontend-web/src/components/ticket/SLABadge.tsx

interface SLABadgeProps {
  ticket: Ticket;
  showLabel?: boolean;
}

export const SLABadge: React.FC<SLABadgeProps> = ({ ticket, showLabel = true }) => {
  const slaInfo = calcularTempoRestanteSLA(ticket.sla.vencimento);
  
  const cores = {
    ok: 'bg-green-100 text-green-800',
    atencao: 'bg-yellow-100 text-yellow-800',
    critico: 'bg-orange-100 text-orange-800',
    violado: 'bg-red-100 text-red-800'
  };
  
  const icones = {
    ok: Clock,
    atencao: AlertCircle,
    critico: AlertTriangle,
    violado: XCircle
  };
  
  const Icone = icones[slaInfo.criticidade];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cores[slaInfo.criticidade]}`}>
      <Icone className="h-3 w-3" />
      {showLabel && slaInfo.formatado}
    </span>
  );
};
```

#### Tarefas Semana 2

**2.4. Atualizar Chat Omnichannel**
- [ ] Adicionar campos tipo/categoria no header do ticket
- [ ] Mostrar badge de SLA no card da lista
- [ ] Adicionar botão "Categorizar" (sugestão IA)
- [ ] Exibir alerta visual quando SLA crítico

**2.5. Criar Página Gestão de Tickets**
```typescript
// frontend-web/src/pages/GestaoTicketsPage.tsx

export default function GestaoTicketsPage() {
  // KPI Cards com SLA
  const stats = {
    total: tickets.length,
    novos: tickets.filter(t => t.status === 'novo').length,
    emAtendimento: tickets.filter(t => t.status === 'em_atendimento').length,
    slaViolado: tickets.filter(t => t.sla.violado).length,
    slaCritico: tickets.filter(t => {
      const info = calcularTempoRestanteSLA(t.sla.vencimento);
      return info.criticidade === 'critico';
    }).length
  };
  
  // Filtros avançados
  const filtros = {
    tipo: TipoTicket[],
    categoria: CategoriaTicket[],
    status: StatusTicket[],
    prioridade: PrioridadeTicket[],
    slaStatus: 'todos' | 'ok' | 'critico' | 'violado',
    periodo: DateRange
  };
  
  // Visualizações
  // - Lista (padrão)
  // - Kanban (por status)
  // - Calendário (por SLA)
  
  return (
    <div>
      {/* KPI Dashboard */}
      {/* Filtros */}
      {/* Grid/Kanban/Calendário */}
    </div>
  );
}
```

**2.6. Remover/Deprecar Páginas de Demandas**
- [ ] Adicionar aviso de deprecação em `DemandasPage.tsx`
- [ ] Redirecionar `/demandas` → `/atendimento/tickets`
- [ ] Manter por 2 sprints para transição
- [ ] Deletar após Sprint 4

#### Entregáveis Sprint 2
- ✅ Types e helpers atualizados
- ✅ Componentes de SLA (badge, alertas)
- ✅ Chat atualizado com novos campos
- ✅ `GestaoTicketsPage` criada
- ✅ Rotas atualizadas

#### Critérios de Aceitação
- [ ] UI responsiva e intuitiva
- [ ] SLA visível em todas as telas
- [ ] Filtros funcionando
- [ ] Sem erros no console
- [ ] Design System Crevasse mantido

---

### 🚀 Sprint 3: Features Avançadas (2 semanas)

**Objetivo**: Implementar funcionalidades estilo Movidesk

#### Tarefas

**3.1. Categorização Inteligente com IA**
```typescript
// backend/src/modules/atendimento/services/categorizacao.service.ts

@Injectable()
export class CategorizacaoService {
  async sugerirCategoria(descricao: string): Promise<{
    tipo: TipoTicket;
    categoria: CategoriaTicket;
    prioridade: PrioridadeTicket;
    confianca: number;
  }> {
    const prompt = `
Analise esta solicitação e categorize:

"${descricao}"

Responda em JSON:
{
  "tipo": "incidente|requisicao|problema|mudanca",
  "categoria": "tecnico|comercial|financeiro|suporte|rh|outros",
  "prioridade": "baixa|normal|alta|urgente",
  "justificativa": "explicação breve"
}
    `;
    
    const response = await this.openaiService.chat(prompt);
    const resultado = JSON.parse(response);
    
    return {
      ...resultado,
      confianca: 0.85 // calcular baseado no modelo
    };
  }
}
```

**3.2. Portal do Cliente**
```typescript
// frontend-web/src/features/portal-cliente/

// MeusTickets.tsx - Lista tickets do cliente logado
// AbrirTicket.tsx - Formulário simplificado
// AcompanharTicket.tsx - Timeline do ticket
// BaseConhecimento.tsx - Artigos de ajuda
```

**3.3. Base de Conhecimento**
```typescript
// backend/src/modules/conhecimento/

entities/
├── artigo.entity.ts
├── categoria-artigo.entity.ts
└── avaliacao-artigo.entity.ts

// Funcionalidades:
// - Criar artigos com Markdown
// - Categorizar e tags
// - Busca full-text
// - Avaliação (útil/não útil)
// - Sugestão automática baseada no ticket
```

**3.4. Automações e Workflows**
```typescript
// backend/src/modules/atendimento/automacoes/

// Triggers:
// - Ticket criado → Atribuir para equipe automaticamente
// - SLA 1h antes → Enviar alerta
// - Prioridade urgente → Notificar supervisor
// - Status resolvido → Enviar pesquisa satisfação

interface Automacao {
  id: string;
  nome: string;
  ativa: boolean;
  trigger: 'ticket_criado' | 'status_mudou' | 'sla_proximo' | 'prioridade_mudou';
  condicoes: Condicao[];
  acoes: Acao[];
}

interface Condicao {
  campo: string;
  operador: 'igual' | 'diferente' | 'contem' | 'maior' | 'menor';
  valor: any;
}

interface Acao {
  tipo: 'atribuir' | 'notificar' | 'alterar_campo' | 'criar_tarefa';
  parametros: Record<string, any>;
}
```

**3.5. Relatórios e Dashboards**
```typescript
// frontend-web/src/pages/RelatoriosTicketsPage.tsx

// Métricas:
// - Tempo médio de primeira resposta
// - Tempo médio de resolução
// - Taxa de SLA cumprido
// - Tickets por categoria/tipo
// - Performance por atendente
// - Satisfação do cliente (NPS)
// - Tendências e previsões

// Gráficos:
// - Linha: Tickets ao longo do tempo
// - Barra: Por categoria, por atendente
// - Pizza: Distribuição de tipos
// - Funil: Status do ticket
```

#### Entregáveis Sprint 3
- ✅ Categorização IA funcionando
- ✅ Portal do cliente (beta)
- ✅ Base de conhecimento (MVP)
- ✅ 5 automações básicas
- ✅ Dashboard de relatórios

#### Critérios de Aceitação
- [ ] IA acerta 80%+ das categorizações
- [ ] Cliente consegue abrir/acompanhar ticket
- [ ] Automações executam corretamente
- [ ] Relatórios com dados reais

---

### 🎓 Sprint 4: Treinamento e Migração Final (1 semana)

**Objetivo**: Finalizar migração e capacitar usuários

#### Tarefas

**4.1. Migração de Dados Restantes**
- [ ] Validar 100% dos dados migrados
- [ ] Corrigir inconsistências
- [ ] Deletar tabela `demandas_backup` (após confirmação)

**4.2. Documentação**
- [ ] Manual do usuário (PDF + vídeos)
- [ ] Guia do administrador
- [ ] API docs atualizados
- [ ] Changelog completo

**4.3. Treinamento**
- [ ] Sessão para atendentes (2h)
- [ ] Sessão para supervisores (1h)
- [ ] Vídeos tutoriais gravados
- [ ] FAQ documentado

**4.4. Monitoramento Pós-Deploy**
- [ ] Setup Sentry para erros
- [ ] Logs de performance
- [ ] Feedback dos usuários
- [ ] Ajustes rápidos

#### Entregáveis Sprint 4
- ✅ Sistema 100% migrado
- ✅ Documentação completa
- ✅ Equipe treinada
- ✅ Monitoramento ativo

#### Critérios de Aceitação
- [ ] Zero inconsistências de dados
- [ ] Usuários aprovam novo sistema
- [ ] Performance satisfatória (<2s carregamento)
- [ ] Rollback documentado (caso necessário)

---

## 🎯 Checklist Global

### Antes de Começar
- [ ] Aprovação da diretoria/stakeholders
- [ ] Backup completo validado
- [ ] Equipe alocada (backend, frontend, QA)
- [ ] Ambiente de staging preparado

### Durante Sprints
- [ ] Daily standups (15min)
- [ ] Code review obrigatório
- [ ] Testes automatizados (80%+ cobertura)
- [ ] Deploy em staging antes de produção
- [ ] Documentação atualizada continuamente

### Após Conclusão
- [ ] Deploy em produção (horário de menor movimento)
- [ ] Monitoramento 24h ativo
- [ ] Suporte prioritário primeiros 7 dias
- [ ] Retrospectiva da squad
- [ ] Comemoração! 🎉

---

## 🚨 Plano de Rollback

### Situações de Rollback
- ⚠️ Perda de dados detectada
- ⚠️ Performance inaceitável (>5s)
- ⚠️ Bugs críticos bloqueando operação
- ⚠️ Rejeição massiva dos usuários

### Procedimento de Rollback

**Nível 1: Frontend Only** (se backend OK)
```bash
# Reverter deploy frontend
git checkout pre-unificacao
npm run build
npm run deploy
```

**Nível 2: Backend + Frontend**
```bash
# 1. Restaurar banco
psql conectcrm < backup_pre_unificacao.sql

# 2. Reverter migrations
npm run migration:revert

# 3. Reverter código
git checkout pre-unificacao
npm install
npm run build

# 4. Restart servidores
pm2 restart all
```

**Nível 3: Completo** (último recurso)
```bash
# Restaurar snapshot completo da VM/container
# Tempo: ~30 minutos
# Perda: Dados criados após início da sprint
```

---

## 📊 Métricas de Sucesso

### Técnicas
- ✅ 0 erros críticos em produção
- ✅ Performance: <2s carregamento médio
- ✅ Uptime: 99.9%
- ✅ Cobertura de testes: >80%

### Negócio
- ✅ Redução de 30% no tempo de resolução
- ✅ SLA cumprido em 95%+ dos casos
- ✅ Aumento de 20% na satisfação (NPS)
- ✅ 100% dos dados migrados sem perda

### Usuário
- ✅ 90%+ aprovação em pesquisa
- ✅ <5 tickets de suporte sobre nova interface
- ✅ Tempo de adoção <2 semanas

---

## 👥 Equipe Recomendada

### Sprint 1-2 (Backend intenso)
- 2 Backend Developers (senior)
- 1 DBA (part-time)
- 1 QA Engineer

### Sprint 2-3 (Frontend intenso)
- 1 Backend Developer
- 2 Frontend Developers (senior)
- 1 UX/UI Designer
- 1 QA Engineer

### Sprint 4 (Finalização)
- 1 Tech Lead (full-time)
- 1 Technical Writer
- 1 Trainer/Support

---

## 📅 Cronograma Visual

```
Sprint 0: [███████░░░░░░░░░░░░░░░░░░░░░░░░] Preparação (1 semana)
Sprint 1: [░░░░░░░███████████░░░░░░░░░░░░░] Backend (2 semanas)
Sprint 2: [░░░░░░░░░░░░░░░███████████░░░░░] Frontend (2 semanas)
Sprint 3: [░░░░░░░░░░░░░░░░░░░░░███████████] Features (2 semanas)
Sprint 4: [░░░░░░░░░░░░░░░░░░░░░░░░░░░░████] Migração (1 semana)
          |-------|-------|-------|-------|
          Sem 1-2  Sem 3-4  Sem 5-6  Sem 7-8
```

---

## 🎓 Recursos Adicionais

### Referências
- 📚 [Movidesk Documentation](https://docs.movidesk.com)
- 📚 [Zendesk Best Practices](https://support.zendesk.com)
- 📚 [ITIL Service Management](https://www.axelos.com/best-practice-solutions/itil)

### Ferramentas
- 🔧 Postman: Testes de API
- 🔧 Jest: Testes unitários
- 🔧 Playwright: Testes E2E
- 🔧 Sentry: Monitoramento de erros

---

**Status do Documento**: 📋 Aguardando aprovação  
**Próximo Passo**: Reunião de kickoff com stakeholders  
**Responsável**: Tech Lead + Product Owner
