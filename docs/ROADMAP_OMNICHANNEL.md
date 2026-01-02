# 🚀 Roadmap de Evolução - Módulo Omnichannel

**Data**: 11 de dezembro de 2025  
**Status Atual**: ✅ Core funcional (webhook → fila → chat → mensagens)  
**Objetivo**: Evolução estruturada do atendimento omnichannel para produção

---

## 🎯 Situação Atual (Baseline)

### ✅ O Que JÁ Funciona
- ✅ WhatsApp webhook recebendo mensagens
- ✅ Tickets criados automaticamente na fila
- ✅ Chat interface com mensagens em tempo real
- ✅ WebSocket sincronizando atualizações
- ✅ Envio de mensagens texto
- ✅ Scroll automático inteligente
- ✅ Progress bar para uploads
- ✅ Reconexão automática WebSocket

### 🔧 Limitações Atuais
- ⚠️ LocalTunnel (temporário, URL muda)
- ⚠️ Sem upload de imagens/arquivos completo
- ⚠️ Sem templates de mensagens rápidas
- ⚠️ Sem transferência de tickets entre atendentes
- ⚠️ Sem métricas de atendimento
- ⚠️ Sem histórico de conversas
- ⚠️ Sem automação de respostas

---

## 📊 Matriz de Priorização

| Feature | Impacto | Esforço | ROI | Prioridade |
|---------|---------|---------|-----|------------|
| **Deploy Produção** | 🔴 Crítico | 4h | ⭐⭐⭐⭐⭐ | 🔴 P0 |
| **Upload Imagens/Arquivos** | 🔴 Alto | 6h | ⭐⭐⭐⭐⭐ | 🔴 P0 |
| **Templates Rápidos** | 🟠 Alto | 4h | ⭐⭐⭐⭐ | 🟠 P1 |
| **Transferência Tickets** | 🟠 Alto | 6h | ⭐⭐⭐⭐ | 🟠 P1 |
| **Histórico Conversas** | 🟠 Médio | 3h | ⭐⭐⭐⭐ | 🟠 P1 |
| **Notificações Desktop** | 🟡 Médio | 2h | ⭐⭐⭐ | 🟡 P2 |
| **Métricas Dashboard** | 🟡 Médio | 8h | ⭐⭐⭐ | 🟡 P2 |
| **Automação Respostas (IA)** | 🟢 Baixo | 12h | ⭐⭐ | 🟢 P3 |

---

## 🚀 SPRINT 1 (Esta Semana - 12-17 Dezembro) - P0: Produção

### Objetivo: Sistema estável em produção com features essenciais

#### 1️⃣ Deploy em Cloud Permanente (4h) 🔴 CRÍTICO

**Por quê primeiro?**
- LocalTunnel é instável (URL muda, não confiável)
- Webhook Meta precisa de URL fixa
- Bloqueador para clientes reais

**Tarefas**:
- [ ] Escolher plataforma (Railway recomendado)
- [ ] Configurar variáveis de ambiente
- [ ] Deploy backend + frontend
- [ ] Atualizar webhook URL no Meta
- [ ] Testar fluxo completo em produção
- [ ] Documentar URL de produção

**Entregável**: URL permanente funcionando 24/7

---

#### 2️⃣ Upload Completo de Imagens/Arquivos (6h) 🔴 CRÍTICO

**Por quê essencial?**
- Clientes enviam prints, documentos, PDFs
- Atendentes precisam enviar materiais
- Feature top 3 mais solicitada

**Componentes a Implementar**:

**A. Backend - Upload Service** (2h)
```typescript
// backend/src/modules/atendimento/services/upload.service.ts
@Injectable()
export class UploadService {
  async uploadToS3(file: Express.Multer.File): Promise<string> {
    // Upload para S3/CloudFlare R2/Supabase Storage
    const key = `atendimento/${Date.now()}-${file.originalname}`;
    await s3.upload({ Key: key, Body: file.buffer });
    return `https://cdn.conectcrm.com/${key}`;
  }
  
  async sendWhatsAppMedia(
    phoneNumberId: string,
    to: string,
    mediaUrl: string,
    mediaType: 'image' | 'document' | 'audio' | 'video',
  ): Promise<void> {
    // Meta WhatsApp API - enviar mídia
    await axios.post(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: mediaType,
      [mediaType]: { link: mediaUrl },
    });
  }
}
```

**B. Backend - Endpoint Upload** (1h)
```typescript
// backend/src/modules/atendimento/controllers/upload.controller.ts
@Post('mensagens/upload')
@UseInterceptors(FileInterceptor('file'))
async uploadArquivo(
  @UploadedFile() file: Express.Multer.File,
  @Body('ticketId') ticketId: string,
) {
  // 1. Upload para storage
  const url = await this.uploadService.uploadToS3(file);
  
  // 2. Criar mensagem no banco
  const mensagem = await this.mensagemService.criar({
    ticketId,
    tipo: 'arquivo',
    arquivo_url: url,
    arquivo_nome: file.originalname,
    arquivo_tipo: file.mimetype,
  });
  
  // 3. Enviar via WhatsApp
  await this.uploadService.sendWhatsAppMedia(
    phoneNumberId,
    destinatario,
    url,
    this.getMediaType(file.mimetype),
  );
  
  // 4. Broadcast WebSocket
  this.websocketGateway.emitNovaMensagem(mensagem);
  
  return mensagem;
}
```

**C. Frontend - Upload Component** (2h)
```typescript
// frontend-web/src/features/atendimento/omnichannel/components/FileUploadArea.tsx
const FileUploadArea: React.FC<Props> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    
    if (!file) return;
    
    // Validações
    const maxSize = 16 * 1024 * 1024; // 16MB (limite WhatsApp)
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Máximo 16MB.');
      return;
    }
    
    // Upload com progresso
    await atendimentoService.uploadArquivo(
      file,
      ticketId,
      (progress) => setUploadProgress(progress),
    );
  };
  
  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-6 ${isDragging ? 'border-[#159A9C] bg-[#159A9C]/10' : 'border-[#B4BEC9]'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <Upload className="h-10 w-10 text-[#159A9C] mx-auto mb-3" />
      <p className="text-sm text-[#002333] text-center">
        Arraste arquivos ou clique para selecionar
      </p>
      <p className="text-xs text-[#B4BEC9] text-center mt-1">
        Máximo 16MB (imagens, PDFs, documentos)
      </p>
      
      {uploadProgress > 0 && (
        <div className="mt-4">
          <div className="h-2 bg-[#DEEFE7] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#159A9C] transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-center mt-1 text-[#002333]">
            Enviando... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
};
```

**D. Frontend - Preview de Arquivos** (1h)
- Mostrar thumbnail de imagens
- Ícones para PDFs/documentos
- Botão de download
- Lightbox para visualização

**Critérios de Aceite**:
- [ ] Drag & drop funcionando
- [ ] Upload com progress bar
- [ ] Preview de imagens no chat
- [ ] Download de arquivos
- [ ] Envio via WhatsApp (Meta API)
- [ ] Validação de tamanho (16MB)
- [ ] Validação de tipos permitidos

**Entregável**: Upload/download completo funcionando

---

#### 3️⃣ Testes E2E (4h) 🟠 IMPORTANTE

**Por quê agora?**
- Prevenir regressões antes de escalar
- Validar fluxos críticos automaticamente

**Testes Essenciais**:

```typescript
// test/e2e/omnichannel/critical-flows.spec.ts
test.describe('Omnichannel - Fluxos Críticos', () => {
  test('Receber mensagem WhatsApp e aparecer no chat', async ({ page }) => {
    // 1. Simular webhook Meta
    await axios.post('http://localhost:3001/api/atendimento/webhooks/whatsapp/test', mockPayload);
    
    // 2. Abrir chat
    await page.goto('http://localhost:3000/atendimento/chat-omnichannel');
    
    // 3. Verificar ticket criado
    await expect(page.locator('[data-testid="ticket-card"]')).toBeVisible();
    
    // 4. Abrir ticket
    await page.click('[data-testid="ticket-card"]:first-child');
    
    // 5. Verificar mensagem apareceu
    await expect(page.locator('text=Mensagem de teste')).toBeVisible();
  });
  
  test('Atendente envia mensagem e recebe confirmação', async ({ page }) => {
    // Login, navegar, enviar mensagem, verificar confirmação
  });
  
  test('Upload de arquivo e preview no chat', async ({ page }) => {
    // Upload, verificar progresso, validar preview
  });
});
```

**Entregável**: Suite de testes automatizados passando

---

### 📦 Entregáveis Sprint 1
- ✅ Sistema em produção (Railway/Render)
- ✅ Upload/download de arquivos funcionando
- ✅ Testes E2E críticos automatizados
- ✅ Documentação atualizada

**Tempo Total**: ~14 horas (~2 dias de trabalho)

---

## 🎨 SPRINT 2 (Semana 18-24 Dezembro) - P1: UX Profissional

### Objetivo: Otimizar experiência do atendente

#### 4️⃣ Templates de Mensagens Rápidas (4h)

**Por quê importante?**
- Atendentes repetem mensagens (boas-vindas, instruções, despedida)
- Economiza tempo e padroniza atendimento

**Implementação**:

**A. Backend - CRUD Templates** (1h)
```typescript
// backend/src/modules/atendimento/entities/template-mensagem.entity.ts
@Entity('atendimento_templates_mensagens')
export class TemplateMensagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  titulo: string; // Ex: "Boas-vindas"
  
  @Column('text')
  conteudo: string; // Ex: "Olá! Seja bem-vindo ao suporte da {empresa}..."
  
  @Column({ nullable: true })
  atalho: string; // Ex: "/bv" (quick access)
  
  @Column({ default: true })
  ativo: boolean;
  
  @ManyToOne(() => Empresa)
  empresa: Empresa;
}
```

**B. Frontend - Componente Templates** (2h)
```typescript
// Dropdown de templates no input de mensagem
const TemplateSelector: React.FC = ({ onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    atendimentoService.listarTemplates().then(setTemplates);
  }, []);
  
  return (
    <div className="absolute bottom-full mb-2 bg-white rounded-lg shadow-lg border p-2 w-80">
      <input 
        placeholder="Buscar template..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      
      {templates
        .filter(t => t.titulo.toLowerCase().includes(search.toLowerCase()))
        .map(template => (
          <div 
            key={template.id}
            onClick={() => onSelect(template.conteudo)}
            className="p-2 hover:bg-[#159A9C]/10 rounded cursor-pointer"
          >
            <p className="font-medium text-sm text-[#002333]">{template.titulo}</p>
            <p className="text-xs text-[#B4BEC9] truncate">{template.conteudo}</p>
            {template.atalho && (
              <span className="text-xs text-[#159A9C]">{template.atalho}</span>
            )}
          </div>
        ))
      }
    </div>
  );
};
```

**C. Frontend - Autocomplete com "/"** (1h)
```typescript
// Detectar "/" no input e abrir dropdown de templates
const ChatInput = () => {
  const [texto, setTexto] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTexto(value);
    
    // Detectar "/" no início da linha
    if (value.startsWith('/')) {
      setShowTemplates(true);
    } else {
      setShowTemplates(false);
    }
  };
  
  const handleSelectTemplate = (conteudo: string) => {
    setTexto(conteudo);
    setShowTemplates(false);
  };
  
  return (
    <>
      {showTemplates && <TemplateSelector onSelect={handleSelectTemplate} />}
      <textarea value={texto} onChange={handleChange} />
    </>
  );
};
```

**Entregável**: Sistema de templates funcionando com autocomplete

---

#### 5️⃣ Transferência de Tickets entre Atendentes (6h)

**Por quê importante?**
- Especialização (vendas, suporte, financeiro)
- Escalação de problemas complexos

**Implementação**:

**A. Backend - Endpoint Transferência** (2h)
```typescript
// backend/src/modules/atendimento/services/ticket.service.ts
async transferir(
  ticketId: string,
  atendenteDestinoId: string,
  motivo?: string,
): Promise<Ticket> {
  const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
  
  // Criar registro de histórico
  await this.historicoRepo.save({
    ticketId,
    acao: 'transferencia',
    atendenteOrigemId: ticket.atendenteId,
    atendenteDestinoId,
    motivo,
  });
  
  // Atualizar ticket
  ticket.atendenteId = atendenteDestinoId;
  ticket.status = 'em_atendimento';
  await this.ticketRepo.save(ticket);
  
  // Notificar atendente destino via WebSocket
  this.websocketGateway.notificarTransferencia(atendenteDestinoId, ticket);
  
  return ticket;
}
```

**B. Frontend - Modal de Transferência** (3h)
```typescript
// Modal com lista de atendentes disponíveis
const TransferenciaModal: React.FC<Props> = ({ ticket, onClose }) => {
  const [atendentes, setAtendentes] = useState([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  
  useEffect(() => {
    atendimentoService.listarAtendentesDisponiveis().then(setAtendentes);
  }, []);
  
  const handleTransferir = async () => {
    if (!selecionado) return;
    
    await atendimentoService.transferirTicket(ticket.id, selecionado, motivo);
    toast.success('Ticket transferido com sucesso!');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-[#002333] mb-4">
          Transferir Ticket
        </h2>
        
        <p className="text-sm text-[#B4BEC9] mb-4">
          Cliente: {ticket.contato_nome}
        </p>
        
        {/* Lista de atendentes */}
        <div className="space-y-2 mb-4">
          {atendentes.map(atendente => (
            <div 
              key={atendente.id}
              onClick={() => setSelecionado(atendente.id)}
              className={`p-3 border rounded-lg cursor-pointer ${
                selecionado === atendente.id 
                  ? 'border-[#159A9C] bg-[#159A9C]/10' 
                  : 'border-[#B4BEC9]'
              }`}
            >
              <p className="font-medium text-[#002333]">{atendente.nome}</p>
              <p className="text-xs text-[#B4BEC9]">
                {atendente.ticketsAtivos} tickets ativos
              </p>
            </div>
          ))}
        </div>
        
        {/* Motivo (opcional) */}
        <textarea 
          placeholder="Motivo da transferência (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="w-full p-2 border rounded-lg mb-4"
          rows={3}
        />
        
        {/* Botões */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-[#B4BEC9] rounded-lg"
          >
            Cancelar
          </button>
          <button 
            onClick={handleTransferir}
            disabled={!selecionado}
            className="px-4 py-2 bg-[#159A9C] text-white rounded-lg disabled:opacity-50"
          >
            Transferir
          </button>
        </div>
      </div>
    </div>
  );
};
```

**C. Frontend - Notificação de Transferência** (1h)
```typescript
// Toast quando recebe transferência
useEffect(() => {
  socket.on('ticket:transferido', (ticket) => {
    toast.info(`Novo ticket transferido de ${ticket.atendenteOrigem}`, {
      action: {
        label: 'Ver Ticket',
        onClick: () => navigate(`/atendimento/chat-omnichannel/${ticket.id}`),
      },
    });
  });
}, []);
```

**Entregável**: Transferência de tickets funcionando com notificações

---

#### 6️⃣ Histórico Completo de Conversas (3h)

**Por quê importante?**
- Contexto de atendimentos anteriores
- Análise de comportamento do cliente

**Implementação**:

**A. Backend - Endpoint Histórico** (1h)
```typescript
@Get('contatos/:contatoId/historico')
async buscarHistorico(@Param('contatoId') contatoId: string) {
  const tickets = await this.ticketRepo.find({
    where: { contatoId },
    relations: ['mensagens', 'atendente'],
    order: { criadoEm: 'DESC' },
  });
  
  return tickets.map(ticket => ({
    id: ticket.id,
    status: ticket.status,
    criadoEm: ticket.criadoEm,
    finalizadoEm: ticket.finalizadoEm,
    atendente: ticket.atendente?.nome,
    totalMensagens: ticket.mensagens.length,
    primeiraMensagem: ticket.mensagens[0]?.conteudoTexto,
  }));
}
```

**B. Frontend - Painel Lateral de Histórico** (2h)
```typescript
// Componente que mostra histórico ao lado do chat
const HistoricoContato: React.FC<{ contatoId: string }> = ({ contatoId }) => {
  const [historico, setHistorico] = useState([]);
  const [expandido, setExpandido] = useState<string | null>(null);
  
  useEffect(() => {
    atendimentoService.buscarHistorico(contatoId).then(setHistorico);
  }, [contatoId]);
  
  return (
    <div className="w-80 border-l border-[#DEEFE7] bg-white p-4 overflow-y-auto">
      <h3 className="text-lg font-bold text-[#002333] mb-4">
        Histórico de Atendimentos
      </h3>
      
      {historico.map(ticket => (
        <div 
          key={ticket.id}
          className="mb-4 p-3 border border-[#DEEFE7] rounded-lg"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <span className={`px-2 py-1 rounded text-xs ${
              ticket.status === 'resolvido' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {ticket.status}
            </span>
            <span className="text-xs text-[#B4BEC9]">
              {format(new Date(ticket.criadoEm), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
          
          {/* Preview */}
          <p className="text-sm text-[#002333] line-clamp-2 mb-2">
            {ticket.primeiraMensagem}
          </p>
          
          {/* Metadata */}
          <div className="flex justify-between items-center text-xs text-[#B4BEC9]">
            <span>{ticket.totalMensagens} mensagens</span>
            <span>Atendido por {ticket.atendente}</span>
          </div>
          
          {/* Botão expandir */}
          <button 
            onClick={() => setExpandido(expandido === ticket.id ? null : ticket.id)}
            className="text-xs text-[#159A9C] mt-2"
          >
            {expandido === ticket.id ? 'Ver menos' : 'Ver todas as mensagens'}
          </button>
          
          {/* Mensagens expandidas */}
          {expandido === ticket.id && (
            <div className="mt-3 space-y-2">
              {/* Carregar e mostrar todas as mensagens deste ticket */}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

**Entregável**: Histórico de conversas visível no painel lateral

---

### 📦 Entregáveis Sprint 2
- ✅ Templates de mensagens com autocomplete
- ✅ Transferência de tickets funcionando
- ✅ Histórico completo de conversas
- ✅ UX profissional e ágil

**Tempo Total**: ~13 horas (~1,5 dias de trabalho)

---

## 🔔 SPRINT 3 (Semana 25-31 Dezembro) - P2: Engajamento

### Objetivo: Aumentar produtividade do atendente

#### 7️⃣ Notificações Desktop (2h)

**Por quê importante?**
- Atendente vê nova mensagem mesmo em outra aba
- Reduz tempo de resposta

**Implementação**:

```typescript
// frontend-web/src/utils/notifications.ts
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

export const showNotification = (titulo: string, corpo: string) => {
  if (Notification.permission === 'granted') {
    new Notification(titulo, {
      body: corpo,
      icon: '/logo.png',
      tag: 'conectcrm-notification',
    });
  }
};

// Uso no WebSocket
socket.on('mensagem:nova', (mensagem) => {
  if (document.hidden) { // Só notifica se usuário não está na aba
    showNotification(
      `Nova mensagem de ${mensagem.contato}`,
      mensagem.conteudoTexto,
    );
  }
});
```

**Entregável**: Notificações desktop funcionando

---

#### 8️⃣ Dashboard de Métricas de Atendimento (8h)

**Por quê importante?**
- Gestão precisa de dados (tempo médio, taxa resolução)
- Identificar gargalos

**Métricas Essenciais**:
- Tempo médio de primeira resposta
- Tempo médio de resolução
- Taxa de resolução (resolvidos vs abandonados)
- Tickets por atendente
- Horários de pico
- Canais mais usados

**Implementação**:

**A. Backend - Queries Agregadas** (4h)
```typescript
// backend/src/modules/atendimento/services/metricas.service.ts
@Injectable()
export class MetricasService {
  async calcularTempoMedioResposta(empresaId: string, periodo: Date): Promise<number> {
    const result = await this.dataSource.query(`
      SELECT AVG(
        EXTRACT(EPOCH FROM (m.criado_em - t.criado_em)) / 60
      ) as tempo_medio_minutos
      FROM atendimento_tickets t
      JOIN atendimento_mensagens m ON m.ticket_id = t.id
      WHERE t.empresa_id = $1
        AND t.criado_em >= $2
        AND m.tipo_remetente = 'atendente'
        AND m.ordem = 1
    `, [empresaId, periodo]);
    
    return Math.round(result[0].tempo_medio_minutos);
  }
  
  async calcularTaxaResolucao(empresaId: string, periodo: Date): Promise<number> {
    const result = await this.dataSource.query(`
      SELECT 
        COUNT(CASE WHEN status = 'resolvido' THEN 1 END)::float / COUNT(*)::float * 100 as taxa
      FROM atendimento_tickets
      WHERE empresa_id = $1
        AND criado_em >= $2
    `, [empresaId, periodo]);
    
    return Math.round(result[0].taxa);
  }
}
```

**B. Frontend - Dashboard Component** (4h)
```typescript
// frontend-web/src/features/atendimento/pages/DashboardMetricas.tsx
const DashboardMetricas: React.FC = () => {
  const [metricas, setMetricas] = useState({});
  const [periodo, setPeriodo] = useState('7d'); // 7 dias, 30 dias, etc
  
  useEffect(() => {
    atendimentoService.buscarMetricas(periodo).then(setMetricas);
  }, [periodo]);
  
  return (
    <div className="p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          titulo="Tempo Médio Resposta"
          valor={`${metricas.tempoMedioResposta} min`}
          icone={Clock}
        />
        <KPICard 
          titulo="Taxa de Resolução"
          valor={`${metricas.taxaResolucao}%`}
          icone={CheckCircle}
        />
        {/* ... outros KPIs ... */}
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoTicketsPorDia data={metricas.ticketsPorDia} />
        <GraficoTicketsPorAtendente data={metricas.ticketsPorAtendente} />
      </div>
    </div>
  );
};
```

**Entregável**: Dashboard com métricas em tempo real

---

### 📦 Entregáveis Sprint 3
- ✅ Notificações desktop
- ✅ Dashboard de métricas completo
- ✅ Gestão data-driven de atendimento

**Tempo Total**: ~10 horas (~1,5 dias de trabalho)

---

## 🤖 SPRINT 4 (Janeiro 2026) - P3: Automação Inteligente

### Objetivo: Reduzir carga de atendentes com IA

#### 9️⃣ Respostas Automáticas com IA (12h)

**Implementação**:

**A. Backend - Integração OpenAI** (6h)
```typescript
// backend/src/modules/atendimento/services/ia-resposta.service.ts
@Injectable()
export class IARespostaService {
  async gerarResposta(ticket: Ticket): Promise<string> {
    const historico = ticket.mensagens.map(m => ({
      role: m.tipoRemetente === 'contato' ? 'user' : 'assistant',
      content: m.conteudoTexto,
    }));
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Você é um atendente da ${empresa.nome}. 
                    Responda de forma profissional, empática e objetiva.
                    Base de conhecimento: ${empresa.faqDocumentos}`,
        },
        ...historico,
      ],
    });
    
    return completion.choices[0].message.content;
  }
}
```

**B. Frontend - Sugestões de Resposta** (4h)
```typescript
// Botão "Sugerir Resposta" no chat
const SugestaoIA: React.FC = ({ ticket }) => {
  const [sugestao, setSugestao] = useState('');
  const [loading, setLoading] = useState(false);
  
  const gerarSugestao = async () => {
    setLoading(true);
    const resposta = await atendimentoService.gerarRespostaIA(ticket.id);
    setSugestao(resposta);
    setLoading(false);
  };
  
  return (
    <div className="p-3 bg-[#DEEFE7] rounded-lg mb-3">
      <button 
        onClick={gerarSugestao}
        disabled={loading}
        className="px-3 py-1 bg-[#159A9C] text-white rounded text-sm"
      >
        {loading ? 'Gerando...' : '🤖 Sugerir Resposta com IA'}
      </button>
      
      {sugestao && (
        <div className="mt-3 p-3 bg-white rounded border">
          <p className="text-sm text-[#002333] mb-2">{sugestao}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => usarSugestao(sugestao)}
              className="px-3 py-1 bg-[#159A9C] text-white rounded text-xs"
            >
              Usar Esta Resposta
            </button>
            <button 
              onClick={() => setSugestao('')}
              className="px-3 py-1 border rounded text-xs"
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

**C. Backend - Bot Automático (2h)**
```typescript
// Responder automaticamente se confiança > 80%
if (ticket.primeiraInteracao && empresaConfig.botAtivo) {
  const sugestao = await this.iaService.gerarResposta(ticket);
  const confianca = await this.iaService.calcularConfianca(sugestao);
  
  if (confianca > 0.8) {
    // Enviar automaticamente
    await this.mensagemService.enviar(ticket.id, {
      conteudo: sugestao,
      tipo: 'bot',
    });
    
    // Marcar ticket como "atendido_bot"
    ticket.status = 'atendido_bot';
  } else {
    // Enviar para fila humana com sugestão
    ticket.status = 'aguardando_atendente';
    ticket.sugestaoIA = sugestao;
  }
}
```

**Entregável**: Bot de IA respondendo perguntas simples automaticamente

---

### 📦 Entregáveis Sprint 4
- ✅ IA gerando sugestões de resposta
- ✅ Bot automático para perguntas frequentes
- ✅ Redução de 30-40% na carga de atendentes

**Tempo Total**: ~12 horas (~2 dias de trabalho)

---

## 📊 Resumo Geral do Roadmap

| Sprint | Foco | Tempo | Features |
|--------|------|-------|----------|
| **Sprint 1 (P0)** | Produção Estável | 14h | Deploy, Upload Arquivos, Testes E2E |
| **Sprint 2 (P1)** | UX Profissional | 13h | Templates, Transferência, Histórico |
| **Sprint 3 (P2)** | Engajamento | 10h | Notificações, Dashboard Métricas |
| **Sprint 4 (P3)** | Automação IA | 12h | Bot Inteligente, Sugestões IA |

**Total**: ~49 horas (~6 dias de trabalho)

---

## 🎯 Decisão Recomendada

### Começar por: **SPRINT 1 - P0 (Produção Estável)**

**Ordem de Execução Sugerida**:
1. 🔴 **Deploy em Cloud** (4h) - BLOQUEADOR
2. 🔴 **Upload Arquivos** (6h) - FEATURE CRÍTICA
3. 🟠 **Testes E2E** (4h) - QUALIDADE

**Por quê esta ordem?**
- Deploy primeiro = URL fixa (desbloqueia Meta webhook)
- Upload depois = feature mais solicitada por clientes
- Testes por último = validar ambos funcionando

---

## 💡 Quer que eu ajude com algum desses itens?

**Posso começar por**:
1. ✅ Criar guia de deploy Railway/Render
2. ✅ Implementar upload de arquivos completo
3. ✅ Configurar Playwright e primeiro teste E2E
4. ✅ Implementar templates de mensagens

**Qual prefere?** 🚀
