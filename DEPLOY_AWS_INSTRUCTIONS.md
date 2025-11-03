# ============================================
# PASSO A PASSO - DEPLOY AWS EC2
# ConectCRM - Ubuntu 24.04
# ============================================

## ✅ INFORMAÇÕES DA INSTÂNCIA

- **IP Público**: 56.124.63.239
- **DNS Público**: ec2-56-124-63-239.sa-east-1.compute.amazonaws.com
- **SO**: Ubuntu 24.04 LTS (Noble)
- **Região**: sa-east-1 (São Paulo)
- **Portas Liberadas**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (Frontend), 3500 (Backend)

---

## 🚀 ETAPA 1: Conectar na Instância EC2

### 1.1. Configurar permissões da chave SSH (Windows PowerShell)

```powershell
# No seu computador local (C:\Projetos\conectcrm)
icacls conectcrm-key.pem /inheritance:r
icacls conectcrm-key.pem /grant:r "$env:USERNAME:(R)"
```

### 1.2. Conectar via SSH

```powershell
ssh -i conectcrm-key.pem ubuntu@56.124.63.239
```

**Ou usando DNS:**
```powershell
ssh -i conectcrm-key.pem ubuntu@ec2-56-124-63-239.sa-east-1.compute.amazonaws.com
```

---

## 🔧 ETAPA 2: Configurar Servidor (EXECUTAR NA EC2)

### 2.1. Copiar script de setup para EC2

**No seu computador local (PowerShell):**
```powershell
scp -i conectcrm-key.pem setup-ec2.sh ubuntu@56.124.63.239:/home/ubuntu/
```

### 2.2. Executar setup na EC2

**Conectado via SSH na EC2:**
```bash
chmod +x setup-ec2.sh
./setup-ec2.sh
```

Este script irá:
- ✅ Atualizar sistema Ubuntu
- ✅ Instalar Docker e Docker Compose
- ✅ Configurar Firewall (UFW)
- ✅ Criar diretórios de deploy

### 2.3. IMPORTANTE: Relogar após setup

```bash
exit
# Conectar novamente:
ssh -i conectcrm-key.pem ubuntu@56.124.63.239
```

---

## 📦 ETAPA 3: Transferir Projeto para EC2

### 3.1. Criar arquivo .tar.gz do projeto (no seu PC)

**PowerShell local:**
```powershell
# Voltar para raiz do projeto
cd C:\Projetos\conectcrm

# Criar arquivo compactado (excluindo node_modules)
tar -czf conectcrm-deploy.tar.gz `
  --exclude=node_modules `
  --exclude=backend/node_modules `
  --exclude=frontend-web/node_modules `
  --exclude=backend/dist `
  --exclude=frontend-web/build `
  --exclude=.git `
  backend frontend-web docker-compose.prod.yml .env.production deploy-aws.sh
```

### 3.2. Enviar para EC2

```powershell
scp -i conectcrm-key.pem conectcrm-deploy.tar.gz ubuntu@56.124.63.239:/home/ubuntu/apps/
```

### 3.3. Extrair na EC2

**SSH na EC2:**
```bash
cd /home/ubuntu/apps
tar -xzf conectcrm-deploy.tar.gz
ls -la  # Verificar se extraiu corretamente
```

---

## 🚀 ETAPA 4: Fazer Deploy

### 4.1. Executar script de deploy

**Na EC2:**
```bash
cd /home/ubuntu/apps
chmod +x deploy-aws.sh
./deploy-aws.sh
```

### 4.2. Aguardar deploy completar

O script irá:
1. ✅ Construir imagens Docker (backend + frontend + postgres)
2. ✅ Iniciar PostgreSQL
3. ✅ Executar migrations no banco
4. ✅ Subir backend (porta 3500)
5. ✅ Subir frontend (porta 3000)

**Tempo estimado**: 5-10 minutos (primeira vez)

---

## 🧪 ETAPA 5: Testar Aplicação

### 5.1. Verificar containers rodando

```bash
docker ps
# Deve mostrar: conectcrm-backend-prod, conectcrm-frontend-prod, conectcrm-postgres-prod
```

### 5.2. Ver logs em tempo real

```bash
# Backend
docker logs -f conectcrm-backend-prod

# Frontend
docker logs -f conectcrm-frontend-prod

# Banco de dados
docker logs -f conectcrm-postgres-prod
```

### 5.3. Testar endpoints

**Health check do backend:**
```bash
curl http://localhost:3500/health
# Esperado: {"status":"ok"}
```

**Testar do seu computador:**
```powershell
# No seu PC:
curl http://56.124.63.239:3500/health
Invoke-WebRequest -Uri http://56.124.63.239:3500/health
```

### 5.4. Acessar aplicação no navegador

- **Frontend**: http://56.124.63.239:3000
- **Backend API**: http://56.124.63.239:3500

---

## 📱 ETAPA 6: Configurar Webhook WhatsApp

### 6.1. URL do Webhook

Configure no Meta Business Suite:

```
http://56.124.63.239:3500/webhook/whatsapp
```

### 6.2. Verify Token

Use o valor do `.env.production`:
```
conectcrm_webhook_token_123
```

---

## 🔍 COMANDOS ÚTEIS

### Gerenciar Containers

```bash
# Ver status
docker compose -f docker-compose.prod.yml ps

# Parar tudo
docker compose -f docker-compose.prod.yml down

# Reiniciar serviço específico
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend

# Ver logs
docker logs -f conectcrm-backend-prod --tail 100

# Entrar no container
docker exec -it conectcrm-backend-prod sh

# Ver uso de recursos
docker stats
```

### Gerenciar Banco de Dados

```bash
# Conectar no PostgreSQL
docker exec -it conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod

# Backup do banco
docker exec conectcrm-postgres-prod pg_dump -U conectcrm conectcrm_prod > backup.sql

# Restore do banco
cat backup.sql | docker exec -i conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod
```

### Atualizar Aplicação

```bash
# 1. No seu PC: gerar novo tar.gz
cd C:\Projetos\conectcrm
tar -czf conectcrm-deploy.tar.gz --exclude=node_modules backend frontend-web docker-compose.prod.yml .env.production deploy-aws.sh

# 2. Enviar para EC2
scp -i conectcrm-key.pem conectcrm-deploy.tar.gz ubuntu@56.124.63.239:/home/ubuntu/apps/

# 3. Na EC2: parar, extrair, rebuild
cd /home/ubuntu/apps
docker compose -f docker-compose.prod.yml down
tar -xzf conectcrm-deploy.tar.gz
./deploy-aws.sh
```

---

## ⚠️ TROUBLESHOOTING

### Container não inicia

```bash
# Ver logs detalhados
docker logs conectcrm-backend-prod --tail 200

# Verificar se portas estão ocupadas
sudo netstat -tulpn | grep 3500
sudo netstat -tulpn | grep 3000

# Verificar recursos do servidor
free -h
df -h
docker system df
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Ver logs do banco
docker logs conectcrm-postgres-prod --tail 100

# Testar conexão manual
docker exec -it conectcrm-backend-prod sh
nc -zv postgres 5432
```

### Migration não roda

```bash
# Executar migration manualmente
docker compose -f docker-compose.prod.yml run --rm backend npm run migration:run

# Reverter última migration
docker compose -f docker-compose.prod.yml run --rm backend npm run migration:revert

# Ver migrations executadas
docker compose -f docker-compose.prod.yml run --rm backend npm run migration:show
```

### Rebuild completo (limpar tudo)

```bash
# ⚠️ CUIDADO: Isso apaga o banco de dados!
docker compose -f docker-compose.prod.yml down -v
docker system prune -a --volumes -f
./deploy-aws.sh
```

---

## 📋 PRÓXIMOS PASSOS

### 1. Monitoramento

- [ ] Configurar CloudWatch Logs
- [ ] Criar alarmes (CPU, Memory, Disk)
- [ ] Configurar SNS para alertas

### 2. Domínio e SSL

- [ ] Registrar domínio `app.conectcrm.com.br` no Route 53
- [ ] Criar certificado SSL no AWS ACM
- [ ] Configurar Application Load Balancer (ALB)
- [ ] Redirecionar HTTP → HTTPS

### 3. Banco de Dados RDS (Futuro)

- [ ] Criar RDS PostgreSQL Multi-AZ
- [ ] Migrar dados do container para RDS
- [ ] Atualizar `.env.production` com endpoint RDS
- [ ] Remover container PostgreSQL

### 4. Backup e Recovery

- [ ] Configurar backup automático RDS (quando migrar)
- [ ] Snapshots diários da instância EC2
- [ ] S3 para backups de uploads

### 5. CI/CD (Futuro)

- [ ] GitHub Actions para deploy automático
- [ ] Testes automatizados antes de deploy
- [ ] Deploy via push na branch `main`

---

## 📞 SUPORTE

Se algo não funcionar:

1. ✅ Verificar logs: `docker logs -f conectcrm-backend-prod`
2. ✅ Verificar Security Groups (portas abertas)
3. ✅ Verificar `.env.production` (credenciais corretas)
4. ✅ Verificar Firewall UFW: `sudo ufw status`
5. ✅ Verificar recursos: `free -h` e `df -h`

---

**Data**: 30 de outubro de 2025  
**Versão**: 1.0 - Deploy Inicial AWS
