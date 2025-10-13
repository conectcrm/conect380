# 🔄 Script para Atualizar Token WhatsApp
# Este script facilita a atualização do Access Token do WhatsApp Business API

param(
  [Parameter(Mandatory = $false)]
  [string]$NovoToken,
    
  [Parameter(Mandatory = $false)]
  [string]$CanalId = "2fe447a9-3547-427e-be9c-e7ef36eca202"
)

# Cores
$verde = "Green"
$vermelho = "Red"
$amarelo = "Yellow"
$azul = "Cyan"
$cinza = "Gray"

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $azul
Write-Host "║      🔄 ATUALIZADOR DE TOKEN WHATSAPP                     ║" -ForegroundColor $azul
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor $azul

# Configuração do banco
$env:PGPASSWORD = 'conectcrm123'
$dbHost = "localhost"
$dbPort = "5434"
$dbUser = "conectcrm"
$dbName = "conectcrm_db"

# Função para executar SQL
function Invoke-PostgreSQL {
  param([string]$Query)
  return psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c $Query
}

# PASSO 1: Verificar canais existentes
Write-Host "📋 PASSO 1: Verificando canais WhatsApp..." -ForegroundColor $amarelo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $cinza

$canaisQuery = @"
SELECT id, nome, ativo, status 
FROM canais 
WHERE tipo = 'whatsapp' 
ORDER BY "createdAt" DESC;
"@

$canais = Invoke-PostgreSQL -Query $canaisQuery

if (-not $canais) {
  Write-Host "❌ Nenhum canal WhatsApp encontrado!" -ForegroundColor $vermelho
  Write-Host "`n💡 Dica: Primeiro configure um canal via frontend:" -ForegroundColor $amarelo
  Write-Host "   http://localhost:3000/configuracoes/integracoes`n" -ForegroundColor $cinza
  exit 1
}

Write-Host "✅ Canais encontrados:`n" -ForegroundColor $verde

$canalLines = $canais -split "`n" | Where-Object { $_ -ne '' }
$canaisArray = @()

foreach ($linha in $canalLines) {
  $campos = $linha -split '\|'
  $canaisArray += [PSCustomObject]@{
    ID     = $campos[0]
    Nome   = $campos[1]
    Ativo  = $campos[2]
    Status = $campos[3]
  }
    
  $ativoText = if ($campos[2] -eq 't') { "ATIVO ✅" } else { "INATIVO ❌" }
  $ativoCor = if ($campos[2] -eq 't') { $verde } else { $vermelho }
    
  Write-Host "📱 $($campos[1])" -ForegroundColor $amarelo
  Write-Host "   ID: $($campos[0])" -ForegroundColor $cinza
  Write-Host "   Status: $ativoText" -ForegroundColor $ativoCor
  Write-Host ""
}

# PASSO 2: Selecionar canal
Write-Host "`n📋 PASSO 2: Selecionando canal..." -ForegroundColor $amarelo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $cinza

$canalSelecionado = $canaisArray | Where-Object { $_.ID -eq $CanalId } | Select-Object -First 1

if (-not $canalSelecionado) {
  Write-Host "❌ Canal com ID $CanalId não encontrado!" -ForegroundColor $vermelho
  Write-Host "`n💡 Use um dos IDs acima ou passe o parâmetro -CanalId`n" -ForegroundColor $amarelo
  exit 1
}

Write-Host "✅ Canal selecionado: $($canalSelecionado.Nome)" -ForegroundColor $verde
Write-Host "   ID: $($canalSelecionado.ID)" -ForegroundColor $cinza
Write-Host ""

# PASSO 3: Obter token atual
Write-Host "`n📋 PASSO 3: Verificando token atual..." -ForegroundColor $amarelo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $cinza

$tokenAtualQuery = @"
SELECT configuracao->'credenciais'->>'whatsapp_api_token' as token 
FROM canais 
WHERE id = '$CanalId';
"@

$tokenAtual = Invoke-PostgreSQL -Query $tokenAtualQuery

if ($tokenAtual) {
  $tokenPreview = $tokenAtual.Substring(0, [Math]::Min(30, $tokenAtual.Length)) + "..."
  Write-Host "🔑 Token atual: $tokenPreview" -ForegroundColor $cinza
  Write-Host "   Tamanho: $($tokenAtual.Length) caracteres`n" -ForegroundColor $cinza
}
else {
  Write-Host "⚠️  Nenhum token configurado ainda`n" -ForegroundColor $amarelo
}

# PASSO 4: Solicitar novo token (se não foi passado)
if (-not $NovoToken) {
  Write-Host "`n📋 PASSO 4: Inserir novo token..." -ForegroundColor $amarelo
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $cinza
    
  Write-Host "🔑 Cole o novo Access Token do Meta Business API:" -ForegroundColor $amarelo
  Write-Host "   (Pressione Enter quando terminar)`n" -ForegroundColor $cinza
    
  $NovoToken = Read-Host "Token"
    
  if (-not $NovoToken -or $NovoToken.Length -lt 50) {
    Write-Host "`n❌ Token inválido ou muito curto!" -ForegroundColor $vermelho
    Write-Host "   O token do Meta geralmente tem 200+ caracteres`n" -ForegroundColor $cinza
    exit 1
  }
}
else {
  Write-Host "`n📋 PASSO 4: Token fornecido via parâmetro..." -ForegroundColor $amarelo
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $cinza
}

$novoTokenPreview = $NovoToken.Substring(0, [Math]::Min(30, $NovoToken.Length)) + "..."
Write-Host "✅ Novo token recebido: $novoTokenPreview" -ForegroundColor $verde
Write-Host "   Tamanho: $($NovoToken.Length) caracteres`n" -ForegroundColor $cinza

# PASSO 5: Atualizar no banco de dados
Write-Host "`n📋 PASSO 5: Atualizando no banco de dados..." -ForegroundColor $amarelo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $cinza

# Escapar aspas no token
$tokenEscapado = $NovoToken -replace "'", "''"

$updateQuery = @"
UPDATE canais 
SET 
  configuracao = jsonb_set(
    configuracao,
    '{credenciais,whatsapp_api_token}',
    '\"$tokenEscapado\"'
  ),
  ativo = true,
  status = 'ATIVO',
  "updatedAt" = NOW()
WHERE id = '$CanalId';
"@

try {
  Invoke-PostgreSQL -Query $updateQuery | Out-Null
  Write-Host "✅ Token atualizado com sucesso!" -ForegroundColor $verde
  Write-Host "✅ Canal ativado!" -ForegroundColor $verde
  Write-Host "✅ Status alterado para ATIVO`n" -ForegroundColor $verde
}
catch {
  Write-Host "❌ Erro ao atualizar: $_`n" -ForegroundColor $vermelho
  exit 1
}

# PASSO 6: Verificar atualização
Write-Host "`n📋 PASSO 6: Verificando atualização..." -ForegroundColor $amarelo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $cinza

$verificarQuery = @"
SELECT 
  nome,
  ativo,
  status,
  LENGTH(configuracao->'credenciais'->>'whatsapp_api_token') as token_length,
  SUBSTRING(configuracao->'credenciais'->>'whatsapp_api_token', 1, 30) as token_preview
FROM canais 
WHERE id = '$CanalId';
"@

$verificacao = Invoke-PostgreSQL -Query $verificarQuery
$campos = $verificacao -split '\|'

Write-Host "📱 Canal: $($campos[0])" -ForegroundColor $amarelo
Write-Host "   Ativo: $($campos[1])" -ForegroundColor $(if ($campos[1] -eq 't') { $verde }else { $vermelho })
Write-Host "   Status: $($campos[2])" -ForegroundColor $verde
Write-Host "   Token: $($campos[4])... ($($campos[3]) chars)" -ForegroundColor $cinza
Write-Host ""

# PASSO 7: Testar via API
Write-Host "`n📋 PASSO 7: Testando via API (opcional)..." -ForegroundColor $amarelo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $cinza

Write-Host "💡 Agora você pode testar de 3 formas:`n" -ForegroundColor $azul

Write-Host "1️⃣  Via Frontend:" -ForegroundColor $amarelo
Write-Host "   http://localhost:3000/configuracoes/integracoes" -ForegroundColor $cinza
Write-Host "   → Clique em 'Testar Mensagem'`n" -ForegroundColor $cinza

Write-Host "2️⃣  Via Script de Teste:" -ForegroundColor $amarelo
Write-Host "   node test-webhook-whatsapp.js`n" -ForegroundColor $cinza

Write-Host "3️⃣  Via cURL:" -ForegroundColor $amarelo
Write-Host "   curl -X POST http://localhost:3001/api/atendimento/canais/testar-mensagem \" -ForegroundColor $cinza
Write-Host "     -H 'Authorization: Bearer SEU_JWT_TOKEN' \" -ForegroundColor $cinza
Write-Host "     -H 'Content-Type: application/json' \" -ForegroundColor $cinza
Write-Host "     -d '{\"tipo\":\"whatsapp\",\"numero\":\"5562996689991\"}'`n" -ForegroundColor $cinza

# Resumo final
Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $verde
Write-Host "║                    ✅ CONCLUÍDO!                           ║" -ForegroundColor $verde
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor $verde

Write-Host "📊 RESUMO:" -ForegroundColor $azul
Write-Host "   ✅ Token atualizado no banco de dados" -ForegroundColor $verde
Write-Host "   ✅ Canal ativado (ativo = true)" -ForegroundColor $verde
Write-Host "   ✅ Status alterado para ATIVO" -ForegroundColor $verde
Write-Host "   ✅ Pronto para enviar mensagens!`n" -ForegroundColor $verde

Write-Host "⚠️  LEMBRE-SE:" -ForegroundColor $amarelo
Write-Host "   Se você usou um Temporary Token, ele expira em 24 horas." -ForegroundColor $cinza
Write-Host "   Para produção, use um System User Token (permanente).`n" -ForegroundColor $cinza

Write-Host "📚 Documentação:" -ForegroundColor $azul
Write-Host "   docs/RESOLVER_ERRO_401_WHATSAPP.md`n" -ForegroundColor $cinza
