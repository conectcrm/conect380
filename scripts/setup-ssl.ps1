<#
.SYNOPSIS
    Script para configurar SSL/HTTPS com Let's Encrypt (Certbot)

.DESCRIPTION
    Este script automatiza a instalação e configuração de certificados SSL
    usando Let's Encrypt para o ConectCRM. Suporta Windows e Linux.

.PARAMETER Domain
    Domínio para gerar o certificado (ex: conectcrm.com.br)

.PARAMETER Email
    Email para notificações do Let's Encrypt

.PARAMETER Staging
    Usar ambiente de staging (testes) do Let's Encrypt

.PARAMETER SkipInstall
    Pular instalação do Certbot (assumir que já está instalado)

.EXAMPLE
    .\setup-ssl.ps1 -Domain "conectcrm.com.br" -Email "admin@conectcrm.com.br"

.EXAMPLE
    .\setup-ssl.ps1 -Domain "test.conectcrm.com.br" -Email "dev@conectcrm.com.br" -Staging

.NOTES
    Author: Equipe ConectCRM
    Date: 03/11/2025
    Version: 1.0.0
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Domain,

  [Parameter(Mandatory = $true)]
  [string]$Email,

  [Parameter(Mandatory = $false)]
  [switch]$Staging,

  [Parameter(Mandatory = $false)]
  [switch]$SkipInstall
)

# ============================================
# CONFIGURAÇÕES
# ============================================

$ErrorActionPreference = "Stop"
$ScriptVersion = "1.0.0"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$CertsPath = Join-Path $ProjectRoot "certs"

# Cores para output
function Write-ColorOutput {
  param(
    [string]$Message,
    [string]$Color = "White"
  )
    
  $colorMap = @{
    "Green"  = "32"
    "Yellow" = "33"
    "Red"    = "31"
    "Blue"   = "34"
    "Cyan"   = "36"
    "White"  = "37"
  }
    
  $colorCode = $colorMap[$Color]
  Write-Host "`e[${colorCode}m${Message}`e[0m"
}

# ============================================
# FUNÇÕES
# ============================================

function Test-IsLinux {
  return $PSVersionTable.Platform -eq "Unix" -or $PSVersionTable.OS -like "*Linux*"
}

function Test-IsWindows {
  return $PSVersionTable.Platform -eq "Win32NT" -or [System.Environment]::OSVersion.Platform -eq "Win32NT"
}

function Test-CertbotInstalled {
  try {
    $null = Get-Command certbot -ErrorAction Stop
    return $true
  }
  catch {
    return $false
  }
}

function Install-CertbotWindows {
  Write-ColorOutput "📦 Instalando Certbot no Windows..." "Yellow"
    
  # Verificar se Chocolatey está instalado
  if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-ColorOutput "⚠️  Chocolatey não encontrado. Instalando..." "Yellow"
        
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
    Write-ColorOutput "✅ Chocolatey instalado!" "Green"
  }
    
  # Instalar Certbot via Chocolatey
  Write-ColorOutput "📦 Instalando Certbot via Chocolatey..." "Yellow"
  choco install certbot -y
    
  # Refresh PATH
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
  if (Test-CertbotInstalled) {
    Write-ColorOutput "✅ Certbot instalado com sucesso!" "Green"
    certbot --version
  }
  else {
    throw "Falha ao instalar Certbot"
  }
}

function Install-CertbotLinux {
  Write-ColorOutput "📦 Instalando Certbot no Linux..." "Yellow"
    
  # Detectar distribuição
  if (Test-Path "/etc/debian_version") {
    # Debian/Ubuntu
    Write-ColorOutput "🐧 Detectado Debian/Ubuntu" "Cyan"
    sudo apt-get update
    sudo apt-get install -y certbot
  }
  elseif (Test-Path "/etc/redhat-release") {
    # RedHat/CentOS
    Write-ColorOutput "🐧 Detectado RedHat/CentOS" "Cyan"
    sudo yum install -y certbot
  }
  else {
    # Snap (universal)
    Write-ColorOutput "🐧 Usando Snap (universal)" "Cyan"
    sudo snap install --classic certbot
    sudo ln -s /snap/bin/certbot /usr/bin/certbot
  }
    
  if (Test-CertbotInstalled) {
    Write-ColorOutput "✅ Certbot instalado com sucesso!" "Green"
    certbot --version
  }
  else {
    throw "Falha ao instalar Certbot"
  }
}

function New-CertificateDirectory {
  if (-not (Test-Path $CertsPath)) {
    Write-ColorOutput "📁 Criando diretório de certificados: $CertsPath" "Cyan"
    New-Item -ItemType Directory -Path $CertsPath -Force | Out-Null
  }
}

function Request-Certificate {
  param(
    [string]$Domain,
    [string]$Email,
    [bool]$IsStaging
  )
    
  Write-ColorOutput "`n🔐 Gerando certificado SSL para: $Domain" "Yellow"
  Write-ColorOutput "📧 Email: $Email" "Cyan"
    
  if ($IsStaging) {
    Write-ColorOutput "⚠️  MODO STAGING (Teste) - Certificado NÃO será válido!" "Yellow"
  }
    
  # Construir comando
  $certbotArgs = @(
    "certonly",
    "--standalone",
    "--agree-tos",
    "--non-interactive",
    "--email", $Email,
    "-d", $Domain
  )
    
  if ($IsStaging) {
    $certbotArgs += "--staging"
  }
    
  # Executar Certbot
  Write-ColorOutput "`n▶️  Executando Certbot..." "Yellow"
  Write-ColorOutput "   Certbot irá iniciar servidor temporário na porta 80" "Cyan"
  Write-ColorOutput "   ⚠️  IMPORTANTE: Porta 80 deve estar liberada no firewall!" "Yellow"
  Write-ColorOutput "   ⚠️  IMPORTANTE: DNS deve apontar para este servidor!" "Yellow"
    
  $certbotCommand = "certbot $($certbotArgs -join ' ')"
  Write-ColorOutput "`n💻 Comando: $certbotCommand`n" "Cyan"
    
  try {
    if (Test-IsWindows) {
      & certbot $certbotArgs
    }
    else {
      sudo certbot $certbotArgs
    }
        
    if ($LASTEXITCODE -eq 0) {
      Write-ColorOutput "`n✅ Certificado gerado com sucesso!" "Green"
      return $true
    }
    else {
      Write-ColorOutput "`n❌ Erro ao gerar certificado (Exit code: $LASTEXITCODE)" "Red"
      return $false
    }
  }
  catch {
    Write-ColorOutput "`n❌ Erro ao executar Certbot: $_" "Red"
    return $false
  }
}

function Copy-CertificatesToProject {
  param([string]$Domain)
    
  Write-ColorOutput "`n📋 Copiando certificados para o projeto..." "Yellow"
    
  # Localização dos certificados do Let's Encrypt
  if (Test-IsWindows) {
    $letsencryptPath = "C:\Certbot\live\$Domain"
  }
  else {
    $letsencryptPath = "/etc/letsencrypt/live/$Domain"
  }
    
  if (-not (Test-Path $letsencryptPath)) {
    Write-ColorOutput "❌ Certificados não encontrados em: $letsencryptPath" "Red"
    Write-ColorOutput "   Verifique se o Certbot gerou os certificados corretamente" "Yellow"
    return $false
  }
    
  # Arquivos a copiar
  $certFiles = @(
    @{Source = "fullchain.pem"; Dest = "cert.pem" },
    @{Source = "privkey.pem"; Dest = "key.pem" },
    @{Source = "chain.pem"; Dest = "chain.pem" }
  )
    
  New-CertificateDirectory
    
  foreach ($file in $certFiles) {
    $sourcePath = Join-Path $letsencryptPath $file.Source
    $destPath = Join-Path $CertsPath $file.Dest
        
    if (Test-Path $sourcePath) {
      if (Test-IsWindows) {
        Copy-Item -Path $sourcePath -Destination $destPath -Force
      }
      else {
        sudo cp $sourcePath $destPath
        sudo chmod 644 $destPath
      }
      Write-ColorOutput "  ✅ Copiado: $($file.Dest)" "Green"
    }
    else {
      Write-ColorOutput "  ❌ Não encontrado: $($file.Source)" "Red"
    }
  }
    
  Write-ColorOutput "`n✅ Certificados copiados para: $CertsPath" "Green"
  return $true
}

function Test-CertificateValidity {
  param([string]$Domain)
    
  Write-ColorOutput "`n🔍 Validando certificado..." "Yellow"
    
  $certPath = Join-Path $CertsPath "cert.pem"
    
  if (-not (Test-Path $certPath)) {
    Write-ColorOutput "❌ Certificado não encontrado: $certPath" "Red"
    return $false
  }
    
  try {
    if (Test-IsWindows) {
      # Windows: usar openssl se disponível
      if (Get-Command openssl -ErrorAction SilentlyContinue) {
        $certInfo = openssl x509 -in $certPath -noout -text
        Write-ColorOutput "✅ Certificado válido!" "Green"
                
        # Extrair data de expiração
        $expiryDate = openssl x509 -in $certPath -noout -enddate
        Write-ColorOutput "📅 $expiryDate" "Cyan"
      }
      else {
        Write-ColorOutput "⚠️  OpenSSL não encontrado. Validação manual necessária." "Yellow"
      }
    }
    else {
      # Linux: usar openssl
      $certInfo = openssl x509 -in $certPath -noout -text
      Write-ColorOutput "✅ Certificado válido!" "Green"
            
      $expiryDate = openssl x509 -in $certPath -noout -enddate
      Write-ColorOutput "📅 $expiryDate" "Cyan"
    }
        
    return $true
  }
  catch {
    Write-ColorOutput "❌ Erro ao validar certificado: $_" "Red"
    return $false
  }
}

function Show-NextSteps {
  param([string]$Domain)
    
  Write-ColorOutput "`n" "White"
  Write-ColorOutput "═══════════════════════════════════════════════════════" "Cyan"
  Write-ColorOutput "  🎉 CERTIFICADO SSL CONFIGURADO COM SUCESSO!" "Green"
  Write-ColorOutput "═══════════════════════════════════════════════════════" "Cyan"
  Write-ColorOutput "`n📋 PRÓXIMOS PASSOS:`n" "Yellow"
    
  Write-ColorOutput "1️⃣  Configure o backend para usar HTTPS:" "White"
  Write-ColorOutput "   Edite: backend/.env" "Cyan"
  Write-ColorOutput "   Adicione: SSL_ENABLED=true" "Cyan"
  Write-ColorOutput "   Adicione: SSL_CERT_PATH=../certs/cert.pem" "Cyan"
  Write-ColorOutput "   Adicione: SSL_KEY_PATH=../certs/key.pem`n" "Cyan"
    
  Write-ColorOutput "2️⃣  Reinicie o backend:" "White"
  Write-ColorOutput "   cd backend" "Cyan"
  Write-ColorOutput "   npm run start:dev`n" "Cyan"
    
  Write-ColorOutput "3️⃣  Teste HTTPS:" "White"
  Write-ColorOutput "   https://$Domain:3001/health`n" "Cyan"
    
  Write-ColorOutput "4️⃣  Configure renovação automática:" "White"
  Write-ColorOutput "   .\scripts\setup-ssl-renewal.ps1 -Domain $Domain`n" "Cyan"
    
  Write-ColorOutput "5️⃣  Configure firewall AWS:" "White"
  Write-ColorOutput "   Libere portas: 80 (HTTP), 443 (HTTPS)" "Cyan"
  Write-ColorOutput "   Redirecione 80 → 443 (força HTTPS)`n" "Cyan"
    
  Write-ColorOutput "📁 Certificados salvos em:" "Yellow"
  Write-ColorOutput "   $CertsPath`n" "Cyan"
    
  Write-ColorOutput "⏰ IMPORTANTE: Renovação" "Yellow"
  Write-ColorOutput "   Certificados Let's Encrypt expiram em 90 dias" "White"
  Write-ColorOutput "   Configure renovação automática (próximo passo)!" "White"
  Write-ColorOutput "`n═══════════════════════════════════════════════════════`n" "Cyan"
}

# ============================================
# MAIN
# ============================================

try {
  Write-ColorOutput "`n═══════════════════════════════════════════════════════" "Cyan"
  Write-ColorOutput "  🔐 SETUP SSL/HTTPS - ConectCRM v$ScriptVersion" "Green"
  Write-ColorOutput "═══════════════════════════════════════════════════════`n" "Cyan"
    
  # 1. Verificar sistema operacional
  if (Test-IsWindows) {
    Write-ColorOutput "💻 Sistema: Windows" "Cyan"
  }
  elseif (Test-IsLinux) {
    Write-ColorOutput "🐧 Sistema: Linux" "Cyan"
  }
  else {
    throw "Sistema operacional não suportado"
  }
    
  # 2. Validar domínio
  Write-ColorOutput "🌐 Domínio: $Domain" "Cyan"
  Write-ColorOutput "📧 Email: $Email" "Cyan"
    
  if ($Staging) {
    Write-ColorOutput "⚠️  MODO STAGING ativado (apenas para testes)" "Yellow"
  }
    
  # 3. Instalar Certbot (se necessário)
  if (-not $SkipInstall) {
    if (Test-CertbotInstalled) {
      Write-ColorOutput "`n✅ Certbot já está instalado!" "Green"
      certbot --version
    }
    else {
      Write-ColorOutput "`n📦 Certbot não encontrado. Instalando..." "Yellow"
            
      if (Test-IsWindows) {
        Install-CertbotWindows
      }
      elseif (Test-IsLinux) {
        Install-CertbotLinux
      }
    }
  }
  else {
    Write-ColorOutput "`n⏭️  Pulando instalação do Certbot (--SkipInstall)" "Yellow"
  }
    
  # 4. Pré-requisitos
  Write-ColorOutput "`n⚠️  VERIFICAÇÃO DE PRÉ-REQUISITOS`n" "Yellow"
  Write-ColorOutput "Antes de continuar, certifique-se de que:" "White"
  Write-ColorOutput "  ✓ Porta 80 está LIBERADA no firewall" "Cyan"
  Write-ColorOutput "  ✓ DNS aponta para este servidor (A record)" "Cyan"
  Write-ColorOutput "  ✓ Nenhum serviço está usando porta 80" "Cyan"
  Write-ColorOutput "  ✓ Você tem permissões de administrador`n" "Cyan"
    
  $confirmation = Read-Host "Pré-requisitos atendidos? (S/N)"
  if ($confirmation -ne "S" -and $confirmation -ne "s") {
    Write-ColorOutput "`n❌ Operação cancelada pelo usuário" "Red"
    exit 1
  }
    
  # 5. Gerar certificado
  $certSuccess = Request-Certificate -Domain $Domain -Email $Email -IsStaging $Staging
    
  if (-not $certSuccess) {
    throw "Falha ao gerar certificado SSL"
  }
    
  # 6. Copiar certificados para o projeto
  $copySuccess = Copy-CertificatesToProject -Domain $Domain
    
  if (-not $copySuccess) {
    throw "Falha ao copiar certificados para o projeto"
  }
    
  # 7. Validar certificado
  Test-CertificateValidity -Domain $Domain
    
  # 8. Próximos passos
  Show-NextSteps -Domain $Domain
    
  Write-ColorOutput "✅ Script concluído com sucesso!" "Green"
  exit 0
    
}
catch {
  Write-ColorOutput "`n❌ ERRO: $_" "Red"
  Write-ColorOutput "`n📚 Consulte a documentação: scripts/README_SSL.md" "Yellow"
  exit 1
}
