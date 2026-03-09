param(
  [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Get-Location
$frontendDir = Join-Path $root 'frontend-web'
$bundleDir = Join-Path $frontendDir 'build/static/js'

if (-not (Test-Path -Path $frontendDir)) {
  throw "Diretorio frontend-web nao encontrado em: $frontendDir"
}

if (-not $SkipBuild) {
  Write-Host 'Executando build do frontend para validacao de exposicao...' -ForegroundColor Cyan
  npm --prefix frontend-web run build | Out-Host
}

if (-not (Test-Path -Path $bundleDir)) {
  throw "Bundle JS nao encontrado em: $bundleDir"
}

$patterns = @(
  '/guardian/',
  '/api/guardian',
  '/guardian/bff',
  '/guardian/empresas',
  '/admin/empresas',
  '/admin/system-branding',
  '/admin/sistema',
  '/admin/branding',
  '/nuclei/administracao'
)

$files = Get-ChildItem -Path $bundleDir -Filter *.js -File -Recurse
if (-not $files -or $files.Count -eq 0) {
  throw "Nenhum arquivo JS encontrado para scan em: $bundleDir"
}

$violations = New-Object System.Collections.Generic.List[psobject]

foreach ($pattern in $patterns) {
  foreach ($file in $files) {
    $result = Select-String -Path $file.FullName -Pattern $pattern -SimpleMatch
    if ($result) {
      foreach ($item in $result) {
        $violations.Add([pscustomobject]@{
          Pattern = $pattern
          File = $item.Path
          Line = $item.LineNumber
        })
      }
    }
  }
}

if ($violations.Count -gt 0) {
  Write-Host 'Falha no exposure scan. Padroes sensiveis encontrados no bundle:' -ForegroundColor Red
  $violations |
    Sort-Object Pattern, File, Line |
    Select-Object Pattern, File, Line |
    Format-Table -AutoSize | Out-Host
  exit 1
}

Write-Host 'Exposure scan concluido sem exposicao de endpoints/rotas guardian/admin no bundle.' -ForegroundColor Green
exit 0

