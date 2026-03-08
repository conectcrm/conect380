# Guardian Proxy Routing Gap - 2026-03-07

## Resumo executivo
- O backend Guardian está funcional no host `192.168.200.44` na porta `3001`.
- O readiness consolidado em modo real foi aprovado em `http://192.168.200.44:3001`.
- A falha observada em `http://192.168.200.44:3000` não é de regra de negócio: é de roteamento/proxy.

## Evidências
- PASS (readiness real em `:3001`):
  - `docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_REAL_20260307-212826.md`
- FAIL (readiness real em `:3000`, GDN-506 com 404 em `/guardian/bff/*`):
  - `docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_REAL_20260307-212521.md`
  - `docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_GDN506_20260307-212521.md`

## Diagnóstico técnico
- `POST /auth/login` em `:3000` funciona.
- Endpoints Guardian (`/guardian/bff/*`) retornam `404` quando consumidos via `:3000`.
- Os mesmos endpoints retornam `200` via `:3001`.
- Conclusão: o frontend/proxy em `:3000` não está encaminhando namespace Guardian para o backend.

## Ação necessária
- Ajustar configuração de proxy/rewrite do frontend web em `:3000` para encaminhar:
  - `/guardian/*` (ou especificamente `/guardian/bff/*`) para `http://192.168.200.44:3001`.
- Após ajuste, reexecutar:
  - `scripts/ci/guardian-production-readiness-real-check.ps1 -BaseUrl http://192.168.200.44:3000 -Email <...> -Senha <...>`

## Critério de fechamento
- Readiness consolidado em `:3000` com `Status: PASS`.
