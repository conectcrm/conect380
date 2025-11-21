#!/bin/bash

################################################################################
# 📦 ConectCRM - Sistema de Backup Automático PostgreSQL
# Descrição: Backup incremental diário com retenção inteligente e upload cloud
# Autor: ConectCRM DevOps Team
# Data: 2025-11-12
################################################################################

set -euo pipefail

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Diretórios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
LOG_DIR="${LOG_DIR:-$SCRIPT_DIR/../logs}"
TEMP_DIR="/tmp/conectcrm-backup-$$"

# Carrega variáveis do .env se existir
if [ -f "$SCRIPT_DIR/../.env" ]; then
  set -a
  source "$SCRIPT_DIR/../.env"
  set +a
fi

# Database (de .env ou default)
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-conectcrm}"
DB_USER="${DATABASE_USERNAME:-postgres}"
DB_PASSWORD="${DATABASE_PASSWORD:-postgres}"

# Backup settings
BACKUP_PREFIX="conectcrm-backup"
BACKUP_RETENTION_DAILY="${BACKUP_RETENTION_DAILY:-7}"    # 7 dias
BACKUP_RETENTION_WEEKLY="${BACKUP_RETENTION_WEEKLY:-4}"  # 4 semanas
BACKUP_RETENTION_MONTHLY="${BACKUP_RETENTION_MONTHLY:-12}" # 12 meses

# Cloud upload (opcional)
ENABLE_S3_UPLOAD="${ENABLE_S3_UPLOAD:-false}"
S3_BUCKET="${S3_BUCKET:-conectcrm-backups}"
S3_REGION="${S3_REGION:-us-east-1}"

ENABLE_AZURE_UPLOAD="${ENABLE_AZURE_UPLOAD:-false}"
AZURE_STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT:-}"
AZURE_CONTAINER="${AZURE_CONTAINER:-backups}"

# Notificações
ENABLE_SLACK_NOTIFICATIONS="${ENABLE_SLACK_NOTIFICATIONS:-false}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR: $*" | tee -a "$LOG_FILE" >&2
}

success() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ SUCCESS: $*" | tee -a "$LOG_FILE"
}

notify_slack() {
  if [ "$ENABLE_SLACK_NOTIFICATIONS" == "true" ] && [ -n "$SLACK_WEBHOOK_URL" ]; then
    local message="$1"
    local color="${2:-good}" # good (green), warning (yellow), danger (red)
    
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{
        \"attachments\": [{
          \"color\": \"$color\",
          \"title\": \"🗄️ ConectCRM Backup\",
          \"text\": \"$message\",
          \"footer\": \"$(hostname)\",
          \"ts\": $(date +%s)
        }]
      }" 2>/dev/null || true
  fi
}

cleanup() {
  log "Limpando arquivos temporários..."
  rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

# ============================================================================
# VERIFICAÇÕES PRÉ-BACKUP
# ============================================================================

check_prerequisites() {
  log "Verificando pré-requisitos..."
  
  # pg_dump
  if ! command -v pg_dump &> /dev/null; then
    error "pg_dump não encontrado. Instale: sudo apt-get install postgresql-client"
    exit 1
  fi
  
  # gzip
  if ! command -v gzip &> /dev/null; then
    error "gzip não encontrado. Instale: sudo apt-get install gzip"
    exit 1
  fi
  
  # Diretórios
  mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}
  mkdir -p "$LOG_DIR"
  mkdir -p "$TEMP_DIR"
  
  success "Pré-requisitos OK"
}

test_database_connection() {
  log "Testando conexão com banco de dados..."
  
  export PGPASSWORD="$DB_PASSWORD"
  
  if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --schema-only -f /dev/null 2>/dev/null; then
    success "Conexão com banco OK"
    return 0
  else
    error "Falha ao conectar no banco: $DB_HOST:$DB_PORT/$DB_NAME"
    return 1
  fi
}

# ============================================================================
# BACKUP
# ============================================================================

create_backup() {
  local backup_type="$1" # daily, weekly, monthly
  local timestamp=$(date '+%Y%m%d_%H%M%S')
  local backup_file="$BACKUP_DIR/$backup_type/${BACKUP_PREFIX}_${backup_type}_${timestamp}.sql.gz"
  
  log "Criando backup $backup_type: $(basename $backup_file)"
  
  export PGPASSWORD="$DB_PASSWORD"
  
  # Backup com pg_dump (formato custom, compressão)
  if pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --verbose \
    2>> "$LOG_FILE" | gzip > "$backup_file"; then
    
    local size=$(du -h "$backup_file" | cut -f1)
    success "Backup criado: $(basename $backup_file) ($size)"
    
    # Metadata
    echo "{
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"type\": \"$backup_type\",
  \"database\": \"$DB_NAME\",
  \"host\": \"$DB_HOST\",
  \"size\": \"$size\",
  \"file\": \"$(basename $backup_file)\"
}" > "${backup_file}.meta.json"
    
    echo "$backup_file"
    return 0
  else
    error "Falha ao criar backup"
    return 1
  fi
}

verify_backup() {
  local backup_file="$1"
  
  log "Verificando integridade do backup..."
  
  # Testa se é gzip válido
  if gzip -t "$backup_file" 2>/dev/null; then
    # Testa se tem conteúdo SQL válido
    if zcat "$backup_file" | head -n 20 | grep -q "PostgreSQL database dump"; then
      success "Backup íntegro"
      return 0
    fi
  fi
  
  error "Backup corrompido: $backup_file"
  return 1
}

# ============================================================================
# UPLOAD CLOUD
# ============================================================================

upload_to_s3() {
  local file="$1"
  
  if [ "$ENABLE_S3_UPLOAD" != "true" ]; then
    return 0
  fi
  
  log "Upload para S3: s3://$S3_BUCKET/$(basename $file)"
  
  if command -v aws &> /dev/null; then
    if aws s3 cp "$file" "s3://$S3_BUCKET/" --region "$S3_REGION" 2>> "$LOG_FILE"; then
      success "Upload S3 completo"
      
      # Upload metadata
      aws s3 cp "${file}.meta.json" "s3://$S3_BUCKET/" --region "$S3_REGION" 2>> "$LOG_FILE" || true
      return 0
    else
      error "Falha no upload S3"
      return 1
    fi
  else
    error "AWS CLI não instalado. Ignorando upload S3."
    return 1
  fi
}

upload_to_azure() {
  local file="$1"
  
  if [ "$ENABLE_AZURE_UPLOAD" != "true" ]; then
    return 0
  fi
  
  log "Upload para Azure Blob Storage..."
  
  if command -v az &> /dev/null; then
    if az storage blob upload \
      --account-name "$AZURE_STORAGE_ACCOUNT" \
      --container-name "$AZURE_CONTAINER" \
      --name "$(basename $file)" \
      --file "$file" \
      --auth-mode login 2>> "$LOG_FILE"; then
      
      success "Upload Azure completo"
      
      # Upload metadata
      az storage blob upload \
        --account-name "$AZURE_STORAGE_ACCOUNT" \
        --container-name "$AZURE_CONTAINER" \
        --name "$(basename ${file}.meta.json)" \
        --file "${file}.meta.json" \
        --auth-mode login 2>> "$LOG_FILE" || true
      return 0
    else
      error "Falha no upload Azure"
      return 1
    fi
  else
    error "Azure CLI não instalado. Ignorando upload Azure."
    return 1
  fi
}

# ============================================================================
# RETENÇÃO (ROTAÇÃO)
# ============================================================================

rotate_backups() {
  log "Aplicando política de retenção..."
  
  # Daily: mantém últimos N dias
  find "$BACKUP_DIR/daily" -name "${BACKUP_PREFIX}_daily_*.sql.gz" -type f -mtime +$BACKUP_RETENTION_DAILY -delete 2>/dev/null || true
  find "$BACKUP_DIR/daily" -name "${BACKUP_PREFIX}_daily_*.meta.json" -type f -mtime +$BACKUP_RETENTION_DAILY -delete 2>/dev/null || true
  
  # Weekly: mantém últimas N semanas
  find "$BACKUP_DIR/weekly" -name "${BACKUP_PREFIX}_weekly_*.sql.gz" -type f -mtime +$((BACKUP_RETENTION_WEEKLY * 7)) -delete 2>/dev/null || true
  find "$BACKUP_DIR/weekly" -name "${BACKUP_PREFIX}_weekly_*.meta.json" -type f -mtime +$((BACKUP_RETENTION_WEEKLY * 7)) -delete 2>/dev/null || true
  
  # Monthly: mantém últimos N meses
  find "$BACKUP_DIR/monthly" -name "${BACKUP_PREFIX}_monthly_*.sql.gz" -type f -mtime +$((BACKUP_RETENTION_MONTHLY * 30)) -delete 2>/dev/null || true
  find "$BACKUP_DIR/monthly" -name "${BACKUP_PREFIX}_monthly_*.meta.json" -type f -mtime +$((BACKUP_RETENTION_MONTHLY * 30)) -delete 2>/dev/null || true
  
  success "Retenção aplicada: Daily=$BACKUP_RETENTION_DAILY dias, Weekly=$BACKUP_RETENTION_WEEKLY semanas, Monthly=$BACKUP_RETENTION_MONTHLY meses"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
  local today=$(date '+%Y-%m-%d')
  local day_of_week=$(date '+%u')  # 1=Monday, 7=Sunday
  local day_of_month=$(date '+%d')
  
  LOG_FILE="$LOG_DIR/backup_${today}.log"
  
  log "=========================================="
  log "🗄️  ConectCRM Backup Automático"
  log "=========================================="
  log "Data: $today"
  log "Banco: $DB_HOST:$DB_PORT/$DB_NAME"
  log "Diretório: $BACKUP_DIR"
  
  # Verificações
  check_prerequisites
  
  if ! test_database_connection; then
    error "Abortando backup devido a falha na conexão"
    notify_slack "❌ Backup FALHOU: Erro de conexão com banco de dados" "danger"
    exit 1
  fi
  
  # Determina tipo de backup
  local backup_type="daily"
  
  # Backup semanal: Domingo (7) ou segunda (1)
  if [ "$day_of_week" == "7" ]; then
    backup_type="weekly"
  fi
  
  # Backup mensal: Primeiro dia do mês
  if [ "$day_of_month" == "01" ]; then
    backup_type="monthly"
  fi
  
  log "Tipo de backup: $backup_type"
  
  # Cria backup
  if backup_file=$(create_backup "$backup_type"); then
    
    # Verifica integridade
    if verify_backup "$backup_file"; then
      
      # Upload cloud (se habilitado)
      upload_to_s3 "$backup_file" || true
      upload_to_azure "$backup_file" || true
      
      # Rotação
      rotate_backups
      
      success "Backup concluído com sucesso!"
      notify_slack "✅ Backup $backup_type concluído: $(basename $backup_file)" "good"
      
      exit 0
    else
      error "Backup falhou na verificação"
      notify_slack "❌ Backup $backup_type FALHOU: Arquivo corrompido" "danger"
      exit 1
    fi
  else
    error "Falha ao criar backup"
    notify_slack "❌ Backup $backup_type FALHOU: Erro ao criar arquivo" "danger"
    exit 1
  fi
}

# Executa
main "$@"
