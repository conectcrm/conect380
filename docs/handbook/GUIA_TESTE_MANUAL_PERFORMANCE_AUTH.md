# 🧪 Guia de Teste Manual: Performance e Cache (Com Autenticação)

**Data**: 7 de Novembro de 2025  
**Pré-requisitos**: Backend e Frontend rodando  
**Tempo estimado**: 10-15 minutos  

---

## ⚙️ Preparação

### 1. Verificar se Backend e Frontend estão rodando

```powershell
# Verificar portas
netstat -ano | findstr ":3001 :3000"
```

**Esperado**:
```
TCP    0.0.0.0:3000    ... LISTENING    # Frontend
TCP    0.0.0.0:3001    ... LISTENING    # Backend
```

### 2. Abrir Frontend no Navegador

```
http://localhost:3000
```

---

## 🔐 STEP 1: Autenticar e Obter Token JWT

### 1.1. Fazer Login

1. Acesse: `http://localhost:3000/login`
2. Faça login com suas credenciais
3. Aguarde redirecionamento para dashboard

### 1.2. Obter Token JWT do LocalStorage

1. Abra DevTools (F12)
2. Vá em **Application** → **Local Storage** → `http://localhost:3000`
3. Procure pela chave: `@conectcrm:token` ou `token` ou `authToken`
4. **Copie o valor completo** (geralmente começa com `eyJ...`)

**Exemplo**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

## 📊 STEP 2: Testar Endpoint de Métricas de Performance

### 2.1. Usando PowerShell (Invoke-RestMethod)

```powershell
# Substitua <SEU_TOKEN> pelo token copiado acima
$token = "SEU_TOKEN_AQUI"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$metricas = Invoke-RestMethod -Uri "http://localhost:3001/distribuicao-avancada/metricas-performance" -Method Get -Headers $headers

# Ver resultado
$metricas | ConvertTo-Json -Depth 10
```

### 2.2. Usando cURL (Alternativa)

```bash
curl -X GET http://localhost:3001/distribuicao-avancada/metricas-performance \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

### 2.3. Usando Postman (Alternativa)

1. Abra Postman
2. **GET** `http://localhost:3001/distribuicao-avancada/metricas-performance`
3. Headers:
   - `Authorization`: `Bearer SEU_TOKEN_AQUI`
   - `Content-Type`: `application/json`
4. Send

### 2.4. Resultado Esperado

```json
{
  "success": true,
  "message": "Métricas de performance do service",
  "data": {
    "distribuicoes": {
      "total": 150,
      "sucesso": 148,
      "falha": 2,
      "taxaSucessoPct": 98.67
    },
    "performance": {
      "tempoMedioMs": 52.34,
      "tempoTotalMs": 7746
    },
    "cache": {
      "hits": 120,
      "misses": 30,
      "taxaHitPct": 80.0,
      "configsCacheadas": 5,
      "skillsCacheadas": 12
    }
  }
}
```

---

## 🗑️ STEP 3: Testar Endpoint de Limpar Cache

### 3.1. Usando PowerShell

```powershell
$limparResult = Invoke-RestMethod -Uri "http://localhost:3001/distribuicao-avancada/limpar-cache" -Method Post -Headers $headers

$limparResult | ConvertTo-Json
```

### 3.2. Usando cURL

```bash
curl -X POST http://localhost:3001/distribuicao-avancada/limpar-cache \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 3.3. Resultado Esperado

```json
{
  "success": true,
  "message": "Cache limpo com sucesso"
}
```

---

## 🎨 STEP 4: Visualizar Métricas no Dashboard Frontend

### 4.1. Acessar Dashboard

```
http://localhost:3000/atendimento/dashboard-distribuicao
```

### 4.2. Verificar KPI Cards de Performance

Você deve ver **4 novos cards** (além dos 4 antigos):

**Novos Cards (Performance)**:
1. ✅ **Cache Hit Rate**: Mostra % de cache hit (esperado ~80%)
2. ✅ **Tempo Médio**: Mostra ms médio de distribuição (esperado ~50ms)
3. ✅ **Taxa de Sucesso**: Mostra % de sucesso (esperado ~98%+)
4. ✅ **Items em Cache**: Mostra total de configs + skills cacheados

**Cards Antigos (Métricas de Distribuição)**:
1. Total de Distribuições
2. Últimas 24 Horas
3. Realocações
4. Taxa de Realocação

### 4.3. Atualizar Métricas

1. Clique no botão **"Atualizar"** (canto superior direito)
2. Cards devem recarregar com novos valores
3. Loading state deve aparecer durante carregamento

---

## 🧪 STEP 5: Testar Cache Hit/Miss

### 5.1. Limpar Cache (Estado Inicial)

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/distribuicao-avancada/limpar-cache" -Method Post -Headers $headers
```

### 5.2. Obter Métricas Iniciais

```powershell
$metricasIniciais = Invoke-RestMethod -Uri "http://localhost:3001/distribuicao-avancada/metricas-performance" -Method Get -Headers $headers

Write-Host "Cache Hits: $($metricasIniciais.data.cache.hits)"
Write-Host "Cache Misses: $($metricasIniciais.data.cache.misses)"
```

### 5.3. Criar Ticket (Distribuição 1 - Cache Miss)

1. Acesse: `http://localhost:3000/atendimento/triagem`
2. Crie um novo ticket para uma fila específica
3. Aguarde distribuição automática

**Logs esperados no backend**:
```
❌ Cache miss para configuração da fila fila-123
[DistribuicaoAvancadaService] Configuração encontrada
⏱️ Distribuição concluída em 198ms
```

### 5.4. Criar Outro Ticket (Distribuição 2 - Cache Hit)

1. Crie outro ticket para a **MESMA fila**
2. Aguarde distribuição

**Logs esperados**:
```
✅ Cache hit para configuração da fila fila-123
⏱️ Distribuição concluída em 47ms  ← Muito mais rápido!
```

### 5.5. Verificar Métricas Novamente

```powershell
$metricasFinais = Invoke-RestMethod -Uri "http://localhost:3001/distribuicao-avancada/metricas-performance" -Method Get -Headers $headers

Write-Host "Cache Hits: $($metricasFinais.data.cache.hits)"
Write-Host "Cache Misses: $($metricasFinais.data.cache.misses)"
Write-Host "Cache Hit Rate: $($metricasFinais.data.cache.taxaHitPct)%"
```

**Resultado esperado**:
```
Cache Hits: 1
Cache Misses: 1
Cache Hit Rate: 50%
```

---

## 📊 STEP 6: Validar Cálculos de Métricas

### 6.1. Taxa de Sucesso

```powershell
$metricas = Invoke-RestMethod -Uri "http://localhost:3001/distribuicao-avancada/metricas-performance" -Method Get -Headers $headers

$total = $metricas.data.distribuicoes.total
$sucesso = $metricas.data.distribuicoes.sucesso
$taxaEsperada = ($sucesso / $total) * 100
$taxaReal = $metricas.data.distribuicoes.taxaSucessoPct

Write-Host "Total: $total"
Write-Host "Sucesso: $sucesso"
Write-Host "Taxa Esperada: $taxaEsperada %"
Write-Host "Taxa Real: $taxaReal %"
Write-Host "Match: $($taxaEsperada -eq $taxaReal)"
```

### 6.2. Tempo Médio

```powershell
$tempoTotal = $metricas.data.performance.tempoTotalMs
$tempoMedioEsperado = $tempoTotal / $sucesso
$tempoMedioReal = $metricas.data.performance.tempoMedioMs

Write-Host "Tempo Total: $tempoTotal ms"
Write-Host "Tempo Médio Esperado: $tempoMedioEsperado ms"
Write-Host "Tempo Médio Real: $tempoMedioReal ms"
```

### 6.3. Cache Hit Rate

```powershell
$hits = $metricas.data.cache.hits
$misses = $metricas.data.cache.misses
$totalCache = $hits + $misses
$hitRateEsperado = ($hits / $totalCache) * 100
$hitRateReal = $metricas.data.cache.taxaHitPct

Write-Host "Hits: $hits"
Write-Host "Misses: $misses"
Write-Host "Hit Rate Esperado: $hitRateEsperado %"
Write-Host "Hit Rate Real: $hitRateReal %"
```

---

## 🚀 STEP 7: Testar Performance em Produção

### 7.1. Cenário de Teste de Carga Simples

```powershell
# Limpar cache
Invoke-RestMethod -Uri "http://localhost:3001/distribuicao-avancada/limpar-cache" -Method Post -Headers $headers

# Obter métricas iniciais
$inicio = Invoke-RestMethod -Uri "http://localhost:3001/distribuicao-avancada/metricas-performance" -Method Get -Headers $headers

Write-Host "=== MÉTRICAS INICIAIS ===" -ForegroundColor Cyan
Write-Host "Distribuições Totais: $($inicio.data.distribuicoes.total)"
Write-Host "Cache Hit Rate: $($inicio.data.cache.taxaHitPct)%"
Write-Host "Tempo Médio: $($inicio.data.performance.tempoMedioMs) ms"

# Aguardar 5 minutos de operação normal
Write-Host "`nAguardando 5 minutos de operação normal..." -ForegroundColor Yellow
Start-Sleep -Seconds 300

# Obter métricas finais
$fim = Invoke-RestMethod -Uri "http://localhost:3001/distribuicao-avancada/metricas-performance" -Method Get -Headers $headers

Write-Host "`n=== MÉTRICAS FINAIS ===" -ForegroundColor Cyan
Write-Host "Distribuições Totais: $($fim.data.distribuicoes.total)"
Write-Host "Cache Hit Rate: $($fim.data.cache.taxaHitPct)%"
Write-Host "Tempo Médio: $($fim.data.performance.tempoMedioMs) ms"

# Comparar
$novasDistribuicoes = $fim.data.distribuicoes.total - $inicio.data.distribuicoes.total
Write-Host "`n=== ANÁLISE ===" -ForegroundColor Green
Write-Host "Novas Distribuições: $novasDistribuicoes"
Write-Host "Melhoria no Hit Rate: $($fim.data.cache.taxaHitPct - $inicio.data.cache.taxaHitPct)%"
```

### 7.2. Critérios de Sucesso

| Métrica | Esperado | Status |
|---------|----------|--------|
| **Cache Hit Rate** | >= 70% | ✅ / ❌ |
| **Tempo Médio** | <= 100ms | ✅ / ❌ |
| **Taxa de Sucesso** | >= 95% | ✅ / ❌ |
| **Consistência** | Total = Sucesso + Falha | ✅ / ❌ |

---

## ✅ Checklist de Validação Final

- [ ] Backend está rodando (porta 3001)
- [ ] Frontend está rodando (porta 3000)
- [ ] Login funcionando (token JWT obtido)
- [ ] Endpoint `/metricas-performance` retorna dados corretos
- [ ] Endpoint `/limpar-cache` executa sem erros
- [ ] Dashboard mostra 4 novos KPI cards de performance
- [ ] Cache hit/miss rastreado corretamente
- [ ] Tempo médio é calculado corretamente
- [ ] Taxa de sucesso é calculada corretamente
- [ ] Cache hit rate é calculada corretamente
- [ ] Clicar em "Atualizar" recarrega os cards
- [ ] Logs do backend mostram "Cache hit" e "Cache miss"

---

## 🐛 Troubleshooting

### Problema: 401 Unauthorized

**Causa**: Token JWT expirado ou inválido

**Solução**:
1. Fazer logout e login novamente
2. Obter novo token do localStorage
3. Verificar se token está correto no header Authorization

### Problema: Métricas vazias (todos em 0)

**Causa**: Sistema acabou de iniciar, sem distribuições ainda

**Solução**:
1. Criar alguns tickets manualmente
2. Aguardar distribuições automáticas
3. Reobter métricas

### Problema: Cache hit rate sempre 0%

**Causa**: Cache foi limpo ou TTL expirou

**Solução**:
1. Verificar se distribuições estão usando a mesma fila
2. Verificar se TTL não expirou (5min para configs)
3. Verificar logs do backend para confirmar cache hit/miss

### Problema: Dashboard não mostra novos cards

**Causa**: Frontend não compilou ou cache do browser

**Solução**:
1. Limpar cache do browser (Ctrl + Shift + Delete)
2. Fazer hard refresh (Ctrl + F5)
3. Verificar se frontend compilou: `cd frontend-web && npm run build`

---

## 📚 Documentação Relacionada

- `OTIMIZACOES_PERFORMANCE_DISTRIBUICAO.md` - Detalhamento técnico
- `CONCLUSAO_OTIMIZACOES_PERFORMANCE.md` - Conclusão completa
- `RESUMO_OTIMIZACOES_PERFORMANCE.md` - Resumo executivo

---

**Última atualização**: 7 de Novembro de 2025  
**Tempo estimado**: 10-15 minutos  
**Dificuldade**: Fácil (com token JWT)
