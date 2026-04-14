# GDN-516 - Final acceptance legacy decommission

- RunId: 20260307-211844
- Inicio: 2026-03-07 21:18:44
- Fim: 2026-03-07 21:19:00
- DuracaoSegundos: 16.73
- Status: PASS

## Steps
- [PASS] legacy_decommission_phases :: exitCode=0
- [PASS] guardian_only_transition_mode :: exitCode=0
- [PASS] guardian_operational_smoke :: exitCode=0
- [PASS] guardian_surface_without_admin_routes :: exitCode=1
- [PASS] legacy_backup_page_removed :: exitCode=0

## Evidencias

### legacy_decommission_phases
```text
[GDN-504] Executando decommission legado em fases controladas...

===============================================
 GDN-504 - Legacy decommission phased execution
===============================================
RunId: 20260307-211844
DryRun: True

Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN504_LEGACY_DECOMMISSION_CHECK_20260307-211844.md
[GDN-504] Decommission legado validado com sucesso.
 - Relatorio: docs/features/evidencias/GDN504_LEGACY_DECOMMISSION_CHECK_20260307-211844.md
```

### guardian_only_transition_mode
```text
Guardian transition flags validadas com sucesso.
 - Mode: guardian_only
 - CanaryPercent: 0
 - Resultado: todo /admin/* bloqueado; somente /guardian/* permitido.
```

### guardian_operational_smoke
```text
[GDN-506] Executando validacao da suite diaria de smoke...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN506_DAILY_SMOKE_CHECK_20260307-211900.md
[GDN-506] Validacao da suite diaria de smoke concluida com sucesso.
 - Relatorio: docs/features/evidencias/GDN506_DAILY_SMOKE_CHECK_20260307-211900.md
```

### guardian_surface_without_admin_routes
```text

```

### legacy_backup_page_removed
```text
Arquivo legado removido.
```

## Resultado
- Aceite final de descomissionamento legado validado com sucesso.
