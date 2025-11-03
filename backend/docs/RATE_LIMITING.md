# 🛡️ Rate Limiting - Guia de Uso

## 📋 Visão Geral

O ConectCRM implementa **rate limiting** usando `@nestjs/throttler` para proteger a API contra:

- ✅ **Ataques de força bruta** (login, senha)
- ✅ **Abuso de API** (requisições excessivas)
- ✅ **DDoS** (ataques distribuídos)
- ✅ **Scraping** (extração não autorizada de dados)

## 🎯 Limites Padrão

O sistema aplica **3 níveis** de rate limiting automaticamente:

| Nível | Janela de Tempo | Limite | Descrição |
|-------|-----------------|--------|-----------|
| **SHORT** | 1 segundo | 10 requisições | Proteção contra spam |
| **MEDIUM** | 1 minuto | 100 requisições | Uso normal da API |
| **LONG** | 15 minutos | 1000 requisições | Proteção contra abuso prolongado |

### Exemplos Práticos

```typescript
// Usuário fazendo 15 requisições em 1 segundo
// ✅ Primeiras 10 passam
// ❌ 11ª requisição retorna 429 Too Many Requests

// Usuário fazendo 120 requisições em 1 minuto
// ✅ Primeiras 100 passam
// ❌ 101ª requisição retorna 429

// Usuário fazendo 1200 requisições em 15 minutos
// ✅ Primeiras 1000 passam
// ❌ 1001ª requisição retorna 429
```

## 🚀 Como Funciona

### 1. Tracking por IP ou User ID

O sistema identifica usuários por:
- **IP Address** (requisições não autenticadas)
- **User ID** (requisições autenticadas)

```typescript
// Requisições não autenticadas
GET /auth/login → Tracking: IP 192.168.1.100

// Requisições autenticadas
GET /clientes → Tracking: user:550e8400-e29b-41d4-a716-446655440000
```

### 2. Response Headers

Toda resposta inclui headers de rate limiting:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1699022400
```

- `X-RateLimit-Limit`: Limite total de requisições
- `X-RateLimit-Remaining`: Requisições restantes
- `X-RateLimit-Reset`: Timestamp quando limite reseta (Unix epoch)

### 3. Resposta de Erro (429)

Quando limite é excedido:

```json
{
  "statusCode": 429,
  "message": "Muitas requisições. Por favor, aguarde antes de tentar novamente.",
  "error": "Too Many Requests"
}
```

## 🔧 Customização

### Desabilitar Rate Limiting em Rota Específica

Use `@SkipThrottle()` para rotas públicas ou de saúde:

```typescript
import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
export class HealthController {
  @Get()
  @SkipThrottle() // ✅ Sem rate limiting
  check() {
    return { status: 'ok' };
  }
}
```

### Limites Customizados por Rota

Use `@Throttle()` para definir limites específicos:

```typescript
import { Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas/minuto
  async login() {
    // Login é sensível, limite mais restritivo
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 tentativas/5min
  async forgotPassword() {
    // Recuperação de senha ainda mais restritiva
  }
}
```

### Múltiplos Limites Simultâneos

```typescript
@Controller('api')
export class ApiController {
  @Get('data')
  @Throttle([
    { name: 'short', limit: 5, ttl: 1000 },    // 5/segundo
    { name: 'medium', limit: 50, ttl: 60000 }, // 50/minuto
  ])
  getData() {
    return { data: '...' };
  }
}
```

### Limites por Método HTTP

```typescript
@Controller('clientes')
export class ClientesController {
  @Get()
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // GET: 100/min
  findAll() {
    return this.clientesService.findAll();
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // POST: 20/min (mais restritivo)
  create(@Body() data: CreateClienteDto) {
    return this.clientesService.create(data);
  }
}
```

## 📊 Monitoramento

### Logs Automáticos

O sistema loga automaticamente quando limites são atingidos:

```
[Throttler] Rate limit exceeded for IP 192.168.1.100 on /api/clientes
[Throttler] Rate limit exceeded for user:550e8400... on /auth/login
```

### Métricas Recomendadas

Monitore estas métricas em produção:

- **Taxa de 429 (Too Many Requests)**: Se >5%, investigar
- **IPs/Users bloqueados**: Lista de IPs frequentemente bloqueados
- **Rotas mais atingidas**: Quais endpoints precisam ajuste de limite

### Integração com Grafana

```prometheus
# Exemplo de query Prometheus
rate(http_requests_total{status="429"}[5m])
```

## 🎯 Casos de Uso

### 1. Proteção de Login (Força Bruta)

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas/minuto
  async login(@Body() credentials: LoginDto) {
    // Atacante não consegue fazer mais de 5 tentativas/minuto
    return this.authService.login(credentials);
  }
}
```

**Cenário**: Atacante tenta 1000 combinações de senha
- ✅ **Com rate limiting**: Bloqueado após 5 tentativas, levaria 200 minutos para 1000 tentativas
- ❌ **Sem rate limiting**: 1000 tentativas em segundos

### 2. Proteção de APIs Públicas

```typescript
@Controller('webhooks')
export class WebhooksController {
  @Post('whatsapp')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100/minuto
  async receiveWhatsApp(@Body() data: any) {
    // Webhook do WhatsApp limitado
    return this.whatsappService.process(data);
  }
}
```

### 3. Proteção de Upload de Arquivos

```typescript
@Controller('upload')
export class UploadController {
  @Post('file')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads/minuto
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Previne abuso de storage
    return this.uploadService.save(file);
  }
}
```

### 4. Proteção de Endpoints Pesados

```typescript
@Controller('reports')
export class ReportsController {
  @Get('generate')
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 relatórios/5min
  async generateReport(@Query() params: ReportParamsDto) {
    // Relatórios consomem muitos recursos
    return this.reportsService.generate(params);
  }
}
```

## 🚨 Troubleshooting

### Erro: "Muitas requisições"

**Sintoma**:
```json
{
  "statusCode": 429,
  "message": "Muitas requisições..."
}
```

**Soluções**:

1. **Usuário legítimo**: Aguardar reset (verificar header `X-RateLimit-Reset`)
2. **Desenvolvimento**: Desabilitar temporariamente com `@SkipThrottle()`
3. **Produção**: Aumentar limite se for tráfego legítimo

### Rate Limiting não está funcionando

**Verificar**:

```bash
# 1. Verificar se ThrottlerModule está importado
grep -r "ThrottlerModule" backend/src/app.module.ts

# 2. Verificar se guard está registrado
grep -r "APP_GUARD" backend/src/app.module.ts

# 3. Testar endpoint
curl -i http://localhost:3001/api/test
# Deve retornar headers X-RateLimit-*
```

### Múltiplos usuários bloqueados (proxy/NAT)

**Problema**: Todos usuários atrás do mesmo IP compartilham limite

**Solução**: Tracking por user ID já implementado no `CustomThrottlerGuard`

```typescript
// Usuários autenticados usam user ID
// Apenas não autenticados compartilham limite por IP
```

### Ajustar limites em produção

**Monitorar**:
1. Taxa de 429 (deve ser <5%)
2. IPs bloqueados frequentemente
3. Rotas mais afetadas

**Ajustar** em `app.module.ts`:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,
    limit: 20, // ⬆️ Aumentado de 10 para 20
  },
  // ...
])
```

## 🔒 Segurança

### Boas Práticas

✅ **Login**: 3-5 tentativas/minuto  
✅ **APIs públicas**: 50-100/minuto  
✅ **APIs autenticadas**: 100-200/minuto  
✅ **Uploads**: 5-10/minuto  
✅ **Relatórios pesados**: 2-5/5 minutos  
✅ **Webhooks**: 100-500/minuto (depende do volume)

### Ataques Comuns Prevenidos

| Ataque | Como Rate Limiting Protege |
|--------|----------------------------|
| **Brute Force** | Limita tentativas de senha |
| **DDoS** | Limita requisições por IP |
| **Scraping** | Impede extração massiva de dados |
| **Credential Stuffing** | Limita validação de credenciais |
| **API Abuse** | Previne uso excessivo de recursos |

### Complementar com

- 🔥 **Firewall** (AWS Security Group, Cloudflare)
- 🔐 **CAPTCHA** (reCAPTCHA v3 no login após X falhas)
- 📧 **Alertas** (notificar admin sobre IPs suspeitos)
- 🚫 **IP Blacklist** (bloquear IPs maliciosos permanentemente)

## 📚 Referências

- [NestJS Throttler Docs](https://docs.nestjs.com/security/rate-limiting)
- [OWASP Rate Limiting](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [ROADMAP_MELHORIAS.md](../../ROADMAP_MELHORIAS.md) - Sprint 1 (Segurança)
- [backend/src/common/guards/custom-throttler.guard.ts](../src/common/guards/custom-throttler.guard.ts)

---

**Implementado em**: 3 de novembro de 2025  
**Versão**: 1.0.0  
**Status**: ✅ Ativo em produção
