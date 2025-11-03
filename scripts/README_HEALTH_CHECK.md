# 🏥 Health Check Script - ConectCRM

Script automatizado para verificar a saúde completa do sistema ConectCRM.

## 📋 O Que Verifica

✅ **Backend (NestJS)**
- Porta 3001 acessível
- Endpoint `/health` respondendo
- Status HTTP

✅ **Frontend (React)**
- Porta 3000 acessível
- Servidor respondendo
- Status HTTP

✅ **Database (PostgreSQL)**
- Porta 5432 acessível
- Conexão TCP

✅ **Processos Node.js**
- Quantidade de processos
- Uso de CPU por processo
- Uso de memória por processo
- Tempo de execução

✅ **Recursos do Sistema**
- Uso de CPU total
- Uso de memória (RAM)
- Espaço em disco

## 🚀 Como Usar

### Modo Básico
```powershell
.\scripts\health-check.ps1
```

Saída:
```
═══════════════════════════════════════════════════════════════════
  🏥 HEALTH CHECK - ConectCRM System
═══════════════════════════════════════════════════════════════════
  📅 2025-11-03 14:30:45

  🔧 BACKEND (NestJS)
     ✅ Porta 3001: ONLINE
     ✅ Health endpoint: OK (HTTP 200)

  🎨 FRONTEND (React)
     ✅ Porta 3000: ONLINE
     ✅ HTTP Status: OK (HTTP 200)

  🗄️  DATABASE (PostgreSQL)
     ✅ Porta 5432: ONLINE

  💻 RECURSOS DO SISTEMA
     📊 CPU: 12.34%
     💾 RAM: 8.5 GB / 16.0 GB (53.12%)
     💿 Disco C: 120.5 GB / 250.0 GB (48.2%)

═══════════════════════════════════════════════════════════════════
  ✅ STATUS GERAL: SISTEMA SAUDÁVEL
═══════════════════════════════════════════════════════════════════
```

### Modo Detalhado
```powershell
.\scripts\health-check.ps1 -Detailed
```

Adiciona informações sobre processos Node.js:
```
  🔄 PROCESSOS NODE.JS
     📊 Total de processos: 2
     • PID 12345: CPU 2.50% | RAM 150.25 MB | Runtime 01:23:45
     • PID 67890: CPU 1.20% | RAM 80.50 MB | Runtime 00:45:30
```

### Modo JSON (para integração)
```powershell
.\scripts\health-check.ps1 -Json
```

Retorna JSON estruturado:
```json
{
  "Timestamp": "2025-11-03 14:30:45",
  "Services": {
    "Backend": {
      "Port": true,
      "Health": true,
      "StatusCode": 200
    },
    "Frontend": {
      "Port": true,
      "Health": true,
      "StatusCode": 200
    },
    "Database": {
      "Port": true
    }
  },
  "System": {
    "CPU": 12.34,
    "Memory": {
      "TotalGB": 16.0,
      "UsedGB": 8.5,
      "FreeGB": 7.5,
      "PercentUsed": 53.12
    },
    "Disk": {
      "TotalGB": 250.0,
      "UsedGB": 120.5,
      "FreeGB": 129.5,
      "PercentUsed": 48.2
    }
  },
  "Overall": true
}
```

### Modo Watch (monitoramento contínuo)
```powershell
# Atualiza a cada 30 segundos (padrão)
.\scripts\health-check.ps1 -ContinuousWatch

# Atualiza a cada 10 segundos
.\scripts\health-check.ps1 -ContinuousWatch -WatchInterval 10
```

**Pressione Ctrl+C para parar o monitoramento.**

## 📊 Códigos de Saída

- **0**: Sistema saudável (todos os serviços OK)
- **1**: Problemas detectados (algum serviço com falha)

Útil para scripts de CI/CD:
```powershell
.\scripts\health-check.ps1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy pode prosseguir"
} else {
    Write-Host "❌ Sistema com problemas, deploy cancelado"
    exit 1
}
```

## 🎨 Cores e Indicadores

| Cor | Significado |
|-----|-------------|
| 🟢 Verde | Tudo OK |
| 🟡 Amarelo | Atenção (serviço parcial ou recurso alto) |
| 🔴 Vermelho | Erro crítico |
| 🔵 Azul | Informação |

### Limiares
- **CPU**: <50% OK | 50-80% Atenção | >80% Crítico
- **RAM**: <70% OK | 70-85% Atenção | >85% Crítico
- **Disco**: <70% OK | 70-85% Atenção | >85% Crítico

## 🛠️ Troubleshooting

### Backend aparece OFFLINE
```powershell
# Solução 1: Verificar se está rodando
Get-Process -Name node

# Solução 2: Iniciar backend
cd backend
npm run start:dev
```

### Frontend aparece OFFLINE
```powershell
# Solução 1: Verificar porta
Get-NetTCPConnection -LocalPort 3000

# Solução 2: Iniciar frontend
cd frontend-web
npm start
```

### Database aparece OFFLINE
```powershell
# Solução 1: Verificar containers Docker
docker ps

# Solução 2: Iniciar PostgreSQL
docker-compose up -d postgres

# Solução 3: Verificar se Docker está rodando
Get-Service docker
```

### Script não executa
```powershell
# Erro: "execution policy"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Erro: "cannot be loaded"
Unblock-File .\scripts\health-check.ps1
```

## 🔄 Integração com CI/CD

### GitHub Actions
```yaml
- name: Health Check
  run: |
    pwsh -File scripts/health-check.ps1 -Json > health.json
    if ($LASTEXITCODE -ne 0) { exit 1 }
```

### Monitoramento Contínuo
```powershell
# Criar arquivo de log rotativo
while ($true) {
    .\scripts\health-check.ps1 -Json | 
    Add-Content -Path "logs/health-$(Get-Date -Format 'yyyy-MM-dd').json"
    Start-Sleep -Seconds 300  # A cada 5 minutos
}
```

### Alertas por Email (exemplo)
```powershell
$result = .\scripts\health-check.ps1 -Json | ConvertFrom-Json

if (-not $result.Overall) {
    Send-MailMessage `
        -To "admin@conectcrm.com" `
        -Subject "⚠️ Sistema com problemas" `
        -Body "Verifique o dashboard de monitoramento" `
        -SmtpServer "smtp.exemplo.com"
}
```

## 📝 Exemplos de Uso

### Verificação Rápida Antes de Trabalhar
```powershell
# Verificar se tudo está OK antes de começar dev
.\scripts\health-check.ps1

# Se algo estiver errado, o script mostra soluções
```

### Monitoramento Durante Desenvolvimento
```powershell
# Em um terminal separado, deixar rodando
.\scripts\health-check.ps1 -ContinuousWatch -WatchInterval 15
```

### Validação Pré-Deploy
```powershell
# No script de deploy
Write-Host "🔍 Verificando saúde do sistema..."
.\scripts\health-check.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Sistema não está saudável. Deploy cancelado."
    exit 1
}

Write-Host "✅ Sistema OK. Prosseguindo com deploy..."
# ... resto do deploy
```

### Debug de Problemas
```powershell
# Modo detalhado para debug
.\scripts\health-check.ps1 -Detailed

# Salvar em arquivo para análise
.\scripts\health-check.ps1 -Detailed > debug-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt
```

## 🎯 Benefícios

✅ **Diagnóstico Rápido**: 5 segundos para saber se tudo está OK
✅ **Automatizado**: Não precisa verificar cada serviço manualmente
✅ **CI/CD Ready**: Código de saída permite integração em pipelines
✅ **JSON Output**: Fácil integração com ferramentas de monitoramento
✅ **Soluções Imediatas**: Quando algo falha, mostra comandos para consertar
✅ **Multi-plataforma**: PowerShell funciona no Windows, Linux e macOS

## 📚 Referências

- [TROUBLESHOOTING_GUIDE.md](../TROUBLESHOOTING_GUIDE.md) - Guia completo de troubleshooting
- [ROADMAP_MELHORIAS.md](../ROADMAP_MELHORIAS.md) - Melhorias planejadas
- [Backend Health Endpoint](../backend/src/health/health.controller.ts) - Implementação backend

---

**Última atualização**: 3 de novembro de 2025  
**Versão**: 1.0.0
