param(
  [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Get-Location
$frontendDir = Join-Path $root 'frontend-web'
$sourceDir = Join-Path $frontendDir 'src'
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

$sourcePatterns = @(
  '/admin/empresas',
  '/admin/system-branding',
  '/admin/sistema',
  '/admin/branding',
  '/nuclei/administracao',
  'components/Billing/Admin'
)

$bundlePatterns = @(
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

$sourceFiles = Get-ChildItem -Path $sourceDir -Include *.ts,*.tsx -File -Recurse |
  Where-Object { $_.FullName -notmatch '[\\/]{1}__tests__[\\/]{1}' }
if (-not $sourceFiles -or $sourceFiles.Count -eq 0) {
  throw "Nenhum arquivo TS/TSX encontrado para scan em: $sourceDir"
}

$bundleFiles = Get-ChildItem -Path $bundleDir -Filter *.js -File -Recurse
if (-not $bundleFiles -or $bundleFiles.Count -eq 0) {
  throw "Nenhum arquivo JS encontrado para scan em: $bundleDir"
}

$violations = New-Object System.Collections.Generic.List[psobject]

foreach ($pattern in $sourcePatterns) {
  foreach ($file in $sourceFiles) {
    $result = Select-String -Path $file.FullName -Pattern $pattern -SimpleMatch
    if ($result) {
      foreach ($item in $result) {
        $violations.Add([pscustomobject]@{
          Surface = 'source'
          Pattern = $pattern
          File = $item.Path
          Line = $item.LineNumber
        })
      }
    }
  }
}

foreach ($pattern in $bundlePatterns) {
  foreach ($file in $bundleFiles) {
    $result = Select-String -Path $file.FullName -Pattern $pattern -SimpleMatch
    if ($result) {
      foreach ($item in $result) {
        $violations.Add([pscustomobject]@{
          Surface = 'bundle'
          Pattern = $pattern
          File = $item.Path
          Line = $item.LineNumber
        })
      }
    }
  }
}

if ($violations.Count -gt 0) {
  Write-Host 'Falha no exposure scan. Padroes sensiveis encontrados em source/bundle:' -ForegroundColor Red
  $violations |
    Sort-Object Surface, Pattern, File, Line |
    Select-Object Surface, Pattern, File, Line |
    Format-Table -AutoSize | Out-Host
  exit 1
}

Write-Host 'Exposure scan concluido sem exposicao de endpoints/rotas guardian/admin em source e bundle.' -ForegroundColor Green
exit 0
