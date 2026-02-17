param(
  [string]$PrBody = $env:PR_BODY
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($PrBody)) {
  Write-Host "PR template guardrails failed:"
  Write-Host " - Pull request body is empty."
  exit 1
}

$body = $PrBody -replace "`r", ""
$issues = @()

function Get-SectionContent {
  param(
    [string]$Text,
    [string]$StartPattern,
    [string]$EndPattern
  )

  $pattern = "(?ms)$StartPattern\s*(?<content>.*?)(?=$EndPattern|\z)"
  $match = [regex]::Match($Text, $pattern)

  if (-not $match.Success) {
    return $null
  }

  return $match.Groups["content"].Value
}

function Count-CheckedItems {
  param(
    [string]$Content
  )

  if ([string]::IsNullOrWhiteSpace($Content)) {
    return 0
  }

  return ([regex]::Matches($Content, "(?im)^\s*-\s*\[[xX]\]\s+")).Count
}

function Count-ChecklistItems {
  param(
    [string]$Content
  )

  if ([string]::IsNullOrWhiteSpace($Content)) {
    return 0
  }

  return ([regex]::Matches($Content, "(?im)^\s*-\s*\[[xX ]\]\s+")).Count
}

function Require-AtLeastOneChecked {
  param(
    [string]$SectionName,
    [string]$SectionContent
  )

  if ($null -eq $SectionContent) {
    $script:issues += "$SectionName section not found."
    return
  }

  if ((Count-CheckedItems -Content $SectionContent) -lt 1) {
    $script:issues += "$SectionName requires at least one checked option."
  }
}

$tipoMudanca = Get-SectionContent -Text $body -StartPattern "^## Tipo de Mudanca" -EndPattern "^## Modulos Afetados"
Require-AtLeastOneChecked -SectionName "Tipo de Mudanca" -SectionContent $tipoMudanca

$modulosAfetados = Get-SectionContent -Text $body -StartPattern "^## Modulos Afetados" -EndPattern "^## Issue Relacionada"
Require-AtLeastOneChecked -SectionName "Modulos Afetados" -SectionContent $modulosAfetados

$issueRelacionada = Get-SectionContent -Text $body -StartPattern "^## Issue Relacionada" -EndPattern "^## Escopo de UX"
if ($null -eq $issueRelacionada) {
  $issues += "Issue Relacionada section not found."
}
else {
  $issueText = $issueRelacionada.Trim()
  if ([string]::IsNullOrWhiteSpace($issueText)) {
    $issues += "Issue Relacionada must be filled (use issue id or N/A)."
  }
  elseif ($issueText -match "<numero-da-issue>") {
    $issues += "Issue Relacionada still contains the placeholder <numero-da-issue>."
  }
}

$classificacaoTela = Get-SectionContent -Text $body -StartPattern "^### Classificacao da tela" -EndPattern "^### Decisao de layout"
Require-AtLeastOneChecked -SectionName "Classificacao da tela" -SectionContent $classificacaoTela

$decisaoLayout = Get-SectionContent -Text $body -StartPattern "^### Decisao de layout" -EndPattern "^### Checklist UX minimo"
Require-AtLeastOneChecked -SectionName "Decisao de layout" -SectionContent $decisaoLayout

$layoutEspecificoSelecionado = $false
if ($null -ne $decisaoLayout) {
  $layoutEspecificoSelecionado = [regex]::IsMatch(
    $decisaoLayout,
    "(?im)^\s*-\s*\[[xX]\]\s+Usei layout especifico por necessidade de fluxo"
  )
}

if ($layoutEspecificoSelecionado) {
  $layoutReasonSection = Get-SectionContent `
    -Text $body `
    -StartPattern "^Se escolheu layout especifico, explique o motivo:" `
    -EndPattern "^### Checklist UX minimo"

  $layoutReason = ""
  if ($null -ne $layoutReasonSection) {
    $layoutReason = [regex]::Replace($layoutReasonSection, "(?ms)<!--.*?-->", "").Trim()
  }

  if ([string]::IsNullOrWhiteSpace($layoutReason)) {
    $issues += "Layout especifico selecionado sem justificativa."
  }
  elseif ($layoutReason.Length -lt 20) {
    $issues += "Justificativa de layout especifico muito curta (minimo 20 caracteres)."
  }
}

$uxChecklist = Get-SectionContent -Text $body -StartPattern "^### Checklist UX minimo" -EndPattern "^## Checklist Tecnico"

$semTelaSelecionado = $false
if ($null -ne $classificacaoTela) {
  $semTelaSelecionado = [regex]::IsMatch(
    $classificacaoTela,
    "(?im)^\s*-\s*\[[xX]\]\s+Nao se aplica \(sem tela\)"
  )
}

$requerUxChecklist = -not $semTelaSelecionado
if ($requerUxChecklist) {
  if ($null -eq $uxChecklist) {
    $issues += "Checklist UX minimo section not found."
  }
  else {
    $uxTotal = Count-ChecklistItems -Content $uxChecklist
    $uxChecked = Count-CheckedItems -Content $uxChecklist

    if ($uxTotal -eq 0) {
      $issues += "Checklist UX minimo has no checklist items."
    }
    elseif ($uxChecked -lt $uxTotal) {
      $issues += "Checklist UX minimo must be fully checked when frontend/tela is in scope."
    }
  }
}

$checklistTecnico = Get-SectionContent -Text $body -StartPattern "^## Checklist Tecnico" -EndPattern "^## Multi-tenant e Seguranca"
if ($null -eq $checklistTecnico) {
  $issues += "Checklist Tecnico section not found."
}
else {
  $techTotal = Count-ChecklistItems -Content $checklistTecnico
  $techChecked = Count-CheckedItems -Content $checklistTecnico
  if ($techTotal -eq 0) {
    $issues += "Checklist Tecnico has no checklist items."
  }
  elseif ($techChecked -lt $techTotal) {
    $issues += "Checklist Tecnico must be fully checked."
  }
}

$multiTenant = Get-SectionContent -Text $body -StartPattern "^## Multi-tenant e Seguranca" -EndPattern "^## Banco de Dados"
Require-AtLeastOneChecked -SectionName "Multi-tenant e Seguranca" -SectionContent $multiTenant

$bancoDados = Get-SectionContent -Text $body -StartPattern "^## Banco de Dados" -EndPattern "^## Testes"
Require-AtLeastOneChecked -SectionName "Banco de Dados" -SectionContent $bancoDados

$testPlan = Get-SectionContent -Text $body -StartPattern "^## Testes" -EndPattern "^### Evidencias de teste"
if ($null -eq $testPlan) {
  $issues += "Testes section not found."
}
else {
  $testText = $testPlan
  $testText = $testText -replace "(?im)^\s*Descreva como validar:\s*$", ""
  $testText = $testText -replace "(?im)^\s*\d+\.\s*$", ""
  $testText = $testText.Trim()
  if ([string]::IsNullOrWhiteSpace($testText)) {
    $issues += "Testes section must include validation steps."
  }
}

$evidenciasTeste = Get-SectionContent -Text $body -StartPattern "^### Evidencias de teste" -EndPattern "^Comandos executados:"
Require-AtLeastOneChecked -SectionName "Evidencias de teste" -SectionContent $evidenciasTeste

$deploy = Get-SectionContent -Text $body -StartPattern "^## Deploy" -EndPattern "^## Evidencias Visuais"
Require-AtLeastOneChecked -SectionName "Deploy" -SectionContent $deploy

if ($issues.Count -gt 0) {
  Write-Host "PR template guardrails failed:"
  $issues | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "PR template guardrails passed."
