# Runbook Guardian - Incident Response (Piloto)

## 1. Objetivo

Padronizar resposta a incidente no escopo Guardian durante piloto controlado, com trilha clara de:
- classificacao de severidade
- escalonamento N1/N2/N3
- mitigacao e rollback
- comunicacao e encerramento

## 2. Escopo

- `guardian-web` (operacao superadmin)
- backend `guardian/*` (BFF, empresas, billing, auditoria)
- fluxo de transicao legado (`legacy`, `dual`, `canary`, `guardian_only`)

Fora de escopo:
- rotinas de produto cliente fora do namespace Guardian
- incidentes sem impacto em governanca/admin operacao

## 3. Severidade e SLA operacional

| Severidade | Definicao | Acionamento | SLA de resposta |
| --- | --- | --- | --- |
| P0 | indisponibilidade total Guardian ou risco de seguranca critica | N1 + N2 + N3 imediato | N1 imediato, N2 <= 10 min, N3 <= 15 min |
| P1 | funcionalidade critica degradada com impacto alto | N1 + N2 imediato, N3 sob criterio tecnico | N1 <= 10 min, N2 <= 20 min, N3 <= 30 min |
| P2 | falha moderada com workaround | N1 e N2 | N1 <= 15 min, N2 <= 45 min |
| P3 | falha baixa prioridade sem risco operacional | N1 | backlog com acompanhamento diario |

## 4. Matriz de escalonamento N1/N2/N3

| Etapa | Owner | Responsabilidade | Evidencia obrigatoria |
| --- | --- | --- | --- |
| Triagem inicial | N1 (Suporte) | classificar severidade, coletar contexto e abrir incidente | empresa, usuario, horario, request id, rota |
| Mitigacao operacional | N2 (Operacoes) | validar impacto, aplicar workaround, decidir ajuste de flag | acao aplicada, resultado, tempo de recuperacao |
| Correcao tecnica | N3 (Engenharia) | hotfix, patch ou rollback tecnico | commit/patch, teste de regressao, status final |
| Comunicacao | N1 com apoio de N2 | atualizar status para stakeholders | timeline e mensagens registradas |
| Encerramento | N2 + N3 | confirmar estabilidade e registrar RCA | checklist final preenchido |

Regra de escalacao:
- N1 -> N2: impacto operacional ou sem resolucao em 15 min.
- N2 -> N3: risco P0/P1, causa em codigo, ou necessidade de alteracao estrutural.

## 5. Playbooks por tipo de incidente

### 5.1 Falha de autenticacao/MFA Guardian

1. Confirmar erro em login/refresh com `mfa_verified`.
2. Verificar expiracao/sessao invalida e volume de erros em logs.
3. Se impacto alto, N2 aciona N3 para hardening imediato.
4. Validar recuperacao com login de usuario de teste superadmin.

### 5.2 Falha em operacao de empresas

1. Validar chamadas de listagem e acoes mutaveis (suspender, reativar, plano, modulo).
2. Confirmar permissao/role do ator.
3. Se falha for autorizacao indevida, tratar como P1.
4. Registrar `route`, `statusCode` e `requestId` no incidente.

### 5.3 Falha em billing (assinaturas)

1. Validar endpoint de listagem de assinaturas e operacoes de suspensao/reativacao.
2. Checar consistencia entre status de empresa e status de assinatura.
3. Executar reconciliacao quando aplicavel.
4. Se houver impacto financeiro, escalar para N3 e marcar incidente para RCA obrigatoria.

### 5.4 Falha em auditoria critica

1. Confirmar leitura de auditoria critica e export (`csv/json`).
2. Se trilha critica nao for gerada, tratar como P1.
3. Bloquear mudancas operacionais sensiveis ate recuperacao da trilha.

### 5.5 Incidente na transicao legado -> Guardian

1. Ler flags atuais:
   - `GUARDIAN_LEGACY_TRANSITION_MODE`
   - `GUARDIAN_LEGACY_CANARY_PERCENT`
2. Se incidente ocorrer em `canary` ou `guardian_only`, N2 pode mitigar com:
   - reduzir percentual canary
   - alternar para `dual`
   - alternar para `legacy` em caso extremo
3. Registrar horario da troca de flag e justificativa.
4. Reabrir migracao progressiva somente apos janela de estabilidade.

## 6. Procedimento de mitigacao e rollback

1. Declarar incidente e severidade.
2. Congelar mudancas nao essenciais no Guardian.
3. Aplicar mitigacao operacional (flag de transicao, limitacao de acoes, fallback).
4. Se mitigacao falhar, executar rollback de transicao legado.
5. Validar recuperacao em:
   - dashboard Guardian
   - operacoes de empresas
   - operacoes de billing
   - leitura de auditoria critica
6. Registrar decisao de GO/NO-GO para continuidade do piloto.

## 7. Comunicacao de incidente

Template de atualizacao:
- `INCIDENTE [P1] Guardian - <resumo>`
- `Impacto:` o que esta indisponivel/degradado.
- `Escopo:` tenant/empresa/acao afetada.
- `Mitigacao em curso:` acao atual.
- `Proxima atualizacao:` horario previsto.

Regras:
- Atualizacao minima a cada 30 min para P0/P1.
- Encerramento somente com validacao de N2 e aceite tecnico de N3.

## 8. Checklist de encerramento

- [ ] Severidade final confirmada.
- [ ] Causa raiz registrada (ou plano de RCA aberto).
- [ ] Evidencias tecnicas anexadas.
- [ ] Validacao funcional pos-incidente executada.
- [ ] Impacto financeiro/governanca avaliado.
- [ ] Acao preventiva criada no backlog.

## 9. Evidencias minimas por incidente

- timeline com timestamps
- owner por etapa (N1/N2/N3)
- endpoint/rota afetada
- request id/correlation id
- resultado final (resolvido, mitigado, backlog)

## 10. Referencias

- `docs/features/GDN-306_SUPPORT_WORKFLOW_N1_N2_N3_2026-03-07.md`
- `scripts/ci/guardian-transition-flags-check.ps1`
