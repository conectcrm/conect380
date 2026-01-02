# 🚀 PRÓXIMOS PASSOS PARA DEPLOY - AÇÕES IMEDIATAS

**Data**: 21/11/2025  
**Status**: ⚠️ AGUARDANDO INFORMAÇÕES DE PRODUÇÃO

---

## 📊 RESULTADO DA VALIDAÇÃO

✅ **O que está OK:**
- JWT Secrets gerados e configurados
- NODE_ENV=production ✅
- APP_ENV=production ✅
- CORS_ORIGINS sem localhost ✅
- FRONTEND_URL configurado ✅
- WhatsApp token configurado ✅
- 51 migrations prontas ✅

❌ **O que precisa corrigir:**
- **DATABASE_HOST** ainda está como `localhost` (deve ser IP/hostname de PRODUÇÃO)

---

## 🎯 AÇÃO IMEDIATA: OBTER INFORMAÇÕES DO SERVIDOR

Você precisa fornecer as seguintes informações:

### 1️⃣ Informações do Servidor AWS/Azure

```
Qual o IP ou domínio do servidor de produção?
Exemplo: 
  - IP: 54.123.45.67
  - Domínio: server.conecthelp.com.br
```

**Responda**: `SERVIDOR_IP = _____________`

### 2️⃣ Informações do Banco de Dados

```
O banco PostgreSQL está:
[ ] No mesmo servidor da aplicação
[ ] Em servidor separado (RDS, Azure Database, etc.)
```

**Se no mesmo servidor:**
```
DATABASE_HOST = <IP_DO_SERVIDOR>
DATABASE_PORT = 5432
```

**Se em servidor separado (RDS):**
```
DATABASE_HOST = <ENDPOINT_RDS>  (ex: conectcrm.abc123.us-east-1.rds.amazonaws.com)
DATABASE_PORT = 5432
```

**Responda**: `DATABASE_HOST = _____________`

### 3️⃣ Acesso SSH ao Servidor

```
Você tem:
[ ] Chave SSH (.pem) para acessar o servidor
[ ] Usuário SSH (geralmente: ubuntu, ec2-user, admin)
```

**Responda**: 
- Caminho da chave: `_____________`
- Usuário SSH: `_____________`

---

## 📋 ASSIM QUE VOCÊ FORNECER AS INFORMAÇÕES

Vou executar estas etapas automaticamente:

### ✅ Etapa 1: Atualizar .env.production (2 min)
```powershell
# Vou atualizar o DATABASE_HOST com o valor correto
# Você confirma: "Sim, pode atualizar"
```

### ✅ Etapa 2: Validar novamente (1 min)
```powershell
.\validar-config-producao.ps1
# Deve passar sem erros ✅
```

### ✅ Etapa 3: Testar conexão com servidor (2 min)
```powershell
# Testar SSH
ssh -i <SUA_CHAVE>.pem <USUARIO>@<IP> "echo 'Conexão OK'"

# Testar banco (se acessível externamente)
psql -h <DATABASE_HOST> -U conectcrm_prod -d conectcrm_production -c "SELECT version();"
```

### ✅ Etapa 4: Conectar no servidor e preparar (5 min)
```bash
ssh -i <SUA_CHAVE>.pem <USUARIO>@<IP>

# Verificar se Git está instalado
git --version

# Verificar se Node.js está instalado
node --version  # Deve ser >= 18

# Verificar se Docker está instalado (se for usar)
docker --version
```

### ✅ Etapa 5: Clonar/Atualizar código (5 min)
```bash
# Se primeira vez:
git clone https://github.com/Dhonleno/conectsuite.git conectcrm
cd conectcrm
git checkout consolidacao-atendimento

# Se já existe:
cd conectcrm
git fetch origin
git checkout consolidacao-atendimento
git pull origin consolidacao-atendimento
```

### ✅ Etapa 6: Copiar .env.production (3 min)
```powershell
# No Windows local:
scp -i <SUA_CHAVE>.pem backend\.env.production <USUARIO>@<IP>:/home/<USUARIO>/conectcrm/backend/
```

### ✅ Etapa 7: Preparar banco (10 min)
```bash
# No servidor:
cd conectcrm/backend

# Instalar dependências
npm ci

# Rodar migrations
npm run migration:run

# Verificar: deve mostrar 51 migrations aplicadas
npm run migration:show
```

### ✅ Etapa 8: Build e Deploy (15 min)
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend-web
npm ci
npm run build

# Iniciar com PM2 (ou Docker)
cd ..
pm2 start ecosystem.config.js --env production

# OU com Docker:
docker-compose -f docker-compose.prod.yml up -d
```

### ✅ Etapa 9: Validação (10 min)
```bash
# Health check
curl http://localhost:3001/health

# Ver logs
pm2 logs
# OU
docker-compose logs -f

# Testar login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}'
```

### ✅ Etapa 10: Abrir portas/DNS (5 min)
```
- Verificar Security Groups (AWS) ou Firewall (Azure)
- Permitir porta 3001 (backend) e 3000 (frontend)
- Configurar DNS (se aplicável)
```

---

## 🔄 FLUXO VISUAL

```
┌─────────────────────────────────────────────┐
│  VOCÊ FORNECE:                              │
│  - IP do servidor                           │
│  - Chave SSH                                │
│  - Endpoint do banco (se separado)          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  EU ATUALIZO:                               │
│  - backend/.env.production (DATABASE_HOST)  │
│  - Valido configuração ✅                   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  VOCÊ EXECUTA (EU TE GUIO PASSO A PASSO):  │
│  1. Conectar via SSH                        │
│  2. Clonar/atualizar código                 │
│  3. Copiar .env.production                  │
│  4. Instalar dependências                   │
│  5. Rodar migrations                        │
│  6. Build                                   │
│  7. Iniciar aplicação                       │
│  8. Validar                                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  RESULTADO:                                 │
│  🎉 APLICAÇÃO RODANDO EM PRODUÇÃO!         │
└─────────────────────────────────────────────┘
```

---

## 📝 TEMPLATE DE RESPOSTA

**Copie e preencha:**

```
INFORMAÇÕES DO SERVIDOR DE PRODUÇÃO:

1. IP/Domínio do servidor:
   SERVIDOR_IP = _____________

2. Banco de dados:
   DATABASE_HOST = _____________
   DATABASE_PORT = 5432
   [ ] Mesmo servidor da app
   [ ] Servidor separado (RDS/Azure)

3. Acesso SSH:
   Chave SSH: _____________
   Usuário: _____________

4. Deploy method:
   [ ] Docker (docker-compose.prod.yml)
   [ ] PM2 (process manager)
   [ ] Outro: _____________

5. Já tem PostgreSQL instalado?
   [ ] Sim, versão: _____
   [ ] Não, precisa instalar

6. Já tem Node.js instalado?
   [ ] Sim, versão: _____
   [ ] Não, precisa instalar
```

---

## ⏭️ O QUE FAZER AGORA

**OPÇÃO 1: Você já tem as informações**
→ Forneça os dados acima e vou continuar o deploy automaticamente!

**OPÇÃO 2: Você precisa obter as informações**
→ Fale com DevOps/Infra para obter:
   - IP do servidor
   - Chave SSH
   - Endpoint do banco (se RDS)
   
**OPÇÃO 3: Você quer fazer deploy local primeiro (teste)**
→ Posso te ajudar a configurar um ambiente de staging local para testar antes do PROD

---

## 🚨 LEMBRETES IMPORTANTES

- ⚠️ **NÃO** use `DATABASE_HOST=localhost` em produção
- ⚠️ **NÃO** exponha sua chave SSH em lugar inseguro
- ⚠️ **FAÇA** backup do banco antes de rodar migrations (se já existir)
- ⚠️ **TESTE** a conexão com banco antes de rodar migrations
- ⚠️ **MONITORE** os logs após o deploy por 1-2 horas

---

**Aguardando suas informações para prosseguir! 🚀**
