# PostgreSQL Docker - ConectCRM

## 🐳 Configuração Docker

Este projeto agora usa PostgreSQL em Docker para desenvolvimento, garantindo consistência e facilidade de configuração.

### 🚀 Início Rápido

```bash
# Iniciar PostgreSQL + pgAdmin
docker-compose up -d

# Verificar status
docker-compose ps

# Parar containers
docker-compose down
```

### 📊 Informações de Conexão

**PostgreSQL:**
- Host: `localhost`
- Porta: `5434`
- Banco: `conectcrm_db`
- Usuário: `conectcrm`
- Senha: `conectcrm123`

**pgAdmin (Interface Web):**
- URL: http://localhost:5050
- Email: `admin@conectsuite.com.br`
- Senha: `admin123`

### 🛠️ Scripts Úteis

- `setup-docker-postgres.bat` - Configuração inicial
- `manage-docker.bat` - Gerenciamento completo
- `test-connection.js` - Teste de conexão

### 🔧 Comandos Docker

```bash
# Ver logs
docker-compose logs postgres

# Acessar terminal PostgreSQL
docker exec -it conectcrm-postgres psql -U conectcrm -d conectcrm_db

# Backup
docker exec conectcrm-postgres pg_dump -U conectcrm conectcrm_db > backup.sql

# Restaurar
docker exec -i conectcrm-postgres psql -U conectcrm -d conectcrm_db < backup.sql
```

### 🔄 Migração de Dados

Se você tinha dados no PostgreSQL anterior, pode fazer backup e restaurar:

```bash
# Backup do PostgreSQL antigo
pg_dump -h localhost -p 5433 -U conectcrm conectcrm_db > backup_antigo.sql

# Restaurar no Docker
docker exec -i conectcrm-postgres psql -U conectcrm -d conectcrm_db < backup_antigo.sql
```

### ⚠️ Troubleshooting

**Porta já em uso:**
```bash
# Verificar processo usando a porta
netstat -ano | findstr :5434
# Parar containers
docker-compose down
```

**Container não inicia:**
```bash
# Ver logs detalhados
docker-compose logs postgres
# Remover volumes e recriar
docker-compose down -v
docker-compose up -d
```

### 📈 Monitoramento

- **Health Check:** Container verifica automaticamente se PostgreSQL está saudável
- **Logs:** `docker-compose logs postgres`
- **Status:** `docker-compose ps`

### 🔐 Segurança

Para produção, altere:
- Senhas no `docker-compose.yml`
- Configurações de rede
- Volumes persistentes
