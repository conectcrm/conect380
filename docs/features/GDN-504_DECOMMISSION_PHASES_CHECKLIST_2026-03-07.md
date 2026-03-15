# GDN-504 - Decommission legacy phases checklist

## Fase 1 - Freeze read-only
- [ ] Validar `GDN-503` com `scripts/ci/guardian-legacy-read-only-freeze-check.ps1`.
- [ ] Confirmar bloqueio de `POST/PUT/PATCH/DELETE` no legado.

## Fase 2 - Canary cutover 100%
- [ ] Validar flags: `scripts/ci/guardian-transition-flags-check.ps1 -Mode canary -CanaryPercent 100`.
- [ ] Monitorar erros/latencia e readiness do suporte.

## Fase 3 - Guardian only
- [ ] Validar flags: `scripts/ci/guardian-transition-flags-check.ps1 -Mode guardian_only -CanaryPercent 0`.
- [ ] Confirmar indisponibilidade intencional de `/admin/*` para operacao.

## Fase 4 - Protecao backend
- [ ] Executar suite do guard legado:
  - `npm --prefix backend run test -- modules/admin/guards/legacy-admin-transition.guard.spec.ts`
- [ ] Confirmar cenarios `guardian_only` e `read-only` com PASS.

## Fase 5 - Retirada de dependencias legadas
- [ ] Confirmar `deploy/guardian-web.host-nginx.conf` sem rota `/admin`.
- [ ] Confirmar `docker-compose.guardian-web.yml` sem referencia `admin-web`.
- [ ] Publicar evidencia final da execucao faseada em `docs/features/evidencias/`.
