# 🏥 Health Check - ConectCRM System
# Verifica a saúde completa do sistema (backend, frontend, database, APIs)

param(
  [switch]$Detailed,      # Mostrar detalhes completos
  [switch]$Json,          # Output em JSON
  [switch]$ContinuousWatch, # Modo watch (atualiza a cada 30s)
  [int]$WatchInterval = 30  # Intervalo de watch em segundos
)

# Configurações
$BackendUrl = "http://localhost:3001"
$FrontendUrl = "http://localhost:3000"
$PostgresHost = "localhost"
$PostgresPort = 5432

# Cores
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"
$ColorInfo = "Cyan"

# Função para testar URL
function Test-Url {
  param([string]$Url, [int]$TimeoutSeconds = 5)
    
  try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSeconds -ErrorAction Stop
    return @{
      Success      = $true
      StatusCode   = $response.StatusCode
      ResponseTime = $response.Headers.'X-Response-Time'
    }
  }
  catch {
    return @{
      Success = $false
      Error   = $_.Exception.Message
    }
  }
}

# Função para testar porta TCP
function Test-TcpPort {
  param([string]$Host, [int]$Port, [int]$TimeoutMs = 1000)
    
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $connect = $client.BeginConnect($Host, $Port, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
        
    if ($wait) {
      $client.EndConnect($connect)
      $client.Close()
      return $true
    }
    else {
      $client.Close()
      return $false
    }
  }
  catch {
    return $false
  }
}

# Função para verificar processos Node
function Get-NodeProcesses {
  return Get-Process -Name node -ErrorAction SilentlyContinue | 
  Select-Object Id, ProcessName, StartTime, 
  @{Name = 'CPU'; Expression = { $_.CPU.ToString("F2") } },
  @{Name = 'Memory(MB)'; Expression = { [math]::Round($_.WorkingSet64 / 1MB, 2) } }
}

# Função para verificar disco
function Get-DiskSpace {
  $drive = Get-PSDrive C
  return @{
    TotalGB     = [math]::Round($drive.Used / 1GB + $drive.Free / 1GB, 2)
    UsedGB      = [math]::Round($drive.Used / 1GB, 2)
    FreeGB      = [math]::Round($drive.Free / 1GB, 2)
    PercentUsed = [math]::Round(($drive.Used / ($drive.Used + $drive.Free)) * 100, 2)
  }
}

# Início do health check
Clear-Host

do {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $results = @{
    Timestamp = $timestamp
    Services  = @{}
    System    = @{}
    Overall   = $true
  }

  if (-not $Json) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
    Write-Host "  🏥 HEALTH CHECK - ConectCRM System" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
    Write-Host "  📅 $timestamp" -ForegroundColor Gray
    Write-Host ""
  }

  # ========================================
  # 1. BACKEND (NestJS)
  # ========================================
  if (-not $Json) {
    Write-Host "  🔧 BACKEND (NestJS)" -ForegroundColor Yellow
  }
    
  $backendHealth = Test-Url -Url "$BackendUrl/health" -TimeoutSeconds 3
  $backendPort = Test-TcpPort -Host "localhost" -Port 3001
    
  $backendStatus = @{
    Port       = $backendPort
    Health     = $backendHealth.Success
    StatusCode = $backendHealth.StatusCode
    Error      = $backendHealth.Error
  }
    
  $results.Services.Backend = $backendStatus
    
  if ($backendHealth.Success) {
    if (-not $Json) {
      Write-Host "     ✅ Porta 3001: " -NoNewline -ForegroundColor $ColorSuccess
      Write-Host "ONLINE" -ForegroundColor $ColorSuccess
      Write-Host "     ✅ Health endpoint: " -NoNewline -ForegroundColor $ColorSuccess
      Write-Host "OK (HTTP $($backendHealth.StatusCode))" -ForegroundColor $ColorSuccess
    }
  }
  else {
    $results.Overall = $false
    if (-not $Json) {
      if ($backendPort) {
        Write-Host "     ⚠️  Porta 3001: " -NoNewline -ForegroundColor $ColorWarning
        Write-Host "ONLINE mas health falhou" -ForegroundColor $ColorWarning
      }
      else {
        Write-Host "     ❌ Porta 3001: " -NoNewline -ForegroundColor $ColorError
        Write-Host "OFFLINE" -ForegroundColor $ColorError
      }
      Write-Host "     ❌ Health endpoint: " -NoNewline -ForegroundColor $ColorError
      Write-Host "FALHOU - $($backendHealth.Error)" -ForegroundColor $ColorError
    }
  }
    
  if (-not $Json) { Write-Host "" }

  # ========================================
  # 2. FRONTEND (React)
  # ========================================
  if (-not $Json) {
    Write-Host "  🎨 FRONTEND (React)" -ForegroundColor Yellow
  }
    
  $frontendHealth = Test-Url -Url $FrontendUrl -TimeoutSeconds 3
  $frontendPort = Test-TcpPort -Host "localhost" -Port 3000
    
  $frontendStatus = @{
    Port       = $frontendPort
    Health     = $frontendHealth.Success
    StatusCode = $frontendHealth.StatusCode
    Error      = $frontendHealth.Error
  }
    
  $results.Services.Frontend = $frontendStatus
    
  if ($frontendHealth.Success) {
    if (-not $Json) {
      Write-Host "     ✅ Porta 3000: " -NoNewline -ForegroundColor $ColorSuccess
      Write-Host "ONLINE" -ForegroundColor $ColorSuccess
      Write-Host "     ✅ HTTP Status: " -NoNewline -ForegroundColor $ColorSuccess
      Write-Host "OK (HTTP $($frontendHealth.StatusCode))" -ForegroundColor $ColorSuccess
    }
  }
  else {
    $results.Overall = $false
    if (-not $Json) {
      if ($frontendPort) {
        Write-Host "     ⚠️  Porta 3000: " -NoNewline -ForegroundColor $ColorWarning
        Write-Host "ONLINE mas HTTP falhou" -ForegroundColor $ColorWarning
      }
      else {
        Write-Host "     ❌ Porta 3000: " -NoNewline -ForegroundColor $ColorError
        Write-Host "OFFLINE" -ForegroundColor $ColorError
      }
      Write-Host "     ❌ HTTP Status: " -NoNewline -ForegroundColor $ColorError
      Write-Host "FALHOU - $($frontendHealth.Error)" -ForegroundColor $ColorError
    }
  }
    
  if (-not $Json) { Write-Host "" }

  # ========================================
  # 3. DATABASE (PostgreSQL)
  # ========================================
  if (-not $Json) {
    Write-Host "  DATABASE (PostgreSQL)" -ForegroundColor Yellow
  }
    
  $postgresPort = Test-TcpPort -Host $PostgresHost -Port $PostgresPort
    
  $databaseStatus = @{
    Port = $postgresPort
  }
    
  $results.Services.Database = $databaseStatus
    
  if ($postgresPort) {
    if (-not $Json) {
      Write-Host "     ✅ Porta 5432: " -NoNewline -ForegroundColor $ColorSuccess
      Write-Host "ONLINE" -ForegroundColor $ColorSuccess
    }
  }
  else {
    $results.Overall = $false
    if (-not $Json) {
      Write-Host "     ❌ Porta 5432: " -NoNewline -ForegroundColor $ColorError
      Write-Host "OFFLINE" -ForegroundColor $ColorError
      Write-Host "     💡 Solução: docker-compose up -d postgres" -ForegroundColor $ColorInfo
    }
  }
    
  if (-not $Json) { Write-Host "" }

  # ========================================
  # 4. PROCESSOS NODE
  # ========================================
  if ($Detailed -and -not $Json) {
    Write-Host "  🔄 PROCESSOS NODE.JS" -ForegroundColor Yellow
        
    $nodeProcesses = Get-NodeProcesses
        
    if ($nodeProcesses) {
      Write-Host "     📊 Total de processos: $($nodeProcesses.Count)" -ForegroundColor $ColorInfo
            
      foreach ($proc in $nodeProcesses) {
        $runtime = (Get-Date) - $proc.StartTime
        Write-Host "     • PID $($proc.Id): " -NoNewline -ForegroundColor Gray
        Write-Host "CPU $($proc.CPU)% | " -NoNewline -ForegroundColor White
        Write-Host "RAM $($proc.'Memory(MB)') MB | " -NoNewline -ForegroundColor White
        Write-Host "Runtime $($runtime.ToString('hh\:mm\:ss'))" -ForegroundColor White
      }
    }
    else {
      Write-Host "     ⚠️  Nenhum processo Node.js rodando" -ForegroundColor $ColorWarning
    }
        
    Write-Host ""
  }

  # ========================================
  # 5. RECURSOS DO SISTEMA
  # ========================================
  if (-not $Json) {
    Write-Host "  💻 RECURSOS DO SISTEMA" -ForegroundColor Yellow
  }
    
  # CPU
  $cpuUsage = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
  $results.System.CPU = [math]::Round($cpuUsage, 2)
    
  if (-not $Json) {
    Write-Host "     📊 CPU: " -NoNewline
    if ($cpuUsage -lt 50) {
      Write-Host "$([math]::Round($cpuUsage, 2))%" -ForegroundColor $ColorSuccess
    }
    elseif ($cpuUsage -lt 80) {
      Write-Host "$([math]::Round($cpuUsage, 2))%" -ForegroundColor $ColorWarning
    }
    else {
      Write-Host "$([math]::Round($cpuUsage, 2))%" -ForegroundColor $ColorError
    }
  }
    
  # Memória
  $totalMemory = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB
  $freeMemory = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB
  $usedMemory = $totalMemory - $freeMemory
  $memoryPercent = ($usedMemory / $totalMemory) * 100
    
  $results.System.Memory = @{
    TotalGB     = [math]::Round($totalMemory, 2)
    UsedGB      = [math]::Round($usedMemory, 2)
    FreeGB      = [math]::Round($freeMemory, 2)
    PercentUsed = [math]::Round($memoryPercent, 2)
  }
    
  if (-not $Json) {
    Write-Host "     💾 RAM: " -NoNewline
    Write-Host "$([math]::Round($usedMemory, 2)) GB / $([math]::Round($totalMemory, 2)) GB " -NoNewline -ForegroundColor White
    if ($memoryPercent -lt 70) {
      Write-Host "($([math]::Round($memoryPercent, 2))%)" -ForegroundColor $ColorSuccess
    }
    elseif ($memoryPercent -lt 85) {
      Write-Host "($([math]::Round($memoryPercent, 2))%)" -ForegroundColor $ColorWarning
    }
    else {
      Write-Host "($([math]::Round($memoryPercent, 2))%)" -ForegroundColor $ColorError
    }
  }
    
  # Disco
  $disk = Get-DiskSpace
  $results.System.Disk = $disk
    
  if (-not $Json) {
    Write-Host "     💿 Disco C: " -NoNewline
    Write-Host "$($disk.UsedGB) GB / $($disk.TotalGB) GB " -NoNewline -ForegroundColor White
    if ($disk.PercentUsed -lt 70) {
      Write-Host "($($disk.PercentUsed)%)" -ForegroundColor $ColorSuccess
    }
    elseif ($disk.PercentUsed -lt 85) {
      Write-Host "($($disk.PercentUsed)%)" -ForegroundColor $ColorWarning
    }
    else {
      Write-Host "($($disk.PercentUsed)%)" -ForegroundColor $ColorError
    }
  }
    
  if (-not $Json) { Write-Host "" }

  # ========================================
  # 6. RESUMO FINAL
  # ========================================
  if (-not $Json) {
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
        
    if ($results.Overall) {
      Write-Host "  ✅ STATUS GERAL: " -NoNewline -ForegroundColor $ColorSuccess
      Write-Host "SISTEMA SAUDÁVEL" -ForegroundColor $ColorSuccess
    }
    else {
      Write-Host "  ⚠️  STATUS GERAL: " -NoNewline -ForegroundColor $ColorError
      Write-Host "PROBLEMAS DETECTADOS" -ForegroundColor $ColorError
      Write-Host ""
      Write-Host "  💡 SOLUÇÕES RÁPIDAS:" -ForegroundColor $ColorInfo
            
      if (-not $backendHealth.Success) {
        Write-Host "     • Backend: cd backend && npm run start:dev" -ForegroundColor Gray
      }
      if (-not $frontendHealth.Success) {
        Write-Host "     • Frontend: cd frontend-web && npm start" -ForegroundColor Gray
      }
      if (-not $postgresPort) {
        Write-Host "     • Database: docker-compose up -d postgres" -ForegroundColor Gray
      }
    }
        
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
    Write-Host ""
  }

  # Output JSON se solicitado
  if ($Json) {
    $results | ConvertTo-Json -Depth 5
  }

  # Watch mode
  if ($ContinuousWatch) {
    if (-not $Json) {
      Write-Host "  🔄 Aguardando $WatchInterval segundos... (Ctrl+C para sair)" -ForegroundColor Gray
    }
    Start-Sleep -Seconds $WatchInterval
    Clear-Host
  }

} while ($ContinuousWatch)

# Retornar código de saída baseado no status
if ($results.Overall) {
  exit 0
}
else {
  exit 1
}
