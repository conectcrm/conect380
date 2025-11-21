# 🚫 Deploy Freeze Automation - Error Budget Scripts

## 📋 Visão Geral

Este conjunto de scripts automatiza a verificação de **error budget** antes de deploys, implementando um **deploy freeze** quando o budget está criticamente baixo.

### 🎯 Objetivo

Prevenir deploys que possam piorar a confiabilidade do sistema quando o error budget já está comprometido.

---

## 📂 Arquivos

### Scripts Linux/macOS (Bash)

```
scripts/
├── check-error-budget.sh       # Script principal - verifica error budget
├── can-deploy.sh               # Wrapper para CI/CD - bloqueia/permite deploy
└── error-budget-status.sh      # CLI tool - exibe status do budget
```

### Scripts Windows (PowerShell)

```
scripts/
└── Check-ErrorBudget.ps1       # Script principal para Windows
```

### Integração CI/CD

```
.github/workflows/
└── deploy-with-error-budget.yml # GitHub Actions workflow
```

---

## 🚀 Uso Rápido

### Verificar Status do Error Budget

**Linux/macOS:**
```bash
cd scripts
bash check-error-budget.sh
```

**Windows (PowerShell):**
```powershell
cd scripts
.\Check-ErrorBudget.ps1
```

### Verificar se Deploy é Permitido

**Linux/macOS:**
```bash
cd scripts
bash can-deploy.sh

# Exit codes:
# 0 = Deploy permitido
# 1 = Deploy bloqueado (warning)
# 2 = Deploy bloqueado (freeze)
# 3 = Deploy bloqueado (budget esgotado)
```

**Windows:**
```powershell
cd scripts
.\Check-ErrorBudget.ps1

# Verificar $LASTEXITCODE para exit code
```

### CLI Tool (Modo Interativo)

**Verificação única:**
```bash
bash error-budget-status.sh
```

**Output JSON:**
```bash
bash error-budget-status.sh --json
```

**Modo Watch (atualização contínua):**
```bash
bash error-budget-status.sh --watch --interval 30
```

---

## 📊 Política de Deploy Freeze

### Estados de Error Budget

| Budget Restante | Status | Deploy Policy | Ação Requerida |
|----------------|--------|---------------|----------------|
| > 80% | ✅ **NORMAL** | Múltiplos deploys/dia permitidos | Review padrão |
| 50-80% | ⚠️ **CAUTION** | Limitar a 1-2 deploys/dia | Extra atenção |
| 20-50% | ⚠️ **WARNING** | Apenas correções de emergência | Review rigoroso |
| < 20% | 🚫 **FREEZE** | Apenas fixes críticos de segurança/disponibilidade | Aprovação CTO obrigatória |
| < 0% | 🚫 **EXHAUSTED** | SLO violado - NO DEPLOYS | Investigação + Aprovação CTO |

### Overrides

**CAUTION/WARNING (50-80% ou 20-50%):**
```bash
export OVERRIDE_DEPLOY=true
bash can-deploy.sh
```

**FREEZE (<20%):**
```bash
# Requer aprovação do CTO + documentação
export OVERRIDE_DEPLOY_FREEZE=true
bash can-deploy.sh

# Ação será logada para auditoria
```

**EXHAUSTED (budget negativo):**
```bash
# ALTO RISCO - Apenas com aprovação explícita do CTO
export OVERRIDE_BUDGET_EXHAUSTED=true
bash can-deploy.sh

# Auditoria obrigatória
```

---

## 🛠️ Configuração

### Variáveis de Ambiente

```bash
# URL do Prometheus
export PROMETHEUS_URL="http://localhost:9090"

# SLO target (availability)
export SLO_TARGET=99.9

# Janela de tempo para cálculo
export TIME_WINDOW="30d"

# Thresholds (percentuais)
export FREEZE_THRESHOLD=20
export WARNING_THRESHOLD=50
export CAUTION_THRESHOLD=80

# Output JSON
export SAVE_JSON=true
export OUTPUT_FILE="/tmp/error-budget-status.json"
```

### Configuração PowerShell

```powershell
# Executar com parâmetros customizados
.\Check-ErrorBudget.ps1 `
    -PrometheusUrl "http://localhost:9090" `
    -SloTarget 99.9 `
    -TimeWindow "30d" `
    -FreezeThreshold 20 `
    -WarningThreshold 50 `
    -CautionThreshold 80 `
    -SaveJson `
    -OutputFile "C:\temp\error-budget-status.json"
```

---

## 🔗 Integração com CI/CD

### GitHub Actions

**Arquivo:** `.github/workflows/deploy-with-error-budget.yml`

**Configuração:**

1. Adicionar secrets no repositório:
   - `PROMETHEUS_URL`: URL do Prometheus
   - `SLACK_WEBHOOK_URL` (opcional): Para notificações

2. O workflow automaticamente:
   - ✅ Verifica error budget antes de build
   - ✅ Bloqueia deploy se budget baixo
   - ✅ Permite override manual (com logging)
   - ✅ Envia notificações para Slack
   - ✅ Comenta em PRs se deploy bloqueado

**Uso:**

```yaml
# Push para main - verificação automática
git push origin main

# Override manual (via GitHub UI)
# Actions → Deploy with Error Budget Check → Run workflow
# Marcar "Override deploy freeze" se necessário
```

### GitLab CI/CD

```yaml
stages:
  - check
  - build
  - deploy

check-error-budget:
  stage: check
  image: curlimages/curl:latest
  before_script:
    - apk add --no-cache bash jq bc
  script:
    - chmod +x scripts/can-deploy.sh scripts/check-error-budget.sh
    - ./scripts/can-deploy.sh
  allow_failure: false
  artifacts:
    paths:
      - /tmp/error-budget-status.json
    expire_in: 1 week

deploy:
  stage: deploy
  needs: [check-error-budget]
  script:
    - echo "Deploying to production..."
  only:
    - main
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    environment {
        PROMETHEUS_URL = 'http://prometheus:9090'
    }
    
    stages {
        stage('Check Error Budget') {
            steps {
                script {
                    sh '''
                        chmod +x scripts/can-deploy.sh scripts/check-error-budget.sh
                        ./scripts/can-deploy.sh
                    '''
                }
            }
        }
        
        stage('Deploy') {
            when {
                expression { currentBuild.result != 'FAILURE' }
            }
            steps {
                sh 'echo "Deploying..."'
            }
        }
    }
    
    post {
        failure {
            slackSend(
                color: 'danger',
                message: "Deploy bloqueado - Error budget baixo"
            )
        }
    }
}
```

---

## 📊 Output JSON

O script gera um JSON com todas as informações:

```json
{
  "timestamp": "2025-11-17T18:15:30Z",
  "error_budget": {
    "remaining_percent": 45.23,
    "status": "WARNING",
    "days_to_exhaustion": "12.5"
  },
  "slo": {
    "target_percent": 99.9,
    "time_window": "30d"
  },
  "thresholds": {
    "freeze": 20,
    "warning": 50,
    "caution": 80
  },
  "deploy_allowed": false
}
```

**Uso:**

```bash
# Salvar JSON
SAVE_JSON=true bash check-error-budget.sh

# Ler com jq
cat /tmp/error-budget-status.json | jq '.error_budget.status'
# Output: "WARNING"

# Verificar se deploy é permitido
cat /tmp/error-budget-status.json | jq '.deploy_allowed'
# Output: false
```

---

## 🔍 Troubleshooting

### Erro: "Prometheus query failed"

**Causa:** Prometheus não está acessível ou query inválida

**Solução:**
```bash
# Testar conectividade
curl http://localhost:9090/api/v1/query?query=up

# Verificar URL do Prometheus
echo $PROMETHEUS_URL

# Verificar se Prometheus está rodando
docker ps | grep prometheus
```

### Erro: "No data returned from Prometheus"

**Causa:** Métricas `http_requests_total` não existem

**Solução:**
```bash
# Verificar se métrica existe no Prometheus
curl -s 'http://localhost:9090/api/v1/query?query=http_requests_total' | jq

# Verificar se backend está exportando métricas
curl http://localhost:3001/metrics | grep http_requests_total
```

### Erro: "command not found: jq"

**Causa:** Dependência faltando

**Solução:**
```bash
# Ubuntu/Debian
sudo apt-get install jq bc curl

# macOS
brew install jq bc

# Alpine (Docker)
apk add --no-cache jq bc curl bash
```

### Deploy bloqueado mesmo com budget alto

**Causa:** Cache de Prometheus ou cálculo incorreto

**Solução:**
```bash
# Verificar cálculo manualmente no Prometheus UI
# http://localhost:9090/graph
# Query: (1 - (sum(rate(http_requests_total{status=~"5.."}[30d])) / sum(rate(http_requests_total[30d])))) * 100

# Forçar recálculo
bash check-error-budget.sh

# Verificar output JSON
cat /tmp/error-budget-status.json | jq '.'
```

---

## 📈 Monitoramento

### Dashboard Grafana

O dashboard de error budget está disponível em:
- **URL:** http://localhost:3002/d/error-budget-slo
- **Arquivo:** `observability/grafana/dashboards/error-budget-dashboard.json`

**Painéis:**
1. **Error Budget Remaining** (gauge) - Status visual do budget
2. **Days Until Exhaustion** (gauge) - Previsão de esgotamento
3. **Error Budget Burn Rate** (timeseries) - Taxa de consumo
4. **SLO Compliance Overview** (table) - Status de todos os SLOs
5. **SLO Compliance History** (timeseries) - Tendência ao longo do tempo
6. **Latency P95 vs SLO** (timeseries) - Latência comparada ao target

### Alertas Prometheus

Criar alerta para error budget baixo:

```yaml
# backend/config/alert-rules.yml
- alert: ErrorBudgetLow
  expr: |
    (1 - (sum(rate(http_requests_total{status=~"5.."}[30d])) / sum(rate(http_requests_total[30d])))) * 100 < 20
  for: 5m
  labels:
    severity: critical
    category: slo
  annotations:
    summary: "Error budget critically low (<20%)"
    description: "Deploy freeze activated. Current budget: {{ $value | humanize }}%"
    runbook: "https://github.com/conectcrm/runbooks/deploy-freeze.md"
```

---

## 🧪 Testes

### Testar Localmente

```bash
# 1. Verificar se Prometheus está rodando
docker-compose ps prometheus

# 2. Verificar se métricas existem
curl http://localhost:3001/metrics | grep http_requests_total

# 3. Executar script
bash scripts/check-error-budget.sh

# 4. Verificar exit code
echo $?
# 0 = Normal/Caution
# 1 = Warning
# 2 = Freeze
# 3 = Exhausted
```

### Simular Deploy Freeze

Para testar o comportamento do deploy freeze sem afetar produção:

```bash
# Opção 1: Ajustar thresholds temporariamente
FREEZE_THRESHOLD=90 bash can-deploy.sh

# Opção 2: Simular erro budget baixo (injetar erros 500)
# Ver: scripts/simulate-errors.sh (criar se necessário)
```

---

## 📚 Documentação Relacionada

- **[Postmortem Template](../backend/docs/postmortem/TEMPLATE_POSTMORTEM.md)** - Template para documentar incidentes
- **[Postmortem Process](../backend/docs/postmortem/POSTMORTEM_PROCESSO.md)** - Processo completo de postmortem
- **[Alert Rules](../backend/config/alert-rules.yml)** - Configuração de alertas
- **[SLO Definitions](../backend/config/slo-definitions.yml)** - Definições de SLOs
- **[Runbook: Deploy Freeze](../backend/docs/runbooks/deploy-freeze.md)** - Procedimentos operacionais

---

## 🤝 Contribuindo

### Adicionar Novo Threshold

1. Editar `check-error-budget.sh`:
```bash
# Adicionar nova variável
CRITICAL_THRESHOLD=10

# Adicionar case no get_exit_code()
get_exit_code() {
    case "$status" in
        CRITICAL) echo 4 ;;  # Nova condição
        ...
    )
}
```

2. Atualizar documentação neste README

3. Atualizar workflow do GitHub Actions

---

## 📞 Suporte

**Problemas ou dúvidas?**

1. Verificar [Troubleshooting](#-troubleshooting)
2. Abrir issue no GitHub
3. Contatar equipe de SRE: #sre-team no Slack

---

**Versão do Documento**: 1.0  
**Última Atualização**: 2025-11-17  
**Responsável**: Equipe SRE / Observability
