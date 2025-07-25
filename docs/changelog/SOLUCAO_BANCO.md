# 🚨 SOLUÇÃO - Erro de Conexão com Banco de Dados

## ❌ **Erro Atual:**
```
error: autenticação do tipo senha falhou para o usuário "fenixcrm"
```

## 🔧 **Solução: Configurar PostgreSQL**

### **Opção 1: PostgreSQL via Docker (Recomendado)**

```bash
# Parar qualquer container existente
docker stop fenixcrm-postgres 2>/dev/null || true
docker rm fenixcrm-postgres 2>/dev/null || true

# Criar e iniciar o PostgreSQL
docker run --name fenixcrm-postgres \
  -e POSTGRES_PASSWORD=fenixcrm123 \
  -e POSTGRES_USER=fenixcrm \
  -e POSTGRES_DB=fenixcrm_db \
  -p 5432:5432 \
  -d postgres:14

# Aguardar o PostgreSQL inicializar (30 segundos)
timeout 30

# Criar os usuários iniciais
docker exec -i fenixcrm-postgres psql -U fenixcrm -d fenixcrm_db < init-users.sql
```

### **Opção 2: PostgreSQL Local**

Se você tem PostgreSQL instalado localmente:

```bash
# 1. Criar usuário e banco
psql -U postgres -c "CREATE USER fenixcrm WITH PASSWORD 'fenixcrm123';"
psql -U postgres -c "CREATE DATABASE fenixcrm_db OWNER fenixcrm;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE fenixcrm_db TO fenixcrm;"

# 2. Executar o script de usuários
psql -U fenixcrm -d fenixcrm_db -f init-users.sql
```

### **Opção 3: Ajustar Credenciais no .env**

Se você tem PostgreSQL com credenciais diferentes, ajuste o arquivo `.env`:

```bash
# backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=seu_usuario_aqui
DATABASE_PASSWORD=sua_senha_aqui
DATABASE_NAME=seu_banco_aqui
```

## ✅ **Teste de Conectividade**

Após configurar o PostgreSQL, teste a conexão:

```bash
# Via Docker
docker exec -it fenixcrm-postgres psql -U fenixcrm -d fenixcrm_db -c "SELECT version();"

# Via PostgreSQL local
psql -U fenixcrm -d fenixcrm_db -c "SELECT version();"
```

## 🔄 **Reiniciar o Backend**

Após configurar o banco:

1. **Pare o backend atual** (Ctrl+C no terminal)
2. **Reinicie o backend:**
   ```bash
   cd c:\Projetos\fenixcrm\backend
   npm run start:dev
   ```

## 🎯 **Status Esperado**

Quando tudo estiver funcionando, você verá:

```
🔥 Fênix CRM Backend rodando na porta 3001
📖 Documentação disponível em: http://localhost:3001/api-docs
```

## 🔑 **Credenciais Prontas**

Após o setup do banco, use estas credenciais no frontend:

- **Admin**: `admin@fenixcrm.com` / `admin123`
- **Gerente**: `maria@fenixcrm.com` / `manager123`  
- **Vendedor**: `joao@fenixcrm.com` / `vendedor123`

---

**Execute um dos métodos acima e o erro de conexão será resolvido!**
