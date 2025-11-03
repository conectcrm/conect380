# 📊 Sistema de Logging Estruturado - ConectCRM

## 📋 Visão Geral

Sistema completo de logging que captura **todas as requisições HTTP** e **logs da aplicação** com estrutura JSON, rotação automática de arquivos e análise facilitada.

### Componentes

1. **LoggingInterceptor** - Intercepta todas as requisições HTTP
2. **CustomLogger** - Logger com rotação de arquivos e logs estruturados
3. **Integração NestJS** - Configuração global no app.module.ts e main.ts

---

## ✅ O Que Loga

### 1. Requisições HTTP (LoggingInterceptor)

**Informações capturadas:**
- ✅ Método HTTP (GET, POST, PUT, DELETE)
- ✅ URL completa
- ✅ Status code (200, 404, 500, etc.)
- ✅ Tempo de execução (em ms)
- ✅ User ID (se autenticado) ou "Anonymous"
- ✅ IP do cliente
- ✅ User agent (browser, mobile app, etc.)
- ✅ Timestamp ISO 8601

**Exemplo de log:**
```json
{
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "duration": "145ms",
  "userId": "Anonymous",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "timestamp": "2025-11-03T15:30:45.123Z"
}
```

---

### 2. Logs da Aplicação (CustomLogger)

**Níveis de log:**
- 🔴 **ERROR** - Erros críticos (falhas de conexão, exceptions não tratadas)
- 🟡 **WARN** - Avisos (validações falhadas, recursos escassos)
- 🟢 **LOG** - Informações gerais (operações bem-sucedidas)
- 🔵 **DEBUG** - Informações de debugging (apenas em desenvolvimento)
- 🟣 **VERBOSE** - Informações detalhadas (apenas em desenvolvimento)

**Estrutura do log:**
```json
{
  "timestamp": "2025-11-03T15:30:45.123Z",
  "level": "ERROR",
  "context": "UsersService",
  "message": "Failed to create user: Database connection timeout",
  "pid": 12345
}
```

---

## 📂 Estrutura de Arquivos

### Diretório de Logs

```
backend/logs/
├── error.log       # Erros críticos (status 5xx)
├── error.log.1     # Rotacionado (mais recente)
├── error.log.2     # Rotacionado
├── ...
├── error.log.10    # Rotacionado (mais antigo mantido)
├── warn.log        # Avisos (status 4xx)
├── warn.log.1
├── ...
├── info.log        # Informações gerais (status 2xx, 3xx)
└── info.log.1
```

### Rotação Automática

| Configuração | Valor | Descrição |
|--------------|-------|-----------|
| **Tamanho máximo** | 10 MB | Quando arquivo atinge este tamanho, rotaciona |
| **Arquivos mantidos** | 10 | Mantém últimos 10 arquivos rotacionados |
| **Formato** | JSON | Uma linha por log, fácil parsing |
| **Limpeza automática** | 30 dias | Remove logs mais antigos que 30 dias |

---

## 🚀 Como Usar

### 1. Logs Automáticos (HTTP)

**Sem configuração adicional!** Todas as requisições HTTP são logadas automaticamente.

```typescript
// No seu controller, apenas escreva código normal:

@Get()
async findAll() {
  return this.service.findAll();
}

// Log automático gerado:
// {"method":"GET","url":"/api/users","statusCode":200,"duration":"45ms",...}
```

---

### 2. Logs Manuais (Application)

#### Em Services:

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async create(createUserDto: CreateUserDto) {
    this.logger.log(`Creating user: ${createUserDto.email}`);
    
    try {
      const user = await this.repository.save(createUserDto);
      this.logger.log(`User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to create user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
```

**Logs gerados:**
```json
{"timestamp":"2025-11-03T15:30:45.100Z","level":"LOG","context":"UsersService","message":"Creating user: john@example.com","pid":12345}
{"timestamp":"2025-11-03T15:30:45.250Z","level":"LOG","context":"UsersService","message":"User created successfully: 123e4567-e89b-12d3-a456-426614174000","pid":12345}
```

---

#### Em Controllers:

```typescript
import { Controller, Logger } from '@nestjs/common';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log('POST /users endpoint called');
    return this.usersService.create(createUserDto);
  }
}
```

---

#### Níveis de Log:

```typescript
// LOG (info) - operações normais
this.logger.log('User logged in successfully');

// ERROR - erros críticos
this.logger.error('Database connection failed', error.stack);

// WARN - avisos
this.logger.warn('User attempted invalid operation');

// DEBUG - apenas desenvolvimento
this.logger.debug('Query executed with params:', params);

// VERBOSE - detalhes muito específicos
this.logger.verbose('Cache hit for key: user:123');
```

---

## 📊 Análise de Logs

### 1. Buscar Erros Recentes

```bash
# Windows PowerShell
Get-Content backend\logs\error.log -Tail 50 | ConvertFrom-Json | Format-Table timestamp, context, message

# Linux/macOS
tail -50 backend/logs/error.log | jq '.timestamp, .context, .message'
```

---

### 2. Contar Requisições por Status

```bash
# PowerShell
Get-Content backend\logs\info.log | ConvertFrom-Json | Group-Object statusCode | Sort-Object Count -Descending

# Linux/macOS
cat backend/logs/info.log | jq '.statusCode' | sort | uniq -c | sort -rn
```

**Output:**
```
Count Name
----- ----
1243  200
89    201
45    404
12    500
```

---

### 3. Requisições Mais Lentas

```bash
# PowerShell
Get-Content backend\logs\info.log | ConvertFrom-Json | Where-Object { [int]($_.duration -replace 'ms','') -gt 1000 } | Select-Object url, duration, timestamp

# Linux/macOS
cat backend/logs/info.log | jq 'select(.duration | tonumber > 1000) | {url, duration, timestamp}'
```

**Output:**
```
url                          duration  timestamp
---                          --------  ---------
/api/reports/generate        2345ms    2025-11-03T15:30:45.123Z
/api/export/large-dataset    5678ms    2025-11-03T15:32:10.456Z
```

---

### 4. Usuários Mais Ativos

```bash
# PowerShell
Get-Content backend\logs\info.log | ConvertFrom-Json | Where-Object { $_.userId -ne 'Anonymous' } | Group-Object userId | Sort-Object Count -Descending | Select-Object -First 10

# Linux/macOS
cat backend/logs/info.log | jq -r '.userId' | grep -v Anonymous | sort | uniq -c | sort -rn | head -10
```

---

### 5. Endpoints Mais Acessados

```bash
# PowerShell
Get-Content backend\logs\info.log | ConvertFrom-Json | Group-Object url | Sort-Object Count -Descending | Select-Object -First 10 Count, Name

# Linux/macOS
cat backend/logs/info.log | jq -r '.url' | sort | uniq -c | sort -rn | head -10
```

---

### 6. Erros por Tipo

```bash
# PowerShell
Get-Content backend\logs\error.log | ConvertFrom-Json | ForEach-Object { ($_.message -split ':')[0] } | Group-Object | Sort-Object Count -Descending

# Linux/macOS
cat backend/logs/error.log | jq -r '.message' | cut -d':' -f1 | sort | uniq -c | sort -rn
```

---

## 🔍 Troubleshooting com Logs

### Cenário 1: API Lenta

**Problema:** Usuários reclamando de lentidão.

**Solução:**
```bash
# 1. Identificar endpoints lentos
Get-Content backend\logs\info.log | ConvertFrom-Json | 
  Where-Object { [int]($_.duration -replace 'ms','') -gt 1000 } | 
  Group-Object url | 
  Sort-Object Count -Descending

# 2. Analisar padrões
# - Sempre lento? Problema de código/query
# - Lento em horários específicos? Sobrecarga de servidor
# - Lento para usuários específicos? Problema de dados
```

---

### Cenário 2: Erros 500 Frequentes

**Problema:** Logs mostram muitos erros 500.

**Solução:**
```bash
# 1. Ver últimos erros 500
Get-Content backend\logs\error.log -Tail 20 | ConvertFrom-Json | 
  Where-Object { $_.statusCode -eq 500 } | 
  Select-Object timestamp, url, error

# 2. Identificar causa raiz
# - "Connection timeout" → Problema de database
# - "Cannot read property" → Bug no código (null reference)
# - "Memory limit" → Leak de memória
```

---

### Cenário 3: Suspeita de Ataque

**Problema:** Muitas requisições de um IP.

**Solução:**
```bash
# 1. IPs com mais requisições
Get-Content backend\logs\info.log | ConvertFrom-Json | 
  Group-Object ip | 
  Sort-Object Count -Descending | 
  Select-Object -First 10

# 2. Analisar padrões suspeitos
Get-Content backend\logs\info.log | ConvertFrom-Json | 
  Where-Object { $_.ip -eq '192.168.1.100' } | 
  Group-Object url | 
  Sort-Object Count -Descending

# Se ver:
# - Muitas requisições /api/auth/login (Brute force)
# - Muitas 404 em URLs aleatórias (Scanning)
# - Requisições muito rápidas (Bot)
# → Bloquear IP no firewall
```

---

### Cenário 4: Debugging de Feature

**Problema:** Feature não funciona, precisa entender o fluxo.

**Solução:**
```bash
# 1. Filtrar logs de contexto específico
Get-Content backend\logs\info.log | ConvertFrom-Json | 
  Where-Object { $_.context -eq 'UsersService' } | 
  Select-Object timestamp, message

# 2. Seguir timeline de uma operação
Get-Content backend\logs\info.log | ConvertFrom-Json | 
  Where-Object { $_.timestamp -gt '2025-11-03T15:30:00' -and $_.timestamp -lt '2025-11-03T15:35:00' } | 
  Sort-Object timestamp | 
  Format-Table timestamp, level, context, message
```

---

## 🤖 Integração com Ferramentas

### 1. Grafana + Loki

**Enviar logs para Loki:**

```yaml
# docker-compose.yml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
  
  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./backend/logs:/logs
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
```

**Dashboard Grafana:**
- Requisições por segundo (rate)
- Tempo médio de resposta
- Taxa de erros (4xx, 5xx)
- Top endpoints mais lentos

---

### 2. Elasticsearch + Kibana

**Enviar logs para Elasticsearch:**

```typescript
// Instalar: npm install @elastic/elasticsearch

import { Client } from '@elastic/elasticsearch';

const client = new Client({ node: 'http://localhost:9200' });

// No CustomLogger
private async sendToElasticsearch(logEntry: any) {
  try {
    await client.index({
      index: 'conectcrm-logs',
      body: logEntry,
    });
  } catch (error) {
    // Não quebrar aplicação se Elasticsearch falhar
  }
}
```

**Kibana Dashboard:**
- Visualização em tempo real
- Filtros por nível, contexto, user
- Alertas personalizados

---

### 3. Slack Alertas

**Enviar erros críticos para Slack:**

```typescript
// backend/src/common/logger/slack-notifier.ts

import axios from 'axios';

export async function sendSlackAlert(error: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) return;

  const message = {
    text: `🚨 *Erro Crítico em Produção*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Erro:* ${error.message}\n*Endpoint:* ${error.url}\n*Timestamp:* ${error.timestamp}`,
        },
      },
    ],
  };

  try {
    await axios.post(webhookUrl, message);
  } catch (err) {
    // Não quebrar aplicação se Slack falhar
  }
}
```

**Usar no CustomLogger:**
```typescript
error(message: any, trace?: string, context?: string) {
  this.logMessage('error', message, context, trace);
  
  // Enviar para Slack se for produção
  if (process.env.NODE_ENV === 'production') {
    sendSlackAlert({ message, context, timestamp: new Date().toISOString() });
  }
}
```

---

## 🔧 Configuração Avançada

### Variáveis de Ambiente

```env
# .env

# Nível de log (development vs production)
NODE_ENV=production

# Tamanho máximo de arquivo (bytes)
LOG_MAX_FILE_SIZE=10485760  # 10 MB

# Número de arquivos rotacionados
LOG_MAX_FILES=10

# Dias para manter logs
LOG_RETENTION_DAYS=30

# Webhook Slack (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Elasticsearch (opcional)
ELASTICSEARCH_NODE=http://localhost:9200
```

---

### Personalizar Níveis de Log

```typescript
// main.ts

const app = await NestFactory.create(AppModule, {
  logger: process.env.NODE_ENV === 'production'
    ? ['error', 'warn', 'log']  // Produção: só erros, avisos e info
    : ['error', 'warn', 'log', 'debug', 'verbose'],  // Dev: tudo
});
```

---

### Filtrar Logs Sensíveis

```typescript
// logging.interceptor.ts

intercept(context: ExecutionContext, next: CallHandler) {
  const request = context.switchToHttp().getRequest();
  
  // NÃO logar senhas, tokens, etc.
  const sanitizedBody = this.sanitize(request.body);
  
  const logData = {
    // ...
    body: sanitizedBody,  // Body sanitizado
  };
  
  // ...
}

private sanitize(data: any): any {
  if (!data) return data;
  
  const sensitive = ['password', 'token', 'secret', 'authorization'];
  const sanitized = { ...data };
  
  sensitive.forEach(key => {
    if (sanitized[key]) {
      sanitized[key] = '***REDACTED***';
    }
  });
  
  return sanitized;
}
```

---

## 📈 Benefícios

### Antes (Sem Logging Estruturado)

```
Problema em produção:
1. Developer: "Algo está quebrando"
2. Check console → logs misturados, sem estrutura
3. Tentar reproduzir localmente → não consegue
4. Perguntar ao usuário → "não sei, só deu erro"
5. Adicionar console.log → fazer deploy → aguardar erro acontecer novamente
6. Analisar logs → encontrar problema

⏱️ Tempo: 2-4 horas para debugar
```

### Depois (Com Logging Estruturado)

```
Problema em produção:
1. Developer: "Algo está quebrando"
2. Buscar logs estruturados:
   Get-Content logs\error.log | ConvertFrom-Json | Select-Object -Last 10
3. Ver exatamente:
   - Qual endpoint falhou
   - Qual usuário afetado
   - Stack trace completo
   - Timestamp exato
4. Reproduzir localmente com contexto
5. Corrigir bug

⏱️ Tempo: 15-30 minutos para debugar
```

**Ganho:** 80-90% mais rápido debugging

---

## 📚 Referências

### Arquivos Criados
- ✅ `backend/src/common/interceptors/logging.interceptor.ts` - Interceptor HTTP
- ✅ `backend/src/common/logger/custom-logger.ts` - Logger customizado
- ✅ `backend/docs/LOGGING.md` - Esta documentação

### Configuração
- ✅ `backend/src/app.module.ts` - Registro do interceptor
- ✅ `backend/src/main.ts` - Configuração do logger

### Logs Gerados
- 📂 `backend/logs/error.log` - Erros críticos
- 📂 `backend/logs/warn.log` - Avisos
- 📂 `backend/logs/info.log` - Informações gerais

---

## 🎓 Próximas Melhorias

- [ ] Integração com Grafana/Loki (visualização tempo real)
- [ ] Alertas Slack/Email para erros críticos
- [ ] Dashboard de métricas (requests/sec, latência média)
- [ ] Correlação de logs (request ID único por requisição)
- [ ] Log sampling (em alta carga, logar apenas % das requisições)
- [ ] Compressão de logs rotacionados (.gz)
- [ ] Upload automático para S3/Azure Blob (backup long-term)

---

**Mantido por:** Equipe ConectCRM  
**Última atualização:** Novembro 2025
