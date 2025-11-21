# ⚙️ Calibração de Thresholds - Alerting

**Objetivo**: Ajustar sensibilidade de alertas baseado em dados históricos reais.  
**Quando usar**: Após 1-2 semanas de dados coletados OU se houver muitos falsos positivos.

---

## 🎯 Por Que Calibrar?

**Problema**: Thresholds padrão podem não se adequar ao seu perfil de uso:
- ❌ **Falsos positivos**: Alertas disparam sem problema real (fadiga de alerta)
- ❌ **Falsos negativos**: Problema real não dispara alerta (detecção tardia)

**Solução**: Analisar dados históricos e ajustar thresholds baseado em:
- 📊 Percentis reais (P50, P95, P99)
- 📈 Padrões sazonais (horário comercial vs madrugada)
- 🎯 Taxa de falsos positivos/negativos atual

---

## 📊 Análise de Dados Históricos

### 1. Coletar Métricas Reais (Últimos 7 dias)

```powershell
# CPU Usage - Histórico P95
$cpuQuery = 'avg(rate(process_cpu_user_seconds_total[5m])) * 100'
$result = Invoke-RestMethod "http://localhost:9090/api/v1/query_range?query=$cpuQuery&start=$(Get-Date).AddDays(-7).ToUnixTimeSeconds()&end=$(Get-Date).ToUnixTimeSeconds()&step=3600"

# Calcular P95 dos últimos 7 dias
# Usar valor como baseline para threshold

# Memory Usage - Histórico P95
$memQuery = 'avg(process_resident_memory_bytes / process_virtual_memory_max_bytes) * 100'

# Latency P95 - Histórico
$latencyQuery = 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000'

# Error Rate - Histórico
$errorQuery = 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100'
```

### 2. Identificar Padrões de Uso

**Gráficos essenciais no Grafana**:
- CPU/Memory ao longo do tempo (7d)
- Latência por hora do dia (heatmap)
- Taxa de erro por dia da semana
- Distribuição de tráfego (requests/min)

**Perguntas chave**:
- Há picos previsíveis? (ex: todo dia às 9h)
- Fins de semana têm perfil diferente?
- Há manutenções recorrentes? (ex: backup noturno)
- Usuários de quais regiões/timezones?

---

## 🔧 Thresholds por Métrica

### CPU Usage

**Threshold padrão**: 80% por 5 minutos

**Como calibrar**:

```promql
# No Grafana, executar query (últimos 7 dias):
histogram_quantile(0.95, 
  rate(process_cpu_seconds_total[5m])
) * 100

# Resultado exemplo: P95 = 62%
# Novo threshold: P95 + 20% = 62 * 1.2 = 74.4% ≈ 75%
```

**Atualizar alert-rules.yml**:
```yaml
- alert: HighCPUUsage
  expr: avg(rate(process_cpu_seconds_total[5m])) * 100 > 75  # Era 80
  for: 5m
```

**Recomendações**:
- 🟢 Desenvolvimento: P95 + 30% (mais tolerante)
- 🟡 Staging: P95 + 20%
- 🔴 Produção: P95 + 15% (mais sensível)

### Memory Usage

**Threshold padrão**: 85% por 5 minutos

**Como calibrar**:

```promql
# Memory usage P95 (últimos 7 dias)
histogram_quantile(0.95,
  avg(process_resident_memory_bytes / process_virtual_memory_max_bytes) * 100
)

# Se P95 = 68%, threshold ideal = 68 * 1.2 = 81.6% ≈ 82%
```

**Atualizar**:
```yaml
- alert: HighMemoryUsage
  expr: avg(process_resident_memory_bytes / process_virtual_memory_max_bytes) * 100 > 82
  for: 5m
```

**Atenção**: Memory leaks crescem gradualmente! Considerar:
- Adicionar alerta de **tendência** (crescimento >5% por hora)
- Alert de "Memory crescendo rápido" separado

### Latency P95

**Threshold padrão**: 2000ms (2s)

**Como calibrar**:

```promql
# P95 latency (últimos 7 dias)
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
) * 1000

# Se P95 = 850ms, threshold = 850 * 1.5 = 1275ms ≈ 1300ms
```

**Latency por endpoint**:
```promql
# Alguns endpoints são naturalmente mais lentos (ex: relatórios)
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket{endpoint="/api/reports"}[5m])
) * 1000

# Criar alert específico se necessário
```

**Atualizar**:
```yaml
- alert: HighLatencyP95
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000 > 1300
  for: 3m
```

### Latency P99

**Threshold padrão**: 5000ms (5s)

**Como calibrar**:

```promql
# P99 latency
histogram_quantile(0.99, 
  rate(http_request_duration_seconds_bucket[5m])
) * 1000

# Se P99 = 2100ms, threshold = 2100 * 1.5 = 3150ms ≈ 3200ms
```

**P99 é volátil!** Considerar:
- Duração (`for: 5m`) maior para evitar flapping
- Usar `avg_over_time` para suavizar picos

```yaml
- alert: HighLatencyP99
  expr: avg_over_time(histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) * 1000[10m]) > 3200
  for: 5m  # Mais tolerante
```

### Error Rate

**Threshold padrão**: 5% de erros 5xx

**Como calibrar**:

```promql
# Error rate médio (últimos 7 dias)
sum(rate(http_requests_total{status=~"5.."}[5m])) 
/ 
sum(rate(http_requests_total[5m])) * 100

# Se média = 0.8%, threshold = 0.8 * 3 = 2.4% ≈ 2.5%
```

**Atenção**: Error rate pode ser **zero** em apps saudáveis!
- Se P95 < 1%: threshold = 2-3%
- Se P95 = 1-5%: threshold = 5-8%
- Se P95 > 5%: **problema sistêmico, não é threshold!**

```yaml
- alert: HighHTTPErrorRate
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 2.5
  for: 2m
```

### Database Queries

**Threshold padrão**: 1000ms (1s)

**Como calibrar**:

```promql
# Query duration P95
histogram_quantile(0.95, 
  rate(database_query_duration_seconds_bucket[5m])
) * 1000

# Se P95 = 320ms, threshold = 320 * 2 = 640ms
```

**Por tipo de query**:
```promql
# SELECT vs INSERT vs UPDATE têm perfis diferentes
histogram_quantile(0.95, 
  rate(database_query_duration_seconds_bucket{operation="SELECT"}[5m])
) * 1000
```

```yaml
- alert: SlowDatabaseQueries
  expr: histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m])) * 1000 > 640
  for: 5m
```

### Disk Space

**Threshold padrão**: 90% usage

**Como calibrar**:

```promql
# Disk usage atual
(node_filesystem_size_bytes - node_filesystem_free_bytes) 
/ 
node_filesystem_size_bytes * 100

# Taxa de crescimento (GB por dia)
rate(node_filesystem_size_bytes - node_filesystem_free_bytes[24h]) / 1024^3
```

**Estratégia**:
- Alert 1: **Warning** aos 85% (tempo para reagir)
- Alert 2: **Critical** aos 95% (urgente!)
- Considerar: **Dias até cheio** baseado em taxa de crescimento

```yaml
- alert: DiskSpaceRunningOut
  expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 85
  for: 5m
  labels:
    severity: warning

- alert: DiskSpaceCritical
  expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 95
  for: 1m
  labels:
    severity: critical
```

---

## 📈 Calibração por Ambiente

### Development

**Filosofia**: Tolerante, foco em detecção de problemas graves

```yaml
CPU: > 90% por 10min
Memory: > 90% por 10min
Latency P95: > 5000ms
Error Rate: > 10%
```

### Staging

**Filosofia**: Equilibrado, simular produção mas com mais margem

```yaml
CPU: > 80% por 5min
Memory: > 85% por 5min
Latency P95: > 2000ms
Error Rate: > 5%
```

### Production

**Filosofia**: Sensível, detecção precoce mas evitar falsos positivos

```yaml
CPU: > 75% por 3min
Memory: > 80% por 3min
Latency P95: > 1500ms
Error Rate: > 2%
```

---

## 🧪 Testar Thresholds Ajustados

### Método: Shadow Alerting

**Ideia**: Criar versão "shadow" do alerta com novo threshold, marcar como `severity: info` e monitorar por 1 semana.

```yaml
# Alert original (produção)
- alert: HighCPUUsage
  expr: avg(rate(process_cpu_seconds_total[5m])) * 100 > 80
  for: 5m
  labels:
    severity: warning

# Alert shadow (teste)
- alert: HighCPUUsage_Shadow
  expr: avg(rate(process_cpu_seconds_total[5m])) * 100 > 75
  for: 5m
  labels:
    severity: info
    shadow: "true"
  annotations:
    summary: "🧪 Shadow alert: testando threshold 75% (era 80%)"
```

**Análise após 1 semana**:
- Quantos alertas shadow dispararam?
- Quantos foram legítimos (problema real)?
- Taxa de falsos positivos < 10%? → Threshold OK
- Taxa de falsos positivos > 20%? → Threshold agressivo demais

---

## 📊 Dashboard de Calibração

Criar dashboard no Grafana para monitorar efetividade:

**Painel 1: Alerts Disparados vs Problemas Reais**
```
(Firing Alerts / Total Alerts) * 100
```

**Painel 2: Falsos Positivos**
```
count(ALERTS{severity="warning"}) - count(incidents_confirmed)
```

**Painel 3: Threshold vs Métrica Real**
- Linha 1: CPU threshold (80%)
- Linha 2: CPU P95 real (62%)
- Área entre linhas = Margem de segurança

**Painel 4: Distribuição de Valores**
- Histograma mostrando onde métricas ficam
- Threshold como linha vertical
- Idealmente: >95% dos valores abaixo do threshold

---

## 🎯 Critérios de Sucesso

### Threshold Bem Calibrado

✅ **Taxa de falsos positivos < 10%**  
✅ **Tempo de detecção < 2min (MTTD)**  
✅ **Zero falsos negativos** (problema real não detectado)  
✅ **Respeita variação sazonal** (não alerta em picos esperados)  
✅ **Margem de segurança de 15-20%** acima do P95 normal  

### Sinais de Threshold Ruim

❌ **Falsos positivos > 30%** → Muito sensível  
❌ **MTTD > 5min** → Pouco sensível  
❌ **Alertas todo dia no mesmo horário** → Ignorando padrão sazonal  
❌ **Equipe ignorando alertas** → Fadiga de alerta  

---

## 🔄 Processo de Melhoria Contínua

### Revisão Semanal (15min)

1. Quantos alertas dispararam esta semana?
2. Quantos foram falsos positivos?
3. Houve problemas não detectados?
4. Algum threshold precisa ajuste?

### Revisão Mensal (1h)

1. Analisar tendências (métricas subindo/descendo?)
2. Recalcular P95/P99 com dados de 30 dias
3. Ajustar thresholds se necessário
4. Atualizar runbooks com novos aprendizados
5. Revisar SLO targets

### Pós-Incidente

Após cada incidente, perguntar:
- **Alert disparou a tempo?** Se não → Threshold menos sensível
- **Houve falso alarme?** Se sim → Threshold mais tolerante
- **Causa raiz coberta por alert?** Se não → Criar novo alert

---

## 📝 Template de Ajuste

```yaml
# observability/threshold-adjustments.md

## [Data] - Ajuste de Threshold

### Métrica: [Nome]
**Threshold anterior**: [Valor]  
**Threshold novo**: [Valor]  
**Motivo**: [Falsos positivos / Detecção tardia / Padrão sazonal]

### Análise
- P50 últimos 30d: [Valor]
- P95 últimos 30d: [Valor]
- P99 últimos 30d: [Valor]
- Falsos positivos anterior: [N] alertas/semana
- Problemas não detectados: [N] incidentes

### Expectativa
- Reduzir falsos positivos em [X]%
- Manter MTTD < 2min
- Revisar em [Data + 1 semana]

### Resultado (preencher após 1 semana)
- [ ] Falsos positivos reduziram?
- [ ] MTTD mantido?
- [ ] Sem falsos negativos?
- [ ] Decisão: Manter / Ajustar novamente / Reverter
```

---

## 🚀 Quick Wins

**Ajustes rápidos que geram grande impacto**:

1. **Adicionar `for: 5m`** em todos os alerts → Reduz flapping
2. **Usar `avg_over_time[10m]`** em métricas voláteis → Suaviza picos
3. **Criar alertas por horário** (business hours vs off-hours) → Respeita sazonalidade
4. **Agrupar alertas relacionados** → Evita spam (ex: APIDown inibe HighLatency)
5. **Silenciar manutenções programadas** → Zero falsos positivos durante deploy

---

**Thresholds calibrados = Alertas confiáveis = Equipe feliz** 🎯
