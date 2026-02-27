# Release Policy v1 (Conect360)

## Objetivo
Garantir deploys previsíveis e seguros em produção, reduzindo risco de regressão funcional, indisponibilidade e drift de banco.

## Escopo
Aplica para qualquer release de backend, frontend, banco, integrações e configuração de infraestrutura do ambiente `conect360.com`.

## Fluxo oficial (obrigatório)
1. `feature/*` -> PR
2. Revisão técnica + aprovação
3. Deploy em homologação (staging)
4. Validação funcional + técnica
5. Release branch/tag
6. Deploy em produção via runbook/script oficial
7. Validação pós-deploy + registro de evidências

## Gates obrigatórios de release
Uma release só pode subir se **todos** os itens abaixo estiverem atendidos:
- Build backend e frontend concluídos com sucesso.
- Testes/smokes críticos aprovados.
- Migrations versionadas e revisadas (sem SQL manual pendente).
- Plano de rollback definido e testável.
- Backup do banco realizado antes do deploy.
- Checklist de deploy preenchido.
- Dono da release definido (responsável técnico do ciclo).

## Regras de banco de dados
- Toda mudança estrutural deve ir em migration no repositório.
- É proibido aplicar ajuste manual direto em produção sem:
  - abrir incidente/chamado interno,
  - registrar SQL aplicado,
  - criar migration de correção equivalente no código.
- Migration deve ser **idempotente** sempre que possível (`IF EXISTS` / `IF NOT EXISTS`).

## Regras de deploy
- Deploy em produção apenas pelo script oficial: `.production/scripts/release-azure-vm.ps1`.
- É proibido deploy manual ad-hoc em container isolado fora do `docker compose` oficial.
- Releases devem ser associadas a commit/tag rastreável.

## Regras de feature flag
- Recursos novos com risco de impacto devem sair atrás de feature flag.
- Rollout inicial deve ser controlado (tenant específico ou percentual).
- Deve existir estratégia de desligamento rápido (kill switch).

## Validação mínima pós-deploy
- `GET /health` da API.
- Login com usuário real.
- Endpoints críticos:
  - `/minhas-empresas`
  - `/notifications`
  - `/dashboard/resumo?periodo=mensal`
- Frontend carregando bundle novo.
- Branding/logo conferidos após purge de cache.

## Cache/CDN
- Após release frontend: purge de cache no Cloudflare para:
  - `/index.html`
  - `/brand/*`
  - `/static/*`
- Confirmar atualização com hard refresh (`Ctrl+F5`).

## Monitoramento e resposta
- Monitorar por 30 minutos após deploy:
  - taxa de erro 5xx,
  - latência,
  - saúde de containers,
  - erros de schema/migration.
- Qualquer regressão crítica: acionar rollback imediatamente.

## Rollback
- Rollback deve estar pronto antes do deploy:
  - imagem/tag anterior para backend e frontend,
  - dump de banco da janela da release.
- Em caso de falha:
  1. voltar containers para versão anterior,
  2. avaliar necessidade de restore de banco,
  3. abrir relatório de incidente.

## Evidências obrigatórias por release
- Commit/tag liberado.
- Resultado do preflight.
- Horário e arquivo de backup do banco.
- Resultado de migrations.
- Status final dos containers.
- Resultado dos checks pós-deploy.
- Registro de purge de cache.

## Papéis
- **Dono da release**: executa/coordena checklist, aprova go/no-go, comunica status.
- **Revisor técnico**: valida mudanças críticas (banco, auth, billing, integrações).
- **Aprovador de negócio**: valida funcionalidade impactada em staging.

## Exceções
Qualquer exceção desta política deve ser documentada previamente com:
- justificativa,
- risco aceito,
- aprovação explícita do responsável técnico.

## Referências internas
- Runbook operacional: `.production/RELEASE_RUNBOOK.md`
- Script oficial: `.production/scripts/release-azure-vm.ps1`
