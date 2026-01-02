# ⚠️ SOLUÇÃO: Instalar PostgreSQL Localmente

O PostgreSQL Docker tem incompatibilidade de autenticação com conexões do Windows.

## 🎯 Opção FUNCIONANTE: Instalar PostgreSQL 15 no Windows

### 1. Download e Instalação

https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

- Versão: PostgreSQL 15.x
- Senha do usuário `postgres`: `postgres`
- Porta: `5432`

### 2. Após instalação:

```powershell
# Criar database
psql -U postgres
CREATE DATABASE conectcrm;
\q

# Importar dados do Docker
docker exec conectsuite-postgres pg_dump -U postgres conectcrm > backup.sql
psql -U postgres -d conectcrm < backup.sql
```

### 3. Parar PostgreSQL Docker:

```powershell
docker-compose stop postgres
```

### 4. Iniciar backend local:

```powershell
cd backend
npm run start:dev
```

---

## 🚀 OU Use Docker (MAIS FÁCIL!)

```powershell
docker-compose up -d
docker-compose logs -f backend

# Edite código - Hot reload funciona!
```

**Hot reload do Docker É RÁPIDO e funciona perfeitamente!**
