# MVP Rollout Wave 1

Data: 2026-02-18
Escopo: ativacao comercial controlada para os primeiros clientes

## 1) Preparacao da janela (D-0)
- [ ] Confirmar `GO` em `.production/MVP_GO_NO_GO_2026-02-17.md`.
- [ ] Confirmar branch protection em `main` e `develop`.
- [ ] Definir lista da onda 1 (3 a 5 clientes) com dono comercial e tecnico.
- [ ] Publicar canal de incidentes e responsavel de on-call da janela.

## 2) Ativacao (D+1)
- [ ] Habilitar clientes da onda 1.
- [ ] Executar smoke manual rapido por cliente:
  - [ ] Login e contexto da empresa
  - [ ] Criacao de lead
  - [ ] Movimentacao de pipeline
  - [ ] Criacao e consulta de proposta
  - [ ] Ticket e atualizacao de status
- [ ] Registrar evidencias em `evidence.csv` da sessao piloto.

## 3) Monitoramento intensivo (primeiras 48h)
- [ ] Rodar ciclo tecnico periodico:
  - [ ] `.\.production\scripts\run-mvp-pilot-cycle.ps1 -RunDir ".production\pilot-runs\20260217-174413-piloto-comercial-lote-1-full"`
- [ ] Monitorar logs:
  - [ ] `docker compose logs -f backend`
  - [ ] `docker compose logs -f frontend`
- [ ] Monitorar erros de autenticacao e isolamento multi-tenant.

## 4) Gate de continuidade
Continuar ampliando a base somente se:
- [ ] Sem incidente P0 de isolamento.
- [ ] Sem bloqueio em fluxo core do MVP.
- [ ] Taxa operacional >= 95% no recorte da janela.

## 5) Criterio de pausa (rollback comercial)
Pausar novas ativacoes se ocorrer:
- [ ] Incidente P0 de isolamento multi-tenant.
- [ ] Regressao critica em login/contexto.
- [ ] Falha recorrente em fluxo core (lead/pipeline/proposta/atendimento).

## 6) Fechamento da onda
- [ ] Reexecutar readiness:
  - [ ] `.\.production\scripts\assess-mvp-pilot-readiness.ps1 -RunDir ".production\pilot-runs\20260217-174413-piloto-comercial-lote-1-full" -BranchProtectionStatus Applied`
- [ ] Publicar decisao da proxima onda (`GO`/`GO_CONDICIONAL`/`PAUSE`).
