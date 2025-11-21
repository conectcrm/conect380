# 🧪 Guia de Teste - Atualização Banco de Produção

> **⚠️ IMPORTANTE**: Este é um ambiente de TESTE. Faça backup antes!

## 📋 Status das Verificações

✅ **Migrations**: 16/16 críticas presentes  
⚠️ **Environment**: `.env.production` precisa ser criado  
✅ **Seed Data**: Script SQL pronto  

---

## 🚀 Passo a Passo para Testar

### **PASSO 1: Criar Backup do Banco de Produção**

**ANTES DE TUDO**, crie um backup completo:

#### Opção A: Se usar AWS RDS

```bash
# Via AWS CLI
aws rds create-db-snapshot \
  --db-instance-identifier conectcrm-production \
  --db-snapshot-identifier conectcrm-backup-$(Get-Date -Format "yyyyMMdd-HHmmss")

# Via Console AWS
# RDS → Databases → conectcrm-production → Actions → Take snapshot
```

#### Opção B: Se usar PostgreSQL local/EC2

```bash
# Backup completo
pg_dump -h SEU_HOST -U SEU_USER -d conectcrm_production \
  -F c -f backup_antes_migrations_$(date +%Y%m%d_%H%M%S).dump

# Ou backup SQL puro
pg_dump -h SEU_HOST -U SEU_USER -d conectcrm_production \
  > backup_antes_migrations_$(date +%Y%m%d_%H%M%S).sql
```

**✅ Confirme que o backup foi criado antes de prosseguir!**

---

### **PASSO 2: Configurar .env.production**

Crie o arquivo de ambiente de produção:

```bash
# Copiar do template
cd backend
cp .env.production.example .env.production
```

**Edite o arquivo** `backend/.env.production` com os valores **REAIS** de produção:

```bash
# DATABASE - Conexão com banco de PRODUÇÃO
DATABASE_HOST=seu-rds-endpoint.rds.amazonaws.com  # ← SEU RDS
DATABASE_PORT=5432
DATABASE_USERNAME=conectcrm_admin
DATABASE_PASSWORD=SUA_SENHA_REAL_AQUI           # ← SENHA REAL
DATABASE_NAME=conectcrm_production

# JWT - Gere novos secrets para produção
JWT_SECRET=GERE_UM_SECRET_NOVO_256_BITS         # ← NOVO!
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=GERE_OUTRO_SECRET_DIFERENTE  # ← NOVO!
JWT_REFRESH_EXPIRATION=30d

# NODE
NODE_ENV=production
PORT=3001

# FRONTEND - URL de produção
FRONTEND_URL=https://seu-dominio.com.br         # ← SEU DOMÍNIO

# CORS - Configurar origens permitidas
CORS_ORIGINS=https://seu-dominio.com.br,https://app.seu-dominio.com.br

# WhatsApp (se já tiver configurado)
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_BUSINESS_ACCOUNT_ID=seu_id_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id_aqui
WHATSAPP_ACCESS_TOKEN=seu_token_aqui

# OpenAI/Anthropic (se usar)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

**🔐 Gerar JWT Secrets seguros:**

```bash
# No PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Ou no Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### **PASSO 3: Testar Conexão com Banco de Produção**

Antes de executar migrations, **teste a conexão**:

```bash
cd backend

# Teste de conexão (crie este script temporário)
node -e "
const { DataSource } = require('typeorm');
require('dotenv').config({ path: '.env.production' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Conexão com banco de PRODUÇÃO OK!');
    return AppDataSource.destroy();
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  });
"
```

**✅ Só prossiga se a conexão funcionar!**

---

### **PASSO 4: Executar Migrations em Produção**

Agora vamos aplicar as 16 migrations críticas:

```bash
cd backend

# IMPORTANTE: Usar .env.production
$env:NODE_ENV="production"

# Ver migrations pendentes
npm run migration:show

# Executar TODAS as migrations pendentes
npm run migration:run
```

**📊 Saída esperada:**

```
query: SELECT * FROM "migrations" "migrations"
query: CREATE TABLE "atendimento_tickets" ...
query: CREATE TABLE "contatos" ...
... (todas as 16 migrations)
Migration CreateAtendimentoTables1728518400000 has been executed successfully.
Migration CreateContatosTable1744690800000 has been executed successfully.
... (continua)
✅ All migrations executed successfully!
```

**⚠️ Se der erro:**
- Leia a mensagem completa
- **NÃO force** com comandos manuais
- Reverta com: `npm run migration:revert`
- Consulte o plano de rollback em `ESTRATEGIA_DEPLOY_PRODUCAO.md`

---

### **PASSO 5: Validar Estrutura do Banco**

Verifique se as tabelas foram criadas:

```bash
# Conectar no banco
psql -h SEU_HOST -U SEU_USER -d conectcrm_production

# Ou via script Node.js
node -e "
const { DataSource } = require('typeorm');
require('dotenv').config({ path: '.env.production' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

AppDataSource.initialize().then(async () => {
  const result = await AppDataSource.query(\`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  \`);
  
  console.log('📊 Tabelas criadas:', result.length);
  result.forEach(t => console.log('  ✅', t.table_name));
  
  return AppDataSource.destroy();
});
"
```

**📋 Tabelas esperadas (mínimo):**

- ✅ `users`
- ✅ `atendimento_tickets`
- ✅ `atendimento_mensagens`
- ✅ `contatos`
- ✅ `triagem_bot_fluxos`
- ✅ `triagem_bot_nucleos`
- ✅ `equipes`
- ✅ `atribuicoes`
- ✅ `notas_cliente`
- ✅ `demandas`
- ✅ `empresa_configuracoes`
- ✅ `password_reset_tokens`
- ✅ `migrations` (controle do TypeORM)

---

### **PASSO 6: Aplicar Seed Data (Dados Essenciais)**

Popule o banco com dados iniciais:

```bash
# Via psql
psql -h SEU_HOST -U SEU_USER -d conectcrm_production < seed-production-data.sql

# Via Node.js (se psql não disponível)
node -e "
const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

const client = new Client({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

client.connect().then(() => {
  const sql = fs.readFileSync('seed-production-data.sql', 'utf8');
  return client.query(sql);
}).then(() => {
  console.log('✅ Seed data aplicado com sucesso!');
  return client.end();
}).catch((err) => {
  console.error('❌ Erro:', err.message);
  client.end();
});
"
```

**📊 Dados criados:**

- ✅ 1 fluxo de triagem padrão
- ✅ 1 núcleo de atendimento
- ✅ 3 departamentos (Suporte, Vendas, Financeiro)
- ✅ 2 canais (WhatsApp, Chat Web)
- ✅ Configurações do sistema
- ✅ Status de tickets (5 tipos)
- ✅ Prioridades (4 níveis)

---

### **PASSO 7: Criar Usuário Admin**

Crie um usuário para testar o login:

```bash
cd backend

# Script de criação de admin
node -e "
const bcrypt = require('bcrypt');
const { DataSource } = require('typeorm');
require('dotenv').config({ path: '.env.production' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function createAdmin() {
  await AppDataSource.initialize();
  
  const senha = 'Admin@123';  // ← TROQUE DEPOIS!
  const senhaHash = await bcrypt.hash(senha, 10);
  
  await AppDataSource.query(\`
    INSERT INTO users (id, nome, email, senha, role, ativo, deve_trocar_senha, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Admin Sistema',
      'admin@conectcrm.com.br',
      '\${senhaHash}',
      'admin',
      true,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO NOTHING
  \`);
  
  console.log('✅ Usuário admin criado!');
  console.log('   Email: admin@conectcrm.com.br');
  console.log('   Senha: Admin@123');
  console.log('   ⚠️  TROQUE A SENHA NO PRIMEIRO LOGIN!');
  
  await AppDataSource.destroy();
}

createAdmin().catch(console.error);
"
```

---

### **PASSO 8: Testar o Backend em Produção**

Inicie o backend apontando para produção:

```bash
cd backend

# Definir ambiente
$env:NODE_ENV="production"

# Iniciar em modo produção (compilado)
npm run build
npm run start:prod

# OU em modo dev (para teste rápido)
npm run start:dev
```

**📊 Logs esperados:**

```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] INFO [InstanceLoader] ConfigModule dependencies initialized
[Nest] INFO Database connected: conectcrm_production
[Nest] INFO Application is running on: http://localhost:3001
```

---

### **PASSO 9: Testes de Smoke (Verificação Básica)**

Teste os endpoints principais:

#### 1. **Health Check**

```bash
curl http://localhost:3001/health
# Espera: {"status":"ok"}
```

#### 2. **Login**

```bash
# PowerShell
$body = @{
  email = "admin@conectcrm.com.br"
  senha = "Admin@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $body -ContentType "application/json"

Write-Host "✅ Login OK! Token:" $response.access_token
```

#### 3. **Listar Tickets** (autenticado)

```bash
$headers = @{
  Authorization = "Bearer $($response.access_token)"
}

Invoke-RestMethod -Uri "http://localhost:3001/atendimento/tickets" -Headers $headers
```

#### 4. **Listar Contatos**

```bash
Invoke-RestMethod -Uri "http://localhost:3001/contatos" -Headers $headers
```

#### 5. **Listar Fluxos de Triagem**

```bash
Invoke-RestMethod -Uri "http://localhost:3001/triagem/fluxos" -Headers $headers
```

---

## ✅ Checklist Final de Validação

Após executar todos os passos, verifique:

- [ ] Backup do banco foi criado com sucesso
- [ ] Conexão com banco de produção funciona
- [ ] 16 migrations executadas sem erros
- [ ] Tabelas criadas (mínimo 13 tabelas)
- [ ] Seed data aplicado (fluxos, núcleos, departamentos)
- [ ] Usuário admin criado
- [ ] Backend inicia sem erros
- [ ] Login funciona e retorna token JWT
- [ ] Endpoints retornam dados (mesmo que vazios)
- [ ] Logs não mostram erros críticos

---

## 🔄 Rollback (Se Algo Der Errado)

### Reverter Migrations

```bash
cd backend
$env:NODE_ENV="production"

# Reverter última migration
npm run migration:revert

# Ou reverter todas até um ponto
# Execute várias vezes se necessário
```

### Restaurar Backup

#### AWS RDS

```bash
# Via Console AWS
# RDS → Snapshots → Selecionar snapshot → Restore

# Ou via CLI
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier conectcrm-production-restored \
  --db-snapshot-identifier seu-snapshot-id
```

#### PostgreSQL Local

```bash
# Parar aplicação primeiro
# Depois restaurar

# Se usou pg_dump -F c
pg_restore -h SEU_HOST -U SEU_USER -d conectcrm_production backup_file.dump

# Se usou SQL puro
psql -h SEU_HOST -U SEU_USER -d conectcrm_production < backup_file.sql
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Leia os logs** do backend completamente
2. **Verifique** a conexão com banco
3. **Consulte** `ESTRATEGIA_DEPLOY_PRODUCAO.md`
4. **Reverta** se necessário (sempre seguro com backup)

---

## 🎯 Próximos Passos Após Validar

Se tudo funcionar:

1. ✅ **Configurar CI/CD** para deploy automático
2. ✅ **Documentar** credenciais em vault seguro
3. ✅ **Configurar monitoramento** (logs, métricas)
4. ✅ **Testar frontend** conectado a produção
5. ✅ **Realizar testes E2E** completos
6. ✅ **Deploy real** em horário de baixo tráfego

**Última atualização**: 05 de novembro de 2025  
**Versão**: 1.0
