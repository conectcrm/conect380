# 📧 Setup de Notificações - Alerting ConectCRM

**Objetivo**: Configurar notificações reais para Slack, Email e outros canais.  
**Tempo estimado**: 30-45 minutos  

---

## 📋 Pré-requisitos

- ✅ Alertmanager rodando (Week 9 completo)
- ✅ Acesso admin ao Slack workspace
- ✅ Conta SMTP para envio de emails (Gmail recomendado)
- ⚠️ (Opcional) Conta PagerDuty para escalação automática

---

## 1️⃣ Configurar Slack Webhooks

### Passo 1: Criar Canais no Slack

Crie os seguintes canais (se não existirem):

```
#alerts-critical  → Alertas críticos (APIDown, DatabaseDown)
#alerts-warning   → Alertas de warning (HighCPU, SlowQueries)
#alerts-slo       → Alertas de SLO (SLOViolation, ErrorBudget)
#alerts-info      → Alertas informativos (QueueSize, etc)
#incidents        → Canal para comunicação durante incidentes
```

**Configurações recomendadas**:
- 🔔 Notificações: Ativar para #alerts-critical
- 📌 Pin: Mensagem com link para runbooks
- 👥 Membros: Adicionar equipe on-call

### Passo 2: Criar Incoming Webhooks

Para **cada canal**:

1. Acesse: https://api.slack.com/apps
2. Clique **"Create New App"** → **"From scratch"**
3. Nome: `ConectCRM Alerting`
4. Workspace: Seu workspace
5. No menu lateral: **Incoming Webhooks**
6. Ativar **"Activate Incoming Webhooks"**
7. Clique **"Add New Webhook to Workspace"**
8. Selecione o canal (ex: #alerts-critical)
9. Copie a **Webhook URL** (ex: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)
10. Repita para os outros 3 canais

**Você terá 4 URLs diferentes**:
```
SLACK_WEBHOOK_CRITICAL=https://hooks.slack.com/services/T.../B.../XXX (para #alerts-critical)
SLACK_WEBHOOK_WARNING=https://hooks.slack.com/services/T.../B.../YYY  (para #alerts-warning)
SLACK_WEBHOOK_SLO=https://hooks.slack.com/services/T.../B.../ZZZ      (para #alerts-slo)
SLACK_WEBHOOK_INFO=https://hooks.slack.com/services/T.../B.../WWW     (para #alerts-info)
```

### Passo 3: Testar Webhook

```powershell
# Testar webhook do canal critical
$body = @{
    text = "🧪 Teste de integração Alertmanager → Slack"
    channel = "#alerts-critical"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

✅ **Sucesso**: Mensagem aparece no canal  
❌ **Erro**: Verificar URL, permissões do app

---

## 2️⃣ Configurar SMTP para Email

### Opção A: Gmail (Recomendado para testes)

#### Passo 1: Criar App Password

1. Acesse: https://myaccount.google.com/security
2. Ativar **"2-Step Verification"** (se não estiver)
3. Acesse: https://myaccount.google.com/apppasswords
4. Selecione:
   - App: **Mail**
   - Device: **Other** (digite "ConectCRM Alerting")
5. Clique **Generate**
6. Copie a senha de 16 dígitos (ex: `abcd efgh ijkl mnop`)

#### Passo 2: Configurar variáveis

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop  # App Password (sem espaços)
SMTP_FROM=ConectCRM Alerts <seu-email@gmail.com>
SMTP_TO=oncall@empresa.com,sre@empresa.com
```

### Opção B: SendGrid (Recomendado para produção)

1. Acesse: https://sendgrid.com/
2. Crie conta (Free tier: 100 emails/dia)
3. Settings → API Keys → Create API Key
4. Copie a API Key

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=<SENDGRID_API_KEY>
SMTP_FROM=alerts@conectcrm.com
SMTP_TO=oncall@conectcrm.com
```

### Opção C: SMTP Corporativo

Consulte equipe de TI para obter:
- SMTP Host (ex: `smtp.office365.com`, `smtp.empresa.com`)
- Porta (geralmente 587 ou 465)
- Credenciais de autenticação

### Testar SMTP

```powershell
# Testar envio de email via PowerShell
$credentials = New-Object System.Management.Automation.PSCredential(
    "seu-email@gmail.com",
    (ConvertTo-SecureString "abcdefghijklmnop" -AsPlainText -Force)
)

Send-MailMessage `
    -To "oncall@empresa.com" `
    -From "alerts@conectcrm.com" `
    -Subject "🧪 Teste Alertmanager SMTP" `
    -Body "Configuração SMTP funcionando!" `
    -SmtpServer "smtp.gmail.com" `
    -Port 587 `
    -UseSsl `
    -Credential $credentials
```

✅ **Sucesso**: Email recebido  
❌ **Erro comum**: "Less secure app" → Usar App Password

---

## 3️⃣ Atualizar Alertmanager Config

### Passo 1: Editar alertmanager-test.yml

Substitua os placeholders pelas URLs reais:

```yaml
# Antes (linha 75)
api_url: '{{ if .ExternalURL }}{{ .ExternalURL }}{{ else }}https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK{{ end }}'

# Depois (usar sua URL real)
api_url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX'
```

**OU** usar variáveis de ambiente (melhor prática):

```yaml
# Usar template Go no alertmanager-test.yml
api_url: '{{ env "SLACK_WEBHOOK_CRITICAL" }}'
```

E adicionar no docker-compose.yml:

```yaml
alertmanager:
  environment:
    - SLACK_WEBHOOK_CRITICAL=${SLACK_WEBHOOK_CRITICAL}
    - SLACK_WEBHOOK_WARNING=${SLACK_WEBHOOK_WARNING}
    - SLACK_WEBHOOK_SLO=${SLACK_WEBHOOK_SLO}
```

### Passo 2: Descomentar Email Config

No arquivo `alertmanager-test.yml`, localize seção email (linha ~120):

```yaml
# Email (descomentar para ativar)
# email_configs:
#   - to: 'oncall@conectcrm.com'
#     from: 'alerts@conectcrm.com'
#     smarthost: 'smtp.gmail.com:587'
#     auth_username: 'alerts@conectcrm.com'
#     auth_password: 'your-app-password'
#     require_tls: true
```

**Descomente** e preencha com valores reais:

```yaml
email_configs:
  - to: '{{ env "SMTP_TO" }}'
    from: '{{ env "SMTP_FROM" }}'
    smarthost: '{{ env "SMTP_HOST" }}:{{ env "SMTP_PORT" }}'
    auth_username: '{{ env "SMTP_USERNAME" }}'
    auth_password: '{{ env "SMTP_PASSWORD" }}'
    require_tls: true
    headers:
      Subject: '🚨 [{{ .Status | toUpper }}] {{ .GroupLabels.alertname }}'
```

### Passo 3: Recarregar Alertmanager

```powershell
# Recarregar config sem restart
docker exec conectsuite-alertmanager kill -HUP 1

# Verificar se carregou sem erros
docker logs conectsuite-alertmanager --tail 20
```

✅ Sucesso: `Completed loading of configuration file`  
❌ Erro: `error loading config` → verificar sintaxe YAML

---

## 4️⃣ Testar Notificações End-to-End

### Teste 1: Alerta Manual via Prometheus

```powershell
# Simular alerta crítico via Prometheus
$alert = @{
    labels = @{
        alertname = "TestAlert"
        severity = "critical"
    }
    annotations = @{
        summary = "Teste de notificação"
        description = "Validando integração Slack + Email"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
    -Uri "http://localhost:9093/api/v1/alerts" `
    -Method Post `
    -Body "[$alert]" `
    -ContentType "application/json"
```

### Teste 2: Parar Backend (Alerta Real)

```powershell
# Parar backend para disparar APIDown
docker-compose stop backend

# Aguardar 2 minutos
Start-Sleep -Seconds 120

# Verificar se alerta disparou
Invoke-RestMethod "http://localhost:9090/api/v1/alerts" | 
    ConvertFrom-Json | 
    Select-Object -ExpandProperty data | 
    Select-Object -ExpandProperty alerts |
    Where-Object { $_.labels.alertname -eq "APIDown" }
```

**Esperado**:
- ✅ Mensagem no Slack #alerts-critical
- ✅ Email recebido em oncall@empresa.com
- ✅ Alerta visível no Alertmanager (http://localhost:9093)

### Teste 3: Verificar Formato da Mensagem

Mensagem Slack deve aparecer como:

```
🚨 [CRITICAL] APIDown

Alert: APIDown
Severity: critical
Summary: API ConectCRM está fora do ar
Description: A instância localhost:3001 não está respondendo
Runbook: observability/RUNBOOKS.md#apidown
Status: firing
```

Email deve ter:

```
Subject: 🚨 [FIRING] APIDown

Alert: APIDown
Severity: critical
Component: api
Started At: 2025-11-17T23:45:00Z

Summary:
API ConectCRM está fora do ar

Description:
A instância localhost:3001 não está respondendo há 1 minuto

Runbook:
observability/RUNBOOKS.md#apidown

Prometheus Query: up{job="conectcrm-backend"} == 0
```

---

## 5️⃣ (Opcional) Configurar PagerDuty

Para escalação automática e gestão de on-call.

### Passo 1: Criar Service no PagerDuty

1. Acesse: https://app.pagerduty.com
2. Services → New Service
3. Nome: `ConectCRM Production`
4. Escalation Policy: Criar ou selecionar existente
5. Em **Integrations**: Add → **Events API v2**
6. Copiar **Integration Key** (ex: `R0XXXXXXXXXXXXXXXXXXXXXX`)

### Passo 2: Adicionar ao Alertmanager

```yaml
# Em alertmanager-test.yml, adicionar receiver:
- name: 'pagerduty'
  pagerduty_configs:
    - service_key: '{{ env "PAGERDUTY_SERVICE_KEY" }}'
      description: '{{ .CommonAnnotations.summary }}'
      severity: '{{ .CommonLabels.severity }}'
      details:
        alert: '{{ .GroupLabels.alertname }}'
        description: '{{ .CommonAnnotations.description }}'
        runbook: '{{ .CommonAnnotations.runbook }}'
```

### Passo 3: Ajustar Routing

```yaml
# Para alertas críticos, enviar também para PagerDuty
- match:
    severity: critical
  receiver: critical-alerts
  continue: true  # Continuar para próximo match
  
- match:
    severity: critical
  receiver: pagerduty
```

---

## 6️⃣ Validação Final

### Checklist de Setup Completo

- [ ] 4 canais Slack criados
- [ ] 4 webhooks Slack configurados e testados
- [ ] SMTP configurado (Gmail App Password OU SendGrid)
- [ ] Email de teste enviado e recebido
- [ ] Variáveis de ambiente adicionadas em .env
- [ ] alertmanager-test.yml atualizado com URLs reais
- [ ] Alertmanager recarregado sem erros
- [ ] Teste end-to-end realizado (backend parado → alerta → notificação)
- [ ] Mensagem Slack formatada corretamente
- [ ] Email recebido com formato correto
- [ ] (Opcional) PagerDuty configurado e testado

### Teste Completo de Integração

```powershell
# Script de validação completa
Write-Host "🧪 VALIDAÇÃO DE NOTIFICAÇÕES" -ForegroundColor Cyan
Write-Host "========================================`n"

# 1. Testar Slack
Write-Host "1. Testando Slack webhooks..." -ForegroundColor Yellow
# [executar testes Slack]

# 2. Testar SMTP
Write-Host "2. Testando SMTP..." -ForegroundColor Yellow
# [executar teste email]

# 3. Disparar alerta real
Write-Host "3. Disparando alerta real..." -ForegroundColor Yellow
docker-compose stop backend
Start-Sleep -Seconds 90

# 4. Verificar recebimento
Write-Host "4. Verificar:" -ForegroundColor Green
Write-Host "   [ ] Mensagem em #alerts-critical"
Write-Host "   [ ] Email recebido"
Write-Host "   [ ] Alerta visível no Alertmanager"

# 5. Restaurar backend
docker-compose start backend
Write-Host "`n✅ Validação completa!" -ForegroundColor Green
```

---

## 🚨 Troubleshooting

### Problema: Slack não recebe mensagens

**Sintomas**: Alertmanager mostra "sent successfully", mas nada no Slack

**Soluções**:
1. Verificar URL do webhook (copiar/colar novamente)
2. Testar webhook diretamente com curl/PowerShell
3. Verificar permissões do app no workspace
4. Checar se canal existe e bot tem acesso

### Problema: Email não chega

**Sintomas**: SMTP timeout ou authentication failed

**Soluções**:
1. **Gmail**: Usar App Password, não senha normal
2. Verificar 2FA está ativo
3. Permitir "Less secure apps" (não recomendado)
4. Testar porta 465 em vez de 587
5. Verificar firewall bloqueando SMTP

### Problema: Formato de mensagem quebrado

**Sintomas**: Mensagem aparece mas sem formatação

**Soluções**:
1. Verificar sintaxe do template Go no YAML
2. Checar indentação (YAML é sensível)
3. Escapar caracteres especiais (usar aspas simples)
4. Testar template com `amtool template check`

### Problema: Alertmanager não recarrega config

**Sintomas**: Mudanças não aplicadas após SIGHUP

**Soluções**:
```powershell
# Ver logs de erro
docker logs conectsuite-alertmanager --tail 50

# Validar sintaxe YAML
docker exec conectsuite-alertmanager amtool check-config /etc/alertmanager/config.yml

# Último recurso: restart
docker-compose restart alertmanager
```

---

## 📚 Referências

- Alertmanager Config: https://prometheus.io/docs/alerting/latest/configuration/
- Slack Incoming Webhooks: https://api.slack.com/messaging/webhooks
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- PagerDuty Integration: https://support.pagerduty.com/docs/services-and-integrations

---

**Setup completo! Sistema pronto para notificar em produção** 🎉
