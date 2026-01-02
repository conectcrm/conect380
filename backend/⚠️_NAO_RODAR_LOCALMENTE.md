# ⚠️ NÃO RODAR BACKEND LOCALMENTE!

## 🚫 EVITE:
```bash
npm run start:dev  # ❌ NÃO USE ISSO!
npm start          # ❌ NÃO USE ISSO!
```

## ✅ USE DOCKER:

### Iniciar backend:
```bash
cd c:\Projetos\conectcrm
docker-compose up -d backend
```

### Ver logs em tempo real:
```bash
docker-compose logs -f backend
```

### Reiniciar backend:
```bash
docker-compose restart backend
```

---

## ❓ Por que não rodar localmente?

1. ❌ PostgreSQL só existe no Docker (não instalado no Windows)
2. ❌ Redis só existe no Docker
3. ❌ Senha do banco é diferente
4. ❌ Conflito de portas
5. ❌ Configuração duplicada

## ✅ Docker tem hot reload!

- Edite arquivos `.ts` normalmente
- NestJS recompila automaticamente
- Não precisa reconstruir imagem

---

## 🌐 Sistema Funcionando:

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **API Docs:** http://localhost:3001/api-docs
- **Login:** admin@conectsuite.com.br / admin123

---

**Consulte:** `DOCKER_QUICK_START.md` na raiz do projeto
