#!/bin/bash

# =====================================================
# Script: check-error-budget.sh
# Descrição: Verifica status do error budget no Prometheus
# Retorna: Status e percentual de budget restante
# =====================================================

set -euo pipefail

# ==============================
# CONFIGURAÇÕES
# ==============================

PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
SLO_TARGET="${SLO_TARGET:-99.9}"  # 99.9% availability
TIME_WINDOW="${TIME_WINDOW:-30d}" # 30 dias

# Thresholds para status
FREEZE_THRESHOLD=20   # <20% = Deploy FREEZE
WARNING_THRESHOLD=50  # 20-50% = Warning
CAUTION_THRESHOLD=80  # 50-80% = Caution
                      # >80% = Normal

# ==============================
# CORES PARA OUTPUT
# ==============================

RED='\033[0;31m'
YELLOW='\033[1;33m'
ORANGE='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# ==============================
# FUNÇÕES AUXILIARES
# ==============================

log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# ==============================
# QUERY PROMETHEUS
# ==============================

query_prometheus() {
    local query=$1
    local url="${PROMETHEUS_URL}/api/v1/query?query=${query}"
    
    log "Querying Prometheus: $query"
    
    local response=$(curl -s "$url")
    local status=$(echo "$response" | jq -r '.status')
    
    if [ "$status" != "success" ]; then
        error "Prometheus query failed: $response"
        return 1
    fi
    
    local value=$(echo "$response" | jq -r '.data.result[0].value[1] // "null"')
    
    if [ "$value" = "null" ]; then
        error "No data returned from Prometheus"
        return 1
    fi
    
    echo "$value"
}

# ==============================
# CALCULAR ERROR BUDGET
# ==============================

calculate_error_budget() {
    log "Calculating error budget for $TIME_WINDOW window..."
    
    # Query: (1 - (sum(rate(http_requests_total{status=~"5.."}[30d])) / sum(rate(http_requests_total[30d])))) * 100
    local query="(1 - (sum(rate(http_requests_total{status=~\"5..\"}[${TIME_WINDOW}])) / sum(rate(http_requests_total[${TIME_WINDOW}])))) * 100"
    
    local availability=$(query_prometheus "$query")
    
    if [ -z "$availability" ]; then
        error "Failed to calculate availability"
        return 1
    fi
    
    # Calcular percentual de budget restante
    # Budget restante = (Availability atual - SLO target) / (100 - SLO target) * 100
    # Ex: Availability=99.95%, SLO=99.9% → (99.95-99.9)/(100-99.9)*100 = 50% restante
    local slo_margin=$(echo "100 - $SLO_TARGET" | bc -l)
    local current_margin=$(echo "$availability - $SLO_TARGET" | bc -l)
    local budget_remaining=$(echo "scale=2; ($current_margin / $slo_margin) * 100" | bc -l)
    
    # Se availability < SLO, budget é negativo (esgotado)
    if (( $(echo "$availability < $SLO_TARGET" | bc -l) )); then
        budget_remaining=-100
    fi
    
    echo "$budget_remaining"
}

# ==============================
# DETERMINAR STATUS DE DEPLOY
# ==============================

determine_status() {
    local budget=$1
    
    if (( $(echo "$budget < 0" | bc -l) )); then
        echo "EXHAUSTED"
    elif (( $(echo "$budget < $FREEZE_THRESHOLD" | bc -l) )); then
        echo "FREEZE"
    elif (( $(echo "$budget < $WARNING_THRESHOLD" | bc -l) )); then
        echo "WARNING"
    elif (( $(echo "$budget < $CAUTION_THRESHOLD" | bc -l) )); then
        echo "CAUTION"
    else
        echo "NORMAL"
    fi
}

# ==============================
# CALCULAR DIAS ATÉ ESGOTAMENTO
# ==============================

calculate_days_to_exhaustion() {
    local budget=$1
    
    # Query burn rate (1h window)
    local query="sum(rate(http_requests_total{status=~\"5..\"}[1h])) / sum(rate(http_requests_total[1h]))"
    local burn_rate=$(query_prometheus "$query")
    
    if [ -z "$burn_rate" ]; then
        echo "N/A"
        return
    fi
    
    # Se burn rate = 0, budget nunca esgota
    if (( $(echo "$burn_rate == 0" | bc -l) )); then
        echo "∞"
        return
    fi
    
    # Calcular dias = budget_restante / burn_rate
    local days=$(echo "scale=1; ($budget / 100) / ($burn_rate * 24)" | bc -l)
    
    echo "$days"
}

# ==============================
# EXIBIR RESULTADO
# ==============================

display_result() {
    local budget=$1
    local status=$2
    local days=$3
    
    echo ""
    echo "======================================"
    echo "  ERROR BUDGET STATUS"
    echo "======================================"
    echo ""
    
    # Formatar budget com 2 casas decimais
    local budget_formatted=$(printf "%.2f" "$budget")
    
    case "$status" in
        EXHAUSTED)
            echo -e "${RED}Status: 🚫 BUDGET EXHAUSTED${NC}"
            echo -e "${RED}Budget Remaining: $budget_formatted% (NEGATIVE)${NC}"
            ;;
        FREEZE)
            echo -e "${RED}Status: 🚫 DEPLOY FREEZE${NC}"
            echo -e "${RED}Budget Remaining: $budget_formatted%${NC}"
            ;;
        WARNING)
            echo -e "${ORANGE}Status: ⚠️  WARNING${NC}"
            echo -e "${ORANGE}Budget Remaining: $budget_formatted%${NC}"
            ;;
        CAUTION)
            echo -e "${YELLOW}Status: ⚠️  CAUTION${NC}"
            echo -e "${YELLOW}Budget Remaining: $budget_formatted%${NC}"
            ;;
        NORMAL)
            echo -e "${GREEN}Status: ✅ NORMAL${NC}"
            echo -e "${GREEN}Budget Remaining: $budget_formatted%${NC}"
            ;;
    esac
    
    echo "Days to Exhaustion: $days"
    echo "SLO Target: ${SLO_TARGET}%"
    echo "Time Window: $TIME_WINDOW"
    echo ""
    echo "======================================"
    echo "  DEPLOY POLICY"
    echo "======================================"
    echo ""
    
    case "$status" in
        EXHAUSTED)
            echo -e "${RED}🚫 NO DEPLOYS ALLOWED${NC}"
            echo "Budget is EXHAUSTED. Only emergency fixes with CTO approval."
            ;;
        FREEZE)
            echo -e "${RED}🚫 DEPLOY FREEZE ACTIVE${NC}"
            echo "Only critical security/availability fixes allowed."
            echo "All changes require CTO approval."
            ;;
        WARNING)
            echo -e "${ORANGE}⚠️  RELIABILITY FOCUS MODE${NC}"
            echo "Emergency fixes only. No new features."
            echo "Review ALL changes carefully."
            ;;
        CAUTION)
            echo -e "${YELLOW}⚠️  REDUCED DEPLOY FREQUENCY${NC}"
            echo "Limit to 1-2 deploys/day."
            echo "Extra caution required."
            ;;
        NORMAL)
            echo -e "${GREEN}✅ NORMAL OPERATIONS${NC}"
            echo "Multiple deploys/day allowed."
            echo "Standard review process."
            ;;
    esac
    
    echo ""
}

# ==============================
# SALVAR RESULTADO EM JSON
# ==============================

save_json() {
    local budget=$1
    local status=$2
    local days=$3
    local output_file="${OUTPUT_FILE:-/tmp/error-budget-status.json}"
    
    cat > "$output_file" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "error_budget": {
    "remaining_percent": $(printf "%.2f" "$budget"),
    "status": "$status",
    "days_to_exhaustion": "$days"
  },
  "slo": {
    "target_percent": $SLO_TARGET,
    "time_window": "$TIME_WINDOW"
  },
  "thresholds": {
    "freeze": $FREEZE_THRESHOLD,
    "warning": $WARNING_THRESHOLD,
    "caution": $CAUTION_THRESHOLD
  },
  "deploy_allowed": $([ "$status" = "NORMAL" ] || [ "$status" = "CAUTION" ] && echo "true" || echo "false")
}
EOF
    
    log "Result saved to $output_file"
}

# ==============================
# EXIT CODE BASEADO EM STATUS
# ==============================

get_exit_code() {
    local status=$1
    
    case "$status" in
        EXHAUSTED) echo 3 ;;
        FREEZE)    echo 2 ;;
        WARNING)   echo 1 ;;
        CAUTION)   echo 0 ;;
        NORMAL)    echo 0 ;;
        *)         echo 99 ;;
    esac
}

# ==============================
# MAIN
# ==============================

main() {
    log "Starting error budget check..."
    
    # Verificar dependências
    command -v curl >/dev/null 2>&1 || { error "curl is required but not installed."; exit 1; }
    command -v jq >/dev/null 2>&1 || { error "jq is required but not installed."; exit 1; }
    command -v bc >/dev/null 2>&1 || { error "bc is required but not installed."; exit 1; }
    
    # Calcular error budget
    budget=$(calculate_error_budget)
    
    if [ -z "$budget" ]; then
        error "Failed to calculate error budget"
        exit 99
    fi
    
    # Determinar status
    status=$(determine_status "$budget")
    
    # Calcular dias até esgotamento
    days=$(calculate_days_to_exhaustion "$budget")
    
    # Exibir resultado
    display_result "$budget" "$status" "$days"
    
    # Salvar JSON (se solicitado)
    if [ "${SAVE_JSON:-false}" = "true" ]; then
        save_json "$budget" "$status" "$days"
    fi
    
    # Retornar exit code apropriado
    exit_code=$(get_exit_code "$status")
    exit "$exit_code"
}

# ==============================
# EXECUTAR
# ==============================

main "$@"
