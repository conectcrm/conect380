# 🔗 Sistema de Webhooks e Integrações

## 📋 **Webhooks para Clientes Integrarem**

### 1. **🎯 Sistema de Webhooks Configuráveis**

```sql
-- Configurações de Webhook por Empresa
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    secret_key VARCHAR(100), -- Para assinatura HMAC
    events TEXT[] NOT NULL, -- ['client.created', 'proposal.updated']
    active BOOLEAN DEFAULT TRUE,
    retry_attempts INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Log de Execução de Webhooks
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_endpoint_id UUID REFERENCES webhook_endpoints(id),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
    response_status_code INTEGER,
    response_body TEXT,
    attempt_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **📡 Webhook Service**

```typescript
@Injectable()
export class WebhookService {
  constructor(
    private httpService: HttpService,
    private webhookRepository: Repository<WebhookEndpoint>,
    private deliveryRepository: Repository<WebhookDelivery>,
    private queueService: QueueService
  ) {}

  async sendWebhook(empresaId: string, eventType: string, payload: any) {
    const webhooks = await this.webhookRepository.find({
      where: { 
        empresa_id: empresaId, 
        active: true,
        events: ArrayContains([eventType])
      }
    });

    for (const webhook of webhooks) {
      await this.queueWebhookDelivery(webhook, eventType, payload);
    }
  }

  async queueWebhookDelivery(webhook: WebhookEndpoint, eventType: string, payload: any) {
    const delivery = new WebhookDelivery();
    delivery.webhook_endpoint_id = webhook.id;
    delivery.event_type = eventType;
    delivery.payload = payload;
    
    await this.deliveryRepository.save(delivery);
    
    // Adicionar à fila para processamento assíncrono
    await this.queueService.add('webhook-delivery', {
      deliveryId: delivery.id,
      webhookId: webhook.id,
      url: webhook.url,
      payload: this.buildWebhookPayload(eventType, payload),
      secret: webhook.secret_key,
      timeout: webhook.timeout_seconds
    });
  }

  private buildWebhookPayload(eventType: string, data: any) {
    return {
      id: uuidv4(),
      event: eventType,
      created_at: new Date().toISOString(),
      data: data
    };
  }

  private async signPayload(payload: string, secret: string): Promise<string> {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }
}

// Processor para a fila de webhooks
@Processor('webhook-delivery')
export class WebhookProcessor {
  @Process()
  async handleWebhookDelivery(job: Job) {
    const { deliveryId, webhookId, url, payload, secret, timeout } = job.data;
    
    try {
      const payloadString = JSON.stringify(payload);
      const signature = secret ? await this.signPayload(payloadString, secret) : null;
      
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Fenix-CRM-Webhooks/1.0'
      };
      
      if (signature) {
        headers['X-Fenix-Signature'] = signature;
      }

      const response = await this.httpService.post(url, payload, {
        headers,
        timeout: timeout * 1000
      }).toPromise();

      // Marcar como entregue
      await this.updateDeliveryStatus(deliveryId, 'success', response.status, response.data);
      
    } catch (error) {
      await this.handleWebhookError(deliveryId, error);
    }
  }
}
```

### 3. **🔌 Marketplace de Integrações**

```typescript
// Catálogo de Integrações Disponíveis
interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: 'crm' | 'email' | 'payment' | 'analytics' | 'productivity';
  auth_type: 'oauth2' | 'api_key' | 'basic';
  config_fields: ConfigField[];
  supported_events: string[];
  webhook_url?: string;
  documentation_url: string;
  logo_url: string;
}

const INTEGRATION_CATALOG: IntegrationTemplate[] = [
  {
    id: 'rd-station',
    name: 'RD Station',
    description: 'Sincronize leads e clientes com RD Station',
    provider: 'RD Station',
    category: 'crm',
    auth_type: 'oauth2',
    config_fields: [
      { name: 'client_id', type: 'string', required: true },
      { name: 'client_secret', type: 'password', required: true }
    ],
    supported_events: ['client.created', 'client.updated'],
    documentation_url: 'https://developers.rdstation.com'
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Integração com campanhas de email marketing',
    provider: 'Mailchimp',
    category: 'email',
    auth_type: 'api_key',
    config_fields: [
      { name: 'api_key', type: 'password', required: true },
      { name: 'list_id', type: 'string', required: true }
    ],
    supported_events: ['client.created', 'proposal.won'],
    documentation_url: 'https://mailchimp.com/developer'
  }
];

@Injectable()
export class IntegrationsService {
  async getAvailableIntegrations() {
    return INTEGRATION_CATALOG;
  }

  async installIntegration(empresaId: string, integrationId: string, config: any) {
    const template = INTEGRATION_CATALOG.find(i => i.id === integrationId);
    if (!template) throw new Error('Integration not found');

    // Validar configuração
    await this.validateIntegrationConfig(template, config);

    // Salvar configuração
    const integration = new EmpresaIntegration();
    integration.empresa_id = empresaId;
    integration.integration_id = integrationId;
    integration.config = config;
    integration.active = true;

    await this.integrationRepository.save(integration);

    // Configurar webhook se necessário
    if (template.webhook_url) {
      await this.webhookService.createWebhook(empresaId, {
        name: `${template.name} Integration`,
        url: template.webhook_url,
        events: template.supported_events
      });
    }

    return integration;
  }
}
```

### 4. **📊 Monitoramento de Integrações**

```sql
-- Tabela de Integrações por Empresa
CREATE TABLE empresas_integracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    integration_id VARCHAR(100) NOT NULL,
    config JSONB NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'ok', -- 'ok', 'error', 'warning'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Logs de Sincronização
CREATE TABLE integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES empresas_integracoes(id),
    operation VARCHAR(50) NOT NULL, -- 'export_client', 'import_lead'
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    error_details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 **Eventos de Webhook Padrão**

### **Clientes:**
- `client.created` - Novo cliente cadastrado
- `client.updated` - Cliente atualizado
- `client.deleted` - Cliente removido

### **Propostas:**
- `proposal.created` - Nova proposta criada
- `proposal.updated` - Proposta atualizada
- `proposal.sent` - Proposta enviada
- `proposal.viewed` - Proposta visualizada
- `proposal.accepted` - Proposta aceita
- `proposal.rejected` - Proposta rejeitada

### **Financeiro:**
- `invoice.created` - Fatura criada
- `invoice.paid` - Fatura paga
- `invoice.overdue` - Fatura vencida

### **Sistema:**
- `user.created` - Novo usuário
- `subscription.updated` - Assinatura modificada
- `module.activated` - Módulo ativado
