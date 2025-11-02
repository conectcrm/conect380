# 🚀 Roadmap Sprint 2 - ConectCRM

**Período**: Novembro 2025  
**Status**: 🟢 Pronto para Iniciar  
**Pré-requisito**: Sprint 1 concluído ✅

---

## 📊 Visão Geral

O Sprint 1 entregou o sistema **100% funcional em produção** com arquitetura multi-tenant. O Sprint 2 foca em **validação, monitoramento, segurança e preparação para clientes reais**.

---

## 🎯 Objetivos do Sprint 2

1. **Validação End-to-End**: Garantir que todos os fluxos funcionem perfeitamente
2. **Domínio e SSL**: Sistema acessível via HTTPS com domínio próprio
3. **Monitoramento**: Logs, métricas e alertas para detectar problemas
4. **Documentação de Cliente**: Manuais para onboarding de novos clientes
5. **Performance**: Otimizações de velocidade e escalabilidade

---

## 📋 Tarefas Detalhadas

### 🧪 Tarefa 1: Validação End-to-End (Prioridade ALTA)

**Objetivo**: Testar todos os fluxos críticos do sistema

**Subtarefas**:

- [ ] **1.1. Login e Autenticação**
  - [ ] Login via browser funciona
  - [ ] Token JWT armazenado corretamente
  - [ ] Refresh token implementado (se aplicável)
  - [ ] Logout limpa sessão
  - **Tempo estimado**: 30 min

- [ ] **1.2. Isolamento Multi-Tenant**
  - [ ] Criar 2 empresas de teste
  - [ ] Login com usuários de empresas diferentes
  - [ ] Verificar que Empresa A NÃO vê dados da Empresa B
  - [ ] Testar criação de registros (atendimentos, clientes, etc.)
  - **Tempo estimado**: 1 hora

- [ ] **1.3. Módulo Atendimento**
  - [ ] Listar atendimentos
  - [ ] Criar novo atendimento
  - [ ] Editar atendimento existente
  - [ ] Deletar atendimento
  - [ ] Filtros e busca funcionam
  - **Tempo estimado**: 1 hora

- [ ] **1.4. Módulo Clientes**
  - [ ] Listar clientes
  - [ ] Criar novo cliente
  - [ ] Editar cliente
  - [ ] Deletar cliente
  - [ ] Importação em lote (se existir)
  - **Tempo estimado**: 45 min

- [ ] **1.5. Módulo Chat**
  - [ ] Chat abre corretamente
  - [ ] Mensagens são enviadas
  - [ ] Mensagens são recebidas em tempo real (WebSocket)
  - [ ] Histórico carrega
  - [ ] Anexos funcionam (se existir)
  - **Tempo estimado**: 1 hora

- [ ] **1.6. Módulo Triagem Dinâmica**
  - [ ] Fluxos de triagem carregam
  - [ ] Bot responde mensagens
  - [ ] Etapas de coleta funcionam
  - [ ] Árvore de decisão funciona
  - **Tempo estimado**: 1.5 horas

- [ ] **1.7. Gestão de Equipes**
  - [ ] Criar equipe
  - [ ] Adicionar/remover membros
  - [ ] Atribuições automáticas funcionam
  - **Tempo estimado**: 45 min

- [ ] **1.8. Relatórios e Dashboard**
  - [ ] Dashboard carrega métricas
  - [ ] Gráficos renderizam
  - [ ] Filtros por período funcionam
  - **Tempo estimado**: 30 min

**Total Tarefa 1**: ~7 horas  
**Responsável**: Time de Testes + Dev  
**Entrega**: Documento com resultados (aprovado/reprovado por módulo)

---

### 🌐 Tarefa 2: Domínio e SSL (Prioridade ALTA)

**Objetivo**: Sistema acessível via HTTPS com domínio próprio

**Subtarefas**:

- [ ] **2.1. Registrar Domínio**
  - [ ] Comprar domínio (ex: `conectcrm.com.br`)
  - [ ] Configurar DNS para apontar para `56.124.63.239`
  - [ ] Testar propagação DNS (`nslookup conectcrm.com.br`)
  - **Tempo estimado**: 1 hora (+ 24h propagação)

- [ ] **2.2. Instalar Certbot (Let's Encrypt)**
  ```bash
  # Na AWS
  sudo apt update
  sudo apt install certbot python3-certbot-nginx
  ```
  - **Tempo estimado**: 15 min

- [ ] **2.3. Gerar Certificado SSL**
  ```bash
  sudo certbot --nginx -d conectcrm.com.br -d www.conectcrm.com.br
  ```
  - [ ] Certificado gerado com sucesso
  - [ ] Nginx configurado automaticamente
  - **Tempo estimado**: 15 min

- [ ] **2.4. Atualizar nginx.conf**
  ```nginx
  server {
      listen 443 ssl http2;
      server_name conectcrm.com.br www.conectcrm.com.br;
      
      ssl_certificate /etc/letsencrypt/live/conectcrm.com.br/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/conectcrm.com.br/privkey.pem;
      
      # Security headers
      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
      add_header X-Frame-Options DENY always;
      add_header X-Content-Type-Options nosniff always;
      
      # ... resto da config
  }
  
  # Redirecionar HTTP → HTTPS
  server {
      listen 80;
      server_name conectcrm.com.br www.conectcrm.com.br;
      return 301 https://$server_name$request_uri;
  }
  ```
  - **Tempo estimado**: 30 min

- [ ] **2.5. Renovação Automática**
  ```bash
  # Testar renovação
  sudo certbot renew --dry-run
  
  # Certificado renova automaticamente via systemd timer
  sudo systemctl status certbot.timer
  ```
  - **Tempo estimado**: 15 min

- [ ] **2.6. Atualizar Frontend URL**
  - [ ] Mudar `REACT_APP_API_URL` para `https://api.conectcrm.com.br`
  - [ ] Rebuild frontend
  - [ ] Redeploy
  - **Tempo estimado**: 30 min

- [ ] **2.7. Testar HTTPS**
  - [ ] Acessar https://conectcrm.com.br
  - [ ] Verificar cadeado verde no navegador
  - [ ] Testar redirecionamento HTTP → HTTPS
  - [ ] Verificar API funcionando via HTTPS
  - **Tempo estimado**: 15 min

**Total Tarefa 2**: ~3 horas (+ 24h DNS)  
**Responsável**: DevOps/Infra  
**Entrega**: Sistema acessível via HTTPS

---

### 📊 Tarefa 3: Monitoramento e Observabilidade (Prioridade MÉDIA)

**Objetivo**: Detectar problemas antes que afetem usuários

**Subtarefas**:

- [ ] **3.1. Corrigir Health Checks**
  
  **Backend** (`backend/src/health/health.controller.ts`):
  ```typescript
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: await this.checkDatabase(),
    };
  }
  ```
  - [ ] Endpoint `/health` retorna 200
  - [ ] Docker health check configurado
  - **Tempo estimado**: 1 hora

- [ ] **3.2. Logs Estruturados**
  
  Instalar Winston ou Pino:
  ```typescript
  // backend/src/logger/logger.service.ts
  import pino from 'pino';
  
  export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  });
  ```
  - [ ] Substituir `console.log` por logger estruturado
  - [ ] Logs em JSON (produção)
  - [ ] Logs coloridos (desenvolvimento)
  - **Tempo estimado**: 2 horas

- [ ] **3.3. Centralizar Logs (Opcional)**
  
  Opções:
  - **Loki + Grafana** (open source)
  - **CloudWatch** (AWS nativo)
  - **Papertrail** (SaaS simples)
  
  ```bash
  # Instalar Loki (exemplo)
  docker run -d --name loki \
    -p 3100:3100 \
    grafana/loki:latest
  ```
  - [ ] Logs de todos os containers centralizados
  - [ ] Interface de busca funcionando
  - **Tempo estimado**: 3 horas

- [ ] **3.4. Métricas com Prometheus (Opcional)**
  
  ```typescript
  // Instalar: npm install prom-client
  import { register, Counter, Histogram } from 'prom-client';
  
  const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
  });
  
  // Endpoint de métricas
  @Get('metrics')
  async metrics() {
    return register.metrics();
  }
  ```
  - [ ] Endpoint `/metrics` retorna métricas Prometheus
  - [ ] Prometheus configurado para scrape
  - **Tempo estimado**: 2 horas

- [ ] **3.5. Dashboard Grafana (Opcional)**
  
  ```bash
  docker run -d --name grafana \
    -p 3001:3000 \
    grafana/grafana:latest
  ```
  - [ ] Grafana conectado ao Prometheus
  - [ ] Dashboard com:
    - Requests por segundo
    - Latência média/p95/p99
    - Taxa de erros
    - Uptime
  - **Tempo estimado**: 2 horas

- [ ] **3.6. Alertas**
  
  Configurar alertas para:
  - [ ] API retornando 5xx errors (> 10 em 5 min)
  - [ ] Latência alta (p95 > 1s)
  - [ ] Container reiniciando (> 3x em 10 min)
  - [ ] Disco cheio (> 90%)
  
  **Ferramentas**:
  - Slack webhook
  - Email (SMTP)
  - SMS (Twilio - opcional)
  
  - **Tempo estimado**: 2 horas

**Total Tarefa 3**: ~12 horas (opcional reduzir escopo)  
**Responsável**: DevOps  
**Entrega**: Dashboard de métricas + Alertas configurados

---

### 📚 Tarefa 4: Documentação para Clientes (Prioridade MÉDIA)

**Objetivo**: Facilitar onboarding de novos clientes

**Subtarefas**:

- [ ] **4.1. Manual do Usuário**
  - [ ] Como fazer login
  - [ ] Como criar atendimento
  - [ ] Como usar chat
  - [ ] Como configurar triagem
  - [ ] Como gerar relatórios
  - **Formato**: PDF ou Wiki online
  - **Tempo estimado**: 4 horas

- [ ] **4.2. Manual do Administrador**
  - [ ] Como criar novos usuários
  - [ ] Como configurar equipes
  - [ ] Como gerenciar permissões
  - [ ] Como fazer backup de dados
  - **Tempo estimado**: 3 horas

- [ ] **4.3. Guia de Onboarding**
  - [ ] Checklist de configuração inicial
  - [ ] Importação de dados históricos
  - [ ] Configuração de integrações (WhatsApp, etc.)
  - **Tempo estimado**: 2 horas

- [ ] **4.4. FAQs e Troubleshooting**
  - [ ] Problemas comuns e soluções
  - [ ] Contato de suporte
  - **Tempo estimado**: 2 horas

- [ ] **4.5. Vídeos Tutoriais (Opcional)**
  - [ ] Screencast de fluxos principais
  - [ ] Duração: 3-5 min cada
  - [ ] Hospedar no YouTube (unlisted)
  - **Tempo estimado**: 8 horas (4 vídeos x 2h cada)

**Total Tarefa 4**: ~11 horas (ou 19h com vídeos)  
**Responsável**: Time de Produto + Design  
**Entrega**: Documentos em formato PDF + Wiki online

---

### ⚡ Tarefa 5: Performance e Otimizações (Prioridade BAIXA)

**Objetivo**: Sistema mais rápido e eficiente

**Subtarefas**:

- [ ] **5.1. Otimizar Queries**
  - [ ] Identificar queries lentas (> 500ms)
  - [ ] Adicionar índices em colunas filtradas
  - [ ] Usar `EXPLAIN ANALYZE` para diagnóstico
  ```sql
  CREATE INDEX idx_atendimentos_empresa_id ON atendimentos(empresa_id);
  CREATE INDEX idx_atendimentos_created_at ON atendimentos(created_at DESC);
  ```
  - **Tempo estimado**: 3 horas

- [ ] **5.2. Caching com Redis (Opcional)**
  ```typescript
  // Cachear dados que mudam pouco
  @Injectable()
  export class AtendimentoService {
    async listar(empresaId: string) {
      const cacheKey = `atendimentos:${empresaId}`;
      let data = await this.redis.get(cacheKey);
      
      if (!data) {
        data = await this.repository.find({ where: { empresaId } });
        await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 300); // 5 min
      }
      
      return JSON.parse(data);
    }
  }
  ```
  - **Tempo estimado**: 4 horas

- [ ] **5.3. Paginação**
  - [ ] Listar atendimentos: máximo 20 por página
  - [ ] Listar clientes: máximo 50 por página
  - [ ] Cursor-based pagination (mais eficiente)
  - **Tempo estimado**: 2 horas

- [ ] **5.4. Lazy Loading (Frontend)**
  - [ ] Code splitting de rotas
  - [ ] Lazy load de componentes pesados
  ```typescript
  const GestaoEquipesPage = lazy(() => import('./pages/GestaoEquipesPage'));
  ```
  - **Tempo estimado**: 2 horas

- [ ] **5.5. CDN para Assets (Opcional)**
  - [ ] Servir JS/CSS via CloudFront ou Cloudflare
  - [ ] Reduz latência para usuários distantes
  - **Tempo estimado**: 3 horas

**Total Tarefa 5**: ~14 horas  
**Responsável**: Time de Backend + Frontend  
**Entrega**: Latência reduzida em 30-50%

---

### 🔐 Tarefa 6: Segurança Avançada (Prioridade BAIXA)

**Objetivo**: Hardening de segurança

**Subtarefas**:

- [ ] **6.1. Rate Limiting**
  ```typescript
  // Limitar login: máximo 5 tentativas por minuto
  @UseGuards(ThrottlerGuard)
  @Throttle(5, 60)
  @Post('login')
  async login(@Body() dto: LoginDto) { ... }
  ```
  - **Tempo estimado**: 1 hora

- [ ] **6.2. CAPTCHA no Login**
  - [ ] Google reCAPTCHA v3
  - [ ] Prevenir brute force
  - **Tempo estimado**: 2 horas

- [ ] **6.3. Auditoria de Ações**
  - [ ] Tabela `audit_logs`
  - [ ] Registrar: quem, quando, o quê
  ```sql
  CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES usuarios(id),
    empresa_id UUID REFERENCES empresas(id),
    action TEXT,
    resource TEXT,
    changes JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
  - **Tempo estimado**: 3 horas

- [ ] **6.4. Backup Automático**
  - [ ] Cron job diário às 3h
  - [ ] Retenção: 7 dias
  - [ ] Upload para S3 (AWS)
  ```bash
  #!/bin/bash
  # /etc/cron.daily/backup-postgres
  DATE=$(date +%Y%m%d)
  docker exec conectcrm-postgres-prod pg_dump -U conectcrm conectcrm_prod | gzip > /backups/conectcrm_$DATE.sql.gz
  aws s3 cp /backups/conectcrm_$DATE.sql.gz s3://conectcrm-backups/
  find /backups -name "*.sql.gz" -mtime +7 -delete
  ```
  - **Tempo estimado**: 2 horas

- [ ] **6.5. Scan de Vulnerabilidades**
  - [ ] Rodar `npm audit` no backend e frontend
  - [ ] Corrigir vulnerabilidades HIGH/CRITICAL
  - [ ] Configurar Dependabot (GitHub)
  - **Tempo estimado**: 2 horas

**Total Tarefa 6**: ~10 horas  
**Responsável**: Time de Segurança/DevOps  
**Entrega**: Sistema com hardening completo

---

## 📅 Cronograma Sugerido

| Semana | Tarefas | Horas | Status |
|--------|---------|-------|--------|
| **Semana 1** | Validação E2E (Tarefa 1) | 7h | 🟡 Aguardando |
| **Semana 1-2** | Domínio + SSL (Tarefa 2) | 3h | 🟡 Aguardando |
| **Semana 2** | Health Checks + Logs (Tarefa 3.1-3.2) | 3h | 🟡 Aguardando |
| **Semana 3** | Documentação Cliente (Tarefa 4) | 11h | 🟡 Aguardando |
| **Semana 3-4** | Monitoramento Completo (Tarefa 3.3-3.6) | 9h | 🔵 Opcional |
| **Semana 4** | Performance (Tarefa 5.1-5.4) | 11h | 🔵 Opcional |
| **Semana 4** | Segurança (Tarefa 6) | 10h | 🔵 Opcional |

**Total Obrigatório**: ~24 horas (3 dias)  
**Total Opcional**: ~40 horas (5 dias extras)  
**Total Completo**: ~64 horas (~8 dias de trabalho)

---

## ✅ Critérios de Aceitação Sprint 2

### Obrigatórios (Mínimo para ir ao ar com clientes)

- [ ] ✅ Validação E2E passou em todos os módulos
- [ ] 🌐 Sistema acessível via HTTPS com domínio próprio
- [ ] 📊 Health checks funcionando (backend + frontend)
- [ ] 📚 Documentação básica de usuário disponível
- [ ] 🔐 Backups automáticos configurados

### Opcionais (Melhorias recomendadas)

- [ ] 📊 Dashboard Grafana com métricas
- [ ] 🔔 Alertas de downtime configurados
- [ ] ⚡ Latência reduzida (< 300ms p95)
- [ ] 🎥 Vídeos tutoriais criados
- [ ] 🔐 Rate limiting implementado

---

## 🎯 Definição de Pronto (DoD)

Uma tarefa só está "Pronta" quando:

1. ✅ Código implementado e testado
2. ✅ Documentação atualizada
3. ✅ Code review aprovado
4. ✅ Deploy em produção realizado
5. ✅ Validado por usuário/QA
6. ✅ Sem bugs conhecidos (P0/P1)

---

## 🚀 Após Sprint 2

Com Sprint 2 concluído, o sistema estará:

- ✅ 100% validado e testado
- ✅ Acessível via HTTPS com domínio
- ✅ Monitorado e observável
- ✅ Documentado para clientes
- ✅ **Pronto para venda comercial**

### Próximos Sprints (Backlog)

**Sprint 3**: Integrações
- WhatsApp Business API oficial
- Integração com ERPs (Tiny, Bling, etc.)
- Webhooks customizáveis

**Sprint 4**: Features Avançadas
- Automações (n8n ou Zapier-like)
- Relatórios customizáveis
- BI Dashboard avançado

**Sprint 5**: Mobile
- App mobile (React Native)
- Push notifications
- Offline-first sync

---

**Preparado por**: GitHub Copilot  
**Data**: 2 de novembro de 2025  
**Status**: 🟢 Pronto para Kickoff Sprint 2
