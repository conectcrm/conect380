# 🚀 DESENVOLVIMENTO LOCAL - ConectSuite

## ✅ RECOMENDAÇÃO: Use Docker com Hot Reload!

O Docker **JÁ TEM hot reload configurado** e funciona perfeitamente!

### Por quê usar Docker?

- ✅ **Hot reload funciona**: Backend recompila automaticamente
- ✅ **Sem problemas de senha**: PostgreSQL já configurado
- ✅ **Ambiente idêntico**: Mesma config da produção
- ✅ **Sem instalação local**: Não precisa de PostgreSQL/Redis no Windows

### Como usar:

```powershell
# Inicie tudo via Docker
docker-compose up -d

# Edite o código normalmente
# Backend: src/**/*.ts → Recompila automaticamente
# Frontend: src/**/*.tsx → React hot reload

# Veja logs em tempo real
docker-compose logs -f backend
```

---

## ⚠️ Desenvolvimento Local (se REALMENTE precisar)

> Requisito mínimo fora do Docker: **Node.js 22.16+ (npm 10+)** em ambos backend e frontend. Configure `NODE_OPTIONS=--max_old_space_size=4096` ao rodar `npm start` no frontend. Consulte também `docs/CREDENCIAIS_PADRAO.md` para saber o usuário/senha padrão usados nos scripts de teste.

**PROBLEMA ATUAL**: PostgreSQL Docker usa autenticação `scram-sha-256` que não funciona com conexões do Windows.

### Opção 1: Modificar pg_hba.conf (NÃO RECOMENDADO)

```powershell
# Alterar método de autenticação para MD5
docker exec -it conectsuite-postgres sh
echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pgdata/pg_hba.conf
docker-compose restart postgres
```

### Opção 2: Instalar PostgreSQL no Windows

1. Download: https://www.postgresql.org/download/windows/
2. Instalar com senha `postgres`
3. Criar database `conectcrm`
4. Rodar migrations: `npm run migration:run`

---

## 🎯 CONCLUSÃO

**Use Docker!** É mais rápido, confiável e já funciona.

```powershell
# Setup rápido:
docker-compose up -d
docker-compose logs -f backend

# Edite código e veja mudanças instantâneas!
```

Consulte: `DOCKER_QUICK_START.md`
