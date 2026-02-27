# Release Checklist

## Identificação
- Data/Hora da release:
- Dono da release:
- Commit/Tag:
- Escopo resumido:

## Pré-deploy (obrigatório)
- [ ] Branch de release criada e aprovada em PR.
- [ ] `git status` limpo.
- [ ] Preflight executado com sucesso.
- [ ] Build backend/frontend concluído.
- [ ] Testes/smokes críticos aprovados.
- [ ] Migrations versionadas e revisadas.
- [ ] Plano de rollback definido.
- [ ] Backup de banco planejado.

## Deploy
- [ ] Artifact da release gerado.
- [ ] Upload do artifact para VM concluído.
- [ ] Backup do banco executado (`pg_dump`).
- [ ] `docker compose build backend frontend` concluído.
- [ ] `migration:run` executado sem pendências/falhas.
- [ ] `docker compose up -d backend frontend` concluído.

## Validação técnica pós-deploy
- [ ] API health: `GET /health` = 200.
- [ ] Frontend responde = 200.
- [ ] Containers saudáveis (`docker compose ps`).
- [ ] Logs sem erro crítico de schema/migration.

## Validação funcional pós-deploy
- [ ] Login com usuário real.
- [ ] `/minhas-empresas` = OK.
- [ ] `/notifications` = OK.
- [ ] `/dashboard/resumo?periodo=mensal` = OK.
- [ ] Fluxo principal de negócio validado.

## Cache/CDN
- [ ] Purge Cloudflare executado:
  - [ ] `/index.html`
  - [ ] `/brand/*`
  - [ ] `/static/*`
- [ ] Hard refresh (`Ctrl+F5`) validado.

## Encerramento
- [ ] Evidências salvas (logs, prints, checks).
- [ ] Comunicação de sucesso enviada.
- [ ] Pendências pós-release registradas (se houver).

## Rollback (se necessário)
- [ ] Versão anterior identificada (imagem/tag).
- [ ] Procedimento de rollback executável confirmado.
- [ ] Restore de banco avaliado (quando aplicável).

## Observações
-
