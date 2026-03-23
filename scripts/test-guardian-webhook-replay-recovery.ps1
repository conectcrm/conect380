param(
  [switch]$DryRun = $false,
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/GDN407_WEBHOOK_REPLAY_RECOVERY_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$commands = @(
  'npm --prefix backend run test -- modules/mercado-pago/mercado-pago.service.spec.ts modules/planos/assinatura-due-date-scheduler.service.spec.ts'
)

$startedAt = Get-Date
$status = 'PASS'
$notes = @()
$outputs = @()

if ($DryRun) {
  $notes += 'Dry-run habilitado: execucao real de testes nao realizada.'
} else {
  foreach ($cmd in $commands) {
    Write-Host "[GDN-407] Executando: $cmd" -ForegroundColor Cyan
    $tempStdout = New-TemporaryFile
    $tempStderr = New-TemporaryFile
    try {
      $proc = Start-Process `
        -FilePath 'cmd.exe' `
        -ArgumentList '/d', '/c', $cmd `
        -NoNewWindow `
        -Wait `
        -PassThru `
        -RedirectStandardOutput $tempStdout.FullName `
        -RedirectStandardError $tempStderr.FullName

      $out = @(
        @((Get-Content -Path $tempStdout.FullName -ErrorAction SilentlyContinue)),
        @((Get-Content -Path $tempStderr.FullName -ErrorAction SilentlyContinue))
      )
      $exitCode = $proc.ExitCode
    } finally {
      Remove-Item -Path $tempStdout.FullName, $tempStderr.FullName -ErrorAction SilentlyContinue
    }
    $outputs += @(
      '### Comando',
      $cmd,
      '',
      '### Saida resumida',
      (($out | Out-String).Trim()),
      ''
    )

    if ($exitCode -ne 0) {
      $status = 'FAIL'
      $notes += "Falha na execucao de testes (exitCode=$exitCode)."
      break
    }
  }
}

$finishedAt = Get-Date
$durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)

$md = @()
$md += '# GDN-407 - Webhook replay recovery validation'
$md += ''
$md += "- RunId: $runId"
$md += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$md += "- DuracaoSegundos: $durationSeconds"
$md += "- DryRun: $(if ($DryRun) { 'true' } else { 'false' })"
$md += "- Status: $status"
$md += ''
$md += '## Escopo de validacao'
$md += '- idempotencia de webhook duplicado'
$md += '- reconciliacao de pagamentos por lote/replay'
$md += '- consistencia de transicoes de assinatura em recuperacao'
$md += ''

if ($notes.Count -gt 0) {
  $md += '## Observacoes'
  foreach ($n in $notes) {
    $md += "- $n"
  }
  $md += ''
}

if ($outputs.Count -gt 0) {
  $md += '## Evidencias de execucao'
  $md += ''
  $md += $outputs
}

if ($status -eq 'PASS') {
  $md += '## Resultado'
  $md += '- Validacao de replay/recovery concluida com sucesso.'
} else {
  $md += '## Resultado'
  $md += '- Validacao com falhas. Revisar saida de testes.'
}

$outDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path $outDir)) {
  New-Item -Path $outDir -ItemType Directory -Force | Out-Null
}

Set-Content -Path $OutputFile -Value $md -Encoding UTF8
Write-Host "Relatorio salvo em: $OutputFile"

if ($status -ne 'PASS') {
  exit 1
}

exit 0
