#!/bin/bash

# =====================================================
# Script: can-deploy.sh
# Descrição: Verifica se deploy é permitido (wrapper para CI/CD)
# Exit Codes:
#   0 = Deploy permitido
#   1 = Deploy bloqueado (warning)
#   2 = Deploy bloqueado (freeze)
#   3 = Deploy bloqueado (budget esgotado)
# =====================================================

set -euo pipefail

# ==============================
# CONFIGURAÇÕES
# ==============================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_SCRIPT="${SCRIPT_DIR}/check-error-budget.sh"

# ==============================
# CORES
# ==============================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ==============================
# FUNÇÕES
# ==============================

log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# ==============================
# VERIFICAR SE SCRIPT EXISTE
# ==============================

if [ ! -f "$CHECK_SCRIPT" ]; then
    echo -e "${RED}ERROR: check-error-budget.sh not found at $CHECK_SCRIPT${NC}" >&2
    exit 99
fi

# ==============================
# EXECUTAR VERIFICAÇÃO
# ==============================

log "Checking error budget status..."
echo ""

# Executar check-error-budget.sh e capturar exit code
set +e
SAVE_JSON=true OUTPUT_FILE=/tmp/error-budget-status.json bash "$CHECK_SCRIPT"
EXIT_CODE=$?
set -e

echo ""

# ==============================
# INTERPRETAR RESULTADO
# ==============================

case $EXIT_CODE in
    0)
        echo -e "${GREEN}✅ DEPLOY PERMITTED${NC}"
        echo ""
        echo "Error budget is sufficient. Deploy can proceed."
        exit 0
        ;;
    1)
        echo -e "${YELLOW}⚠️  DEPLOY WITH CAUTION${NC}"
        echo ""
        echo "Error budget is in WARNING state."
        echo "Only emergency fixes should be deployed."
        echo ""
        echo "To override, set environment variable:"
        echo "  export OVERRIDE_DEPLOY=true"
        echo ""
        
        if [ "${OVERRIDE_DEPLOY:-false}" = "true" ]; then
            echo -e "${YELLOW}⚠️  OVERRIDE ACTIVE - Deploy proceeding${NC}"
            exit 0
        else
            echo -e "${RED}🚫 DEPLOY BLOCKED${NC}"
            exit 1
        fi
        ;;
    2)
        echo -e "${RED}🚫 DEPLOY FREEZE ACTIVE${NC}"
        echo ""
        echo "Error budget is critically low (<20%)."
        echo "Only critical security/availability fixes allowed."
        echo ""
        echo "To proceed, you MUST:"
        echo "  1. Get approval from CTO"
        echo "  2. Document reason in postmortem"
        echo "  3. Set: export OVERRIDE_DEPLOY_FREEZE=true"
        echo ""
        
        if [ "${OVERRIDE_DEPLOY_FREEZE:-false}" = "true" ]; then
            echo -e "${YELLOW}⚠️  FREEZE OVERRIDE ACTIVE - Deploy proceeding${NC}"
            echo -e "${YELLOW}   This action will be logged and audited.${NC}"
            
            # Log override para auditoria
            echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] FREEZE OVERRIDE by ${USER:-unknown} on ${HOSTNAME:-unknown}" >> /var/log/deploy-freeze-overrides.log 2>/dev/null || true
            
            exit 0
        else
            echo -e "${RED}🚫 DEPLOY BLOCKED${NC}"
            exit 2
        fi
        ;;
    3)
        echo -e "${RED}🚫 ERROR BUDGET EXHAUSTED${NC}"
        echo ""
        echo "SLO has been violated. Error budget is NEGATIVE."
        echo "NO DEPLOYS ALLOWED except with CTO approval."
        echo ""
        echo "Actions required:"
        echo "  1. Investigate SLO violation"
        echo "  2. Create postmortem"
        echo "  3. Wait for error budget to recover"
        echo "  4. Get explicit CTO approval for any deploy"
        echo ""
        
        if [ "${OVERRIDE_BUDGET_EXHAUSTED:-false}" = "true" ]; then
            echo -e "${RED}⚠️  EXHAUSTED BUDGET OVERRIDE ACTIVE${NC}"
            echo -e "${RED}   This is a HIGH-RISK action and will be audited.${NC}"
            
            # Log override com severidade alta
            echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] EXHAUSTED BUDGET OVERRIDE by ${USER:-unknown} on ${HOSTNAME:-unknown} - REQUIRES INVESTIGATION" >> /var/log/deploy-freeze-overrides.log 2>/dev/null || true
            
            exit 0
        else
            echo -e "${RED}🚫 DEPLOY BLOCKED${NC}"
            exit 3
        fi
        ;;
    99)
        echo -e "${RED}ERROR: Failed to check error budget${NC}" >&2
        echo ""
        echo "Possible causes:"
        echo "  - Prometheus is down"
        echo "  - Network connectivity issues"
        echo "  - Missing dependencies (curl, jq, bc)"
        echo ""
        echo "To bypass (NOT RECOMMENDED), set:"
        echo "  export BYPASS_ERROR_BUDGET_CHECK=true"
        echo ""
        
        if [ "${BYPASS_ERROR_BUDGET_CHECK:-false}" = "true" ]; then
            echo -e "${YELLOW}⚠️  ERROR BUDGET CHECK BYPASSED${NC}"
            echo -e "${YELLOW}   Proceeding without error budget verification.${NC}"
            exit 0
        else
            echo -e "${RED}🚫 DEPLOY BLOCKED DUE TO CHECK FAILURE${NC}"
            exit 99
        fi
        ;;
    *)
        echo -e "${RED}ERROR: Unexpected exit code: $EXIT_CODE${NC}" >&2
        exit $EXIT_CODE
        ;;
esac
