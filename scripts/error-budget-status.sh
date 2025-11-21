#!/bin/bash

# =====================================================
# Script: error-budget-status.sh
# Descrição: Exibe status do error budget (CLI tool)
# Uso: ./error-budget-status.sh [--json] [--watch]
# =====================================================

set -euo pipefail

# ==============================
# CONFIGURAÇÕES
# ==============================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_SCRIPT="${SCRIPT_DIR}/check-error-budget.sh"

# ==============================
# PARSE ARGUMENTOS
# ==============================

JSON_OUTPUT=false
WATCH_MODE=false
WATCH_INTERVAL=30

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --interval)
            WATCH_INTERVAL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --json              Output in JSON format"
            echo "  --watch             Watch mode (continuous updates)"
            echo "  --interval SECONDS  Update interval for watch mode (default: 30)"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                  # Check status once"
            echo "  $0 --json           # Output JSON"
            echo "  $0 --watch          # Watch mode"
            echo "  $0 --watch --interval 60  # Watch with 60s interval"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# ==============================
# VERIFICAR SE SCRIPT EXISTE
# ==============================

if [ ! -f "$CHECK_SCRIPT" ]; then
    echo "ERROR: check-error-budget.sh not found at $CHECK_SCRIPT" >&2
    exit 1
fi

# ==============================
# FUNÇÃO DE EXIBIÇÃO
# ==============================

run_check() {
    if [ "$JSON_OUTPUT" = true ]; then
        # Output JSON
        SAVE_JSON=true OUTPUT_FILE=/dev/stdout bash "$CHECK_SCRIPT" 2>/dev/null || true
    else
        # Output colorido
        bash "$CHECK_SCRIPT" || true
    fi
}

# ==============================
# MODO WATCH
# ==============================

if [ "$WATCH_MODE" = true ]; then
    echo "Watching error budget status (interval: ${WATCH_INTERVAL}s)"
    echo "Press Ctrl+C to stop"
    echo ""
    
    while true; do
        clear
        run_check
        sleep "$WATCH_INTERVAL"
    done
else
    # Execução única
    run_check
fi
