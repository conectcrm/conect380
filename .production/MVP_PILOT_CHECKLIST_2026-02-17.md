# MVP Pilot Checklist

Data: 2026-02-17

## 1) Entrada do piloto
- [ ] Executar kickoff da sessao:
  - [ ] `.\.production\scripts\start-mvp-pilot.ps1 -PilotName "piloto-comercial-lote-1" -SkipPreflight`
- [ ] `preflight-mvp-go-live.ps1` em verde
- [ ] `smoke-mvp-core.ps1` em verde
- [ ] `smoke-mvp-ui.ps1` em verde
- [ ] Branch protection aplicada em `main` e `develop`

## 2) Selecao de clientes piloto
- [ ] Gerar base inicial por atividade:
  - [ ] `.\.production\scripts\recommend-mvp-pilot-clients.ps1 -RunDir "<pasta-da-sessao>"`
- [ ] Classificar candidatos:
  - [ ] `SUGERIDO` = apto para convite imediato
  - [ ] `REVISAR_CONTATO` = validar contato de negocio antes do convite
  - [ ] `REVISAR_PERFIL` = validar se conta demo/homolog pode entrar na janela
- [ ] Revisar e resolver pendencias de `REVISAR_PERFIL`:
  - [ ] `.\.production\scripts\review-mvp-pilot-profiles.ps1 -RunDir "<pasta-da-sessao>" -Reviewer "time-comercial" -MinScore 1`
- [ ] Definir 3 a 5 clientes com perfil de uso ativo (atendimento + comercial)
- [ ] Confirmar contato tecnico e contato de negocio por cliente
- [ ] Validar janela de observacao (minimo 48h)
- [ ] Finalizar contatos e janela da sessao:
  - [ ] `.\.production\scripts\finalize-mvp-pilot-clients.ps1 -RunDir "<pasta-da-sessao>" -WindowStart "2026-02-18 09:00" -WindowHours 48`
- [ ] Gerar plano de outreach para o comercial:
  - [ ] `.\.production\scripts\prepare-mvp-pilot-outreach.ps1 -RunDir "<pasta-da-sessao>" -Owner "time-comercial"`

## 3) Roteiro operacional do piloto
- [ ] Habilitar clientes piloto em janela controlada
- [ ] Executar roteiro funcional:
  - [ ] Login e contexto da empresa
  - [ ] Criar lead
  - [ ] Movimentar pipeline
  - [ ] Criar e consultar proposta
  - [ ] Abrir ticket, responder, alterar status
- [ ] Registrar evidencias (timestamp, cliente, resultado, erro)
  - [ ] Usar `.\.production\scripts\record-mvp-pilot-evidence.ps1`

## 4) Monitoramento intensivo
- [ ] Monitorar logs backend (`docker compose logs -f backend`)
- [ ] Monitorar erros de autenticacao e autorizacao
- [ ] Monitorar falhas de isolamento multi-tenant
- [ ] Monitorar latencia e disponibilidade dos fluxos core
- [ ] Executar ciclo tecnico automatizado e validar resumo:
  - [ ] `.\.production\scripts\run-mvp-pilot-cycle.ps1 -RunDir "<pasta-da-sessao>"`

## 5) Criterios de aprovacao
- [ ] 0 incidente P0 de isolamento multi-tenant
- [ ] 0 bloqueio em fluxo core (leads/pipeline/propostas/atendimento)
- [ ] Taxa de sucesso operacional >= 95% nos cenarios do piloto
- [ ] Sem regressao critica em autenticacao/contexto de empresa
- [ ] Rodar readiness automatizado sem blockers:
  - [ ] `.\.production\scripts\assess-mvp-pilot-readiness.ps1 -RunDir "<pasta-da-sessao>" -BranchProtectionStatus Applied`

## 6) Rollback
- [ ] Se houver incidente P0, interromper rollout para novos clientes
- [ ] Preservar evidencias (logs + passos para reproducao)
- [ ] Classificar incidente, corrigir e rerodar smoke antes de retomar
