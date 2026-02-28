param(
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = 'http://localhost:3001',

  [Parameter(Mandatory = $false)]
  [int]$IntervalSeconds = 300,

  [Parameter(Mandatory = $false)]
  [int]$DurationHours = 48,

  [Parameter(Mandatory = $false)]
  [int]$MaxCycles = 0,

  [Parameter(Mandatory = $false)]
  [string]$EmpresaId = '',

  [Parameter(Mandatory = $false)]
  [string]$BearerToken = '',

  [Parameter(Mandatory = $false)]
  [switch]$SkipMetrics = $false,

  [Parameter(Mandatory = $false)]
  [switch]$SkipAlertas = $false,

  [Parameter(Mandatory = $false)]
  [string]$OutputDir = 'docs/features/evidencias'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if (-not [System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir = Join-Path $repoRoot $OutputDir
}

if (-not (Test-Path $OutputDir)) {
  New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null
}

function Parse-Labels {
  param([string]$LabelText)

  $labels = @{}
  if ([string]::IsNullOrWhiteSpace($LabelText)) {
    return $labels
  }

  $inner = $LabelText.Trim().TrimStart('{').TrimEnd('}')
  if ([string]::IsNullOrWhiteSpace($inner)) {
    return $labels
  }

  foreach ($part in ($inner -split ',')) {
    if ($part -match '^\s*([^=]+)="([^"]*)"\s*$') {
      $labels[$matches[1]] = $matches[2]
    }
  }

  return $labels
}

function Parse-MetricsText {
  param([string]$Text)

  $metrics = @{
    ciclos_success = 0.0
    ciclos_partial = 0.0
    ciclos_fatal_error = 0.0
    ciclos_skipped_concurrent = 0.0
    ultimo_ciclo_timestamp_seconds = $null
    ultimo_ciclo_duracao_segundos = $null
    empresas_processadas_ultimo_ciclo = $null
    empresas_falha_ultimo_ciclo = $null
    totais_gerados = $null
    totais_resolvidos = $null
    totais_ativos = $null
  }

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $metrics
  }

  $pattern = '^(?<name>[a-zA-Z_:][a-zA-Z0-9_:]*)(?<labels>\{[^}]*\})?\s+(?<value>[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)\s*$'

  foreach ($line in ($Text -split "`r?`n")) {
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
      continue
    }

    if ($line -notmatch $pattern) {
      continue
    }

    $name = $matches['name']
    $labelText = $matches['labels']
    $value = [double]$matches['value']
    $labels = Parse-Labels -LabelText $labelText

    switch ($name) {
      'conectcrm_financeiro_alertas_monitor_ciclos_total' {
        $status = $labels['status']
        switch ($status) {
          'success' { $metrics.ciclos_success = $value }
          'partial' { $metrics.ciclos_partial = $value }
          'fatal_error' { $metrics.ciclos_fatal_error = $value }
          'skipped_concurrent' { $metrics.ciclos_skipped_concurrent = $value }
        }
      }
      'conectcrm_financeiro_alertas_monitor_ultimo_ciclo_timestamp_seconds' {
        $metrics.ultimo_ciclo_timestamp_seconds = $value
      }
      'conectcrm_financeiro_alertas_monitor_ultimo_ciclo_duracao_segundos' {
        $metrics.ultimo_ciclo_duracao_segundos = $value
      }
      'conectcrm_financeiro_alertas_monitor_empresas_processadas_ultimo_ciclo' {
        $metrics.empresas_processadas_ultimo_ciclo = $value
      }
      'conectcrm_financeiro_alertas_monitor_empresas_falha_ultimo_ciclo' {
        $metrics.empresas_falha_ultimo_ciclo = $value
      }
      'conectcrm_financeiro_alertas_monitor_totais_ultimo_ciclo' {
        $tipo = $labels['tipo']
        switch ($tipo) {
          'gerados' { $metrics.totais_gerados = $value }
          'resolvidos' { $metrics.totais_resolvidos = $value }
          'ativos' { $metrics.totais_ativos = $value }
        }
      }
    }
  }

  return $metrics
}

function Invoke-HttpGet {
  param(
    [string]$Url,
    [hashtable]$Headers = $null,
    [int]$TimeoutSeconds = 20
  )

  $result = [ordered]@{
    ok = $false
    statusCode = 0
    content = ''
    elapsedMs = 0.0
    error = ''
  }

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -Headers $Headers -TimeoutSec $TimeoutSeconds -UseBasicParsing
    $result.ok = $true
    $result.statusCode = [int]$response.StatusCode
    $result.content = [string]$response.Content
  } catch {
    $result.error = $_.Exception.Message
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      try {
        $result.statusCode = [int]$_.Exception.Response.StatusCode.value__
      } catch {
        $result.statusCode = 0
      }
    }
  } finally {
    $sw.Stop()
    $result.elapsedMs = [Math]::Round($sw.Elapsed.TotalMilliseconds, 2)
  }

  return [PSCustomObject]$result
}

function Count-AlertasByTipo {
  param([array]$Alertas)

  $counts = @{
    total = 0
    critical = 0
    webhook_pagamento_falha = 0
    status_sincronizacao_divergente = 0
    referencia_integracao_invalida = 0
    estorno_falha = 0
  }

  if ($null -eq $Alertas) {
    return $counts
  }

  $counts.total = @($Alertas).Count
  foreach ($item in $Alertas) {
    $tipo = [string]$item.tipo
    $sev = [string]$item.severidade
    if ($sev -eq 'critical') {
      $counts.critical++
    }

    if ($counts.ContainsKey($tipo)) {
      $counts[$tipo]++
    }
  }

  return $counts
}

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$startedAt = Get-Date
$finishBy = $startedAt.AddHours($DurationHours)

$csvFile = Join-Path $OutputDir "MONITORAMENTO_POS_GO_LIVE_48H_$runId.csv"
$summaryFile = Join-Path $OutputDir "MONITORAMENTO_POS_GO_LIVE_48H_$runId.md"

$snapshots = New-Object System.Collections.Generic.List[object]
$anomalies = New-Object System.Collections.Generic.List[object]
$warnings = New-Object System.Collections.Generic.List[string]

$headers = @{}
if (-not [string]::IsNullOrWhiteSpace($BearerToken)) {
  $headers['Authorization'] = "Bearer $BearerToken"
}
if (-not [string]::IsNullOrWhiteSpace($EmpresaId)) {
  $headers['x-empresa-id'] = $EmpresaId
}

if (-not $SkipAlertas) {
  if ([string]::IsNullOrWhiteSpace($BearerToken) -or [string]::IsNullOrWhiteSpace($EmpresaId)) {
    $warnings.Add('Coleta de alertas desabilitada automaticamente: informe -BearerToken e -EmpresaId para monitorar fila de excecoes.')
    $SkipAlertas = $true
  }
}

if ($IntervalSeconds -lt 10) {
  $warnings.Add('Intervalo menor que 10s pode gerar ruido; recomendado >= 60s para janela de 48h.')
}

if ($DurationHours -lt 1 -and $MaxCycles -eq 0) {
  $warnings.Add('DurationHours < 1 sem MaxCycles definido pode encerrar cedo demais.')
}

$previousCounters = $null
$cycle = 0

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' Monitoramento Pos-Go-Live 48h - Fluxo Vendas -> Financeiro' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "BaseUrl: $BaseUrl"
Write-Host "Intervalo: $IntervalSeconds s"
Write-Host "Duracao alvo: $DurationHours h"
if ($MaxCycles -gt 0) {
  Write-Host "MaxCycles: $MaxCycles"
}
Write-Host "Coleta metricas: $(if ($SkipMetrics) { 'nao' } else { 'sim' })"
Write-Host "Coleta alertas: $(if ($SkipAlertas) { 'nao' } else { 'sim' })"
Write-Host ''

while ($true) {
  $now = Get-Date
  if ($now -ge $finishBy) {
    break
  }
  if ($MaxCycles -gt 0 -and $cycle -ge $MaxCycles) {
    break
  }

  $cycle++
  Write-Host "[$($now.ToString('yyyy-MM-dd HH:mm:ss'))] Ciclo $cycle" -ForegroundColor Yellow

  $health = Invoke-HttpGet -Url "$BaseUrl/health"

  $metricsRaw = $null
  $parsedMetrics = Parse-MetricsText -Text ''
  if (-not $SkipMetrics) {
    $metricsRaw = Invoke-HttpGet -Url "$BaseUrl/metrics"
    if ($metricsRaw.ok) {
      $parsedMetrics = Parse-MetricsText -Text $metricsRaw.content
    } else {
      $anomalies.Add([PSCustomObject]@{
        timestampUtc = $now.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        codigo = 'METRICS_UNAVAILABLE'
        detalhe = "Falha em /metrics (status=$($metricsRaw.statusCode)): $($metricsRaw.error)"
      }) | Out-Null
    }
  }

  $alertasResult = $null
  $alertCounts = @{
    total = $null
    critical = $null
    webhook_pagamento_falha = $null
    status_sincronizacao_divergente = $null
    referencia_integracao_invalida = $null
    estorno_falha = $null
  }
  if (-not $SkipAlertas) {
    $alertasResult = Invoke-HttpGet -Url "$BaseUrl/financeiro/alertas-operacionais?status=ativo&limite=200" -Headers $headers
    if ($alertasResult.ok) {
      try {
        $payload = $alertasResult.content | ConvertFrom-Json
        $alertCounts = Count-AlertasByTipo -Alertas $payload
      } catch {
        $anomalies.Add([PSCustomObject]@{
          timestampUtc = $now.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
          codigo = 'ALERTAS_PARSE_ERROR'
          detalhe = "Falha ao converter payload de alertas: $($_.Exception.Message)"
        }) | Out-Null
      }
    } else {
      $anomalies.Add([PSCustomObject]@{
        timestampUtc = $now.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        codigo = 'ALERTAS_UNAVAILABLE'
        detalhe = "Falha em /financeiro/alertas-operacionais (status=$($alertasResult.statusCode)): $($alertasResult.error)"
      }) | Out-Null
    }
  }

  $healthOk = $health.ok
  if (-not $healthOk) {
    $anomalies.Add([PSCustomObject]@{
      timestampUtc = $now.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
      codigo = 'HEALTH_UNAVAILABLE'
      detalhe = "Falha em /health (status=$($health.statusCode)): $($health.error)"
    }) | Out-Null
  }

  $monitorAgeSec = $null
  if ($null -ne $parsedMetrics.ultimo_ciclo_timestamp_seconds) {
    $monitorAgeSec = [Math]::Round(([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() - [double]$parsedMetrics.ultimo_ciclo_timestamp_seconds), 2)
    $staleLimit = ($IntervalSeconds * 2) + 60
    if ($monitorAgeSec -gt $staleLimit) {
      $anomalies.Add([PSCustomObject]@{
        timestampUtc = $now.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        codigo = 'MONITOR_STALE_CYCLE'
        detalhe = "Ultimo ciclo do monitor com idade ${monitorAgeSec}s (limite ${staleLimit}s)."
      }) | Out-Null
    }
  }

  $deltaTotal = $null
  $deltaFailureRatePct = $null
  $totalCiclosAtual =
    [double]$parsedMetrics.ciclos_success +
    [double]$parsedMetrics.ciclos_partial +
    [double]$parsedMetrics.ciclos_fatal_error +
    [double]$parsedMetrics.ciclos_skipped_concurrent
  $totalFalhasAtual = [double]$parsedMetrics.ciclos_partial + [double]$parsedMetrics.ciclos_fatal_error

  if ($null -ne $previousCounters) {
    $deltaTotal = $totalCiclosAtual - $previousCounters.totalCiclos
    $deltaFalhas = $totalFalhasAtual - $previousCounters.totalFalhas
    if ($deltaTotal -gt 0) {
      $deltaFailureRatePct = [Math]::Round(($deltaFalhas / $deltaTotal) * 100, 2)
      if ($deltaFailureRatePct -gt 20) {
        $anomalies.Add([PSCustomObject]@{
          timestampUtc = $now.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
          codigo = 'MONITOR_HIGH_FAILURE_RATE'
          detalhe = "Taxa de falha do monitor no delta do ciclo: ${deltaFailureRatePct}% (limite 20%)."
        }) | Out-Null
      }
    }
  }

  $previousCounters = @{
    totalCiclos = $totalCiclosAtual
    totalFalhas = $totalFalhasAtual
  }

  if ($null -ne $parsedMetrics.empresas_falha_ultimo_ciclo -and [double]$parsedMetrics.empresas_falha_ultimo_ciclo -gt 0) {
    $anomalies.Add([PSCustomObject]@{
      timestampUtc = $now.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
      codigo = 'MONITOR_COMPANIES_FAILURE'
      detalhe = "Empresas com falha no ultimo ciclo: $($parsedMetrics.empresas_falha_ultimo_ciclo)."
    }) | Out-Null
  }

  if ($null -ne $alertCounts.critical -and [int]$alertCounts.critical -gt 0) {
    $anomalies.Add([PSCustomObject]@{
      timestampUtc = $now.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
      codigo = 'ALERTAS_CRITICAL_OPEN'
      detalhe = "Alertas criticos ativos na fila: $($alertCounts.critical)."
    }) | Out-Null
  }

  $snapshots.Add([PSCustomObject]@{
    timestamp_utc = $now.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    ciclo = $cycle
    health_ok = $health.ok
    health_status = $health.statusCode
    health_latency_ms = $health.elapsedMs
    metrics_ok = if ($SkipMetrics) { $null } else { $metricsRaw.ok }
    metrics_status = if ($SkipMetrics) { $null } else { $metricsRaw.statusCode }
    monitor_age_sec = $monitorAgeSec
    monitor_last_duration_sec = $parsedMetrics.ultimo_ciclo_duracao_segundos
    monitor_empresas_falha = $parsedMetrics.empresas_falha_ultimo_ciclo
    ciclos_success = $parsedMetrics.ciclos_success
    ciclos_partial = $parsedMetrics.ciclos_partial
    ciclos_fatal_error = $parsedMetrics.ciclos_fatal_error
    ciclos_skipped_concurrent = $parsedMetrics.ciclos_skipped_concurrent
    delta_ciclos_total = $deltaTotal
    delta_failure_rate_pct = $deltaFailureRatePct
    alertas_total = $alertCounts.total
    alertas_critical = $alertCounts.critical
    alertas_webhook_pagamento_falha = $alertCounts.webhook_pagamento_falha
    alertas_status_sincronizacao_divergente = $alertCounts.status_sincronizacao_divergente
    alertas_referencia_integracao_invalida = $alertCounts.referencia_integracao_invalida
    alertas_estorno_falha = $alertCounts.estorno_falha
  }) | Out-Null

  if (($now.AddSeconds($IntervalSeconds)) -lt $finishBy -and ($MaxCycles -eq 0 -or $cycle -lt $MaxCycles)) {
    Start-Sleep -Seconds $IntervalSeconds
  }
}

$finishedAt = Get-Date

if ($snapshots.Count -gt 0) {
  $snapshots | Export-Csv -Path $csvFile -NoTypeInformation -Encoding UTF8
}

$healthFailures = @($snapshots | Where-Object { -not $_.health_ok }).Count
$metricsFailures = @($snapshots | Where-Object { $_.metrics_ok -eq $false }).Count
$maxMonitorAge = ($snapshots | Measure-Object -Property monitor_age_sec -Maximum).Maximum
$maxFailureRate = ($snapshots | Measure-Object -Property delta_failure_rate_pct -Maximum).Maximum
$maxCriticalAlertas = ($snapshots | Measure-Object -Property alertas_critical -Maximum).Maximum

$md = @()
$md += '# Relatorio de monitoramento pos-go-live (48h) - Fluxo Vendas -> Financeiro'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- BaseUrl: $BaseUrl"
$md += "- Intervalo (s): $IntervalSeconds"
$md += "- Duracao alvo (h): $DurationHours"
$md += "- Ciclos executados: $($snapshots.Count)"
$md += "- Coleta metricas: $(if ($SkipMetrics) { 'nao' } else { 'sim' })"
$md += "- Coleta alertas: $(if ($SkipAlertas) { 'nao' } else { 'sim' })"
$md += "- EmpresaId: $(if ([string]::IsNullOrWhiteSpace($EmpresaId)) { '-' } else { $EmpresaId })"
$md += "- Arquivo de timeline: $($csvFile.Replace($repoRoot + '\', ''))"
$md += ''
$md += '## Resumo tecnico'
$md += ''
$md += "- Falhas de health check: $healthFailures"
$md += "- Falhas de metrics: $metricsFailures"
$md += "- Maior idade do ultimo ciclo monitor (s): $(if ($null -eq $maxMonitorAge) { '-' } else { [Math]::Round([double]$maxMonitorAge, 2) })"
$md += "- Maior taxa de falha no delta (%): $(if ($null -eq $maxFailureRate) { '-' } else { [Math]::Round([double]$maxFailureRate, 2) })"
$md += "- Maior quantidade de alertas criticos ativos: $(if ($null -eq $maxCriticalAlertas) { '-' } else { [int]$maxCriticalAlertas })"
$md += "- Total de anomalias detectadas: $($anomalies.Count)"
$md += ''

if ($warnings.Count -gt 0) {
  $md += '## Avisos de execucao'
  $md += ''
  foreach ($warn in $warnings) {
    $md += "- $warn"
  }
  $md += ''
}

$md += '## Anomalias'
$md += ''
$md += '| Timestamp UTC | Codigo | Detalhe |'
$md += '| --- | --- | --- |'
if ($anomalies.Count -eq 0) {
  $md += '| - | - | Nenhuma anomalia detectada nos criterios monitorados. |'
} else {
  foreach ($item in $anomalies) {
    $md += "| $($item.timestampUtc) | $($item.codigo) | $($item.detalhe) |"
  }
}

$md += ''
$md += '## Conclusao automatica'
$md += ''
if ($anomalies.Count -eq 0) {
  $md += 'Janela monitorada sem anomalias nos checks automatizados deste script.'
} else {
  $md += 'Foram detectadas anomalias. Avaliar triagem usando runbook AP304 e decidir GO/NO-GO operacional.'
}

Set-Content -Path $summaryFile -Value $md -Encoding UTF8

Write-Host ''
Write-Host "Timeline CSV: $csvFile"
Write-Host "Resumo MD:    $summaryFile"
Write-Host "Anomalias:    $($anomalies.Count)"
Write-Host ''

exit 0
