# ⚡ Comandos Rápidos - ConectCRM Produção

**Guia de referência rápida para operações comuns**  
**AWS**: 56.124.63.239  
**SSH Key**: `C:\Users\mults\Downloads\conect-crm-key.pem`

---

## 🔑 Conexão SSH

```powershell
# Conectar na AWS
ssh -i "C:\Users\mults\Downloads\conect-crm-key.pem" ubuntu@56.124.63.239
```

---

## 🐋 Docker - Operações Básicas

### Ver Containers Rodando

```bash
sudo docker ps

# Ver todos (incluindo parados)
sudo docker ps -a

# Ver apenas nomes
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Logs de Containers

```bash
# Backend (últimas 100 linhas)
sudo docker logs --tail 100 conectcrm-backend-prod

# Backend (follow mode - tempo real)
sudo docker logs -f conectcrm-backend-prod

# Frontend
sudo docker logs -f conectcrm-frontend-prod

# PostgreSQL
sudo docker logs --tail 50 conectcrm-postgres-prod
```

### Restart de Containers

```bash
# Reiniciar backend
sudo docker restart conectcrm-backend-prod

# Reiniciar frontend
sudo docker restart conectcrm-frontend-prod

# Reiniciar PostgreSQL (CUIDADO!)
sudo docker restart conectcrm-postgres-prod
```

### Stop/Start Containers

```bash
# Parar backend
sudo docker stop conectcrm-backend-prod

# Iniciar backend
sudo docker start conectcrm-backend-prod

# Verificar status
sudo docker ps | grep conectcrm
```

---

## 🗄️ PostgreSQL - Comandos Úteis

### Conectar no PostgreSQL

```bash
sudo docker exec -it conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod
```

### Queries Úteis

```sql
-- Ver todas as tabelas
\dt

-- Ver políticas RLS ativas
SELECT tablename, policyname, cmd 
FROM pg_policies 
ORDER BY tablename, cmd;

-- Ver empresas cadastradas
SELECT id, nome, cnpj FROM empresas;

-- Ver usuários por empresa
SELECT u.email, u.nome, e.nome as empresa 
FROM usuarios u 
JOIN empresas e ON u.empresa_id = e.id 
ORDER BY e.nome, u.email;

-- Contar registros por empresa
SELECT 
  e.nome as empresa,
  COUNT(DISTINCT a.id) as atendimentos,
  COUNT(DISTINCT c.id) as clientes,
  COUNT(DISTINCT u.id) as usuarios
FROM empresas e
LEFT JOIN atendimentos a ON a.empresa_id = e.id
LEFT JOIN clientes c ON c.empresa_id = e.id
LEFT JOIN usuarios u ON u.empresa_id = e.id
GROUP BY e.nome;

-- Ver atendimentos com empresa
SELECT a.titulo, a.status, e.nome as empresa 
FROM atendimentos a 
JOIN empresas e ON a.empresa_id = e.id 
ORDER BY a.created_at DESC 
LIMIT 10;

-- Sair do psql
\q
```

### Backup PostgreSQL

```bash
# Backup completo
sudo docker exec conectcrm-postgres-prod pg_dump -U conectcrm conectcrm_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup apenas dados (sem schema)
sudo docker exec conectcrm-postgres-prod pg_dump -U conectcrm --data-only conectcrm_prod > backup_data_$(date +%Y%m%d).sql

# Backup apenas schema (sem dados)
sudo docker exec conectcrm-postgres-prod pg_dump -U conectcrm --schema-only conectcrm_prod > backup_schema.sql
```

### Restore PostgreSQL

```bash
# Restore de backup
cat backup_20251102.sql | sudo docker exec -i conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod
```

---

## 🌐 Testar Endpoints

### Frontend

```bash
# Verificar se está servindo React
curl -I http://56.124.63.239:3000
curl -s http://56.124.63.239:3000 | grep "main.*.js"

# Verificar tamanho HTML
curl -s http://56.124.63.239:3000 | wc -c
# ✅ Esperado: ~722 bytes (HTML minificado)
```

### Backend API

```bash
# Health check
curl http://56.124.63.239:3500/health

# Swagger
curl -I http://56.124.63.239:3500/api

# Login (obter token)
curl -X POST http://56.124.63.239:3500/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usera@test.com","senha":"123456"}'

# Listar atendimentos (com token)
curl http://56.124.63.239:3500/atendimentos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📦 Deploy - Comandos Completos

### Deploy Backend (Manual)

```powershell
# Local (Windows)
cd C:\Projetos\conectcrm

# 1. Build TypeScript
cd backend
npm run build
cd ..

# 2. Build Docker image
docker build -f .production/docker/Dockerfile.backend -t conectcrm-backend:latest .

# 3. Export e Transfer
docker save conectcrm-backend:latest -o backend.tar
scp -i "C:\Users\mults\Downloads\conect-crm-key.pem" backend.tar ubuntu@56.124.63.239:/tmp/

# 4. Deploy na AWS
ssh -i "C:\Users\mults\Downloads\conect-crm-key.pem" ubuntu@56.124.63.239 "
  sudo docker load -i /tmp/backend.tar &&
  sudo docker stop conectcrm-backend-prod &&
  sudo docker rm conectcrm-backend-prod &&
  sudo docker run -d \
    --name conectcrm-backend-prod \
    --network conectcrm-network \
    -p 3500:3001 \
    -e DATABASE_HOST=conectcrm-postgres-prod \
    -e DATABASE_PORT=5432 \
    -e DATABASE_USERNAME=conectcrm \
    -e DATABASE_PASSWORD=conectcrm_prod_2024_secure \
    -e DATABASE_NAME=conectcrm_prod \
    -e JWT_SECRET=conectcrm_jwt_secret_2024_production \
    -e JWT_EXPIRATION=7d \
    --restart unless-stopped \
    conectcrm-backend:latest &&
  rm /tmp/backend.tar
"
```

### Deploy Frontend (Manual)

```powershell
# Local (Windows)
cd C:\Projetos\conectcrm

# 1. Build React
cd frontend-web
npx react-scripts build
cd ..

# 2. Build Docker image
docker build -f .production/docker/Dockerfile.frontend-simple -t conectcrm-frontend:latest .

# 3. Export e Transfer
docker save conectcrm-frontend:latest -o frontend.tar
scp -i "C:\Users\mults\Downloads\conect-crm-key.pem" frontend.tar ubuntu@56.124.63.239:/tmp/

# 4. Deploy na AWS
ssh -i "C:\Users\mults\Downloads\conect-crm-key.pem" ubuntu@56.124.63.239 "
  sudo docker load -i /tmp/frontend.tar &&
  sudo docker stop conectcrm-frontend-prod 2>/dev/null || true &&
  sudo docker rm conectcrm-frontend-prod 2>/dev/null || true &&
  sudo docker run -d \
    --name conectcrm-frontend-prod \
    --network conectcrm-network \
    -p 3000:80 \
    --restart unless-stopped \
    conectcrm-frontend:latest &&
  rm /tmp/frontend.tar
"
```

### Deploy com Scripts (Automatizado)

```powershell
# Backend
cd C:\Projetos\conectcrm
.\.production\scripts\deploy-backend.ps1

# Frontend
.\.production\scripts\deploy-frontend.ps1

# Pular build (se já buildou)
.\.production\scripts\deploy-frontend.ps1 -SkipBuild
```

---

## 🔍 Diagnóstico de Problemas

### Container Não Inicia

```bash
# Ver logs de erro
sudo docker logs conectcrm-backend-prod

# Ver últimas 50 linhas
sudo docker logs --tail 50 conectcrm-backend-prod

# Ver eventos do Docker
sudo docker events --filter container=conectcrm-backend-prod
```

### Backend Retorna 500 Error

```bash
# Ver logs em tempo real
sudo docker logs -f conectcrm-backend-prod

# Verificar variáveis de ambiente
sudo docker exec conectcrm-backend-prod env | grep DATABASE

# Testar conexão com PostgreSQL
sudo docker exec conectcrm-backend-prod ping conectcrm-postgres-prod
```

### Frontend Mostra Página Branca

```bash
# Verificar se build foi copiado
sudo docker exec conectcrm-frontend-prod ls -la /usr/share/nginx/html/

# Ver pasta static/
sudo docker exec conectcrm-frontend-prod ls -lh /usr/share/nginx/html/static/js/

# Ver configuração nginx
sudo docker exec conectcrm-frontend-prod cat /etc/nginx/conf.d/default.conf
```

### PostgreSQL Não Conecta

```bash
# Verificar se está rodando
sudo docker ps | grep postgres

# Ver logs
sudo docker logs conectcrm-postgres-prod

# Testar conexão
sudo docker exec conectcrm-postgres-prod pg_isready -U conectcrm

# Verificar porta
sudo docker exec conectcrm-postgres-prod netstat -tuln | grep 5432
```

---

## 📊 Monitoramento

### Uso de Recursos

```bash
# CPU e Memória de todos os containers
sudo docker stats --no-stream

# Apenas backend
sudo docker stats --no-stream conectcrm-backend-prod

# Uso de disco
df -h

# Espaço usado por Docker
sudo docker system df
```

### Verificar Uptime

```bash
# Ver há quanto tempo containers estão rodando
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"
```

### Limpar Espaço (CUIDADO!)

```bash
# Remover containers parados
sudo docker container prune

# Remover imagens não usadas
sudo docker image prune

# Remover tudo não usado (CUIDADO!)
sudo docker system prune

# Limpeza completa (remove volumes também - MUITO CUIDADO!)
sudo docker system prune -a --volumes
```

---

## 🔐 Segurança

### Ver Logs de Acesso

```bash
# SSH login history
last -i | head -20

# Ver quem está conectado agora
w

# Ver últimos comandos sudo
sudo cat /var/log/auth.log | grep sudo | tail -20
```

### Atualizar Sistema

```bash
# Atualizar pacotes Ubuntu
sudo apt update
sudo apt upgrade -y

# Atualizar Docker
sudo apt install docker-ce docker-ce-cli containerd.io
```

---

## 🚨 Emergência - Rollback

### Rollback Backend

```bash
# Parar versão atual
sudo docker stop conectcrm-backend-prod
sudo docker rm conectcrm-backend-prod

# Rodar versão anterior (se tiver tag)
sudo docker run -d \
  --name conectcrm-backend-prod \
  --network conectcrm-network \
  -p 3500:3001 \
  -e DATABASE_HOST=conectcrm-postgres-prod \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USERNAME=conectcrm \
  -e DATABASE_PASSWORD=conectcrm_prod_2024_secure \
  -e DATABASE_NAME=conectcrm_prod \
  -e JWT_SECRET=conectcrm_jwt_secret_2024_production \
  --restart unless-stopped \
  conectcrm-backend:previous  # ⚡ Trocar tag
```

### Rollback Frontend

```bash
sudo docker stop conectcrm-frontend-prod
sudo docker rm conectcrm-frontend-prod
sudo docker run -d \
  --name conectcrm-frontend-prod \
  --network conectcrm-network \
  -p 3000:80 \
  --restart unless-stopped \
  conectcrm-frontend:previous  # ⚡ Trocar tag
```

---

## 📝 Criar Nova Empresa (Multi-Tenant)

```sql
-- Conectar no PostgreSQL
sudo docker exec -it conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod

-- Criar empresa
INSERT INTO empresas (id, nome, cnpj, razao_social, email, telefone, ativo)
VALUES (
  gen_random_uuid(),
  'Nome da Empresa',
  '12345678000199',
  'Razão Social Ltda',
  'contato@empresa.com',
  '11999999999',
  true
);

-- Pegar ID da empresa criada
SELECT id, nome FROM empresas ORDER BY created_at DESC LIMIT 1;

-- Criar usuário admin para a empresa
INSERT INTO usuarios (id, email, nome, senha, empresa_id, role, ativo)
VALUES (
  gen_random_uuid(),
  'admin@empresa.com',
  'Administrador',
  '$2b$10$hash_da_senha_aqui',  -- Gerar hash com bcrypt
  'ID_DA_EMPRESA_AQUI',
  'admin',
  true
);

-- Verificar
SELECT u.email, u.nome, e.nome as empresa 
FROM usuarios u 
JOIN empresas e ON u.empresa_id = e.id 
WHERE u.email = 'admin@empresa.com';

\q
```

---

## 🔧 Variáveis de Ambiente

### Backend (.env)

```bash
DATABASE_HOST=conectcrm-postgres-prod
DATABASE_PORT=5432
DATABASE_USERNAME=conectcrm
DATABASE_PASSWORD=conectcrm_prod_2024_secure
DATABASE_NAME=conectcrm_prod
JWT_SECRET=conectcrm_jwt_secret_2024_production
JWT_EXPIRATION=7d
FRONTEND_URL=http://56.124.63.239:3000
```

### Frontend (build time)

```bash
REACT_APP_API_URL=http://56.124.63.239:3500
REACT_APP_WS_URL=ws://56.124.63.239:3500
```

---

## 📞 Contatos de Emergência

**AWS IP**: 56.124.63.239  
**SSH Key**: `C:\Users\mults\Downloads\conect-crm-key.pem`  
**SSH User**: ubuntu  

**Portas Abertas**:
- 3000: Frontend (React)
- 3500: Backend (API)
- 5432: PostgreSQL (interno - não exposto)

**Docker Network**: `conectcrm-network`

---

## ✅ Checklist Diário de Saúde

```bash
# 1. Verificar containers
sudo docker ps

# 2. Ver uso de recursos
sudo docker stats --no-stream

# 3. Verificar logs de erro
sudo docker logs --tail 50 conectcrm-backend-prod | grep -i error

# 4. Testar endpoints
curl -I http://56.124.63.239:3000
curl -I http://56.124.63.239:3500/api

# 5. Verificar PostgreSQL
sudo docker exec conectcrm-postgres-prod pg_isready

# 6. Ver uptime
uptime

# 7. Verificar disco
df -h
```

---

**Última atualização**: 2 de novembro de 2025  
**Versão**: 1.0
