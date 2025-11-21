# 📟 Guia de On-Call - ConectCRM

**Última atualização**: 2025-11-17  
**Versão**: 1.0  

---

## 🎯 Visão Geral

Este guia orienta o plantonista on-call na resposta a incidentes do ConectCRM. Use-o durante seu turno para garantir resposta rápida e estruturada.

---

## 📱 Informações de Contato

### Escalação de Incidentes

**Nível 1 - Plantonista On-Call**  
- Resposta inicial: < 5 minutos  
- Resolução esperada: < 15 minutos (críticos)  
- Escala para L2 se: não resolver em 15min OU necessitar acesso especial

**Nível 2 - Tech Lead / SRE**  
- Resposta: < 10 minutos após escalação  
- Resolução esperada: < 30 minutos  
- Escala para L3 se: impacto sistêmico OU incidente prolongado

**Nível 3 - CTO / Arquiteto**  
- Resposta: < 15 minutos após escalação  
- Decisões arquiteturais e mudanças emergenciais

### Canais de Notificação

- 🔴 **Crítico**: Slack #alerts-critical + SMS/Telefone
- 🟠 **Warning**: Slack #alerts-warning  
- 🔵 **Info**: Slack #alerts-info
- 📊 **SLO**: Slack #alerts-slo

---

## 🚨 Ao Receber um Alerta

### Checklist Imediato (primeiros 2 minutos)

1. **Acknowledge o alerta** no Alertmanager
   - Acesse: http://localhost:9093
   - Clique no alerta → Silence por 15min (tempo de investigação)

2. **Avalie a severidade**
   - 🔴 **Critical**: Ação imediata, pode impactar clientes
   - 🟠 **Warning**: Investigar, pode escalar para crítico
   - 🔵 **Info**: Monitorar, não requer ação urgente

3. **Verifique o contexto**
   - Dashboard Grafana: http://localhost:3002
   - Prometheus Alerts: http://localhost:9090/alerts
   - Logs no Loki: http://localhost:3002 (Explore → Loki)

4. **Consulte o Runbook**
   - Abra: `observability/RUNBOOKS.md`
   - Localize o alerta específico
   - Siga os passos de diagnóstico

---

## 📋 Procedimentos por Severidade

### 🔴 Alertas CRÍTICOS (Critical)

**SLA**: Resposta < 5min | Resolução < 15min

**Ações Obrigatórias**:
1. ✅ Acknowledge imediato no Alertmanager
2. ✅ Silenciar por 15min (tempo de investigação)
3. ✅ Notificar em #incidents: "🚨 Investigando [AlertName]"
4. ✅ Abrir dashboard de contexto (ver seção Dashboards)
5. ✅ Seguir runbook específico
6. ✅ Escalar se não resolver em 15min

**Alertas Críticos**:
- `APIDown`: Backend não responde → Impacto total
- `DatabaseConnectionPoolExhausted`: DB sem conexões → Erros massivos
- `HighLatencyP99`: 1% usuários com 5s+ → Experiência ruim
- `DiskSpaceRunningOut`: Disco >90% → Sistema pode travar
- `SLOAvailabilityViolation`: SLO quebrado → Error budget esgotado

### 🟠 Alertas WARNING (Warning)

**SLA**: Resposta < 15min | Investigação < 30min

**Ações**:
1. ✅ Acknowledge no Alertmanager
2. ✅ Avaliar tendência (está piorando?)
3. ✅ Documentar observações em thread do Slack
4. ✅ Seguir runbook para investigação
5. ✅ Criar ticket se necessário follow-up
6. ✅ Escalar se tendência de piora continuar

**Alertas Warning**:
- `HighHTTPErrorRate`: >5% erros 5xx
- `HighLatencyP95`: 5% usuários com 2s+
- `SlowDatabaseQueries`: Queries >1s frequentes
- `HighCPUUsage`: CPU >80% por 5min
- `HighMemoryUsage`: Memory >85% por 5min

### 🔵 Alertas INFO (Info)

**SLA**: Revisar no próximo dia útil

**Ações**:
1. ✅ Revisar contexto quando possível
2. ✅ Documentar se padrão anormal
3. ✅ Criar ticket para otimização futura

---

## 🔧 Ferramentas de Diagnóstico

### Dashboards Essenciais

**Grafana** (http://localhost:3002):
- **Overview**: `/d/conectcrm-overview` - Visão geral do sistema
- **Alerting**: `/d/alerting-dashboard` - Status de alertas
- **Error Budget**: `/d/error-budget` - SLO e budget
- **Traces**: `/d/traces-dashboard` - Distributed tracing
- **Logs**: Explore → Loki datasource

**Prometheus** (http://localhost:9090):
- **Alerts**: `/alerts` - Estado atual dos alertas
- **Targets**: `/targets` - Saúde dos endpoints
- **Graph**: `/graph` - Queries customizadas

**Alertmanager** (http://localhost:9093):
- **Alerts**: `/` - Gerenciar alertas ativos
- **Silences**: `/silences` - Gerenciar silenciamentos

**Jaeger** (http://localhost:16686):
- **Search**: Rastrear requisições específicas
- **Compare**: Comparar traces lentas vs rápidas

### Comandos PowerShell Úteis

```powershell
# Verificar containers Docker
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs de um container
docker logs -f --tail 100 conectsuite-backend

# Saúde do backend
Invoke-RestMethod http://localhost:3001/health

# Alertas ativos no Prometheus
Invoke-RestMethod http://localhost:9090/api/v1/alerts | ConvertTo-Json -Depth 10

# Alertas ativos no Alertmanager
Invoke-RestMethod http://localhost:9093/api/v2/alerts | ConvertTo-Json -Depth 10

# Reiniciar um serviço
docker-compose restart backend

# Ver uso de recursos
docker stats --no-stream

# Verificar portas em uso
netstat -ano | findstr "3001 9090 9093"
```

---

## 🔇 Como Silenciar Alertas

### Via Interface Web (Recomendado)

1. Acesse Alertmanager: http://localhost:9093
2. Localize o alerta ativo
3. Clique em **"Silence"**
4. Preencha:
   - **Duration**: 15min (investigação), 1h (manutenção), 24h (conhecido)
   - **Creator**: Seu nome
   - **Comment**: Motivo do silenciamento (obrigatório!)
5. Clique **"Create"**

### Via CLI (amtool)

```powershell
# Silenciar APIDown por 1 hora
docker exec conectsuite-alertmanager amtool silence add alertname=APIDown --duration=1h --comment="Manutenção programada" --author="Nome"

# Listar silenciamentos ativos
docker exec conectsuite-alertmanager amtool silence query

# Remover silenciamento
docker exec conectsuite-alertmanager amtool silence expire <silence-id>
```

### Boas Práticas de Silenciamento

✅ **SEMPRE adicione comentário explicativo**  
✅ Use duração apropriada (15min-1h para investigação)  
✅ Documente em #incidents o motivo  
✅ Remova silenciamento após resolver  

❌ **NUNCA silencie sem comentário**  
❌ Nunca silencie por mais de 24h  
❌ Nunca silencie alertas críticos sem investigar  

---

## 📊 Escalação de Incidentes

### Quando Escalar para L2 (Tech Lead/SRE)

- ⏱️ Não resolveu em 15 minutos
- 🔐 Precisa de acesso privilegiado (prod DB, secrets)
- 🏗️ Requer mudança arquitetural
- 📈 Impacto crescente (mais clientes afetados)
- 🤔 Causa raiz não identificada

### Quando Escalar para L3 (CTO/Arquiteto)

- 🔥 Incidente prolongado (>1h)
- 💥 Múltiplos sistemas afetados
- 💰 Impacto financeiro significativo
- 🗣️ Comunicação externa necessária
- 🚨 Decisão de negócio crítica (ex: rollback de release)

### Template de Escalação

```
🚨 ESCALAÇÃO PARA L2/L3

Alerta: [Nome do Alerta]
Severidade: [Critical/Warning]
Início: [HH:MM]
Duração: [X minutos]

Sintomas:
- [O que está acontecendo]

Já Tentado:
- [Ações realizadas]

Impacto:
- [Quantos clientes afetados]
- [Funcionalidades comprometidas]

Contexto:
- Dashboard: [Link Grafana]
- Logs: [Link Loki com query]
- Traces: [Link Jaeger se aplicável]
```

---

## 📝 Post-Incident Review

### Após Resolver o Incidente

**Imediatamente**:
1. ✅ Remover silenciamentos
2. ✅ Confirmar métricas normalizadas
3. ✅ Atualizar thread em #incidents com resolução
4. ✅ Documentar ações tomadas

**Até 2h depois**:
1. ✅ Preencher Post-Mortem (use template em RUNBOOKS.md)
2. ✅ Identificar causa raiz
3. ✅ Propor ações corretivas
4. ✅ Criar tickets de follow-up

**Até 24h depois**:
1. ✅ Revisar Post-Mortem com equipe
2. ✅ Atualizar runbook se necessário
3. ✅ Ajustar thresholds se falso positivo

---

## 🔄 Handoff de Turno

### Checklist ao Assumir Turno

```markdown
## 🟢 Assumindo Turno - [Data] [HH:MM]

- [ ] Revisei alertas ativos no Alertmanager
- [ ] Chequei silenciamentos ativos e motivos
- [ ] Li threads em #incidents das últimas 24h
- [ ] Verifiquei dashboards estão carregando
- [ ] Testei acesso a ferramentas (Grafana, Prometheus, Alertmanager)
- [ ] Li handoff notes do turno anterior
- [ ] Confirmei contatos de escalação disponíveis

**Alertas Ativos**: [Número] - [Listar se houver]
**Silenciamentos**: [Número] - [Motivos]
**Incidentes Abertos**: [Número] - [Status]
**Observações**: [Qualquer contexto importante]

Plantonista: [Nome]
```

### Checklist ao Passar Turno

```markdown
## 🔴 Passando Turno - [Data] [HH:MM]

**Resumo do Turno**:
- Duração: [X horas]
- Alertas recebidos: [Número]
- Incidentes: [Número]

**Incidentes Tratados**:
1. [AlertName] - [HH:MM] - Resolvido/Escalado - [Breve descrição]

**Pendências para Próximo Turno**:
- [ ] [Ação pendente 1]
- [ ] [Ação pendente 2]

**Silenciamentos Ativos**:
- [AlertName] - Expira em [HH:MM] - Motivo: [X]

**Observações**:
- [Comportamentos anormais notados]
- [Trends preocupantes]
- [Manutenções programadas]

Plantonista saindo: [Nome]
Plantonista entrando: [Nome]
```

---

## 🎓 Dicas de Veterano

### Performance Under Pressure

1. **Respire**: 30 segundos para organizar pensamento valem mais que agir às cegas
2. **Siga o Runbook**: Ele existe para te guiar sob pressão
3. **Documente enquanto investiga**: Você vai esquecer detalhes depois
4. **Peça ajuda cedo**: Escalar não é falha, é inteligência
5. **Comunique proativamente**: Silêncio gera ansiedade

### Comandos Salvadores

```powershell
# Ver últimos 50 logs de erro do backend
docker logs conectsuite-backend --tail 50 | Select-String "ERROR|FATAL"

# Identificar queries lentas no Postgres
docker exec -it conectsuite-postgres psql -U postgres -d conectcrm -c "SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 seconds' ORDER BY duration DESC;"

# Verificar uso de memória de containers
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Tail logs de múltiplos containers
docker-compose logs -f --tail=50 backend postgres redis

# Reiniciar stack completo (último recurso!)
docker-compose restart
```

### Red Flags 🚩

Estes sinais indicam problemas sérios - investigue imediatamente:

- 🚩 CPU >95% por mais de 1 minuto
- 🚩 Memória >95% por mais de 30 segundos
- 🚩 Disco >95% 
- 🚩 Database connections >90% do pool
- 🚩 Latência P99 >10s
- 🚩 Taxa de erro >10%
- 🚩 Múltiplos alertas críticos simultâneos
- 🚩 Logs mostrando "Out of Memory" ou "Connection refused"

---

## 📚 Recursos Adicionais

### Documentação Técnica

- **Runbooks**: `observability/RUNBOOKS.md`
- **Week 9 Doc**: `observability/WEEK_9_ALERTING_ONCALL.md`
- **Architecture**: `ANALISE_ARQUITETURA_OMNICHANNEL_COMPLETA.md`

### Dashboards de Referência

- Overview System: http://localhost:3002/d/conectcrm-overview
- Error Budget: http://localhost:3002/d/error-budget
- Alerting: http://localhost:3002/d/alerting-dashboard

### Contatos de Emergência

```
Tech Lead:    [Nome] - [Telefone] - [Email]
SRE:          [Nome] - [Telefone] - [Email]
CTO:          [Nome] - [Telefone] - [Email]
DevOps:       [Nome] - [Telefone] - [Email]
```

---

## ✅ Quick Reference Card

**Imprima e mantenha perto durante turno on-call**

```
╔══════════════════════════════════════════════════════════╗
║        🚨 QUICK REFERENCE - ON-CALL CONECTCRM           ║
╚══════════════════════════════════════════════════════════╝

📱 ESCALAÇÃO:
   L1 → Você (< 5min response, < 15min resolve)
   L2 → Tech Lead (< 10min response)
   L3 → CTO (< 15min response)

🔗 DASHBOARDS:
   Grafana:      http://localhost:3002
   Prometheus:   http://localhost:9090/alerts
   Alertmanager: http://localhost:9093
   Jaeger:       http://localhost:16686

🔧 COMANDOS RÁPIDOS:
   Logs:      docker logs -f --tail 100 conectsuite-backend
   Restart:   docker-compose restart backend
   Health:    Invoke-RestMethod http://localhost:3001/health
   Stats:     docker stats --no-stream

🚨 ALERTA RECEBIDO - AÇÃO IMEDIATA:
   1. Acknowledge no Alertmanager
   2. Silence 15min
   3. Abrir dashboard contexto
   4. Seguir runbook
   5. Documentar em #incidents
   6. Escalar se não resolver em 15min

📝 COMUNICAÇÃO:
   Slack #incidents: Atualizações de status
   Slack #alerts-*:  Notificações automáticas
   
🔇 SILENCIAR ALERTA:
   http://localhost:9093 → Alerta → Silence
   SEMPRE adicionar comentário!

📋 HANDOFF:
   Revisar alertas ativos + silenciamentos
   Documentar pendências
   Passar contexto para próximo turno

🆘 EMERGÊNCIA:
   Tech Lead: [Telefone]
   Runbooks:  observability/RUNBOOKS.md
```

---

**Boa sorte no seu turno! 🚀**  
Lembre-se: Você tem ferramentas, runbooks e equipe. Não está sozinho(a)!
