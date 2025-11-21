<#
.SYNOPSIS
    Configura renovação automática de certificados SSL Let's Encrypt

.DESCRIPTION
    Este script configura renovação automática de certificados SSL usando
    Task Scheduler (Windows) ou cron (Linux). Certificados Let's Encrypt
    expiram em 90 dias e devem ser renovados periodicamente.

.PARAMETER Domain
    Domínio do certificado a ser renovado

.PARAMETER Schedule
    Frequência de verificação: Daily, Weekly, Monthly (padrão: Monthly)

.PARAMETER TestRenewal
    Executa teste de renovação sem agendar

.EXAMPLE
    .\setup-ssl-renewal.ps1 -Domain "conectcrm.com.br"

.EXAMPLE
    .\setup-ssl-renewal.ps1 -Domain "conectcrm.com.br" -Schedule Weekly

.EXAMPLE
    .\setup-ssl-renewal.ps1 -Domain "conectcrm.com.br" -TestRenewal

.NOTES
    Author: Equipe ConectCRM
    Date: 03/11/2025
    Version: 1.0.0
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Domain,

  [Parameter(Mandatory = $false)]
  [ValidateSet("Daily", "Weekly", "Monthly")]
  [string]$Schedule = "Monthly",

  [Parameter(Mandatory = $false)]
  [switch]$TestRenewal
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $PSScriptRoot
$ScriptPath = Join-Path $PSScriptRoot "renew-ssl-certificate.ps1"

# ============================================
# FUNÇÕES
# ============================================

function Write-ColorOutput {
  param(
    [string]$Message,
    [string]$Color = "White"
  )
    
  $colorMap = @{
    "Green" = "32"; "Yellow" = "33"; "Red" = "31"
    "Blue" = "34"; "Cyan" = "36"; "White" = "37"
  }
    
  $colorCode = $colorMap[$Color]
  Write-Host "`e[${colorCode}m${Message}`e[0m"
}

function Test-IsLinux {
  return $PSVersionTable.Platform -eq "Unix" -or $PSVersionTable.OS -like "*Linux*"
}

function Test-IsWindows {
  return $PSVersionTable.Platform -eq "Win32NT" -or [System.Environment]::OSVersion.Platform -eq "Win32NT"
}

function New-RenewalScript {
  Write-ColorOutput "📝 Criando script de renovação..." "Yellow"
    
  $renewalScriptContent = @"
<#
.SYNOPSIS
    Renova certificado SSL Let's Encrypt

.DESCRIPTION
    Script executado automaticamente para renovar certificados SSL.
    Criado por: setup-ssl-renewal.ps1
    Data: $(Get-Date -Format "dd/MM/yyyy HH:mm")
#>

`$ErrorActionPreference = "Stop"
`$Domain = "$Domain"
`$ProjectRoot = "$ScriptRoot"
`$CertsPath = Join-Path `$ProjectRoot "certs"
`$LogFile = Join-Path `$ProjectRoot "logs" "ssl-renewal.log"

function Write-Log {
    param([string]`$Message)
    `$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    `$logMessage = "[`$timestamp] `$Message"
    Write-Host `$logMessage
    Add-Content -Path `$LogFile -Value `$logMessage
}

try {
    Write-Log "🔄 Iniciando renovação de certificado SSL para: `$Domain"
    
    # Criar diretório de logs se não existir
    `$logsDir = Split-Path -Parent `$LogFile
    if (-not (Test-Path `$logsDir)) {
        New-Item -ItemType Directory -Path `$logsDir -Force | Out-Null
    }
    
    # Executar renovação
    Write-Log "▶️  Executando certbot renew..."
    
    if (`$PSVersionTable.Platform -eq "Unix" -or `$PSVersionTable.OS -like "*Linux*") {
        # Linux
        sudo certbot renew --quiet --deploy-hook "systemctl restart conectcrm-backend"
    } else {
        # Windows
        certbot renew --quiet
    }
    
    if (`$LASTEXITCODE -eq 0) {
        Write-Log "✅ Renovação verificada com sucesso"
        
        # Copiar certificados atualizados
        if (`$PSVersionTable.Platform -eq "Unix" -or `$PSVersionTable.OS -like "*Linux*") {
            `$letsencryptPath = "/etc/letsencrypt/live/`$Domain"
        } else {
            `$letsencryptPath = "C:\Certbot\live\`$Domain"
        }
        
        if (Test-Path `$letsencryptPath) {
            Write-Log "📋 Copiando certificados atualizados..."
            
            if (`$PSVersionTable.Platform -eq "Unix" -or `$PSVersionTable.OS -like "*Linux*") {
                sudo cp "`$letsencryptPath/fullchain.pem" "`$CertsPath/cert.pem"
                sudo cp "`$letsencryptPath/privkey.pem" "`$CertsPath/key.pem"
                sudo cp "`$letsencryptPath/chain.pem" "`$CertsPath/chain.pem"
            } else {
                Copy-Item -Path "`$letsencryptPath\fullchain.pem" -Destination "`$CertsPath\cert.pem" -Force
                Copy-Item -Path "`$letsencryptPath\privkey.pem" -Destination "`$CertsPath\key.pem" -Force
                Copy-Item -Path "`$letsencryptPath\chain.pem" -Destination "`$CertsPath\chain.pem" -Force
            }
            
            Write-Log "✅ Certificados atualizados"
        }
        
        # Reiniciar backend (se estiver rodando)
        Write-Log "🔄 Verificando se backend precisa ser reiniciado..."
        
        `$backendProcess = Get-Process -Name node -ErrorAction SilentlyContinue | 
            Where-Object { `$_.Path -like "*conectcrm*backend*" }
        
        if (`$backendProcess) {
            Write-Log "⚠️  Backend rodando. Reinício manual recomendado."
            Write-Log "   Execute: cd backend && npm run start:dev"
        }
        
        Write-Log "✅ Renovação concluída com sucesso"
        exit 0
    } else {
        Write-Log "❌ Erro na renovação (Exit code: `$LASTEXITCODE)"
        exit 1
    }
    
} catch {
    Write-Log "❌ ERRO: `$_"
    exit 1
}
"@
    
  Set-Content -Path $ScriptPath -Value $renewalScriptContent -Encoding UTF8
  Write-ColorOutput "✅ Script de renovação criado: $ScriptPath" "Green"
}

function Test-RenewalDryRun {
  Write-ColorOutput "`n🧪 Testando renovação (dry-run)..." "Yellow"
    
  try {
    if (Test-IsLinux) {
      sudo certbot renew --dry-run
    }
    else {
      certbot renew --dry-run
    }
        
    if ($LASTEXITCODE -eq 0) {
      Write-ColorOutput "✅ Teste de renovação bem-sucedido!" "Green"
      Write-ColorOutput "   Certificado pode ser renovado sem problemas" "Cyan"
      return $true
    }
    else {
      Write-ColorOutput "❌ Teste de renovação falhou (Exit code: $LASTEXITCODE)" "Red"
      return $false
    }
  }
  catch {
    Write-ColorOutput "❌ Erro no teste: $_" "Red"
    return $false
  }
}

function New-WindowsScheduledTask {
  param([string]$Domain, [string]$Schedule)
    
  Write-ColorOutput "`n📅 Configurando Task Scheduler (Windows)..." "Yellow"
    
  $taskName = "ConectCRM SSL Renewal"
  $taskDescription = "Renova automaticamente o certificado SSL do ConectCRM usando Let's Encrypt"
    
  # Verificar se task já existe
  $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($existingTask) {
    Write-ColorOutput "⚠️  Task '$taskName' já existe. Removendo..." "Yellow"
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  }
    
  # Definir trigger baseado no schedule
  switch ($Schedule) {
    "Daily" {
      $trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
      Write-ColorOutput "🕐 Agendamento: Diário às 02:00" "Cyan"
    }
    "Weekly" {
      $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2:00AM
      Write-ColorOutput "🕐 Agendamento: Semanal (Domingos às 02:00)" "Cyan"
    }
    "Monthly" {
      $trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
      $trigger.DaysOfMonth = 1
      Write-ColorOutput "🕐 Agendamento: Mensal (Dia 1 às 02:00)" "Cyan"
    }
  }
    
  # Definir ação
  $action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
    
  # Definir configurações
  $settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable
    
  # Criar task
  $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    
  Register-ScheduledTask `
    -TaskName $taskName `
    -Description $taskDescription `
    -Trigger $trigger `
    -Action $action `
    -Settings $settings `
    -Principal $principal
    
  Write-ColorOutput "✅ Task Scheduler configurado!" "Green"
  Write-ColorOutput "`n📋 Para gerenciar a task:" "Cyan"
  Write-ColorOutput "   • Abrir Task Scheduler: taskschd.msc" "White"
  Write-ColorOutput "   • Localizar: Task Scheduler Library > $taskName" "White"
  Write-ColorOutput "   • Testar: Botão direito > Run" "White"
}

function New-LinuxCronJob {
  param([string]$Domain, [string]$Schedule)
    
  Write-ColorOutput "`n📅 Configurando cron job (Linux)..." "Yellow"
    
  # Definir schedule cron
  switch ($Schedule) {
    "Daily" {
      $cronSchedule = "0 2 * * *"
      Write-ColorOutput "🕐 Agendamento: Diário às 02:00" "Cyan"
    }
    "Weekly" {
      $cronSchedule = "0 2 * * 0"
      Write-ColorOutput "🕐 Agendamento: Semanal (Domingos às 02:00)" "Cyan"
    }
    "Monthly" {
      $cronSchedule = "0 2 1 * *"
      Write-ColorOutput "🕐 Agendamento: Mensal (Dia 1 às 02:00)" "Cyan"
    }
  }
    
  $cronCommand = "pwsh -NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
  $cronEntry = "$cronSchedule $cronCommand"
    
  # Adicionar ao crontab
  Write-ColorOutput "📝 Adicionando ao crontab..." "Yellow"
    
  # Verificar se já existe
  $existingCron = sudo crontab -l 2>/dev/null | grep "renew-ssl-certificate.ps1"
    
  if ($existingCron) {
    Write-ColorOutput "⚠️  Cron job já existe. Removendo entrada antiga..." "Yellow"
    sudo crontab -l | grep -v "renew-ssl-certificate.ps1" | sudo crontab -
  }
    
  # Adicionar nova entrada
  (sudo crontab -l 2>/dev/null; echo $cronEntry) | sudo crontab -
    
  Write-ColorOutput "✅ Cron job configurado!" "Green"
  Write-ColorOutput "`n📋 Para gerenciar o cron:" "Cyan"
  Write-ColorOutput "   • Listar jobs: sudo crontab -l" "White"
  Write-ColorOutput "   • Editar: sudo crontab -e" "White"
  Write-ColorOutput "   • Remover: sudo crontab -r" "White"
}

function Show-Summary {
  param([string]$Domain, [string]$Schedule)
    
  Write-ColorOutput "`n═══════════════════════════════════════════════════════" "Cyan"
  Write-ColorOutput "  ✅ RENOVAÇÃO AUTOMÁTICA CONFIGURADA!" "Green"
  Write-ColorOutput "═══════════════════════════════════════════════════════" "Cyan"
    
  Write-ColorOutput "`n📋 RESUMO:`n" "Yellow"
  Write-ColorOutput "Domínio: $Domain" "White"
  Write-ColorOutput "Frequência: $Schedule" "White"
  Write-ColorOutput "Script: $ScriptPath" "White"
  Write-ColorOutput "Logs: $ScriptRoot\logs\ssl-renewal.log`n" "White"
    
  Write-ColorOutput "⏰ QUANDO RENOVAR:" "Yellow"
  Write-ColorOutput "  • Certificados Let's Encrypt expiram em 90 dias" "White"
  Write-ColorOutput "  • Renovação pode ser feita a partir de 30 dias antes" "White"
  Write-ColorOutput "  • O Certbot só renova se necessário (< 30 dias)`n" "White"
    
  Write-ColorOutput "🔍 MONITORAMENTO:" "Yellow"
  Write-ColorOutput "  • Verifique logs regularmente" "White"
  Write-ColorOutput "  • Configure alertas de expiração (opcional)" "White"
  Write-ColorOutput "  • Teste manualmente: .\$ScriptPath`n" "White"
    
  Write-ColorOutput "📧 NOTIFICAÇÕES:" "Yellow"
  Write-ColorOutput "  • Let's Encrypt envia emails de expiração" "White"
  Write-ColorOutput "  • Se receber email, verifique logs de renovação`n" "White"
    
  Write-ColorOutput "═══════════════════════════════════════════════════════`n" "Cyan"
}

# ============================================
# MAIN
# ============================================

try {
  Write-ColorOutput "`n═══════════════════════════════════════════════════════" "Cyan"
  Write-ColorOutput "  🔄 SETUP RENOVAÇÃO AUTOMÁTICA SSL - ConectCRM" "Green"
  Write-ColorOutput "═══════════════════════════════════════════════════════`n" "Cyan"
    
  # Verificar sistema
  if (Test-IsWindows) {
    Write-ColorOutput "💻 Sistema: Windows" "Cyan"
  }
  elseif (Test-IsLinux) {
    Write-ColorOutput "🐧 Sistema: Linux" "Cyan"
  }
  else {
    throw "Sistema operacional não suportado"
  }
    
  Write-ColorOutput "🌐 Domínio: $Domain" "Cyan"
  Write-ColorOutput "📅 Schedule: $Schedule`n" "Cyan"
    
  # Criar script de renovação
  New-RenewalScript
    
  # Se for apenas teste
  if ($TestRenewal) {
    Test-RenewalDryRun
    Write-ColorOutput "`n✅ Teste concluído! Use sem -TestRenewal para agendar." "Green"
    exit 0
  }
    
  # Testar renovação antes de agendar
  Write-ColorOutput "`n🧪 Executando teste de renovação..." "Yellow"
  $testSuccess = Test-RenewalDryRun
    
  if (-not $testSuccess) {
    Write-ColorOutput "`n⚠️  ATENÇÃO: Teste de renovação falhou!" "Yellow"
    Write-ColorOutput "Deseja continuar mesmo assim? (S/N)" "Yellow"
    $confirmation = Read-Host
        
    if ($confirmation -ne "S" -and $confirmation -ne "s") {
      Write-ColorOutput "❌ Operação cancelada" "Red"
      exit 1
    }
  }
    
  # Agendar renovação
  if (Test-IsWindows) {
    New-WindowsScheduledTask -Domain $Domain -Schedule $Schedule
  }
  elseif (Test-IsLinux) {
    New-LinuxCronJob -Domain $Domain -Schedule $Schedule
  }
    
  # Resumo
  Show-Summary -Domain $Domain -Schedule $Schedule
    
  Write-ColorOutput "✅ Configuração concluída com sucesso!" "Green"
  exit 0
    
}
catch {
  Write-ColorOutput "`n❌ ERRO: $_" "Red"
  exit 1
}
