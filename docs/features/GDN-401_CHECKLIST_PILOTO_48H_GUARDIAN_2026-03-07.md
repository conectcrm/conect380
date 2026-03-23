# GDN-401 - Checklist piloto 48h Guardian

## 1. Identificacao

- Janela inicio:
- Janela fim:
- Responsavel operacoes:
- Responsavel suporte:
- Responsavel engenharia:
- Canal de incidente:

## 2. Preparacao pre-piloto

- [ ] Coorte definida em `GDN-401_COHORT_PILOTO_GUARDIAN_2026-03-07.csv`.
- [ ] Owners de cada conta piloto confirmados.
- [ ] Runbook de incidente revisado com N1/N2/N3.
- [ ] Comando de smoke validado em dry-run.
- [ ] Canal de comunicacao de status combinado.

## 3. Smoke inicial (T+30 min)

- [ ] Health da API Guardian ok.
- [ ] Dashboard Guardian responde sem erro.
- [ ] Listagem de empresas funcional.
- [ ] Operacoes de billing disponiveis.
- [ ] Auditoria critica listando dados.

## 4. Janela de monitoramento

### T+2 h
- [ ] Sem incidente P0/P1.
- [ ] Sem falha recorrente de autenticacao/MFA.
- [ ] Sem falha critica de latencia em endpoints Guardian.

### T+8 h
- [ ] Operacao das contas piloto confirmada.
- [ ] Sem bloqueio de rotina administrativa.

### T+24 h
- [ ] Sem regressao de governanca.
- [ ] Sem divergencia critica em operacoes de billing.

### T+48 h
- [ ] Estabilidade mantida.
- [ ] Incidentes (se houver) mitigados e documentados.
- [ ] Decisao de expansao registrada.

## 5. Decisao GO/NO-GO

- [ ] GO para expandir lote.
- [ ] NO-GO com rollback para modo anterior.
- [ ] Justificativa registrada.

## 6. Evidencias obrigatorias

- [ ] Relatorio smoke piloto.
- [ ] Timeline de incidentes/mitigacoes.
- [ ] Resultado final do piloto (GO/NO-GO).
