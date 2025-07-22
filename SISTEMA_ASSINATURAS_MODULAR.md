# 🎯 Sistema de Assinaturas e Planos Modulares - Fênix CRM

## 📋 **Funcionalidades Necessárias para Venda Modular**

### 1. **📦 Gestão de Planos e Módulos**

#### **Entidades do Banco de Dados:**

```sql
-- Tabela de Planos
CREATE TABLE planos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT,
    preco_mensal DECIMAL(10,2) NOT NULL,
    preco_anual DECIMAL(10,2),
    max_usuarios INTEGER DEFAULT NULL, -- NULL = ilimitado
    max_clientes INTEGER DEFAULT NULL,
    max_propostas INTEGER DEFAULT NULL,
    storage_gb INTEGER DEFAULT 10,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Módulos do Sistema
CREATE TABLE modulos_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT,
    preco_adicional DECIMAL(10,2) DEFAULT 0,
    dependencias TEXT[], -- Array de códigos de módulos dependentes
    categoria VARCHAR(50), -- 'core', 'comercial', 'financeiro', 'marketing'
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Relacionamento Planos x Módulos
CREATE TABLE planos_modulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plano_id UUID REFERENCES planos(id),
    modulo_id UUID REFERENCES modulos_sistema(id),
    incluido BOOLEAN DEFAULT TRUE,
    preco_override DECIMAL(10,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Assinaturas das Empresas
CREATE TABLE assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id),
    plano_id UUID REFERENCES planos(id),
    status VARCHAR(20) DEFAULT 'ativa', -- 'ativa', 'suspensa', 'cancelada', 'trial'
    data_inicio DATE NOT NULL,
    data_fim DATE,
    data_proximo_pagamento DATE,
    valor_mensal DECIMAL(10,2) NOT NULL,
    trial_ate DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Módulos Contratados por Empresa
CREATE TABLE empresas_modulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id),
    modulo_id UUID REFERENCES modulos_sistema(id),
    assinatura_id UUID REFERENCES assinaturas(id),
    ativo BOOLEAN DEFAULT TRUE,
    data_ativacao DATE DEFAULT NOW(),
    data_desativacao DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **💳 Sistema de Billing e Pagamentos**

#### **Entidades Financeiras:**

```sql
-- Faturas de Assinatura
CREATE TABLE faturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assinatura_id UUID REFERENCES assinaturas(id),
    numero VARCHAR(50) UNIQUE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_emissao DATE DEFAULT NOW(),
    valor_total DECIMAL(10,2) NOT NULL,
    valor_desconto DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'paga', 'vencida', 'cancelada'
    data_pagamento DATE DEFAULT NULL,
    metodo_pagamento VARCHAR(50), -- 'cartao', 'boleto', 'pix', 'transferencia'
    gateway_payment_id VARCHAR(100), -- ID do pagamento no gateway
    tentativas_cobranca INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Itens da Fatura
CREATE TABLE fatura_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fatura_id UUID REFERENCES faturas(id),
    descricao VARCHAR(255) NOT NULL,
    tipo VARCHAR(50), -- 'plano', 'modulo', 'usuario_adicional', 'storage'
    quantidade INTEGER DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    periodo_inicio DATE,
    periodo_fim DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Histórico de Pagamentos
CREATE TABLE pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fatura_id UUID REFERENCES faturas(id),
    valor DECIMAL(10,2) NOT NULL,
    data_pagamento TIMESTAMP DEFAULT NOW(),
    metodo VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'aprovado', -- 'aprovado', 'recusado', 'estornado'
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **🔐 Sistema de Permissões por Módulo**

#### **Middleware de Autorização:**

```typescript
// Middleware para verificar acesso a módulos
@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private empresasModulosService: EmpresasModulosService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.get<string>('module', context.getHandler());
    
    if (!requiredModule) {
      return true; // Sem restrição de módulo
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verificar se a empresa tem acesso ao módulo
    const hasAccess = await this.empresasModulosService.hasModuleAccess(
      user.empresa_id,
      requiredModule
    );

    return hasAccess;
  }
}

// Decorator para proteger rotas
export const RequireModule = (module: string) => SetMetadata('module', module);

// Uso nos controllers
@Controller('propostas')
export class PropostasController {
  
  @Get()
  @RequireModule('propostas')
  @UseGuards(JwtAuthGuard, ModuleAccessGuard)
  async getPropostas() {
    // Só executa se empresa tiver módulo de propostas ativo
  }
}
```

### 4. **📊 Dashboard de Administração SaaS**

#### **Funcionalidades Necessárias:**

```typescript
// Service para métricas SaaS
@Injectable()
export class SaasMetricsService {
  async getDashboardMetrics() {
    return {
      // Métricas de Receita
      mrr: await this.calculateMRR(), // Monthly Recurring Revenue
      arr: await this.calculateARR(), // Annual Recurring Revenue
      churn_rate: await this.calculateChurnRate(),
      
      // Métricas de Clientes
      total_empresas: await this.getTotalEmpresas(),
      empresas_ativas: await this.getEmpresasAtivas(),
      empresas_trial: await this.getEmpresasTrial(),
      novos_clientes_mes: await this.getNovosClientesMes(),
      
      // Métricas de Módulos
      modulos_mais_usados: await this.getModulosMaisUsados(),
      receita_por_modulo: await this.getReceitaPorModulo(),
      
      // Métricas Operacionais
      faturas_pendentes: await this.getFaturasPendentes(),
      inadimplencia: await this.getTaxaInadimplencia(),
      suporte_tickets: await this.getTicketsSuporteAbertos()
    };
  }
}
```

### 5. **🚨 Sistema de Alertas e Limites**

#### **Controle de Uso por Plano:**

```typescript
@Injectable()
export class UsageLimitsService {
  async checkUsageLimits(empresaId: string) {
    const assinatura = await this.getAssinaturaAtiva(empresaId);
    const plano = await this.getPlano(assinatura.plano_id);
    
    const usage = await this.getCurrentUsage(empresaId);
    
    const alerts = [];
    
    // Verificar limite de usuários
    if (plano.max_usuarios && usage.usuarios >= plano.max_usuarios) {
      alerts.push({
        type: 'limit_reached',
        module: 'usuarios',
        current: usage.usuarios,
        limit: plano.max_usuarios
      });
    }
    
    // Verificar limite de clientes
    if (plano.max_clientes && usage.clientes >= plano.max_clientes) {
      alerts.push({
        type: 'limit_reached',
        module: 'clientes',
        current: usage.clientes,
        limit: plano.max_clientes
      });
    }
    
    // Verificar storage
    if (usage.storage_used_gb >= plano.storage_gb * 0.9) {
      alerts.push({
        type: 'storage_warning',
        current: usage.storage_used_gb,
        limit: plano.storage_gb
      });
    }
    
    return alerts;
  }
}
```

### 6. **🔧 Sistema de Configuração White Label**

#### **Personalização por Cliente:**

```sql
-- Configurações White Label
CREATE TABLE empresas_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) UNIQUE,
    logo_url VARCHAR(255),
    logo_dark_url VARCHAR(255),
    primary_color VARCHAR(7) DEFAULT '#159A9C',
    secondary_color VARCHAR(7) DEFAULT '#0F7B7D',
    accent_color VARCHAR(7) DEFAULT '#DEEFE7',
    custom_domain VARCHAR(100), -- cliente.meucrm.com
    custom_css TEXT,
    hide_fenix_branding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Configurações de Sistema por Empresa
CREATE TABLE empresas_configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) UNIQUE,
    configuracoes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7. **📈 Sistema de Analytics e Relatórios**

#### **Métricas por Cliente:**

```typescript
@Injectable()
export class ClientAnalyticsService {
  async getClientDashboard(empresaId: string) {
    return {
      // Usage Analytics
      usuarios_ativos: await this.getUsuariosAtivos(empresaId),
      clientes_cadastrados: await this.getTotalClientes(empresaId),
      propostas_mes: await this.getPropostasMes(empresaId),
      receita_gerada: await this.getReceitaGerada(empresaId),
      
      // Feature Usage
      modulos_utilizados: await this.getModulosUtilizados(empresaId),
      funcionalidades_populares: await this.getFuncionalidadesPopulares(empresaId),
      tempo_medio_sessao: await this.getTempoMedioSessao(empresaId),
      
      // Health Score
      health_score: await this.calculateHealthScore(empresaId),
      risk_churn: await this.calculateChurnRisk(empresaId)
    };
  }
}
```

### 8. **🎯 Sistema de Onboarding Automatizado**

#### **Fluxo de Ativação:**

```typescript
@Injectable()
export class OnboardingService {
  async iniciarOnboarding(empresaId: string) {
    const steps = [
      { step: 1, name: 'configurar_perfil', completed: false },
      { step: 2, name: 'importar_dados', completed: false },
      { step: 3, name: 'configurar_usuarios', completed: false },
      { step: 4, name: 'personalizar_sistema', completed: false },
      { step: 5, name: 'primeiro_cliente', completed: false },
      { step: 6, name: 'primeira_proposta', completed: false }
    ];
    
    await this.createOnboardingProgress(empresaId, steps);
    await this.sendWelcomeEmail(empresaId);
    await this.scheduleFollowUps(empresaId);
  }
}
```

## 🚀 **Prioridades de Implementação**

### **Fase 1 (Crítica - 2-3 semanas):**
1. ✅ Sistema de Planos e Módulos
2. ✅ Middleware de Autorização por Módulo
3. ✅ Sistema de Assinaturas Básico
4. ✅ Controle de Limites de Uso

### **Fase 2 (Alta - 3-4 semanas):**
1. ✅ Sistema de Billing Completo
2. ✅ Dashboard SaaS Admin
3. ✅ White Label Básico
4. ✅ Analytics por Cliente

### **Fase 3 (Média - 4-6 semanas):**
1. ✅ Sistema de Onboarding
2. ✅ Integração com Gateways de Pagamento
3. ✅ Sistema de Suporte Integrado
4. ✅ Métricas Avançadas

## 🎯 **Resultado Final**

Com essa implementação, o Fênix CRM se tornará uma **plataforma SaaS completa** com:

- ✅ **Vendas modulares** por funcionalidade
- ✅ **Billing automatizado** com múltiplos planos
- ✅ **Multi-tenancy completo** com isolamento seguro
- ✅ **White label** para personalização
- ✅ **Analytics e métricas** para decisões
- ✅ **Escalabilidade** para centenas de clientes

---

**💡 O sistema estará pronto para ser comercializado como SaaS B2B com modelo de receita recorrente!**
