param(
  [string]$BaseUrl = 'http://localhost:3001',
  [string]$Token = '',
  [string]$Email = '',
  [string]$Senha = '',
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$normalizedBaseUrl = $BaseUrl.TrimEnd('/')
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN507_FINANCIAL_CONSISTENCY_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$monitorCsv = "docs/features/evidencias/GDN507_FINANCIAL_MONITOR_$runId.csv"
$monitorSummary = "docs/features/evidencias/GDN507_FINANCIAL_MONITOR_$runId.md"

$startedAt = Get-Date
$status = 'PASS'
$checks = @()
$notes = @()

$monitorArgs = @(
  '-ExecutionPolicy', 'Bypass',
  '-File', 'scripts/monitor-guardian-billing-platform.ps1',
  '-BaseUrl', $normalizedBaseUrl,
  '-MaxCycles', '1',
  '-IntervalSeconds', '1',
  '-OutputCsv', $monitorCsv,
  '-OutputSummary', $monitorSummary
)

if ($DryRun) {
  $monitorArgs += '-DryRun'
} else {
  if (-not [string]::IsNullOrWhiteSpace($Token)) {
    $monitorArgs += @('-Token', $Token)
  } elseif (-not [string]::IsNullOrWhiteSpace($Email) -and -not [string]::IsNullOrWhiteSpace($Senha)) {
    $monitorArgs += @('-Email', $Email, '-Senha', $Senha)
  }
}

Write-Host '[GDN-507] Executando monitor financeiro diario...' -ForegroundColor Cyan
$monitorOutput = & powershell @monitorArgs 2>&1
$monitorExitCode = $LASTEXITCODE

if ($monitorExitCode -ne 0) {
  $status = 'FAIL'
  $notes += "Monitor financeiro retornou exitCode=$monitorExitCode"
} else {
  if (-not (Test-Path -Path $monitorCsv)) {
    $status = 'FAIL'
    $notes += "CSV do monitor nao encontrado: $monitorCsv"
  } else {
    $rows = @()
    try {
      $rows = @(Import-Csv -Path $monitorCsv)
    } catch {
      $status = 'FAIL'
      $notes += "Falha ao ler CSV do monitor: $($_.Exception.Message)"
    }

    if ($status -eq 'PASS') {
      if ($rows.Count -eq 0) {
        $status = 'FAIL'
        $notes += 'Monitor nao gerou linhas de dados para conciliacao.'
      } else {
        $latest = $rows[-1]

        $subscriptionsTotal = [int]$latest.subscriptions_total
        $statusTrial = [int]$latest.status_trial
        $statusActive = [int]$latest.status_active
        $statusPastDue = [int]$latest.status_past_due
        $statusSuspended = [int]$latest.status_suspended
        $statusCanceled = [int]$latest.status_canceled
        $statusUnknown = [int]$latest.status_unknown
        $statusNoSubscription = [int]$latest.status_no_subscription

        $statusSum = $statusTrial + $statusActive + $statusPastDue + $statusSuspended + $statusCanceled + $statusUnknown + $statusNoSubscription
        $paymentFailureIndicators = [int]$latest.payment_failure_indicators
        $expectedPaymentFailureIndicators = $statusPastDue + $statusSuspended

        $dailyTransitionTotal = [int]$latest.daily_transition_total
        $dailySuspendSuccess = [int]$latest.daily_suspend_success
        $dailySuspendError = [int]$latest.daily_suspend_error
        $dailyReactivateSuccess = [int]$latest.daily_reactivate_success
        $dailyReactivateError = [int]$latest.daily_reactivate_error
        $detailedTransitionCount = $dailySuspendSuccess + $dailySuspendError + $dailyReactivateSuccess + $dailyReactivateError

        $checkRows = @(
          [PSCustomObject]@{
            Name = 'subscriptions_total igual a soma dos status'
            Pass = ($subscriptionsTotal -eq $statusSum)
            Detail = "subscriptions_total=$subscriptionsTotal status_sum=$statusSum"
          },
          [PSCustomObject]@{
            Name = 'payment_failure_indicators consistente com past_due+suspended'
            Pass = ($paymentFailureIndicators -eq $expectedPaymentFailureIndicators)
            Detail = "payment_failure_indicators=$paymentFailureIndicators expected=$expectedPaymentFailureIndicators"
          },
          [PSCustomObject]@{
            Name = 'daily_transition_total cobre soma de suspend/reactivate'
            Pass = ($dailyTransitionTotal -ge $detailedTransitionCount)
            Detail = "daily_transition_total=$dailyTransitionTotal detailed_count=$detailedTransitionCount"
          }
        )

        foreach ($row in $checkRows) {
          $checks += $row
          if (-not $row.Pass) {
            $status = 'FAIL'
            $notes += "Falha na conciliacao: $($row.Name)"
          }
        }
      }
    }
  }
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-507 - Daily financial consistency validation'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- DuracaoSegundos: $durationSeconds"
$md += "- BaseUrl: $normalizedBaseUrl"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- Status: $status"
$md += "- MonitorCsv: $monitorCsv"
$md += "- MonitorSummary: $monitorSummary"
$md += ''
$md += '## Checks de consistencia'
if ($checks.Count -eq 0) {
  $md += '- Nenhum check executado.'
} else {
  foreach ($check in $checks) {
    $md += "- [$(if ($check.Pass) { 'PASS' } else { 'FAIL' })] $($check.Name) :: $($check.Detail)"
  }
}
$md += ''

if ($notes.Count -gt 0) {
  $md += '## Observacoes'
  foreach ($note in $notes) {
    $md += "- $note"
  }
  $md += ''
}

if ($monitorOutput) {
  $md += '## Evidencia do monitor'
  $md += ''
  $md += '```text'
  $md += ($monitorOutput | Out-String).Trim()
  $md += '```'
  $md += ''
}

$md += '## Resultado'
if ($status -eq 'PASS') {
  $md += '- Consistencia financeira diaria validada com sucesso.'
} else {
  $md += '- Consistencia financeira diaria com falhas. Revisar checks.'
}

$outDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path -Path $outDir)) {
  New-Item -Path $outDir -ItemType Directory -Force | Out-Null
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($status -ne 'PASS') {
  exit 1
}

exit 0
