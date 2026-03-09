# Modelo de Automacao de Sprint e Gate - Guardian

## Objetivo

Padronizar a execucao do backlog Guardian do inicio ao fim sem pausar para perguntar se deve seguir para a proxima implementacao.

## Arquivos usados

1. Backlog Cloud: `docs/features/BACKLOG_JIRA_CLOUD_GUARDIAN_PRODUCAO_2026-03_04.csv`
2. Estado de execucao: `docs/features/GUARDIAN_AUTOPILOT_STATE_2026-03_04.json`
3. Script de orquestracao: `scripts/guardian-autopilot.ps1`

## Regras obrigatorias

1. O agente executa itens da sprint atual na ordem de dependencias.
2. O agente marca item concluido com `-Command done`.
3. O agente fecha gate da sprint com `-Command gate` no fim das validacoes.
4. Se gate fechar com sucesso o script avanca sprint automaticamente.
5. O agente nao pede confirmacao para avancar de sprint quando gate estiver verde.
6. O agente so escalona quando existir bloqueio externo real.

## Comandos

```powershell
# 1) Inicializar estado
powershell -ExecutionPolicy Bypass -File scripts/guardian-autopilot.ps1 -Command init

# 2) Ver status da sprint atual
powershell -ExecutionPolicy Bypass -File scripts/guardian-autopilot.ps1 -Command status

# 3) Listar proximos itens prontos para execucao
powershell -ExecutionPolicy Bypass -File scripts/guardian-autopilot.ps1 -Command next

# 4) Marcar item concluido
powershell -ExecutionPolicy Bypass -File scripts/guardian-autopilot.ps1 -Command done -IssueId GDN-001 -Note "Implementado e validado"

# 5) Fechar gate da sprint atual
powershell -ExecutionPolicy Bypass -File scripts/guardian-autopilot.ps1 -Command gate

# 6) Tentar avanco automatico de gate quando nao houver itens executaveis
powershell -ExecutionPolicy Bypass -File scripts/guardian-autopilot.ps1 -Command auto
```

## Logica de testes e validacoes por sprint

1. Sprint 0: consistencia comercial + cenarios de negocio + aprovacao legal financeira.
2. Sprint 1: unitario de estados + integracao webhook + idempotencia + fallback de indisponibilidade.
3. Sprint 2: autorizacao negativa + tentativa de bypass + MFA sessao + varredura de exposicao.
4. Sprint 3: E2E operacional + permissao por acao + validacao visual + UAT interno.
5. Sprint 4: piloto controlado + carga leve + replay webhook + runbook de suporte.
6. Sprint 5: smoke diario + consistencia financeira + auditoria critica + rollback documentado.

## Criterio de avanco automatico

1. Todos os itens da sprint devem estar `done`.
2. O item `Gate` da sprint deve ser fechado.
3. Com o gate fechado o script troca `currentSprint` automaticamente para a proxima.
