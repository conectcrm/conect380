# Release Runbook (Teste -> Produção Azure VM)

## Objetivo
Padronizar a subida de ajustes do ambiente de testes para produção sem perda de mudanças, com validação, backup e rollback.

## Pré-requisitos
- Branch de release criada a partir da branch homologada.
- `git status` limpo.
- VM Azure acessível via SSH.
- Docker/Compose ativos na VM.
- Chave SSH (`.pem`) disponível.
- Cloudflare com acesso para purge de cache.

## Fluxo oficial
1. Congelar escopo da release.
2. Executar validações locais.
3. Gerar pacote do commit (artifact).
4. Fazer backup do banco em produção.
5. Aplicar release na VM.
6. Executar migrations.
7. Subir backend e validar APIs.
8. Subir frontend e validar UI.
9. Purge de cache (Cloudflare).
10. Registrar evidências da release.

## Checklist pré-deploy
- `.\.production\scripts\preflight-go-live.ps1 -SkipE2E`
- Conferir endpoints críticos no staging:
  - `/minhas-empresas`
  - `/notifications`
  - `/dashboard/resumo?periodo=mensal`
- Conferir usuário proprietário/superadmin.
- Garantir migrations no repositório para qualquer ajuste manual já feito.

## Deploy na VM (resumo técnico)
1. Sincronizar código da release (artifact zip do `HEAD`) para `~/conect360`.
2. Backup do banco:
   - `docker exec conectcrm-postgres pg_dump -U postgres -d conectcrm -Fc > /tmp/conectcrm-<timestamp>.dump`
3. Build e subida:
   - `cd ~/conect360/.production`
   - `docker compose up -d postgres redis`
   - `docker compose build backend frontend`
   - `docker compose up -d backend`
4. Executar migration:
   - `docker compose run --rm backend npm run migration:run`
5. Validar backend:
   - `curl http://127.0.0.1:3500/health`
6. Subir frontend:
   - `docker compose up -d frontend`
7. Validar frontend:
   - `curl https://conect360.com`
   - login + dashboard + branding.

## Pós-deploy
- Purge Cloudflare:
  - `Purge Everything` ou no mínimo:
    - `/index.html`
    - `/brand/*`
    - `/static/*`
- Hard refresh no navegador (`Ctrl+F5`).
- Verificar logs:
  - `docker logs --since 10m conectcrm-backend`
  - `docker logs --since 10m conectcrm-frontend`

## Rollback (rápido)
1. Voltar código para commit anterior e rebuild:
   - `docker compose build backend frontend`
   - `docker compose up -d backend frontend`
2. Se necessário, restaurar banco pelo dump:
   - `pg_restore` no `conectcrm-postgres` (janela de manutenção).

## Evidências mínimas a salvar
- Commit/tag da release.
- Resultado do preflight.
- Horário de backup do banco.
- Status dos containers após deploy.
- Resultado dos endpoints críticos.
- Confirmação de purge do Cloudflare.

## Deploy sem re-informar dados (perfil local)
Use o fluxo de perfil local para rodar o deploy sem repetir IP/usuario/chave.

- Guia: `.production/DEPLOY_AGENT_PROFILE.md`
- Atalho recomendado: `.\.production\scripts\release-production.ps1 -Execute`

## Execucao recomendada (deploy + smoke ADM-303)
Para validar o fluxo administrativo critico imediatamente apos o deploy, execute com smoke ADM-303 habilitado:

```powershell
.\.production\scripts\release-production.ps1 `
  -ProfileName production `
  -AllowDirtyWorktree `
  -SkipPreflight `
  -Execute `
  -RunAdm303Smoke `
  -Adm303BaseUrl "https://api.conect360.com" `
  -Adm303RequesterEmail "<requester@email>" `
  -Adm303RequesterPassword "<senha>" `
  -Adm303ApproverEmail "<approver@email>" `
  -Adm303ApproverPassword "<senha>" `
  -Adm303TargetEmail "<target@email>" `
  -Adm303TargetPassword "<senha>"
```

Opcao sem credenciais na linha de comando:
- configurar `Adm303Smoke` no `deploy-profile.local.psd1` e executar apenas:
  - `.\.production\scripts\release-production.ps1 -ProfileName production -Execute`
- referencia: `.production/RELEASE_ADM303_POST_DEPLOY_SMOKE.md`

## Checklist complementar
- ADM-303 break-glass rollout:
  - `.production/ADM303_BREAK_GLASS_ROLLOUT_CHECKLIST.md`
  - smoke automatizado: `.production/scripts/smoke-adm303-break-glass.ps1`
