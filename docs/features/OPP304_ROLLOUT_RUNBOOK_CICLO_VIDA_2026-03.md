# OPP-304 - Runbook operacional de rollout assistido (2026-03)

## 1. Objetivo

Padronizar a execucao do rollout do lifecycle de oportunidades por tenant, com monitoramento, triagem de incidente e rollback controlado.

## 2. Escopo operacional

1. Ativacao da flag `crm_oportunidades_lifecycle_v1`.
2. Monitoramento funcional nas primeiras 48h por tenant piloto.
3. Criticos de suporte para acoes de lifecycle:
   - arquivar;
   - restaurar;
   - reabrir;
   - exclusao logica;
   - exclusao permanente (restrita).

## 3. Pre-condicoes

1. Sprint 1, 2 e 3 com aceite formal.
2. Ambiente de homologacao validado sem bloqueador aberto.
3. Equipe de suporte com acesso ao painel/logs e a este runbook.
4. Migration de lifecycle aplicada no ambiente alvo:
   - `npm run migration:run` (backend).
5. Backend reiniciado apos migration para recarregar schema em memoria.

## 4. Procedimento de ativacao por tenant

1. Confirmar `empresa_id` alvo.
2. Habilitar flag:

```sql
INSERT INTO feature_flags_tenant (empresa_id, flag_key, enabled, rollout_percentage, updated_at)
VALUES ('<empresa_id>', 'crm_oportunidades_lifecycle_v1', true, 0, now())
ON CONFLICT (empresa_id, flag_key)
DO UPDATE SET
  enabled = EXCLUDED.enabled,
  rollout_percentage = EXCLUDED.rollout_percentage,
  updated_at = now();
```

3. Validar endpoint:
   - `GET /oportunidades/lifecycle/feature-flag`
4. Executar smoke funcional:
   - baseline tecnico (sem chamadas reais): `npm run test:opp304:piloto:dryrun`;
   - smoke real autenticado: `powershell -ExecutionPolicy Bypass -File scripts/test-opp304-piloto-lifecycle.ps1 -BaseUrl <url_homolog> -Token <jwt_valido>`;
   - smoke com transicoes lifecycle: `powershell -ExecutionPolicy Bypass -File scripts/test-opp304-piloto-lifecycle.ps1 -BaseUrl <url_homolog> -Token <jwt_valido> -RunLifecycleActions -OportunidadeId <id_aberta> -ClosedOportunidadeId <id_fechada>`;
   - validar relatorio em `docs/features/evidencias/OPP304_PILOTO_API_SMOKE_<timestamp>.md`.

## 5. Monitoramento nas primeiras 48h

Indicadores minimos:

1. Taxa de erro HTTP em endpoints de oportunidades.
2. Quantidade de `400` por transicao de estagio invalida.
3. Quantidade de `403` por permissao.
4. Volume de acoes de lifecycle executadas.

Ritmo sugerido:

1. `T+30 min`: cheque inicial.
2. `T+2 h`: estabilidade do primeiro ciclo.
3. `T+8 h`: consolidacao de uso.
4. `T+24 h`: validacao de negocio.
5. `T+48 h`: decisao de expandir rollout.

Comandos recomendados:

1. Baseline tecnico (dry-run):
   - `npm run monitor:opp304:piloto:dryrun`
2. Validacao local rapida (2 ciclos):
   - `npm run monitor:opp304:piloto:quick`
3. Janela real de 48h em homolog/go-live:
   - `powershell -ExecutionPolicy Bypass -File scripts/monitor-opp304-piloto-48h.ps1 -BaseUrl <url_homolog> -Token <jwt_valido> -IntervalSeconds 300 -DurationHours 48`
4. Evidencias geradas automaticamente:
   - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_<timestamp>.md`
   - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_<timestamp>.csv`

Observacao operacional:

1. Evitar logins concorrentes com o mesmo usuario em execucoes paralelas de smoke/monitor, pois o ambiente pode invalidar sessao anterior.
2. O script `monitor-opp304-piloto-48h.ps1` reautentica por ciclo quando executado com `-Email/-Senha`, reduzindo risco de expiração de token em janelas longas.

## 6. Triage de incidentes

## SEV-1

Exemplo:

1. Falha generalizada em endpoints de oportunidades para tenants piloto.

Acao:

1. Acionar rollback imediato da flag.
2. Comunicar Produto + Operacoes + Tech Lead.
3. Abrir hotfix com prioridade maxima.

## SEV-2

Exemplo:

1. Erro recorrente de transicao em fluxo especifico.

Acao:

1. Mitigar regra/UX.
2. Manter piloto congelado (sem expandir lote).
3. Corrigir e revalidar antes de seguir rollout.

## 7. Rollback

1. Desabilitar flag:

```sql
UPDATE feature_flags_tenant
SET enabled = false,
    rollout_percentage = 0,
    updated_at = now()
WHERE empresa_id = '<empresa_id>'
  AND flag_key = 'crm_oportunidades_lifecycle_v1';
```

2. Confirmar retorno ao comportamento anterior:
   - `GET /oportunidades/lifecycle/feature-flag` com `enabled=false`;
   - listagem de oportunidades sem acoes lifecycle ativas na UI.
3. Registrar evidencia do rollback (data/hora, motivo, responsavel).

## 8. Comunicacao

Template interno (operacao/comercial):

1. Escopo: rollout lifecycle oportunidades.
2. Janela: `<data/hora inicio>` ate `<data/hora fim>`.
3. Impacto esperado: reorganizacao de visoes (abertas/fechadas/arquivadas/lixeira).
4. Canal de suporte: `<canal interno>`.
5. Responsavel de plantao: `<nome>`.

## 9. Evidencias obrigatorias

1. Tenant piloto ativado e validado.
2. Log de monitoramento (48h).
3. Resultado final:
   - aprovado para lote seguinte; ou
   - rollback executado.
