# GDN-406 - Validation light peak load test

## Data
- 2026-03-07

## Objetivo
- Executar perfil de carga leve em janelas de pico esperado e medir latencia/erro por endpoint critico Guardian.

## Implementacao
- Harness de carga leve publicado:
  - `scripts/test-guardian-light-peak-load.ps1`
- Check CI de validacao publicado:
  - `scripts/ci/guardian-light-peak-load-check.ps1`

## Endpoints cobertos
- `/health`
- `/guardian/bff/overview`
- `/guardian/bff/billing/subscriptions`
- `/guardian/bff/audit/critical`

## Indicadores coletados
- total de requests por endpoint
- taxa de erro
- latencia media
- latencia p95
- latencia maxima

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-light-peak-load-check.ps1`
- Resultado: PASS
