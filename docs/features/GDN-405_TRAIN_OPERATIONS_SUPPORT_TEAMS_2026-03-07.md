# GDN-405 - Train operations and support teams

## Data
- 2026-03-07

## Objetivo
- Formalizar treinamento operacional N1/N2/N3 para resposta a incidentes Guardian durante piloto.

## Implementacao
- Plano de treinamento:
  - `docs/features/GDN-405_TRAINING_PLAN_N1_N2_N3_2026-03-07.md`
- Roteiro de exercicios praticos:
  - `docs/features/GDN-405_EXERCICIOS_PRACTICOS_GUARDIAN_2026-03-07.md`
- Template de registro e aceite:
  - `docs/features/GDN-405_REGISTRO_TREINAMENTO_TEMPLATE_2026-03-07.md`
- Check de integridade do pacote:
  - `scripts/ci/guardian-support-training-pack-check.ps1`

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-support-training-pack-check.ps1`
- Resultado: PASS
