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
