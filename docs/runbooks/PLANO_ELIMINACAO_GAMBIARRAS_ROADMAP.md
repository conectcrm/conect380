# 🎯 PLANO DE ELIMINAÇÃO DE GAMBIARRAS E ROADMAP DE EXCELÊNCIA

**Data**: 06 de Novembro de 2025  
**Projeto**: ConectCRM - Módulo Omnichannel  
**Objetivo**: Elevar sistema ao nível ENTERPRISE sem gambiarras  
**Prazo**: 90 dias (3 meses)  

---

## 📋 ÍNDICE

1. [Gambiarras Identificadas e Correções](#gambiarras)
2. [Roadmap de Implementação](#roadmap)
3. [Regras Anti-Gambiarras](#regras)
4. [Checklist de Qualidade](#checklist)
5. [Code Review Guidelines](#code-review)
6. [Arquitetura de Referência](#arquitetura)

---

## 🚨 GAMBIARRAS IDENTIFICADAS E CORREÇÕES {#gambiarras}

### ❌ GAMBIARRA #1: Reconexão de Mensagens via Polling

**Localização**: `frontend-web/src/features/atendimento/omnichannel/hooks/useMensagens.ts`

**Problema Atual**:
```typescript
// ❌ GAMBIARRA - Recarrega TODAS as mensagens ao receber 1 nova
socket.on('nova_mensagem', (mensagem) => {
  recarregarMensagens(); // ⚠️ Faz nova chamada HTTP ao backend!
});
```

**Por que é gambiarra?**:
- Desperdiça recursos (HTTP request desnecessário)
- Atraso perceptível (roundtrip HTTP)
- Não é escalável (muitas mensagens = muitos HTTP requests)
- WebSocket existe justamente para evitar isso!

**Solução Correta**:
```typescript
// ✅ CORRETO - Adiciona mensagem diretamente no state
socket.on('nova_mensagem', (mensagem) => {
  setMensagens(prev => {
    // Evita duplicatas
    if (prev.some(m => m.id === mensagem.id)) {
      return prev;
    }
    // Adiciona nova mensagem
    return [...prev, mensagem].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });
});
```

**Prazo**: 2 horas  
**Prioridade**: 🔴 ALTA  
**Responsável**: Frontend Lead  

---

### ❌ GAMBIARRA #2: State Management Descentralizado

**Localização**: Múltiplos componentes com `useState`

**Problema Atual**:
```typescript
// ❌ GAMBIARRA - Estado espalhado em vários componentes
// ChatOmnichannel.tsx
const [tickets, setTickets] = useState([]);
const [mensagens, setMensagens] = useState([]);

// ConversationList.tsx
const [tickets, setTickets] = useState([]); // ⚠️ DUPLICADO!

// ChatArea.tsx
const [mensagens, setMensagens] = useState([]); // ⚠️ DUPLICADO!
```

**Por que é gambiarra?**:
- Dados duplicados em vários lugares
- Dificulta debug (qual é o state correto?)
- Re-renders desnecessários
- Sincronização complexa entre componentes

**Solução Correta - Zustand Store**:
```typescript
// ✅ CORRETO - State centralizado
// stores/atendimentoStore.ts
import { create } from 'zustand';

interface AtendimentoStore {
  tickets: Ticket[];
  mensagens: Mensagem[];
  ticketAtual: Ticket | null;
  
  // Actions
  setTickets: (tickets: Ticket[]) => void;
  addMensagem: (mensagem: Mensagem) => void;
  setTicketAtual: (ticket: Ticket | null) => void;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

export const useAtendimentoStore = create<AtendimentoStore>((set) => ({
  tickets: [],
  mensagens: [],
  ticketAtual: null,
  
  setTickets: (tickets) => set({ tickets }),
  
  addMensagem: (mensagem) => set((state) => ({
    mensagens: [...state.mensagens, mensagem].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  })),
  
  setTicketAtual: (ticket) => set({ 
    ticketAtual: ticket,
    mensagens: [] // Limpa mensagens ao trocar ticket
  }),
  
  updateTicket: (ticketId, updates) => set((state) => ({
    tickets: state.tickets.map(t => 
      t.id === ticketId ? { ...t, ...updates } : t
    )
  }))
}));

// Uso nos componentes:
const { tickets, addMensagem } = useAtendimentoStore();
```

**Prazo**: 1 dia  
**Prioridade**: 🔴 ALTA  
**Responsável**: Frontend Lead  

---

### ❌ GAMBIARRA #3: Upload Sem Validação

**Localização**: `backend/src/modules/atendimento/services/mensagem.service.ts`

**Problema Atual**:
```typescript
// ❌ GAMBIARRA - Aceita qualquer tamanho de arquivo
async uploadFile(file: Express.Multer.File) {
  // ⚠️ Sem validação de tamanho!
  // ⚠️ Sem validação de tipo!
  const filename = `${randomUUID()}${extname(file.originalname)}`;
  await fsPromises.writeFile(join(this.uploadsDir, filename), file.buffer);
  return filename;
}
```

**Por que é gambiarra?**:
- Vulnerabilidade de segurança (upload de executáveis)
- Pode encher disco (arquivos gigantes)
- Sem validação de tipo (pode subir qualquer coisa)

**Solução Correta**:
```typescript
// ✅ CORRETO - Validação completa
import { BadRequestException } from '@nestjs/common';

// Configurações
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/webm'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

async uploadFile(file: Express.Multer.File, tipo: 'image' | 'video' | 'audio' | 'document') {
  // 1. Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException(`Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  // 2. Validar tipo MIME
  const allowedTypes = ALLOWED_MIME_TYPES[tipo];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException(`Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}`);
  }
  
  // 3. Validar extensão (double check)
  const ext = extname(file.originalname).toLowerCase();
  const validExtensions = {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    video: ['.mp4', '.webm', '.mov'],
    audio: ['.mp3', '.ogg', '.wav', '.m4a', '.webm'],
    document: ['.pdf', '.doc', '.docx'],
  };
  
  if (!validExtensions[tipo].includes(ext)) {
    throw new BadRequestException(`Extensão não permitida: ${ext}`);
  }
  
  // 4. Sanitizar nome do arquivo
  const safeName = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100);
  
  const filename = `${randomUUID()}_${safeName}`;
  
  // 5. Salvar
  await fsPromises.writeFile(
    join(this.uploadsDir, filename), 
    file.buffer
  );
  
  this.logger.log(`✅ Arquivo salvo: ${filename} (${file.size} bytes)`);
  
  return filename;
}
```

**Prazo**: 3 horas  
**Prioridade**: 🔴 CRÍTICA (segurança)  
**Responsável**: Backend Lead  

---

### ❌ GAMBIARRA #4: WebSocket Sem Retry Exponencial

**Localização**: `frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts`

**Problema Atual**:
```typescript
// ❌ GAMBIARRA - Reconecta imediatamente (loop infinito em caso de erro)
socket.on('disconnect', () => {
  console.log('Desconectado');
  // ⚠️ Socket.io reconecta automaticamente SEM backoff!
});
```

**Por que é gambiarra?**:
- Reconnect storm (milhares de conexões por segundo)
- Sobrecarrega servidor
- Não respeita rate limits

**Solução Correta**:
```typescript
// ✅ CORRETO - Retry exponencial com jitter
const MAX_RETRIES = 10;
const INITIAL_DELAY = 1000; // 1 segundo
const MAX_DELAY = 30000; // 30 segundos

const socketRef = useRef<Socket | null>(null);
const retryCountRef = useRef(0);
const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const conectar = useCallback(() => {
  if (socketRef.current?.connected) {
    return; // Já conectado
  }
  
  socketRef.current = io(`${API_URL}/atendimento`, {
    auth: { token: localStorage.getItem('token') },
    reconnection: false, // ⚠️ Desabilita reconexão automática
  });
  
  socketRef.current.on('connect', () => {
    console.log('✅ WebSocket conectado');
    retryCountRef.current = 0; // Reset contador
    setConnected(true);
  });
  
  socketRef.current.on('disconnect', (reason) => {
    console.log(`🔌 WebSocket desconectado: ${reason}`);
    setConnected(false);
    
    // Reconectar apenas se não foi intencional
    if (reason !== 'io client disconnect') {
      agendarReconexao();
    }
  });
  
  socketRef.current.on('connect_error', (error) => {
    console.error('❌ Erro ao conectar WebSocket:', error.message);
    setConnected(false);
    agendarReconexao();
  });
}, []);

const agendarReconexao = useCallback(() => {
  if (retryCountRef.current >= MAX_RETRIES) {
    console.error('❌ Máximo de tentativas atingido. Parando reconexão.');
    return;
  }
  
  // Backoff exponencial com jitter
  const baseDelay = Math.min(
    INITIAL_DELAY * Math.pow(2, retryCountRef.current),
    MAX_DELAY
  );
  const jitter = Math.random() * 1000; // 0-1 segundo de aleatoriedade
  const delay = baseDelay + jitter;
  
  console.log(`🔄 Tentando reconectar em ${(delay / 1000).toFixed(1)}s (tentativa ${retryCountRef.current + 1}/${MAX_RETRIES})`);
  
  retryCountRef.current++;
  
  retryTimeoutRef.current = setTimeout(() => {
    conectar();
  }, delay);
}, [conectar]);

useEffect(() => {
  conectar();
  
  return () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    socketRef.current?.disconnect();
  };
}, [conectar]);
```

**Prazo**: 2 horas  
**Prioridade**: 🟡 MÉDIA  
**Responsável**: Frontend Lead  

---

## 🗓️ ROADMAP DE IMPLEMENTAÇÃO {#roadmap}

### 📅 SPRINT 1 (Semanas 1-2): Correção de Gambiarras + Sistema de Filas

**Objetivos**:
- ✅ Eliminar TODAS as 4 gambiarras
- ✅ Implementar sistema de filas básico
- ✅ Implementar distribuição automática

#### Semana 1: Correções de Gambiarras

| Dia | Tarefa | Responsável | Horas |
|-----|--------|-------------|-------|
| Seg | Gambiarra #1: WebSocket direto no state | Frontend | 2h |
| Seg | Gambiarra #2: Setup Zustand | Frontend | 4h |
| Ter | Gambiarra #2: Migrar todos componentes | Frontend | 6h |
| Qua | Gambiarra #3: Validação de upload | Backend | 3h |
| Qua | Gambiarra #4: Retry exponencial | Frontend | 2h |
| Qui | Testes de integração (gambiarras corrigidas) | QA | 6h |
| Sex | Code review e ajustes finais | Tech Lead | 4h |

**Entregável Semana 1**: 🎯 Sistema SEM gambiarras, código limpo

---

#### Semana 2: Sistema de Filas Básico

**Backend**:

```typescript
// ✅ Arquivos a criar/modificar

// 1. backend/src/modules/atendimento/entities/fila.entity.ts
@Entity('atendimento_filas')
export class Fila {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  nome: string;
  
  @Column({ type: 'enum', enum: AlgoritmoDistribuicao, default: 'round-robin' })
  algoritmo: AlgoritmoDistribuicao;
  
  @Column({ type: 'int', default: 5 })
  limiteAtendimentosPorAtendente: number;
  
  @Column({ type: 'boolean', default: true })
  distribuicaoAutomatica: boolean;
  
  @Column({ type: 'jsonb', nullable: true })
  regrasDistribuicao?: {
    prioridade: 'fifo' | 'lifo' | 'prioridade';
    considerarCargaAtual: boolean;
    considerarHabilidades: boolean;
  };
}

export enum AlgoritmoDistribuicao {
  ROUND_ROBIN = 'round-robin',
  LEAST_LOADED = 'least-loaded',
  SKILL_BASED = 'skill-based',
}

// 2. backend/src/modules/atendimento/services/distribuicao.service.ts
@Injectable()
export class DistribuicaoService {
  async distribuirTicket(ticket: Ticket, fila: Fila): Promise<Atendente> {
    const atendentes = await this.buscarAtendentesDisponiveis(fila);
    
    switch (fila.algoritmo) {
      case AlgoritmoDistribuicao.ROUND_ROBIN:
        return this.distribuirRoundRobin(atendentes);
      
      case AlgoritmoDistribuicao.LEAST_LOADED:
        return this.distribuirPorCarga(atendentes);
      
      case AlgoritmoDistribuicao.SKILL_BASED:
        return this.distribuirPorHabilidade(atendentes, ticket);
    }
  }
  
  private async distribuirRoundRobin(atendentes: Atendente[]): Promise<Atendente> {
    // Implementar round-robin (próximo na fila)
  }
  
  private async distribuirPorCarga(atendentes: Atendente[]): Promise<Atendente> {
    // Retorna atendente com MENOS tickets ativos
    const cargas = await Promise.all(
      atendentes.map(async (atendente) => {
        const count = await this.ticketRepository.count({
          where: { atendenteId: atendente.id, status: StatusTicket.EM_ATENDIMENTO }
        });
        return { atendente, count };
      })
    );
    
    cargas.sort((a, b) => a.count - b.count);
    return cargas[0].atendente;
  }
}

// 3. backend/src/modules/atendimento/services/fila.service.ts
@Injectable()
export class FilaService {
  async enfileirar(ticket: Ticket): Promise<void> {
    // Adiciona ticket à fila
    ticket.status = StatusTicket.AGUARDANDO;
    await this.ticketRepository.save(ticket);
    
    // Se distribuição automática habilitada
    const fila = await this.filaRepository.findOne({ where: { id: ticket.filaId } });
    if (fila.distribuicaoAutomatica) {
      await this.distribuirProximoTicket(fila);
    }
  }
  
  async distribuirProximoTicket(fila: Fila): Promise<void> {
    const proximoTicket = await this.buscarProximoNaFila(fila);
    if (!proximoTicket) return;
    
    const atendente = await this.distribuicaoService.distribuirTicket(proximoTicket, fila);
    
    await this.atribuirTicket(proximoTicket, atendente);
  }
}
```

**Prazo**: 5 dias  
**Prioridade**: 🔴 CRÍTICA  

---

### 📅 SPRINT 2 (Semanas 3-4): Templates + SLA Básico

#### Semana 3: Templates de Mensagens

**Backend**:

```typescript
// backend/src/modules/atendimento/entities/template.entity.ts
@Entity('atendimento_templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  nome: string;
  
  @Column()
  atalho: string; // "/boas-vindas"
  
  @Column({ type: 'text' })
  conteudo: string; // "Olá {{nome}}, bem-vindo!"
  
  @Column({ type: 'jsonb' })
  variaveis: string[]; // ["nome", "empresa", "telefone"]
  
  @Column({ nullable: true })
  categoria: string;
  
  @Column({ default: false })
  compartilhado: boolean; // Todos atendentes podem usar
  
  @ManyToOne(() => User)
  criadoPor: User;
}

// backend/src/modules/atendimento/services/template.service.ts
@Injectable()
export class TemplateService {
  async aplicarTemplate(
    templateId: string, 
    variaveis: Record<string, string>
  ): Promise<string> {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    
    let conteudo = template.conteudo;
    
    // Substituir variáveis
    for (const [chave, valor] of Object.entries(variaveis)) {
      conteudo = conteudo.replace(new RegExp(`{{${chave}}}`, 'g'), valor);
    }
    
    return conteudo;
  }
  
  async buscarPorAtalho(atalho: string): Promise<Template | null> {
    return this.templateRepository.findOne({ where: { atalho } });
  }
}
```

**Frontend**:

```typescript
// frontend-web/src/features/atendimento/omnichannel/components/MessageInput.tsx

const MessageInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [showTemplateSuggestions, setShowTemplateSuggestions] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Detectar atalho de template (inicia com /)
    if (value.startsWith('/')) {
      const atalho = value.substring(1);
      const templatesFiltrados = await buscarTemplates(atalho);
      setTemplates(templatesFiltrados);
      setShowTemplateSuggestions(true);
    } else {
      setShowTemplateSuggestions(false);
    }
  };
  
  const selecionarTemplate = async (template: Template) => {
    // Aplicar template com variáveis do cliente atual
    const conteudo = await aplicarTemplate(template.id, {
      nome: clienteAtual.nome,
      empresa: clienteAtual.empresa,
      telefone: clienteAtual.telefone,
    });
    
    setInputValue(conteudo);
    setShowTemplateSuggestions(false);
  };
  
  return (
    <div>
      <textarea 
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Digite / para usar template..."
      />
      
      {showTemplateSuggestions && (
        <div className="template-suggestions">
          {templates.map(template => (
            <div 
              key={template.id}
              onClick={() => selecionarTemplate(template)}
            >
              <strong>{template.atalho}</strong> - {template.nome}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Prazo**: 4 dias  
**Prioridade**: 🔴 ALTA  

---

#### Semana 4: SLA Tracking Básico

**Backend**:

```typescript
// backend/src/modules/atendimento/entities/sla.entity.ts
@Entity('atendimento_slas')
export class SLA {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  nome: string;
  
  @Column({ type: 'int' })
  tempoRespostaMinutos: number; // Ex: 30 minutos
  
  @Column({ type: 'int' })
  tempoResolucaoMinutos: number; // Ex: 240 minutos (4 horas)
  
  @Column({ type: 'jsonb' })
  horarioAtendimento: {
    inicio: string; // "08:00"
    fim: string; // "18:00"
    diasSemana: number[]; // [1,2,3,4,5]
  };
  
  @Column({ default: true })
  ativo: boolean;
}

// backend/src/modules/atendimento/services/sla.service.ts
@Injectable()
export class SLAService {
  async verificarViolacao(ticket: Ticket): Promise<{
    respostaViolada: boolean;
    resolucaoViolada: boolean;
    tempoRestanteResposta: number;
    tempoRestanteResolucao: number;
  }> {
    const sla = await this.buscarSLAPorTicket(ticket);
    if (!sla) return null;
    
    const agora = new Date();
    const abertura = new Date(ticket.data_abertura);
    const primeiraResposta = ticket.data_primeira_resposta;
    
    // Calcular tempo decorrido (considerando horário comercial)
    const tempoDecorrido = this.calcularTempoUtil(abertura, agora, sla.horarioAtendimento);
    
    // Verificar violação de resposta
    const respostaViolada = !primeiraResposta && 
      tempoDecorrido > sla.tempoRespostaMinutos;
    
    // Verificar violação de resolução
    const resolucaoViolada = ticket.status !== StatusTicket.RESOLVIDO &&
      tempoDecorrido > sla.tempoResolucaoMinutos;
    
    return {
      respostaViolada,
      resolucaoViolada,
      tempoRestanteResposta: sla.tempoRespostaMinutos - tempoDecorrido,
      tempoRestanteResolucao: sla.tempoResolucaoMinutos - tempoDecorrido,
    };
  }
  
  private calcularTempoUtil(inicio: Date, fim: Date, horario: any): number {
    // Implementar cálculo considerando apenas horário comercial
    // Exemplo: Segunda 08:00 às 18:00 = 10 horas úteis
  }
}

// backend/src/modules/atendimento/processors/sla-monitor.processor.ts
@Processor('sla-monitor')
export class SLAMonitorProcessor {
  @Cron('*/5 * * * *') // A cada 5 minutos
  async verificarSLAs() {
    const ticketsAtivos = await this.ticketRepository.find({
      where: { 
        status: In([StatusTicket.ABERTO, StatusTicket.EM_ATENDIMENTO, StatusTicket.AGUARDANDO])
      }
    });
    
    for (const ticket of ticketsAtivos) {
      const violacao = await this.slaService.verificarViolacao(ticket);
      
      if (violacao?.respostaViolada) {
        // Notificar supervisor
        await this.notificarViolacaoSLA(ticket, 'resposta');
      }
      
      if (violacao?.resolucaoViolada) {
        // Escalar ticket
        await this.escalarTicket(ticket);
      }
    }
  }
}
```

**Prazo**: 5 dias  
**Prioridade**: 🔴 ALTA  

---

### 📅 SPRINT 3 (Semanas 5-6): Dashboard + Métricas

**Componentes**:

```typescript
// frontend-web/src/features/atendimento/dashboard/DashboardMetricas.tsx
const DashboardMetricas: React.FC = () => {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  
  useEffect(() => {
    const carregarMetricas = async () => {
      const dados = await atendimentoService.buscarMetricas();
      setMetricas(dados);
    };
    
    carregarMetricas();
    const interval = setInterval(carregarMetricas, 30000); // Atualiza a cada 30s
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="grid grid-cols-4 gap-6">
      {/* KPI Cards */}
      <KPICard 
        titulo="Tickets Abertos"
        valor={metricas?.ticketsAbertos}
        icone={<MessageSquare />}
        cor="blue"
      />
      
      <KPICard 
        titulo="Tempo Médio Resposta"
        valor={formatarTempo(metricas?.tempoMedioResposta)}
        icone={<Clock />}
        cor="green"
      />
      
      <KPICard 
        titulo="Satisfação Média"
        valor={`${metricas?.satisfacaoMedia}/5`}
        icone={<Star />}
        cor="yellow"
      />
      
      <KPICard 
        titulo="SLA Violações"
        valor={metricas?.violacoesSLA}
        icone={<AlertTriangle />}
        cor="red"
      />
      
      {/* Gráficos */}
      <div className="col-span-2">
        <GraficoTicketsPorCanal data={metricas?.distribuicaoCanais} />
      </div>
      
      <div className="col-span-2">
        <GraficoTempoResolucao data={metricas?.temposResolucao} />
      </div>
      
      {/* Tabela de Atendentes */}
      <div className="col-span-4">
        <TabelaDesempenhoAtendentes 
          atendentes={metricas?.desempenhoAtendentes}
        />
      </div>
    </div>
  );
};
```

**Prazo**: 7 dias  
**Prioridade**: 🟡 MÉDIA  

---

### 📅 SPRINT 4-6 (Semanas 7-12): Canais + Features Avançadas

- Semana 7-8: Integração Email (SendGrid/SES)
- Semana 9-10: Integração Instagram/Facebook
- Semana 11: Sistema de Tags Avançado
- Semana 12: Chatbot Visual Avançado

---

## 🚫 REGRAS ANTI-GAMBIARRAS {#regras}

### 📜 MANIFESTO: CÓDIGO LIMPO É INEGOCIÁVEL

**Princípios Fundamentais**:

1. **TODO código passa por code review antes de merge**
2. **TODO código tem testes (mínimo 70% coverage)**
3. **ZERO warnings no build (TypeScript strict mode)**
4. **ZERO console.log em produção**
5. **TODO endpoint REST tem validação (class-validator)**
6. **TODO upload tem validação de tipo e tamanho**
7. **TODA integração externa tem retry e timeout**
8. **TODO WebSocket tem reconexão exponencial**

---

### ✅ CHECKLIST PRÉ-COMMIT (OBRIGATÓRIO) {#checklist}

**Antes de fazer commit, SEMPRE verificar**:

```bash
# 1. Lint passa sem erros
npm run lint

# 2. Build passa sem warnings
npm run build

# 3. Testes passam
npm test

# 4. Não tem console.log
git diff | grep -i "console.log" && echo "❌ REMOVA console.log!" || echo "✅ OK"

# 5. Não tem // TODO ou // FIXME sem issue
git diff | grep -i "// TODO" && echo "⚠️ TODO encontrado, crie issue!" || echo "✅ OK"

# 6. Não tem any no TypeScript
git diff | grep ": any" && echo "❌ REMOVA any!" || echo "✅ OK"

# 7. Imports organizados
npm run lint:fix
```

---

### 🔍 CODE REVIEW GUIDELINES {#code-review}

#### ❌ Rejeitar PR se contiver:

1. **Código duplicado** (DRY violation)
   ```typescript
   // ❌ REPROVAR
   const usuarios1 = await api.get('/usuarios');
   const usuarios2 = await api.get('/usuarios'); // DUPLICADO!
   ```

2. **Lógica de negócio no Controller**
   ```typescript
   // ❌ REPROVAR
   @Post()
   async criar(@Body() dto: CreateDto) {
     // ⚠️ Lógica NO CONTROLLER! Deveria estar no SERVICE!
     if (dto.email && !dto.email.includes('@')) {
       throw new BadRequestException('Email inválido');
     }
     // ...
   }
   ```

3. **Queries N+1**
   ```typescript
   // ❌ REPROVAR
   const tickets = await this.ticketRepository.find();
   for (const ticket of tickets) {
     ticket.mensagens = await this.mensagemRepository.find({ 
       where: { ticketId: ticket.id } 
     }); // ⚠️ N+1 QUERY!
   }
   ```

4. **Sem tratamento de erro**
   ```typescript
   // ❌ REPROVAR
   async enviarEmail(email: string) {
     await axios.post('/send-email', { email }); // ⚠️ E se der erro?
   }
   ```

5. **Magic numbers sem constantes**
   ```typescript
   // ❌ REPROVAR
   if (tickets.length > 50) { // ⚠️ O que é 50?
     // ...
   }
   
   // ✅ APROVAR
   const MAX_TICKETS_PER_PAGE = 50;
   if (tickets.length > MAX_TICKETS_PER_PAGE) {
     // ...
   }
   ```

6. **Comentários explicando código ruim**
   ```typescript
   // ❌ REPROVAR
   // Loop para buscar usuários ativos e adicionar em array temporário
   const temp = [];
   for (let i = 0; i < users.length; i++) {
     if (users[i].active) {
       temp.push(users[i]);
     }
   }
   
   // ✅ APROVAR (autoexplicativo)
   const activeUsers = users.filter(user => user.active);
   ```

---

#### ✅ Aprovar PR apenas se:

1. **Código autoexplicativo** (nomes claros)
2. **Funções pequenas** (max 50 linhas)
3. **Single Responsibility** (cada função faz 1 coisa)
4. **Testes passando** (coverage >= 70%)
5. **Documentação atualizada** (JSDoc para funções públicas)
6. **Performance considerada** (sem queries N+1, sem loops desnecessários)
7. **Segurança validada** (inputs sanitizados, uploads validados)

---

### 📐 PADRÕES DE CÓDIGO (TEMPLATES)

#### Template: Service Method

```typescript
/**
 * Busca tickets por status com paginação
 * 
 * @param status - Status do ticket (ABERTO, EM_ATENDIMENTO, etc)
 * @param page - Página atual (1-based)
 * @param limit - Itens por página (padrão: 20)
 * @returns Lista paginada de tickets
 * @throws NotFoundException se nenhum ticket encontrado
 */
async buscarPorStatus(
  status: StatusTicket,
  page: number = 1,
  limit: number = 20
): Promise<{ tickets: Ticket[]; total: number; totalPages: number }> {
  try {
    // 1. Validar entrada
    if (page < 1) {
      throw new BadRequestException('Página deve ser >= 1');
    }
    
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limite deve estar entre 1 e 100');
    }
    
    // 2. Buscar no banco (com eager loading)
    const [tickets, total] = await this.ticketRepository.findAndCount({
      where: { status },
      relations: ['atendente', 'canal', 'cliente'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    
    // 3. Verificar se encontrou
    if (tickets.length === 0) {
      throw new NotFoundException(`Nenhum ticket com status ${status}`);
    }
    
    // 4. Log para audit
    this.logger.log(`Buscados ${tickets.length} tickets com status ${status}`);
    
    // 5. Retornar resposta estruturada
    return {
      tickets,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    // 6. Log de erro
    this.logger.error(
      `Erro ao buscar tickets: ${error.message}`,
      error.stack
    );
    
    // 7. Re-throw se for erro conhecido
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    
    // 8. Erro genérico para o resto
    throw new InternalServerErrorException(
      'Erro ao buscar tickets',
      error.message
    );
  }
}
```

#### Template: React Component

```typescript
/**
 * Componente de lista de tickets com filtros
 */
interface TicketListProps {
  status?: StatusTicket;
  onTicketSelect: (ticket: Ticket) => void;
}

export const TicketList: React.FC<TicketListProps> = ({ 
  status, 
  onTicketSelect 
}) => {
  // 1. State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  
  // 2. Store (se usar Zustand)
  const { addTicket, updateTicket } = useAtendimentoStore();
  
  // 3. WebSocket
  useWebSocket({
    onNovoTicket: (ticket) => {
      if (!status || ticket.status === status) {
        setTickets(prev => [ticket, ...prev]);
      }
    },
    onTicketAtualizado: (ticket) => {
      setTickets(prev => prev.map(t => 
        t.id === ticket.id ? ticket : t
      ));
    },
  });
  
  // 4. Effects
  useEffect(() => {
    carregarTickets();
  }, [status, page]);
  
  // 5. Handlers
  const carregarTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await atendimentoService.buscarTickets({
        status,
        page,
        limit: 20,
      });
      
      setTickets(response.tickets);
    } catch (err) {
      console.error('Erro ao carregar tickets:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTicketClick = useCallback((ticket: Ticket) => {
    onTicketSelect(ticket);
  }, [onTicketSelect]);
  
  // 6. Render conditions
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage message={error} onRetry={carregarTickets} />;
  }
  
  if (tickets.length === 0) {
    return <EmptyState message="Nenhum ticket encontrado" />;
  }
  
  // 7. Render principal
  return (
    <div className="ticket-list">
      {tickets.map(ticket => (
        <TicketCard 
          key={ticket.id}
          ticket={ticket}
          onClick={() => handleTicketClick(ticket)}
        />
      ))}
      
      <Pagination 
        currentPage={page}
        onPageChange={setPage}
      />
    </div>
  );
};
```

---

## 🏗️ ARQUITETURA DE REFERÊNCIA {#arquitetura}

### Backend (NestJS)

```
backend/src/modules/atendimento/
├── controllers/
│   ├── ticket.controller.ts              # REST endpoints
│   ├── mensagem.controller.ts
│   ├── fila.controller.ts
│   └── template.controller.ts
├── services/
│   ├── ticket.service.ts                 # Lógica de negócio
│   ├── mensagem.service.ts
│   ├── fila.service.ts
│   ├── distribuicao.service.ts           # Distribuição de tickets
│   ├── sla.service.ts                    # SLA tracking
│   └── template.service.ts               # Templates de mensagens
├── processors/
│   ├── sla-monitor.processor.ts          # Cron jobs
│   └── inactividade.processor.ts
├── gateways/
│   └── atendimento.gateway.ts            # WebSocket
├── entities/
│   ├── ticket.entity.ts                  # Modelos TypeORM
│   ├── mensagem.entity.ts
│   ├── fila.entity.ts
│   ├── sla.entity.ts
│   └── template.entity.ts
├── dto/
│   ├── create-ticket.dto.ts              # Validação de entrada
│   ├── update-ticket.dto.ts
│   └── filtrar-tickets.dto.ts
└── utils/
    ├── validators.ts                      # Validações customizadas
    └── formatters.ts                      # Formatadores
```

### Frontend (React)

```
frontend-web/src/features/atendimento/
├── pages/
│   ├── AtendimentoIntegradoPage.tsx      # Página principal
│   └── DashboardMetricasPage.tsx         # Dashboard
├── omnichannel/
│   ├── ChatOmnichannel.tsx               # Componente principal
│   ├── components/
│   │   ├── ConversationList.tsx          # Lista de conversas
│   │   ├── ChatArea.tsx                  # Área de chat
│   │   ├── MessageList.tsx               # Lista de mensagens
│   │   ├── MessageInput.tsx              # Input com templates
│   │   └── CustomerInfo.tsx              # Info do cliente
│   ├── hooks/
│   │   ├── useWebSocket.ts               # WebSocket hook
│   │   ├── useTickets.ts                 # Tickets hook
│   │   └── useMensagens.ts               # Mensagens hook
│   ├── services/
│   │   └── atendimentoService.ts         # API calls
│   ├── stores/
│   │   └── atendimentoStore.ts           # Zustand store
│   └── types/
│       └── index.ts                       # TypeScript types
└── dashboard/
    ├── DashboardMetricas.tsx
    ├── components/
    │   ├── KPICard.tsx
    │   ├── GraficoTickets.tsx
    │   └── TabelaAtendentes.tsx
    └── services/
        └── metricasService.ts
```

---

## 📊 MÉTRICAS DE QUALIDADE

### KPIs de Código

| Métrica | Meta | Atual | Status |
|---------|------|-------|--------|
| **Code Coverage** | >= 70% | ? | 🟡 Medir |
| **TypeScript Errors** | 0 | ? | 🟡 Medir |
| **ESLint Warnings** | 0 | ? | 🟡 Medir |
| **Complexity Média** | <= 10 | ? | 🟡 Medir |
| **Duplicação** | <= 3% | ? | 🟡 Medir |
| **Tempo Build** | <= 2min | ? | 🟡 Medir |
| **Bundle Size** | <= 500KB | ? | 🟡 Medir |

### Ferramentas de Medição

```bash
# Instalar ferramentas
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev eslint @typescript-eslint/eslint-plugin
npm install --save-dev prettier
npm install --save-dev husky lint-staged

# Configurar pre-commit hooks
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm test"

# Adicionar script no package.json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "test": "jest --coverage --coverageThreshold='{\"global\":{\"lines\":70}}'",
    "type-check": "tsc --noEmit",
    "build": "npm run type-check && npm run lint && vite build"
  }
}
```

---

## 🎓 TREINAMENTO DA EQUIPE

### Semana 1: Onboarding

1. **Segunda**: Apresentação do plano completo (2h)
2. **Terça**: Workshop de código limpo (4h)
3. **Quarta**: Pair programming - correção de gambiarras (6h)
4. **Quinta**: Code review ao vivo (3h)
5. **Sexta**: Retrospectiva e ajustes (2h)

### Material de Estudo

- [Clean Code - Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [NestJS Best Practices](https://docs.nestjs.com/)
- [React Best Practices 2025](https://react.dev/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

## 📅 CRONOGRAMA COMPLETO (90 DIAS)

| Sprint | Semanas | Objetivo | Prioridade |
|--------|---------|----------|------------|
| **Sprint 1** | 1-2 | Eliminar gambiarras + Filas | 🔴 CRÍTICA |
| **Sprint 2** | 3-4 | Templates + SLA | 🔴 ALTA |
| **Sprint 3** | 5-6 | Dashboard + Métricas | 🟡 MÉDIA |
| **Sprint 4** | 7-8 | Integração Email | 🟡 MÉDIA |
| **Sprint 5** | 9-10 | Instagram/Facebook | 🟢 BAIXA |
| **Sprint 6** | 11-12 | Tags + Chatbot | 🟢 BAIXA |

**Checkpoint semanal**: Sexta-feira às 16h  
**Demo para stakeholders**: Final de cada sprint  
**Retrospectiva**: Última sexta do sprint  

---

## ✅ CRITÉRIOS DE SUCESSO

**Sprint 1 (Gambiarras)**:
- ✅ ZERO gambiarras no código
- ✅ Code coverage >= 70%
- ✅ Build sem warnings
- ✅ Sistema de filas funcionando

**Sprint 2 (Templates + SLA)**:
- ✅ Templates funcionando com atalhos
- ✅ SLA tracking ativo
- ✅ Alertas de violação funcionando

**Sprint 3 (Dashboard)**:
- ✅ Dashboard em tempo real
- ✅ Métricas precisas
- ✅ Exportação de relatórios

**Final (90 dias)**:
- ✅ Sistema omnichannel completo
- ✅ Multi-canal (WhatsApp + Email + Instagram)
- ✅ Nota >= 9/10 na análise de arquitetura
- ✅ Comparável a Zendesk/Intercom

---

## 🎯 CONCLUSÃO

Este plano garante:

1. **Eliminação total de gambiarras** (Sprint 1)
2. **Código de qualidade enterprise** (padrões rigorosos)
3. **Implementação de features críticas** (Filas, SLA, Templates)
4. **Sistema escalável e manutenível** (arquitetura sólida)
5. **Equipe alinhada** (treinamento + code review)

**Meta final**: Módulo Atendimento (Omnichannel) do ConectCRM com nota **9/10**, comparável às plataformas líderes do mercado, **SEM gambiarras**.

---

**Documento vivo**: Atualizar a cada sprint  
**Revisão**: Semanal (sextas)  
**Responsável**: Tech Lead  
**Última atualização**: 06/11/2025
