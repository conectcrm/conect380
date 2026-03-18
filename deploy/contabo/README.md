# Contabo 2-VM Deploy (App VM + DB VM)

This package is for production with:
- VM 1: application (backend, frontend, redis, nginx)
- VM 2: PostgreSQL only

## Alternative split used in this project (App + API/DB)

For the provided VPS pair:
- `srv_app` (147.93.3.241): frontend + nginx app
- `srv_api` (147.93.3.190): backend + nginx api + PostgreSQL

Use dedicated nginx files:
- App VM: `deploy/contabo/nginx.app-only.conf`
- API VM: `deploy/contabo/nginx.api-only.conf`

Domain mapping:
- `conect360.com` and `www.conect360.com` -> `srv_app`
- `api.conect360.com` -> `srv_api`
- `guardian.conect360.com` -> `srv_app`

## 1) DB VM bootstrap

1. Install PostgreSQL:
   ```bash
   sudo apt update && sudo apt -y upgrade
   sudo apt -y install postgresql postgresql-contrib ufw fail2ban
   sudo systemctl enable --now postgresql
   ```

2. Create database and role:
   ```bash
   sudo -u postgres psql -f postgres-bootstrap.sql
   ```
   Edit `postgres-bootstrap.sql` before running and replace password.

3. PostgreSQL hardening:
   - In `postgresql.conf`, set:
     ```conf
     listen_addresses = '127.0.0.1,DB_VM_PRIVATE_IP'
     password_encryption = scram-sha-256
     ```
   - In `pg_hba.conf`, allow only app VM private IP:
     ```conf
     host    conectcrm_production    conectcrm_admin    APP_VM_PRIVATE_IP/32    scram-sha-256
     ```
   - Restart:
     ```bash
     sudo systemctl restart postgresql
     ```

4. Firewall on DB VM:
   ```bash
   sudo ufw default deny incoming
   sudo ufw allow OpenSSH
   sudo ufw allow from APP_VM_PRIVATE_IP to any port 5432 proto tcp
   sudo ufw enable
   ```

## 2) App VM bootstrap

1. Install runtime:
   ```bash
   sudo apt update && sudo apt -y upgrade
   curl -fsSL https://get.docker.com | sudo sh
   sudo apt -y install docker-compose-plugin nginx certbot python3-certbot-nginx ufw fail2ban
   sudo usermod -aG docker $USER
   ```
   Re-login after adding your user to docker group.

2. Prepare app env:
   ```bash
   cp deploy/contabo/.env.app-vm.example deploy/contabo/.env.app-vm
   ```
   Fill all required secrets, especially database and JWT fields.
   Ensure these entries are set for Guardian:
   - `REACT_APP_GUARDIAN_WEB_URL=https://guardian.seudominio.com`
   - `VITE_GUARDIAN_API_URL=https://api.seudominio.com`
   - `CORS_ORIGINS` includes `https://guardian.seudominio.com`

3. Build and start app stack:
   ```bash
   docker compose -f deploy/contabo/docker-compose.app-vm.yml --env-file deploy/contabo/.env.app-vm up -d --build redis
   docker compose -f deploy/contabo/docker-compose.app-vm.yml --env-file deploy/contabo/.env.app-vm run --rm backend npm run migration:run
   docker compose -f deploy/contabo/docker-compose.app-vm.yml --env-file deploy/contabo/.env.app-vm up -d backend frontend guardian-web
   docker compose -f deploy/contabo/docker-compose.app-vm.yml ps
   ```

4. Local health checks on app VM:
   ```bash
   curl -f http://127.0.0.1:3500/health
   curl -I http://127.0.0.1:3000
   curl -I http://127.0.0.1:3020
   ```

## 3) Nginx on App VM and API VM

1. App VM (`conect360.com`, `www.conect360.com`, `guardian.conect360.com`):
   ```bash
   sudo cp deploy/contabo/nginx.app-only.conf /etc/nginx/sites-available/conect360-app
   sudo ln -s /etc/nginx/sites-available/conect360-app /etc/nginx/sites-enabled/conect360-app
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d conect360.com -d www.conect360.com -d guardian.conect360.com
   ```

2. API VM (`api.conect360.com`):
   ```bash
   sudo cp deploy/contabo/nginx.api-only.conf /etc/nginx/sites-available/conect360-api
   sudo ln -s /etc/nginx/sites-available/conect360-api /etc/nginx/sites-enabled/conect360-api
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d api.conect360.com
   ```

## 4) Firewall on App VM

```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 5) Final validation

```bash
curl -I https://app.seudominio.com
curl -f https://api.seudominio.com/health
curl -I https://guardian.seudominio.com
```

Then validate in UI:
- login
- dashboard load
- pipeline load
- create opportunity
- notification bell and websocket updates

## 6) Automated deploy scripts (PowerShell)

The repo includes deploy scripts for the split setup:
- API VM (`backend + redis`)
- APP VM (`frontend + guardian-web`)

Scripts:
- `deploy/contabo/deploy-prod.ps1`
- `deploy/contabo/rollback-prod.ps1`
- `deploy/contabo/smoke-prod.ps1`
- `deploy/contabo/deploy-prod.bat`
- `deploy/contabo/rollback-prod.bat`
- `deploy/contabo/smoke-prod.bat`

For Windows operation, prefer `.bat` wrappers. They call the corresponding `.ps1` script with the local profile automatically.

### 6.1 Prepare deploy profile

Create a local profile (ignored by git):

```powershell
Copy-Item deploy/contabo/deploy-profile.example.psd1 deploy/contabo/deploy-profile.local.psd1
```

Fill at least:
- `ApiVm.Host`, `AppVm.Host`
- `SshUser` / optional `SshKeyPath`
- `RuntimeEnvRemoteRelativePath` (default `shared/.env.app-vm`)

### 6.2 Dry-run (recommended first)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy/contabo/deploy-prod.ps1 `
  -ProfilePath deploy/contabo/deploy-profile.local.psd1 `
  -AllowDirtyWorktree
```

Equivalent `.bat`:

```bat
deploy\contabo\deploy-prod.bat -AllowDirtyWorktree
```

### 6.3 Execute deploy

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy/contabo/deploy-prod.ps1 `
  -ProfilePath deploy/contabo/deploy-profile.local.psd1 `
  -Execute `
  -UploadRuntimeEnv
```

Equivalent `.bat`:

```bat
deploy\contabo\deploy-prod.bat -Execute -UploadRuntimeEnv
```

Notes:
- `-UploadRuntimeEnv` pushes local `deploy/contabo/.env.app-vm` to both VMs.
- If you keep env already on server, omit `-UploadRuntimeEnv`.
- Migrations run on API VM by default. Use `-SkipMigrations` only if needed.

### 6.3.1 Async mode (recommended on Windows)

If your terminal appears to "hang" after deploy completion, use async mode:

1) Start deploy in background:

```bat
deploy\contabo\deploy-prod.bat start -Execute -UploadRuntimeEnv
```

2) Check status/logs:

```bat
deploy\contabo\deploy-prod.bat status
```

3) Wait until finish (with periodic polling):

```bat
deploy\contabo\deploy-prod.bat wait
```

You can pass a specific operation id in `status`/`wait`:

```bat
deploy\contabo\deploy-prod.bat status deploy-YYYYMMDD-HHMMSS-1234
deploy\contabo\deploy-prod.bat wait deploy-YYYYMMDD-HHMMSS-1234
```

PowerShell equivalents:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy/contabo/deploy-prod.ps1 `
  -Mode start `
  -ProfilePath deploy/contabo/deploy-profile.local.psd1 `
  -Execute `
  -UploadRuntimeEnv

powershell -NoProfile -ExecutionPolicy Bypass -File deploy/contabo/deploy-prod.ps1 -Mode status
powershell -NoProfile -ExecutionPolicy Bypass -File deploy/contabo/deploy-prod.ps1 -Mode wait
```

### 6.4 Run smoke after deploy

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy/contabo/smoke-prod.ps1 `
  -ProfilePath deploy/contabo/deploy-profile.local.psd1 `
  -SuperAdminEmail "conectcrm@gmail.com" `
  -SuperAdminPassword "SUA_SENHA" `
  -SuperAdminMfaCode "123456" `
  -ExpectedOwnerEmpresaId "SEU_OWNER_EMPRESA_ID"
```

Equivalent `.bat`:

```bat
deploy\contabo\smoke-prod.bat
```

### 6.5 Rollback

Rollback to previous release registered on each VM:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy/contabo/rollback-prod.ps1 `
  -ProfilePath deploy/contabo/deploy-profile.local.psd1 `
  -Execute
```

Rollback to a specific release id:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy/contabo/rollback-prod.ps1 `
  -ProfilePath deploy/contabo/deploy-profile.local.psd1 `
  -TargetReleaseId "rel-YYYYMMDD-HHMMSS-abcdef" `
  -Execute
```

Equivalent `.bat`:

```bat
deploy\contabo\rollback-prod.bat -Execute
deploy\contabo\rollback-prod.bat -TargetReleaseId "rel-YYYYMMDD-HHMMSS-abcdef" -Execute
```

### 6.6 Safety behavior

- Dry-run by default (requires `-Execute` to apply changes).
- Health checks are enforced per VM.
- Automatic best-effort rollback is attempted if deploy fails.
- Keeps release history under `<RemoteRoot>/.deploy/history.log`.

## 7) GitHub Actions (auto deploy)

There is a dedicated workflow for Contabo deploy:

- `.github/workflows/deploy-contabo-production.yml`

### 7.1 Required secrets (GitHub -> Settings -> Secrets and variables -> Actions)

Create these repository or environment secrets:

- `CONTABO_SSH_PRIVATE_KEY`: private key allowed in both VMs.
- `CONTABO_DEPLOY_PROFILE_PSD1`: full content of `deploy/contabo/deploy-profile.local.psd1` adjusted for CI.
- `CONTABO_RUNTIME_ENV_FILE`: full content of `deploy/contabo/.env.app-vm` (required when `upload_runtime_env=true`).
- `CONTABO_SMOKE_SUPERADMIN_EMAIL` (optional if already in profile).
- `CONTABO_SMOKE_SUPERADMIN_PASSWORD` (optional if already in profile).
- `CONTABO_SMOKE_SUPERADMIN_MFA_CODE` (optional).
- `CONTABO_SMOKE_EXPECTED_OWNER_EMPRESA_ID` (optional).

Notes:
- The workflow writes the SSH key to `/home/runner/.ssh/id_ed25519`.
- Any `SshKeyPath` line in profile secret is removed at runtime to avoid Windows path issues in CI.

### 7.2 Automatic deploy on push

The workflow listens to push in `main` and `production`, but only executes when variable:

- `CONTABO_AUTO_DEPLOY_ENABLED=true`

is set in `Settings -> Secrets and variables -> Actions -> Variables`.

This allows safe rollout: keep manual deploy until everything is validated, then enable auto deploy.

### 7.3 Manual deploy (recommended for first runs)

Run the workflow manually in GitHub Actions (`workflow_dispatch`) and choose:

- `target_ref` (branch/tag/sha; empty uses current commit)
- `run_smoke`
- `upload_runtime_env`
- `skip_migrations`
- `no_cache_build`

### 7.4 MFA guardrail

When `upload_runtime_env=true`, the workflow validates:

- SMTP global must be configured for auth e-mails (`SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` or `SMTP_PASSWORD`).

This prevents auth outage in forgot-password/MFA caused by missing SMTP credentials.
