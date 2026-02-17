param(
  [string]$RunDir = "",
  [string]$PostgresContainer = "conectcrm-postgres",
  [string]$DbUser = "conectcrm",
  [string]$DbName = "conectcrm_db",
  [int]$Limit = 5
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pilotRoot = Join-Path $repoRoot ".production\pilot-runs"

function Resolve-RunDir {
  param(
    [string]$ProvidedRunDir
  )

  if ([string]::IsNullOrWhiteSpace($ProvidedRunDir)) {
    if (-not (Test-Path $pilotRoot)) {
      throw "Nenhuma pasta de piloto encontrada em $pilotRoot."
    }

    $latest = Get-ChildItem $pilotRoot -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -eq $latest) {
      throw "Nenhuma sessao de piloto encontrada em $pilotRoot."
    }

    return $latest.FullName
  }

  if (-not (Test-Path $ProvidedRunDir)) {
    throw "RunDir nao encontrado: $ProvidedRunDir"
  }

  return (Resolve-Path $ProvidedRunDir).Path
}

function Invoke-SqlCsv {
  param(
    [string]$SqlText
  )

  $raw = $SqlText | docker exec -i $PostgresContainer psql -U $DbUser -d $DbName --csv -f -
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return @()
  }

  return @($raw | ConvertFrom-Csv)
}

function Get-ObjectCount {
  param(
    [object]$Value
  )

  return @($Value).Count
}

$RunDir = Resolve-RunDir -ProvidedRunDir $RunDir

$baseSql = @"
WITH stats AS (
  SELECT
    e.id::text AS empresa_id,
    e.nome AS cliente,
    e.email AS contato_negocio,
    tech.contato_tecnico,
    COALESCE(l.cnt, 0) AS leads,
    COALESCE(o.cnt, 0) AS oportunidades,
    COALESCE(p.cnt, 0) AS propostas,
    COALESCE(t.cnt, 0) AS tickets,
    GREATEST(
      COALESCE(l.last_ts, TIMESTAMP '1970-01-01'),
      COALESCE(o.last_ts, TIMESTAMP '1970-01-01'),
      COALESCE(p.last_ts, TIMESTAMP '1970-01-01'),
      COALESCE(t.last_ts, TIMESTAMP '1970-01-01')
    ) AS ultima_atividade
  FROM empresas e
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt, MAX(COALESCE(leads.updated_at, leads.created_at)) AS last_ts
    FROM leads
    WHERE leads.empresa_id::text = e.id::text
  ) l ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt, MAX(COALESCE(oportunidades."updatedAt", oportunidades."createdAt")) AS last_ts
    FROM oportunidades
    WHERE oportunidades.empresa_id::text = e.id::text
  ) o ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt, MAX(COALESCE(propostas."atualizadaEm", propostas."criadaEm")) AS last_ts
    FROM propostas
    WHERE propostas.empresa_id::text = e.id::text
  ) p ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt, MAX(COALESCE(atendimento_tickets.updated_at, atendimento_tickets.created_at)) AS last_ts
    FROM atendimento_tickets
    WHERE atendimento_tickets.empresa_id::text = e.id::text
  ) t ON true
  LEFT JOIN LATERAL (
    SELECT
      TRIM(COALESCE(users.nome, '')) || ' <' || TRIM(users.email) || '>' AS contato_tecnico
    FROM users
    WHERE users.empresa_id::text = e.id::text
      AND COALESCE(users.ativo, true) = true
      AND COALESCE(TRIM(users.email), '') <> ''
      AND LOWER(users.email) NOT LIKE '%@test.%'
      AND LOWER(users.email) NOT LIKE '%@teste.%'
      AND LOWER(users.email) NOT LIKE '%example.%'
      AND LOWER(users.email) NOT LIKE '%mailinator%'
      AND LOWER(users.email) NOT LIKE '%+teste%'
      AND LOWER(COALESCE(users.nome, '')) NOT LIKE '%test%'
      AND LOWER(COALESCE(users.nome, '')) NOT LIKE '%e2e%'
    ORDER BY
      CASE WHEN users.role IN ('superadmin', 'admin') THEN 0 ELSE 1 END,
      users.updated_at DESC NULLS LAST
    LIMIT 1
  ) tech ON true
),
ranked AS (
  SELECT
    empresa_id,
    cliente,
    contato_negocio,
    contato_tecnico,
    leads,
    oportunidades,
    propostas,
    tickets,
    ultima_atividade,
    (leads + oportunidades + propostas + tickets) AS score
  FROM stats
  WHERE LOWER(cliente) NOT LIKE '%test%'
    AND LOWER(cliente) NOT LIKE '%e2e%'
    AND (leads + oportunidades + propostas + tickets) > 0
)
"@

$primarySql = @"
$baseSql
SELECT
  cliente,
  empresa_id,
  contato_negocio,
  contato_tecnico,
  score,
  ultima_atividade,
  'SUGERIDO' AS status_sugestao,
  '' AS motivo
FROM ranked
WHERE COALESCE(TRIM(contato_negocio), '') <> ''
  AND LOWER(cliente) NOT LIKE '%demo%'
  AND LOWER(cliente) NOT LIKE '%homolog%'
  AND LOWER(cliente) NOT LIKE '%debug%'
  AND LOWER(cliente) NOT LIKE '%stdout%'
  AND LOWER(contato_negocio) NOT LIKE '%@test.%'
  AND LOWER(contato_negocio) NOT LIKE '%example.%'
  AND LOWER(contato_negocio) NOT LIKE '%mailinator%'
ORDER BY score DESC, ultima_atividade DESC
LIMIT $Limit;
"@

$primarySuggestions = @(Invoke-SqlCsv -SqlText $primarySql)
$primaryCount = Get-ObjectCount -Value $primarySuggestions

$desiredRows = [Math]::Max(3, $primaryCount)
$remainingSlots = $desiredRows - $primaryCount
$fallbackSuggestions = @()
$fallbackProfileSuggestions = @()

if ($remainingSlots -gt 0) {
  $excludedIds = @($primarySuggestions | Select-Object -ExpandProperty empresa_id)
  $excludeClause = ""
  if ($excludedIds.Count -gt 0) {
    $quoted = $excludedIds | ForEach-Object { "'" + ($_ -replace "'", "''") + "'" }
    $excludeClause = "AND empresa_id NOT IN (" + ($quoted -join ",") + ")"
  }

  $fallbackSql = @"
$baseSql
SELECT
  cliente,
  empresa_id,
  contato_negocio,
  contato_tecnico,
  score,
  ultima_atividade,
  'REVISAR_CONTATO' AS status_sugestao,
  CASE
    WHEN COALESCE(TRIM(contato_negocio), '') = '' THEN 'sem_contato_negocio'
    WHEN LOWER(contato_negocio) LIKE '%@test.%'
      OR LOWER(contato_negocio) LIKE '%example.%'
      OR LOWER(contato_negocio) LIKE '%mailinator%' THEN 'contato_suspeito'
    ELSE 'validar_contato_manual'
  END AS motivo
FROM ranked
WHERE 1=1
  AND LOWER(cliente) NOT LIKE '%demo%'
  AND LOWER(cliente) NOT LIKE '%homolog%'
  AND LOWER(cliente) NOT LIKE '%debug%'
  AND LOWER(cliente) NOT LIKE '%stdout%'
  $excludeClause
ORDER BY score DESC, ultima_atividade DESC
LIMIT $remainingSlots;
"@

  $fallbackSuggestions = @(Invoke-SqlCsv -SqlText $fallbackSql)
}

$remainingAfterFallback = $remainingSlots - (Get-ObjectCount -Value $fallbackSuggestions)
if ($remainingAfterFallback -gt 0) {
  $excludedIds2 = @($primarySuggestions | Select-Object -ExpandProperty empresa_id) + @($fallbackSuggestions | Select-Object -ExpandProperty empresa_id)
  $excludeClause2 = ""
  if ($excludedIds2.Count -gt 0) {
    $quoted2 = $excludedIds2 | ForEach-Object { "'" + ($_ -replace "'", "''") + "'" }
    $excludeClause2 = "AND empresa_id NOT IN (" + ($quoted2 -join ",") + ")"
  }

  $fallbackProfileSql = @"
$baseSql
SELECT
  cliente,
  empresa_id,
  contato_negocio,
  contato_tecnico,
  score,
  ultima_atividade,
  'REVISAR_PERFIL' AS status_sugestao,
  CASE
    WHEN LOWER(cliente) LIKE '%demo%' THEN 'nome_suspeito_demo'
    WHEN LOWER(cliente) LIKE '%homolog%' THEN 'nome_suspeito_homolog'
    WHEN LOWER(cliente) LIKE '%debug%' THEN 'nome_suspeito_debug'
    WHEN LOWER(cliente) LIKE '%stdout%' THEN 'nome_suspeito_stdout'
    ELSE 'validar_perfil_manual'
  END AS motivo
FROM ranked
WHERE (LOWER(cliente) LIKE '%demo%'
    OR LOWER(cliente) LIKE '%homolog%'
    OR LOWER(cliente) LIKE '%debug%'
    OR LOWER(cliente) LIKE '%stdout%')
  AND LOWER(cliente) NOT LIKE '%test%'
  AND LOWER(cliente) NOT LIKE '%e2e%'
  $excludeClause2
ORDER BY score DESC, ultima_atividade DESC
LIMIT $remainingAfterFallback;
"@

  $fallbackProfileSuggestions = @(Invoke-SqlCsv -SqlText $fallbackProfileSql)
}

$combinedSuggestions = @($primarySuggestions) + @($fallbackSuggestions) + @($fallbackProfileSuggestions)
$fallbackCount = Get-ObjectCount -Value $fallbackSuggestions
$fallbackProfileCount = Get-ObjectCount -Value $fallbackProfileSuggestions
$combinedCount = Get-ObjectCount -Value $combinedSuggestions

$suggestedPath = Join-Path $RunDir "clients-suggested.csv"
$combinedSuggestions |
  Select-Object cliente, empresa_id, contato_negocio, contato_tecnico, score, ultima_atividade, status_sugestao, motivo |
  Export-Csv -Path $suggestedPath -NoTypeInformation -Encoding UTF8

$clientsPath = Join-Path $RunDir "clients.csv"
$clients = @()

foreach ($suggested in $combinedSuggestions) {
  $extra = "score=$($suggested.score); ultima_atividade=$($suggested.ultima_atividade)"
  if (-not [string]::IsNullOrWhiteSpace($suggested.motivo)) {
    $extra = "$extra; motivo=$($suggested.motivo)"
  }

  $clients += [pscustomobject]@{
    cliente = $suggested.cliente
    empresa_id = $suggested.empresa_id
    contato_tecnico = $suggested.contato_tecnico
    contato_negocio = $suggested.contato_negocio
    janela_inicio = ""
    janela_fim = ""
    status = $suggested.status_sugestao
    observacoes = $extra
  }
}

for ($i = $clients.Count + 1; $i -le $desiredRows; $i++) {
  $clients += [pscustomobject]@{
    cliente = "Cliente Piloto $i"
    empresa_id = ""
    contato_tecnico = ""
    contato_negocio = ""
    janela_inicio = ""
    janela_fim = ""
    status = "PENDENTE"
    observacoes = "Definir cliente real"
  }
}

$clients | Export-Csv -Path $clientsPath -NoTypeInformation -Encoding UTF8

Write-Host "Recomendacoes geradas:"
Write-Host " - $suggestedPath"
Write-Host " - $clientsPath"
Write-Host ""
Write-Host "Resumo:"
Write-Host " - sugeridos qualificados: $primaryCount"
Write-Host " - candidatos para revisao: $fallbackCount"
Write-Host " - candidatos para revisao de perfil: $fallbackProfileCount"
Write-Host " - total candidatos: $combinedCount"
Write-Host " - total para sessao: $($clients.Count)"
Write-Host ""
Write-Host "Top candidatos:"
$combinedSuggestions | Select-Object -First 5 | Format-Table cliente, empresa_id, contato_negocio, score, status_sugestao, motivo -AutoSize

exit 0
