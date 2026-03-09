param(
  [ValidateSet('init', 'status', 'next', 'done', 'gate', 'auto')]
  [string]$Command = 'status',
  [string]$BacklogPath = 'docs/features/BACKLOG_JIRA_CLOUD_GUARDIAN_PRODUCAO_2026-03_04.csv',
  [string]$StatePath = 'docs/features/GUARDIAN_AUTOPILOT_STATE_2026-03_04.json',
  [string]$IssueId = '',
  [string]$Note = '',
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-PathSafe {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }
  return Join-Path -Path (Get-Location) -ChildPath $Path
}

function Parse-DateSafe {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return [datetime]::MinValue
  }
  try {
    return [datetime]::ParseExact($Value.Trim(), 'yyyy-MM-dd', [System.Globalization.CultureInfo]::InvariantCulture)
  }
  catch {
    return [datetime]::MinValue
  }
}

function Import-Backlog {
  param([string]$Path)
  if (-not (Test-Path -Path $Path)) {
    throw "Backlog nao encontrado: $Path"
  }
  $rows = Import-Csv -Path $Path
  if (-not $rows -or $rows.Count -eq 0) {
    throw "Backlog vazio: $Path"
  }
  return $rows
}

function Get-SprintOrder {
  param($BacklogRows)

  $epicRows = @(
    $BacklogRows |
      Where-Object { $_.'Issue Type' -eq 'Epic' -and -not [string]::IsNullOrWhiteSpace($_.Sprint) } |
      Sort-Object @{ Expression = { Parse-DateSafe $_.'Start date' } }, @{ Expression = { $_.Sprint } }
  )

  $sprints = New-Object System.Collections.Generic.List[string]
  foreach ($row in $epicRows) {
    if (-not $sprints.Contains($row.Sprint)) {
      [void]$sprints.Add($row.Sprint)
    }
  }

  if ($sprints.Count -eq 0) {
    $fallback = @(
      $BacklogRows |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_.Sprint) } |
        Sort-Object @{ Expression = { Parse-DateSafe $_.'Start date' } }, @{ Expression = { $_.Sprint } }
    )
    foreach ($row in $fallback) {
      if (-not $sprints.Contains($row.Sprint)) {
        [void]$sprints.Add($row.Sprint)
      }
    }
  }

  return @($sprints)
}

function New-IssueState {
  param([string]$IssueType)
  $status = 'todo'
  if ($IssueType -eq 'Epic') {
    $status = 'na'
  }
  return [pscustomobject]@{
    status = $status
    completedAt = $null
    note = $null
  }
}

function New-StateObject {
  param($BacklogRows, [string]$BacklogPath)

  $sprints = Get-SprintOrder -BacklogRows $BacklogRows
  if ($sprints.Count -eq 0) {
    throw 'Nao foi possivel determinar a ordem de sprints no backlog.'
  }

  $issues = [pscustomobject]@{}
  foreach ($row in $BacklogRows) {
    $id = $row.'Issue ID'
    if ([string]::IsNullOrWhiteSpace($id)) {
      continue
    }
    Add-Member -InputObject $issues -MemberType NoteProperty -Name $id -Value (New-IssueState -IssueType $row.'Issue Type')
  }

  return [pscustomobject]@{
    schemaVersion = 1
    backlogPath = $BacklogPath
    currentSprint = $sprints[0]
    sprints = @($sprints)
    programCompleted = $false
    updatedAt = (Get-Date).ToString('s')
    issues = $issues
    history = @()
  }
}

function Save-State {
  param($State, [string]$Path)

  $dir = Split-Path -Parent $Path
  if (-not [string]::IsNullOrWhiteSpace($dir) -and -not (Test-Path -Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }

  $State.updatedAt = (Get-Date).ToString('s')
  $json = $State | ConvertTo-Json -Depth 25
  Set-Content -Path $Path -Value $json -Encoding UTF8
}

function Load-State {
  param([string]$Path)
  if (-not (Test-Path -Path $Path)) {
    throw "Estado nao encontrado: $Path. Execute primeiro com -Command init."
  }
  $raw = Get-Content -Path $Path -Raw
  if ([string]::IsNullOrWhiteSpace($raw)) {
    throw "Estado vazio em: $Path"
  }
  return ($raw | ConvertFrom-Json)
}

function Add-History {
  param($State, [string]$Action, [string]$IssueId, [string]$Message)
  $entry = [pscustomobject]@{
    at = (Get-Date).ToString('s')
    action = $Action
    issueId = $IssueId
    message = $Message
  }
  $current = @($State.history)
  $current += $entry
  $State.history = $current
}

function Get-IssueRow {
  param($BacklogRows, [string]$IssueId)
  return ($BacklogRows | Where-Object { $_.'Issue ID' -eq $IssueId } | Select-Object -First 1)
}

function Get-IssueState {
  param($State, [string]$IssueId)
  $prop = $State.issues.PSObject.Properties[$IssueId]
  if (-not $prop) {
    return $null
  }
  return $prop.Value
}

function Get-IssueStatus {
  param($State, [string]$IssueId)
  $entry = Get-IssueState -State $State -IssueId $IssueId
  if (-not $entry) {
    return $null
  }
  return $entry.status
}

function Set-IssueStatus {
  param($State, [string]$IssueId, [string]$Status, [string]$Note)
  $prop = $State.issues.PSObject.Properties[$IssueId]
  if (-not $prop) {
    throw "Issue nao existe no estado: $IssueId"
  }

  $current = $prop.Value
  $completedAt = $null
  if ($current -and $current.PSObject.Properties['completedAt']) {
    $completedAt = $current.completedAt
  }
  if ($Status -eq 'done') {
    $completedAt = (Get-Date).ToString('s')
  }

  $noteValue = $null
  if ($current -and $current.PSObject.Properties['note']) {
    $noteValue = $current.note
  }
  if (-not [string]::IsNullOrWhiteSpace($Note)) {
    $noteValue = $Note
  }

  $prop.Value = [pscustomobject]@{
    status = $Status
    completedAt = $completedAt
    note = $noteValue
  }
}

function Sync-StateWithBacklog {
  param($State, $BacklogRows)

  foreach ($row in $BacklogRows) {
    $id = $row.'Issue ID'
    if ([string]::IsNullOrWhiteSpace($id)) {
      continue
    }
    if (-not $State.issues.PSObject.Properties[$id]) {
      Add-Member -InputObject $State.issues -MemberType NoteProperty -Name $id -Value (New-IssueState -IssueType $row.'Issue Type')
    }
  }

  $orderedSprints = Get-SprintOrder -BacklogRows $BacklogRows
  $State.sprints = @($orderedSprints)

  if ([string]::IsNullOrWhiteSpace($State.currentSprint)) {
    $State.currentSprint = $orderedSprints[0]
  }
}

function Get-Dependencies {
  param($Row)
  if ([string]::IsNullOrWhiteSpace($Row.Dependencies)) {
    return @()
  }
  return @(
    $Row.Dependencies.Split(';') |
      ForEach-Object { $_.Trim() } |
      Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
  )
}

function Test-DependenciesDone {
  param($State, $Row)

  $deps = Get-Dependencies -Row $Row
  $missing = New-Object System.Collections.Generic.List[string]
  foreach ($dep in $deps) {
    $status = Get-IssueStatus -State $State -IssueId $dep
    if ($status -ne 'done' -and $status -ne 'na') {
      [void]$missing.Add($dep)
    }
  }

  return [pscustomobject]@{
    ready = ($missing.Count -eq 0)
    missing = @($missing)
    dependencies = @($deps)
  }
}

function Get-CurrentSprintRows {
  param($BacklogRows, $State)
  return @(
    $BacklogRows |
      Where-Object { $_.Sprint -eq $State.currentSprint -and $_.'Issue Type' -ne 'Epic' }
  )
}

function Get-ActionableRows {
  param($BacklogRows, $State)
  $rows = Get-CurrentSprintRows -BacklogRows $BacklogRows -State $State
  $actionable = New-Object System.Collections.Generic.List[object]
  foreach ($row in $rows) {
    $status = Get-IssueStatus -State $State -IssueId $row.'Issue ID'
    if ($status -ne 'todo') {
      continue
    }
    $dep = Test-DependenciesDone -State $State -Row $row
    if ($dep.ready) {
      [void]$actionable.Add($row)
    }
  }
  return @(
    $actionable |
      Sort-Object @{ Expression = { Parse-DateSafe $_.'Start date' } }, @{ Expression = { $_.'Issue ID' } }
  )
}

function Get-GateRow {
  param($BacklogRows, $State)
  $rows = Get-CurrentSprintRows -BacklogRows $BacklogRows -State $State
  $gate = $rows | Where-Object { $_.Summary -match 'Gate sprint|Gate program completion' } | Select-Object -First 1
  if (-not $gate) {
    $gate = $rows | Where-Object { $_.Labels -match '\bgate\b' } | Select-Object -First 1
  }
  return $gate
}

function Advance-ToNextSprint {
  param($State)
  $sprints = @($State.sprints)
  $idx = [array]::IndexOf($sprints, $State.currentSprint)
  if ($idx -lt 0) {
    $idx = 0
  }

  if ($idx -ge ($sprints.Count - 1)) {
    $State.programCompleted = $true
    Add-History -State $State -Action 'program-complete' -IssueId '' -Message 'Programa concluido com todos os gates fechados.'
    return $null
  }

  $next = $sprints[$idx + 1]
  $prev = $State.currentSprint
  $State.currentSprint = $next
  Add-History -State $State -Action 'sprint-advance' -IssueId '' -Message "Avanco automatico de $prev para $next."
  return $next
}

function Invoke-Gate {
  param($BacklogRows, $State)

  $gate = Get-GateRow -BacklogRows $BacklogRows -State $State
  if (-not $gate) {
    throw "Gate nao encontrado para a sprint atual: $($State.currentSprint)"
  }

  $rows = Get-CurrentSprintRows -BacklogRows $BacklogRows -State $State
  $blocking = @(
    $rows |
      Where-Object { $_.'Issue ID' -ne $gate.'Issue ID' } |
      Where-Object { (Get-IssueStatus -State $State -IssueId $_.'Issue ID') -ne 'done' }
  )

  if ($blocking.Count -gt 0) {
    Write-Host "Gate bloqueado. Itens pendentes em $($State.currentSprint):" -ForegroundColor Yellow
    $blocking |
      Sort-Object @{ Expression = { Parse-DateSafe $_.'Start date' } }, @{ Expression = { $_.'Issue ID' } } |
      ForEach-Object {
        $dep = Test-DependenciesDone -State $State -Row $_
        if ($dep.ready) {
          Write-Host " - $($_.'Issue ID') $($_.Summary) [pronto para execucao]" -ForegroundColor DarkYellow
        }
        else {
          Write-Host " - $($_.'Issue ID') $($_.Summary) [aguardando: $($dep.missing -join ';')]" -ForegroundColor DarkYellow
        }
      }
    return $false
  }

  if ((Get-IssueStatus -State $State -IssueId $gate.'Issue ID') -ne 'done') {
    Set-IssueStatus -State $State -IssueId $gate.'Issue ID' -Status 'done' -Note 'Gate fechado automaticamente'
    Add-History -State $State -Action 'gate-close' -IssueId $gate.'Issue ID' -Message "Gate fechado na sprint $($State.currentSprint)."
  }

  $next = Advance-ToNextSprint -State $State
  if ($null -eq $next) {
    Write-Host 'Programa concluido. Todos os gates foram fechados.' -ForegroundColor Green
  }
  else {
    Write-Host "Gate fechado. Sprint atual avancou para: $next" -ForegroundColor Green
  }
  return $true
}

$resolvedBacklogPath = Resolve-PathSafe -Path $BacklogPath
$resolvedStatePath = Resolve-PathSafe -Path $StatePath
$backlogRows = Import-Backlog -Path $resolvedBacklogPath

switch ($Command) {
  'init' {
    $state = New-StateObject -BacklogRows $backlogRows -BacklogPath $resolvedBacklogPath
    Save-State -State $state -Path $resolvedStatePath
    Write-Host "Estado criado: $resolvedStatePath" -ForegroundColor Green
    Write-Host "Sprint atual: $($state.currentSprint)" -ForegroundColor Cyan
    break
  }

  'status' {
    $state = Load-State -Path $resolvedStatePath
    Sync-StateWithBacklog -State $state -BacklogRows $backlogRows
    Save-State -State $state -Path $resolvedStatePath

    $rows = Get-CurrentSprintRows -BacklogRows $backlogRows -State $state
    $done = @($rows | Where-Object { (Get-IssueStatus -State $state -IssueId $_.'Issue ID') -eq 'done' }).Count
    $todo = @($rows | Where-Object { (Get-IssueStatus -State $state -IssueId $_.'Issue ID') -eq 'todo' }).Count
    $gate = Get-GateRow -BacklogRows $backlogRows -State $state
    $gateStatus = if ($gate) { Get-IssueStatus -State $state -IssueId $gate.'Issue ID' } else { 'na' }

    Write-Host "Sprint atual: $($state.currentSprint)" -ForegroundColor Cyan
    Write-Host "Programa concluido: $($state.programCompleted)" -ForegroundColor Cyan
    Write-Host "Itens da sprint: $($rows.Count) | done: $done | todo: $todo" -ForegroundColor Cyan
    if ($gate) {
      Write-Host "Gate: $($gate.'Issue ID') [$gateStatus]" -ForegroundColor Cyan
    }

    $nextRows = @(Get-ActionableRows -BacklogRows $backlogRows -State $state)
    if ($nextRows.Count -eq 0) {
      Write-Host 'Nenhum item pronto para execucao no momento.' -ForegroundColor Yellow
    }
    else {
      Write-Host 'Proximos itens prontos para execucao:' -ForegroundColor Green
      $nextRows | ForEach-Object {
        Write-Host " - $($_.'Issue ID') $($_.Summary)" -ForegroundColor Gray
      }
    }
    break
  }

  'next' {
    $state = Load-State -Path $resolvedStatePath
    Sync-StateWithBacklog -State $state -BacklogRows $backlogRows
    Save-State -State $state -Path $resolvedStatePath

    $nextRows = @(Get-ActionableRows -BacklogRows $backlogRows -State $state)
    if ($nextRows.Count -eq 0) {
      Write-Host 'Nenhum item pronto para execucao.' -ForegroundColor Yellow
      break
    }

    Write-Host "Itens prontos em $($state.currentSprint):" -ForegroundColor Green
    $nextRows | ForEach-Object {
      Write-Host " - $($_.'Issue ID') [$($_.'Issue Type')] $($_.Summary)" -ForegroundColor Gray
    }
    break
  }

  'done' {
    if ([string]::IsNullOrWhiteSpace($IssueId)) {
      throw 'Informe -IssueId para o comando done.'
    }

    $state = Load-State -Path $resolvedStatePath
    Sync-StateWithBacklog -State $state -BacklogRows $backlogRows

    $row = Get-IssueRow -BacklogRows $backlogRows -IssueId $IssueId
    if (-not $row) {
      throw "Issue nao encontrada no backlog: $IssueId"
    }
    if ($row.'Issue Type' -eq 'Epic') {
      throw "Issue $IssueId e Epic e nao deve ser marcada manualmente."
    }

    if (-not $Force) {
      if ($row.Sprint -ne $state.currentSprint) {
        throw "Issue $IssueId esta na sprint $($row.Sprint). Sprint atual: $($state.currentSprint). Use -Force se necessario."
      }
      $dep = Test-DependenciesDone -State $state -Row $row
      if (-not $dep.ready) {
        throw "Issue $IssueId bloqueada por dependencias: $($dep.missing -join ';')"
      }
    }

    Set-IssueStatus -State $state -IssueId $IssueId -Status 'done' -Note $Note
    Add-History -State $state -Action 'issue-done' -IssueId $IssueId -Message 'Marcada como concluida.'
    Save-State -State $state -Path $resolvedStatePath
    Write-Host "Issue marcada como done: $IssueId" -ForegroundColor Green
    break
  }

  'gate' {
    $state = Load-State -Path $resolvedStatePath
    Sync-StateWithBacklog -State $state -BacklogRows $backlogRows
    [void](Invoke-Gate -BacklogRows $backlogRows -State $state)
    Save-State -State $state -Path $resolvedStatePath
    break
  }

  'auto' {
    $state = Load-State -Path $resolvedStatePath
    Sync-StateWithBacklog -State $state -BacklogRows $backlogRows

    for ($i = 0; $i -lt 20; $i++) {
      if ($state.programCompleted) {
        Write-Host 'Programa ja concluido.' -ForegroundColor Green
        break
      }

      $nextRows = @(Get-ActionableRows -BacklogRows $backlogRows -State $state)
      $nonGateRows = @($nextRows | Where-Object { $_.Summary -notmatch 'Gate sprint|Gate program completion' })
      if ($nonGateRows.Count -gt 0) {
        Write-Host "Execucao manual necessaria em $($state.currentSprint). Itens prontos:" -ForegroundColor Yellow
        $nonGateRows | ForEach-Object { Write-Host " - $($_.'Issue ID') $($_.Summary)" -ForegroundColor Gray }
        break
      }

      $gateResult = Invoke-Gate -BacklogRows $backlogRows -State $state
      if (-not $gateResult) {
        break
      }
    }

    Save-State -State $state -Path $resolvedStatePath
    break
  }
}
