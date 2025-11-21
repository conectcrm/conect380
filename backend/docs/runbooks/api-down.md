# Runbook: API Down
**Severity**: CRITICAL  
**Impact**: Clientes não conseguem acessar o sistema

## 🚨 Sintomas
- Alerta `APIDown` disparado
- Health check endpoint `/health` retornando 503 ou timeout
- Usuários reportando erro 502/503 no frontend

## 🔍 Diagnóstico Rápido (2 minutos)

### 1. Verificar se o serviço está rodando
```bash
# Verificar processo Node.js
ps aux | grep node

# Verificar container Docker (se aplicável)
docker ps | grep nestjs-api
```

### 2. Checar logs recentes
```bash
# Últimas 50 linhas de erro
tail -50 /var/log/conectcrm/error.log

# Logs do PM2 (se usar)
pm2 logs conectcrm-api --lines 50 --err
```

### 3. Testar conectividade
```bash
# Teste local
curl http://localhost:3001/health

# Teste do load balancer
curl http://api.conectcrm.com/health
```

## 🔧 Soluções Comuns

### Problema 1: Processo morto/travado
```bash
# Reiniciar aplicação
pm2 restart conectcrm-api

# Ou via systemd
systemctl restart conectcrm-api

# Verificar se subiu
curl http://localhost:3001/health
```

### Problema 2: Out of Memory (OOM)
```bash
# Verificar memória
free -h
docker stats

# Se OOM, aumentar limite e reiniciar
# Editar PM2 ecosystem.config.js:
max_memory_restart: '2G'

pm2 restart conectcrm-api
```

### Problema 3: Database inacessível
```bash
# Testar conexão PostgreSQL
psql -h localhost -U conectcrm -d conectcrm -c "SELECT 1"

# Se falhar, verificar status
systemctl status postgresql

# Reiniciar se necessário
systemctl restart postgresql
```

### Problema 4: Porta ocupada
```bash
# Verificar porta 3001
lsof -i :3001

# Matar processo se necessário
kill -9 <PID>

# Reiniciar aplicação
pm2 restart conectcrm-api
```

## 📋 Checklist de Recuperação

- [ ] Processo está rodando?
- [ ] Health check retorna 200?
- [ ] Database conecta?
- [ ] Logs não mostram erros críticos?
- [ ] Frontend consegue fazer login?
- [ ] Testar funcionalidade básica (criar ticket)?

## 🔄 Procedimento Completo (10-15 minutos)

### Fase 1: Detecção (0-2min)
1. Confirmar alerta no Prometheus/Alertmanager
2. Verificar dashboard de monitoramento
3. Confirmar impacto (quantos usuários afetados?)

### Fase 2: Mitigação Inicial (2-5min)
1. Tentar reinício rápido (hot restart)
2. Se falhar, fazer restart completo
3. Verificar se resolveu

### Fase 3: Investigação (5-10min)
1. Analisar logs de erro
2. Verificar métricas antes da queda
3. Identificar root cause

### Fase 4: Resolução Definitiva (10-15min)
1. Aplicar fix definitivo (se conhecido)
2. Validar estabilidade (monitorar 5min)
3. Documentar incidente

## 📞 Escalação

| Tempo sem resolução | Ação |
|---|---|
| 0-5min | On-call engineer resolve |
| 5-10min | Escalar para Tech Lead |
| 10-15min | Escalar para CTO |
| 15min+ | Comunicar clientes via status page |

## 📊 Métricas de Recovery

**RTO (Recovery Time Objective)**: 5 minutos  
**RPO (Recovery Point Objective)**: 0 (sem perda de dados)

## 🔗 Links Úteis
- [Dashboard Grafana](http://grafana.conectcrm.com/d/api-health)
- [Logs Centralizados](http://logs.conectcrm.com)
- [Status Page](https://status.conectcrm.com)

## 📝 Pós-Incidente
1. Atualizar status page
2. Criar postmortem (se > 10min downtime)
3. Identificar melhorias
4. Atualizar runbook se necessário
