# 🎧 Sistema de Suporte Integrado para SaaS

## 📋 **Help Desk Interno por Cliente**

### 1. **🎫 Sistema de Tickets**

```sql
-- Categorias de Suporte
CREATE TABLE support_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    priority_default INTEGER DEFAULT 2, -- 1=baixa, 2=média, 3=alta, 4=crítica
    sla_hours INTEGER DEFAULT 24,
    active BOOLEAN DEFAULT TRUE
);

-- Tickets de Suporte
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(20) UNIQUE NOT NULL, -- TK-2024-001
    empresa_id UUID NOT NULL,
    usuario_id UUID NOT NULL, -- Quem abriu
    category_id UUID REFERENCES support_categories(id),
    assigned_to UUID, -- Agente responsável
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'
    resolution TEXT,
    tags TEXT[],
    metadata JSONB, -- Informações técnicas (versão, browser, etc)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- Respostas dos Tickets
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id),
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- 'customer', 'agent', 'system'
    message TEXT NOT NULL,
    attachments JSONB, -- Array de URLs de anexos
    is_internal BOOLEAN DEFAULT FALSE, -- Nota interna
    created_at TIMESTAMP DEFAULT NOW()
);

-- Anexos
CREATE TABLE ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id),
    message_id UUID REFERENCES ticket_messages(id),
    filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **🤖 Sistema de Knowledge Base**

```sql
-- Base de Conhecimento
CREATE TABLE knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category VARCHAR(100),
    tags TEXT[],
    difficulty_level INTEGER DEFAULT 1, -- 1=básico, 2=intermediário, 3=avançado
    estimated_read_time INTEGER, -- minutos
    author_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    views_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    unhelpful_votes INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);

-- FAQ Dinâmico
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    unhelpful_votes INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **📊 Dashboard de Suporte**

```typescript
@Injectable()
export class SupportDashboardService {
  async getSupportMetrics(empresaId?: string) {
    const filters = empresaId ? { empresa_id: empresaId } : {};
    
    return {
      // Métricas Gerais
      tickets_abertos: await this.getTicketsCount({ ...filters, status: 'open' }),
      tickets_em_andamento: await this.getTicketsCount({ ...filters, status: 'in_progress' }),
      tickets_resolvidos_hoje: await this.getTicketsResolvedToday(filters),
      tempo_medio_resolucao: await this.getAvgResolutionTime(filters),
      
      // SLA
      tickets_dentro_sla: await this.getTicketsWithinSLA(filters),
      tickets_fora_sla: await this.getTicketsOutsideSLA(filters),
      sla_compliance_rate: await this.getSLAComplianceRate(filters),
      
      // Por Prioridade
      criticos: await this.getTicketsCount({ ...filters, priority: 4 }),
      altos: await this.getTicketsCount({ ...filters, priority: 3 }),
      medios: await this.getTicketsCount({ ...filters, priority: 2 }),
      baixos: await this.getTicketsCount({ ...filters, priority: 1 }),
      
      // Trends
      tickets_por_dia: await this.getTicketsTrend(filters),
      categorias_mais_comuns: await this.getMostCommonCategories(filters),
      
      // Knowledge Base
      artigos_mais_acessados: await this.getMostViewedArticles(),
      pesquisas_sem_resultado: await this.getFailedSearches()
    };
  }
}
```

### 4. **🔍 Sistema de Busca Inteligente**

```typescript
@Injectable()
export class SupportSearchService {
  async searchHelp(query: string, empresaId?: string) {
    // Buscar em Knowledge Base
    const articles = await this.searchArticles(query);
    
    // Buscar em FAQs
    const faqs = await this.searchFAQs(query);
    
    // Buscar tickets similares (se admin)
    const similarTickets = empresaId ? 
      await this.searchSimilarTickets(query, empresaId) : [];
    
    // Sugestões automáticas
    const suggestions = await this.generateSuggestions(query);
    
    return {
      articles: articles.slice(0, 5),
      faqs: faqs.slice(0, 3),
      similar_tickets: similarTickets.slice(0, 3),
      suggestions,
      total_results: articles.length + faqs.length + similarTickets.length
    };
  }

  private async generateSuggestions(query: string) {
    // IA para sugerir soluções baseadas na query
    const commonIssues = [
      {
        trigger: ['login', 'senha', 'acesso'],
        suggestion: 'Problemas de Login',
        action: 'reset_password'
      },
      {
        trigger: ['lento', 'performance', 'carregando'],
        suggestion: 'Otimização de Performance',
        action: 'check_browser'
      },
      {
        trigger: ['dados', 'perdeu', 'sumiu'],
        suggestion: 'Recuperação de Dados',
        action: 'contact_support'
      }
    ];

    return commonIssues.filter(issue => 
      issue.trigger.some(word => 
        query.toLowerCase().includes(word)
      )
    );
  }
}
```

### 5. **📱 Widget de Suporte In-App**

```typescript
// Component React para Widget de Suporte
export const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showNewTicket, setShowNewTicket] = useState(false);

  const handleSearch = async (query: string) => {
    if (query.length < 3) return;
    
    const results = await supportService.searchHelp(query);
    setSearchResults(results);
  };

  return (
    <>
      {/* Botão Flutuante */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Modal de Suporte */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
          <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-semibold">Como podemos ajudar?</h3>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Busca */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Descreva seu problema..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto p-4">
              {searchResults ? (
                <SearchResults results={searchResults} />
              ) : (
                <QuickActions onNewTicket={() => setShowNewTicket(true)} />
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowNewTicket(true)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Abrir Ticket de Suporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Ticket */}
      {showNewTicket && (
        <NewTicketModal
          onClose={() => setShowNewTicket(false)}
          onSubmit={handleNewTicket}
        />
      )}
    </>
  );
};
```

### 6. **🤖 Chatbot com IA**

```typescript
@Injectable()
export class SupportChatbotService {
  async processMessage(message: string, context: any) {
    // Analisar intenção da mensagem
    const intent = await this.analyzeIntent(message);
    
    switch (intent.type) {
      case 'greeting':
        return this.getGreetingResponse();
        
      case 'technical_issue':
        return this.handleTechnicalIssue(intent.entities, context);
        
      case 'billing_question':
        return this.handleBillingQuestion(intent.entities, context);
        
      case 'feature_request':
        return this.handleFeatureRequest(intent.entities);
        
      case 'escalate':
        return this.escalateToHuman(context);
        
      default:
        return this.getDefaultResponse();
    }
  }

  private async handleTechnicalIssue(entities: any, context: any) {
    // Buscar soluções conhecidas
    const solutions = await this.findKnownSolutions(entities);
    
    if (solutions.length > 0) {
      return {
        type: 'solution_suggestion',
        message: 'Encontrei algumas soluções que podem ajudar:',
        suggestions: solutions,
        quick_actions: ['try_solution', 'need_more_help']
      };
    }
    
    return {
      type: 'collect_info',
      message: 'Para ajudar melhor, pode me contar mais detalhes sobre o problema?',
      follow_up_questions: [
        'Quando o problema começou?',
        'Qual navegador você está usando?',
        'Você fez alguma alteração recente?'
      ]
    };
  }
}
```

## 🚀 **Integração com o Sistema Principal**

### **Notificações Automáticas:**
- 🚨 Ticket crítico aberto
- ⏰ SLA próximo do vencimento
- ✅ Ticket resolvido
- 📈 Relatórios semanais

### **Métricas para Admin SaaS:**
- 📊 Satisfaction Score por cliente
- 🎯 Tempo médio de resolução
- 📈 Volume de tickets por plano
- 💡 Tópicos mais comuns (para melhorar produto)
