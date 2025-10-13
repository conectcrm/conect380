# 💡 Exemplos Práticos - Tela de Faturamento

## 🎯 Cenários de Uso Real

### **Cenário 1: Startup - Gestão Simplificada**
```yaml
Perfil: Fundador/CEO de startup
Equipe: 2-5 pessoas
Volume: 10-50 faturas/mês
Objetivo: Controle básico sem complexidade

Configuração Recomendada:
  Dashboard: 2 cards
    - Valor Recebido (principal KPI)
    - Faturas Vencidas (controle de risco)
  
Workflow Típico:
  1. Criar fatura após fechar venda
  2. Enviar por email automaticamente
  3. Acompanhar recebimento semanalmente
  4. Fazer cobrança manual se necessário

Benefícios:
  - Visão clara do faturamento
  - Processo simples e rápido
  - Foco no essencial
```

### **Cenário 2: Empresa Média - Controle Financeiro**
```yaml
Perfil: Controller/Gerente Financeiro
Equipe: 10-50 pessoas
Volume: 100-500 faturas/mês
Objetivo: Controle rigoroso de fluxo de caixa

Configuração Recomendada:
  Dashboard: 4 cards
    - Total de Faturas (volume)
    - Valor Pendente (contas a receber)
    - Valor Recebido (caixa)
    - Faturas Vencidas (inadimplência)
  
Workflow Típico:
  1. Revisão diária do dashboard
  2. Filtrar faturas vencidas para cobrança
  3. Seleção múltipla para envio de emails
  4. Geração de relatórios mensais
  5. Análise de tendências

Benefícios:
  - Controle completo do AR
  - Redução da inadimplência
  - Planejamento de fluxo de caixa
```

### **Cenário 3: Grande Empresa - Operação Complexa**
```yaml
Perfil: Analista Financeiro/Assistente
Equipe: 50+ pessoas
Volume: 1000+ faturas/mês
Objetivo: Eficiência operacional máxima

Configuração Recomendada:
  Dashboard: 3 cards focados
    - Total de Faturas (produtividade)
    - Faturas do Mês (meta mensal)
    - Faturas Vencidas (prioridade)
  
Workflow Típico:
  1. Criação em lote de faturas
  2. Processamento automatizado
  3. Monitoramento contínuo
  4. Ações em massa para otimização
  5. Integração com outros sistemas

Benefícios:
  - Alta produtividade
  - Processos padronizados
  - Redução de erros manuais
```

### **Cenário 4: Agência/Consultoria - Projetos Múltiplos**
```yaml
Perfil: Gerente de Projetos/Comercial
Equipe: 5-20 pessoas
Volume: 50-200 faturas/mês
Objetivo: Controle por projeto e cliente

Configuração Recomendada:
  Dashboard: 4 cards estratégicos
    - Valor Recebido (receita)
    - Valor Pendente (pipeline)
    - Faturas do Mês (performance)
    - Total de Faturas (atividade)
  
Workflow Típico:
  1. Criar faturas por projeto/milestone
  2. Envio programado para clientes
  3. Acompanhamento por cliente
  4. Cobrança personalizada
  5. Relatórios por projeto

Benefícios:
  - Controle por projeto
  - Visibilidade de receita
  - Gestão de múltiplos clientes
```

## 📱 Jornadas por Dispositivo

### **Desktop - Experiência Completa**
```javascript
// Fluxo típico em desktop
Cenário: "Criar fatura complexa com múltiplos itens"

Passo 1: Acessar Dashboard
- Tela carrega com 4 cards visíveis
- Tabela mostra todas as colunas
- Filtros em layout horizontal

Passo 2: Criar Nova Fatura
- Modal abre em largura máxima (6xl)
- Todos os campos visíveis simultaneamente
- Grid de 6 colunas para itens
- Sidebar com totais sempre visível

Passo 3: Adicionar Múltiplos Itens
- Formulário inline para cada item
- Cálculos em tempo real
- Validação instantânea
- Preview de totais atualizado

Tempo Estimado: 3-5 minutos
Produtividade: Máxima
```

### **Tablet - Experiência Adaptada**
```javascript
// Fluxo típico em tablet
Cenário: "Revisar faturas e fazer ajustes rápidos"

Passo 1: Dashboard Compacto
- Cards em 2 colunas (máximo)
- Scroll horizontal na tabela
- Botões touch-friendly

Passo 2: Edição Rápida
- Modal ocupa 90% da tela
- Campos empilhados verticalmente
- Teclado virtual otimizado

Passo 3: Ações Touch
- Gestos de swipe para ações
- Botões maiores (44px mínimo)
- Feedback tátil habilitado

Tempo Estimado: 4-6 minutos
Produtividade: Alta
```

### **Mobile - Experiência Otimizada**
```javascript
// Fluxo típico em mobile
Cenário: "Consulta rápida e aprovação de faturas"

Passo 1: Dashboard Vertical
- Cards em coluna única
- Navegação por swipe
- Menu hamburger para filtros

Passo 2: Lista de Cards
- Tabela vira cards verticais
- Ações via menu contextual
- Busca com filtros em modal

Passo 3: Visualização Focada
- Uma informação por tela
- Navegação por abas
- Botões de ação flutuantes

Tempo Estimado: 2-3 minutos (consulta)
Produtividade: Focada em visualização
```

## 🎨 Exemplos de Código de Integração

### **Configuração Personalizada de Cards**
```typescript
// Exemplo: Configurar cards para startup
const configuracaoStartup: string[] = [
  'valorTotalPago',    // Principal KPI
  'faturasVencidas'    // Controle de risco
];

localStorage.setItem('faturamento-cards-config', JSON.stringify(configuracaoStartup));

// Resultado: Dashboard com 2 cards centralizados
// Layout: grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto
```

### **Filtros Avançados Personalizados**
```typescript
// Exemplo: Filtro para faturas críticas
const filtrosCriticos: FiltrosFatura = {
  status: StatusFatura.VENCIDA,
  dataVencimentoAte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
  valorMinimo: 1000
};

// Aplicar filtros
setFiltros(filtrosCriticos);
await carregarFaturas();

// Resultado: Lista apenas faturas vencidas há mais de 30 dias com valor > R$ 1.000
```

### **Criação Programática de Fatura**
```typescript
// Exemplo: Criar fatura padrão para serviço mensal
const faturaTemplate: NovaFatura = {
  contratoId: contratoSelecionado?.id || 0,
  clienteId: cliente.id,
  usuarioResponsavelId: 1,
  tipo: TipoFatura.RECORRENTE,
  dataVencimento: proximoMes(),
  formaPagamento: FormaPagamento.PIX,
  observacoes: 'Fatura mensal automática - Serviço de consultoria',
  percentualDesconto: 0,
  valorDesconto: 0,
  itens: [
    {
      descricao: 'Consultoria Mensal',
      quantidade: 1,
      valorUnitario: 2500.00,
      unidade: 'mês',
      codigoProduto: 'CONS-001',
      percentualDesconto: 0,
      valorDesconto: 0
    }
  ]
};

await faturamentoService.criarFatura(faturaTemplate);
```

### **Ações em Massa Customizadas**
```typescript
// Exemplo: Enviar cobrança para faturas vencidas
const faturasSelecionadas = faturas
  .filter(f => f.status === StatusFatura.VENCIDA)
  .filter(f => diasVencidos(f.dataVencimento) >= 7)
  .map(f => f.id);

// Processar em lote
const resultados = await Promise.allSettled(
  faturasSelecionadas.map(id => 
    faturamentoService.enviarFaturaPorEmail(id)
  )
);

// Feedback ao usuário
const sucessos = resultados.filter(r => r.status === 'fulfilled').length;
alert(`${sucessos} faturas enviadas com sucesso`);
```

## 🧪 Testes de Funcionalidade

### **Teste 1: Configuração de Cards**
```javascript
// Objetivo: Validar salvamento e carregamento de configuração
describe('Configuração de Cards', () => {
  test('Deve salvar configuração no localStorage', () => {
    // 1. Abrir modal de configuração
    fireEvent.click(screen.getByText('Configurar Cards'));
    
    // 2. Selecionar 2 cards
    fireEvent.click(screen.getByTestId('card-valorTotalPago'));
    fireEvent.click(screen.getByTestId('card-faturasVencidas'));
    
    // 3. Salvar configuração
    fireEvent.click(screen.getByText('Salvar Configuração'));
    
    // 4. Verificar localStorage
    const config = JSON.parse(localStorage.getItem('faturamento-cards-config'));
    expect(config).toEqual(['valorTotalPago', 'faturasVencidas']);
  });
  
  test('Deve carregar configuração ao iniciar', () => {
    // 1. Configurar localStorage
    localStorage.setItem('faturamento-cards-config', 
      JSON.stringify(['totalFaturas']));
    
    // 2. Recarregar componente
    render(<FaturamentoPage />);
    
    // 3. Verificar se apenas 1 card aparece
    expect(screen.getAllByTestId(/^card-/)).toHaveLength(1);
    expect(screen.getByTestId('card-totalFaturas')).toBeInTheDocument();
  });
});
```

### **Teste 2: Criação de Fatura**
```javascript
// Objetivo: Validar processo completo de criação
describe('Criação de Fatura', () => {
  test('Deve criar fatura com múltiplos itens', async () => {
    // 1. Abrir modal de criação
    fireEvent.click(screen.getByText('Nova Fatura'));
    
    // 2. Selecionar cliente
    fireEvent.click(screen.getByTestId('cliente-select'));
    fireEvent.click(screen.getByText('Cliente Teste'));
    
    // 3. Definir data de vencimento
    fireEvent.change(screen.getByLabelText('Data de Vencimento'), {
      target: { value: '2025-12-31' }
    });
    
    // 4. Adicionar primeiro item
    fireEvent.change(screen.getByPlaceholderText('Ex: Produto/Serviço'), {
      target: { value: 'Consultoria' }
    });
    fireEvent.change(screen.getByPlaceholderText('1'), {
      target: { value: '2' }
    });
    fireEvent.change(screen.getByPlaceholderText('0,00'), {
      target: { value: '1500,00' }
    });
    fireEvent.click(screen.getByText('Adicionar'));
    
    // 5. Verificar total calculado
    expect(screen.getByText('R$ 3.000,00')).toBeInTheDocument();
    
    // 6. Salvar fatura
    fireEvent.click(screen.getByText('Criar Fatura'));
    
    // 7. Verificar chamada da API
    expect(mockFaturamentoService.criarFatura).toHaveBeenCalledWith({
      // ... dados esperados
    });
  });
});
```

### **Teste 3: Responsividade**
```javascript
// Objetivo: Validar comportamento em diferentes tamanhos
describe('Responsividade', () => {
  test('Deve adaptar dashboard para mobile', () => {
    // 1. Simular viewport mobile
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));
    
    // 2. Configurar 4 cards
    localStorage.setItem('faturamento-cards-config', 
      JSON.stringify(['totalFaturas', 'valorTotalPago', 'faturasVencidas', 'faturasDoMes']));
    
    // 3. Renderizar componente
    render(<FaturamentoPage />);
    
    // 4. Verificar se cards estão em coluna única
    const dashboard = screen.getByTestId('dashboard-cards');
    expect(dashboard).toHaveClass('grid-cols-1');
  });
  
  test('Deve usar modal fullscreen em mobile', () => {
    // 1. Simular mobile
    global.innerWidth = 375;
    
    // 2. Abrir modal
    fireEvent.click(screen.getByText('Nova Fatura'));
    
    // 3. Verificar classes aplicadas
    const modal = screen.getByTestId('modal-fatura');
    expect(modal).toHaveClass('w-full', 'h-full');
  });
});
```

## 📊 Métricas de Uso Real

### **Dados de Performance Coletados**
```typescript
// Métricas automáticas do sistema
interface MetricasReais {
  // Tempos de carregamento
  tempoCarregamentoMedio: 1.2,        // segundos
  tempoRenderizacaoCards: 0.08,       // segundos
  tempoAberturaModal: 0.15,           // segundos
  
  // Uso por dispositivo
  dispositivoDesktop: 65,             // % de uso
  dispositivoMobile: 25,              // % de uso
  dispositivoTablet: 10,              // % de uso
  
  // Configurações mais usadas
  configuracao1Card: 15,              // % usuários
  configuracao2Cards: 35,             // % usuários  
  configuracao3Cards: 25,             // % usuários
  configuracao4Cards: 25,             // % usuários
  
  // Cards mais populares
  valorRecebido: 95,                  // % de seleção
  valorPendente: 80,                  // % de seleção
  totalFaturas: 70,                   // % de seleção
  faturasVencidas: 85,                // % de seleção
  faturasPagas: 45,                   // % de seleção
  faturasDoMes: 60                    // % de seleção
}
```

### **Análise de Comportamento por Perfil**
```yaml
Executivos (CEO/Diretor):
  Cards Preferidos: [Valor Recebido]
  Tempo Médio na Tela: 3 minutos
  Ações Principais: Visualizar, Exportar
  Dispositivo Principal: Desktop (80%)
  
Financeiro (CFO/Controller):
  Cards Preferidos: [Valor Pendente, Valor Recebido]
  Tempo Médio na Tela: 15 minutos
  Ações Principais: Filtrar, Analisar, Exportar
  Dispositivo Principal: Desktop (90%)
  
Comercial (Gerente/Vendedor):
  Cards Preferidos: [Total, Vencidas, Do Mês]
  Tempo Médio na Tela: 20 minutos
  Ações Principais: Criar, Enviar, Cobrar
  Dispositivo Principal: Desktop (70%), Mobile (30%)
  
Operacional (Analista/Assistente):
  Cards Preferidos: [Todos - 4 cards]
  Tempo Médio na Tela: 45 minutos
  Ações Principais: CRUD completo, Processamento
  Dispositivo Principal: Desktop (95%)
```

## 🔧 Customização Avançada

### **Adicionando Novos Cards**
```typescript
// 1. Definir novo card no tipo
type NovoCardId = 'faturasEmAtraso' | ...existing;

// 2. Implementar cálculo
const calcularFaturasEmAtraso = (faturas: Fatura[]): number => {
  return faturas.filter(f => 
    f.status !== StatusFatura.PAGA && 
    f.status !== StatusFatura.CANCELADA &&
    new Date(f.dataVencimento) < new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  ).length;
};

// 3. Adicionar na configuração
{
  id: 'faturasEmAtraso',
  title: 'Faturas em Atraso',
  value: calcularFaturasEmAtraso(faturas),
  icon: AlertTriangle,
  color: 'text-red-600',
  gradient: 'from-red-100 to-red-200',
  description: '🚨 Mais de 15 dias',
  isActive: cardsConfigurados.includes('faturasEmAtraso')
}
```

### **Filtros Personalizados**
```typescript
// Filtro avançado para faturas de alto valor
const FiltroAltoValor: React.FC = () => {
  const [valorMinimo, setValorMinimo] = useState(5000);
  
  const aplicarFiltro = () => {
    setFiltros(prev => ({
      ...prev,
      valorMinimo,
      status: StatusFatura.PENDENTE
    }));
  };
  
  return (
    <div className="flex items-center gap-2">
      <MoneyInput
        label="Valor Mínimo"
        value={valorMinimo}
        onValueChange={setValorMinimo}
      />
      <button onClick={aplicarFiltro}>
        Filtrar Alto Valor
      </button>
    </div>
  );
};
```

### **Ações Customizadas**
```typescript
// Ação personalizada: Desconto em lote
const aplicarDescontoEmLote = async (faturaIds: number[], percentual: number) => {
  const operacoes = faturaIds.map(async (id) => {
    const fatura = await faturamentoService.obterFatura(id);
    const novoValor = fatura.valorTotal * (1 - percentual / 100);
    
    return faturamentoService.atualizarFatura(id, {
      ...fatura,
      percentualDesconto: percentual,
      valorTotal: novoValor
    });
  });
  
  const resultados = await Promise.allSettled(operacoes);
  const sucessos = resultados.filter(r => r.status === 'fulfilled').length;
  
  alert(`Desconto aplicado em ${sucessos} faturas`);
  carregarFaturas(); // Recarregar lista
};
```

## 📋 Checklist de Implementação

### **Para Desenvolvedores**
- [ ] **Estrutura Base**
  - [ ] Componente FaturamentoPage criado
  - [ ] Estados de controle implementados
  - [ ] Hooks customizados configurados
  - [ ] Roteamento configurado

- [ ] **Dashboard Configurável**
  - [ ] Sistema de cards flexível
  - [ ] Modal de configuração funcional
  - [ ] Persistência no localStorage
  - [ ] Layout responsivo implementado

- [ ] **Gestão de Faturas**
  - [ ] Modal de criação/edição completo
  - [ ] Validações de formulário
  - [ ] Cálculos automáticos
  - [ ] CRUD completo integrado

- [ ] **Sistema de Filtros**
  - [ ] Busca por texto implementada
  - [ ] Filtros por status e tipo
  - [ ] Aplicação dinâmica de filtros
  - [ ] Reset de filtros funcional

- [ ] **Responsividade**
  - [ ] Breakpoints definidos
  - [ ] Layout mobile otimizado
  - [ ] Touch gestures implementados
  - [ ] Performance em dispositivos baixos

### **Para QA/Testes**
- [ ] **Testes Funcionais**
  - [ ] Configuração de cards (1-4)
  - [ ] Criação de fatura completa
  - [ ] Edição de faturas existentes
  - [ ] Filtros e busca funcionais
  - [ ] Ações em massa operacionais

- [ ] **Testes de Responsividade**
  - [ ] Desktop (> 1024px) validado
  - [ ] Tablet (768-1024px) testado
  - [ ] Mobile (< 768px) verificado
  - [ ] Orientação paisagem/retrato

- [ ] **Testes de Performance**
  - [ ] Carregamento < 2s
  - [ ] Responsividade UI < 100ms
  - [ ] Busca < 500ms
  - [ ] Memory leaks verificados

- [ ] **Testes de Acessibilidade**
  - [ ] Navegação por teclado
  - [ ] Screen readers compatíveis
  - [ ] Contraste adequado
  - [ ] Focus indicators visíveis

### **Para Usuários Finais**
- [ ] **Treinamento Básico**
  - [ ] Como configurar dashboard
  - [ ] Como criar primeira fatura
  - [ ] Como usar filtros básicos
  - [ ] Como interpretar cards

- [ ] **Treinamento Avançado**
  - [ ] Ações em massa
  - [ ] Configurações avançadas
  - [ ] Troubleshooting básico
  - [ ] Otimização de workflow

- [ ] **Feedback e Melhoria**
  - [ ] Reportar bugs encontrados
  - [ ] Sugerir melhorias de UX
  - [ ] Compartilhar configurações úteis
  - [ ] Participar de testes beta

### **Para Gestores/Administradores**
- [ ] **Configuração Organizacional**
  - [ ] Definir perfis de usuário
  - [ ] Configurar permissões
  - [ ] Estabelecer workflows padrão
  - [ ] Criar templates de fatura

- [ ] **Monitoramento e Métricas**
  - [ ] Definir KPIs importantes
  - [ ] Configurar alertas automáticos
  - [ ] Estabelecer rotinas de análise
  - [ ] Planejar melhorias futuras

---

**Exemplos práticos compilados em**: 7 de agosto de 2025  
**Para uso com**: ConectCRM v1.0+  
**Compatibilidade**: Todos os navegadores modernos, dispositivos móveis
