# 🔍 OpenTelemetry Distributed Tracing - Week 7

## ✅ Status: IMPLEMENTADO

Sistema de rastreamento distribuído configurado e funcional usando OpenTelemetry + Jaeger.

---

## 🎯 O Que Foi Implementado

### 1. **OpenTelemetry SDK Configurado**
- **Arquivo**: `backend/src/config/tracing.ts`
- **Features**:
  - Auto-instrumentação HTTP, Express, TypeORM, Redis
  - Export para Jaeger via OTLP (porta 4318)
  - Console exporter silencioso em dev (use `ENABLE_TRACING_LOGS=true` para debug)
  - Graceful shutdown em SIGTERM/SIGINT

### 2. **Jaeger Deployment**
- **Container**: `conectsuite-jaeger`
- **Portas**:
  - `16686`: Jaeger UI (http://localhost:16686)
  - `4318`: OTLP HTTP Collector
  - `4317`: OTLP gRPC Collector
- **Configuração**: `observability/docker-compose.yml`

### 3. **Grafana Integration**
- **Datasource**: Jaeger configurado como datasource
- **Arquivo**: `observability/grafana/provisioning/datasources/jaeger.yml`
- **Features**: Correlação traces + métricas

### 4. **Helper Utilities**
- **Arquivo**: `backend/src/utils/tracing-helper.ts`
- **Funções**:
  - `withSpan()`: Criar span customizado
  - `addEvent()`: Adicionar evento ao span
  - `addAttribute()`: Adicionar atributo
  - `@TraceMethod()`: Decorator para métodos

---

## 🚀 Como Usar

### **1. Visualizar Traces no Jaeger**

```bash
# Acessar UI
http://localhost:16686

# No Jaeger:
1. Service: Selecione "conectcrm-backend"
2. Operation: Deixe "all" ou selecione endpoint específico
3. Clique "Find Traces"
```

**O que você verá**:
- ✅ Traces de requisições HTTP completas
- ✅ Spans automáticos (Express middleware, TypeORM queries)
- ✅ Latência de cada operação (ms)
- ✅ Propagação de contexto entre serviços
- ✅ Erros e exceptions registrados

---

### **2. Criar Spans Customizados**

#### **Opção A: Função `withSpan()`**

```typescript
import { withSpan } from '../utils/tracing-helper';

async processarPedido(pedidoId: string) {
  return withSpan(
    'ProcessarPedido',  // Nome do span
    async (span) => {
      // Adicionar atributos
      span.setAttribute('pedido.id', pedidoId);
      span.setAttribute('pedido.prioridade', 'alta');

      // Sua lógica aqui
      const resultado = await this.processarLogica(pedidoId);

      // Adicionar evento
      span.addEvent('Pedido processado', { 
        resultado: resultado.status 
      });

      return resultado;
    },
    // Atributos iniciais (opcional)
    { pedidoId, timestamp: Date.now() }
  );
}
```

#### **Opção B: Decorator `@TraceMethod()`**

```typescript
import { TraceMethod } from '../utils/tracing-helper';

export class PedidoService {
  
  @TraceMethod('ProcessarPedido')
  async processarPedido(pedidoId: string) {
    // Seu código aqui - automaticamente trackeado!
    return await this.repository.save(pedido);
  }
}
```

#### **Opção C: Manual (mais controle)**

```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api';

async operacaoCritica() {
  const tracer = trace.getTracer('conectcrm-backend');
  
  return tracer.startActiveSpan('OperacaoCritica', async (span) => {
    try {
      span.setAttribute('operacao.tipo', 'critica');
      
      // Sua lógica
      const resultado = await this.executar();
      
      span.setStatus({ code: SpanStatusCode.OK });
      return resultado;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error.message 
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

---

### **3. Adicionar Eventos ao Span Ativo**

```typescript
import { addEvent } from '../utils/tracing-helper';

async enviarEmail(to: string) {
  // Evento simples
  addEvent('Email enviado');

  // Evento com atributos
  addEvent('Email enviado', {
    'email.to': to,
    'email.status': 'success',
    'email.timestamp': Date.now()
  });
}
```

---

### **4. Adicionar Atributos ao Span Ativo**

```typescript
import { addAttribute } from '../utils/tracing-helper';

async processarTicket(ticketId: string) {
  addAttribute('ticket.id', ticketId);
  addAttribute('ticket.prioridade', 'alta');
  addAttribute('ticket.departamento', 'suporte');
  
  // Sua lógica...
}
```

---

## 📊 Correlação Traces + Métricas (Grafana)

### **1. Acessar Grafana**
```
http://localhost:3002
```

### **2. Criar Dashboard com Traces**

```json
{
  "datasource": "Jaeger",
  "targets": [{
    "queryType": "search",
    "service": "conectcrm-backend",
    "operation": "POST /api/tickets"
  }]
}
```

### **3. Correlacionar com Métricas Prometheus**

**Cenário**: Spike de latência no dashboard

```
1. Ver métrica P95 alta no Grafana (3s)
2. Clicar no timestamp do spike
3. Ver traces do Jaeger no mesmo período
4. Identificar qual query específica está lenta
5. Otimizar query
```

---

## 🎯 Exemplos Práticos

### **Exemplo 1: Trace de Processamento de Ticket**

```typescript
import { withSpan, addEvent } from '../utils/tracing-helper';

async processarTicket(ticketId: string) {
  return withSpan('Ticket.Processar', async (span) => {
    span.setAttribute('ticket.id', ticketId);
    
    // 1. Buscar ticket
    addEvent('Buscando ticket no banco');
    const ticket = await this.repository.findOne(ticketId);
    
    // 2. Validar
    addEvent('Validando ticket');
    await this.validarTicket(ticket);
    
    // 3. Atribuir
    addEvent('Atribuindo a atendente');
    await this.atribuirAtendente(ticket);
    
    // 4. Notificar
    addEvent('Enviando notificações');
    await this.notificarAtendente(ticket.atendenteId);
    
    span.setAttribute('ticket.status', 'processado');
    return ticket;
  });
}
```

**Resultado no Jaeger**:
```
Ticket.Processar (250ms)
├─ Buscando ticket no banco (50ms)
├─ Validando ticket (20ms)
├─ Atribuindo a atendente (100ms)
└─ Enviando notificações (80ms)
```

---

### **Exemplo 2: Trace de Envio de Mensagem WhatsApp**

```typescript
import { withSpan } from '../utils/tracing-helper';

async enviarMensagemWhatsApp(para: string, texto: string) {
  return withSpan('WhatsApp.EnviarMensagem', async (span) => {
    span.setAttribute('whatsapp.destinatario', para);
    span.setAttribute('whatsapp.tamanho', texto.length);
    
    try {
      // Preparar
      span.addEvent('Preparando envio');
      const config = await this.prepararEnvio(para);
      
      // Enviar
      span.addEvent('Enviando requisição HTTP');
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${config.phoneId}/messages`,
        { to: para, text: { body: texto } },
        { headers: { Authorization: `Bearer ${config.token}` } }
      );
      
      span.setAttribute('whatsapp.message_id', response.data.messages[0].id);
      span.setStatus({ code: SpanStatusCode.OK });
      
      return response.data;
    } catch (error) {
      span.recordException(error);
      span.setAttribute('whatsapp.erro', error.message);
      throw error;
    }
  });
}
```

---

### **Exemplo 3: Trace de Query Complexa**

```typescript
async buscarTicketsComRelacionamentos(empresaId: string) {
  return withSpan('Ticket.BuscarComplexo', async (span) => {
    span.setAttribute('empresa.id', empresaId);
    
    // Query complexa com joins
    span.addEvent('Iniciando query com múltiplos joins');
    
    const tickets = await this.repository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.atendente', 'atendente')
      .leftJoinAndSelect('ticket.fila', 'fila')
      .leftJoinAndSelect('ticket.mensagens', 'mensagens')
      .where('ticket.empresaId = :empresaId', { empresaId })
      .getMany();
    
    span.setAttribute('ticket.count', tickets.length);
    span.addEvent('Query finalizada', { count: tickets.length });
    
    return tickets;
  });
}
```

---

## 🔧 Troubleshooting

### **Problema: Não vejo traces no Jaeger**

```bash
# 1. Verificar se Jaeger está rodando
docker ps | grep jaeger
# Deve estar UP na porta 16686

# 2. Verificar logs do backend
# No terminal backend, procurar:
"🔍 OpenTelemetry Tracing inicializado"

# 3. Verificar conectividade
curl http://localhost:16686/api/services
# Deve retornar JSON com lista de serviços

# 4. Fazer requisição de teste
curl http://localhost:3001/metrics
# Aguardar 5 segundos e verificar Jaeger UI
```

---

### **Problema: Traces aparecendo duplicados**

```typescript
// ❌ ERRADO - Não inicializar OpenTelemetry múltiplas vezes
await initializeTracing();
await initializeTracing(); // ❌ NÃO!

// ✅ CORRETO - Inicializar apenas uma vez no main.ts
// main.ts
import { initializeTracing } from './config/tracing';

async function bootstrap() {
  await initializeTracing(); // ← Apenas aqui!
  
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
}
```

---

### **Problema: Erro "Resource not found"**

```typescript
// O erro "Resource not found" geralmente indica que o Jaeger
// não está acessível na URL configurada

// 1. Verificar URL no tracing.ts
// Deve ser: http://jaeger:4318/v1/traces (dentro do Docker)
// OU: http://localhost:4318/v1/traces (fora do Docker)

// 2. Se backend roda fora do Docker, use localhost
const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // ← localhost se backend fora do Docker
});
```

---

## 📈 Métricas de Tracing

O sistema de tracing **não interfere** com métricas Prometheus. Ambos coexistem:

- **Prometheus**: Métricas agregadas (contadores, gauges, histogramas)
- **OpenTelemetry**: Traces individuais de requisições

**Exemplo de uso combinado**:
```typescript
// Incrementar métrica Prometheus
ticketsCriadosTotal.inc();

// E também criar span OpenTelemetry
withSpan('CriarTicket', async () => {
  // lógica
});
```

---

## 🎓 Boas Práticas

### **✅ DO**

- ✅ Criar spans para operações demoradas (>100ms)
- ✅ Adicionar atributos relevantes (IDs, status, tipo)
- ✅ Registrar eventos importantes (inicio de etapas)
- ✅ Capturar exceções com `span.recordException()`
- ✅ Usar nomes descritivos (`ProcessarPedido`, não `metodo1`)

### **❌ DON'T**

- ❌ Criar spans para operações rápidas (<10ms)
- ❌ Adicionar atributos sensíveis (senhas, tokens)
- ❌ Criar milhares de spans em loops (samplar)
- ❌ Esquecer de chamar `span.end()`
- ❌ Usar nomes genéricos (`operacao`, `metodo`)

---

## 🚀 Próximos Passos

Agora que o tracing está funcional, você pode:

1. **Week 8 - Logs Centralizados (Loki)**
   - Agregar logs em local único
   - Correlacionar logs + traces + métricas
   - Busca rápida por contexto

2. **Week 9 - Alerting & On-Call**
   - Alertas automáticos de SLO
   - Notificações Slack/Email
   - Runbooks para troubleshooting

---

## 📚 Referências

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Jaeger UI Guide](https://www.jaegertracing.io/docs/latest/frontend-ui/)
- [Trace Context Propagation](https://www.w3.org/TR/trace-context/)
- [Grafana Jaeger Datasource](https://grafana.com/docs/grafana/latest/datasources/jaeger/)

---

**Week 7 - Distributed Tracing: ✅ COMPLETO**
