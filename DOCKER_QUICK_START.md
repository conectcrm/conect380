# 🐳 Docker Quick Start - ConectSuite

## ✅ Sistema Configurado para Rodar Via Docker

**Última atualização:** 26/11/2025

---

## 🚀 Comandos Essenciais

### Iniciar Sistema Completo
```powershell
docker-compose up -d
```

### Iniciar Apenas Backend e Frontend
```powershell
docker-compose up -d backend frontend
```

### Ver Status dos Containers
```powershell
docker-compose ps
```

### Ver Logs em Tempo Real
```powershell
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# Todos
docker-compose logs -f
```

### Parar Sistema
```powershell
docker-compose down
```

### Reconstruir e Reiniciar (após mudanças no código)
```powershell
# Backend
docker-compose build backend
docker-compose up -d backend

# Frontend
docker-compose build frontend
docker-compose up -d frontend
```

---

## 🌐 Acessos

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface do usuário |
| **Backend API** | http://localhost:3001 | API REST |
| **Documentação API** | http://localhost:3001/api-docs | Swagger UI |
| **PostgreSQL** | localhost:5432 | Banco de dados |
| **Redis** | localhost:6379 | Cache |
| **Grafana** | http://localhost:3002 | Dashboards (admin/admin) |
| **Prometheus** | http://localhost:9090 | Métricas |
| **Jaeger** | http://localhost:16686 | Tracing |

---

## 👤 Login Padrão

```
Email: admin@conectsuite.com.br
Senha: admin123
```

---

## 🔧 Troubleshooting

### Backend não inicia / erro de autenticação
```powershell
# Verificar se PostgreSQL está saudável
docker-compose ps postgres

# Ver logs do backend
docker logs conectsuite-backend --tail 50

# Recriar container
docker-compose up -d --force-recreate backend
```

### Limpar tudo e recomeçar
```powershell
# Parar e remover containers
docker-compose down

# Remover volumes (⚠️ APAGA DADOS DO BANCO!)
docker-compose down -v

# Recriar tudo
docker-compose up -d
```

### Verificar saúde do sistema
```powershell
# Status detalhado
docker-compose ps

# Banco de dados
docker exec conectsuite-postgres psql -U postgres -d conectcrm -c "SELECT COUNT(*) FROM empresas;"

# Backend health
curl http://localhost:3001/health
```

---

## 📝 Desenvolvimento

### Hot Reload está ATIVO por padrão!

O Docker está configurado com **volume mounts**, então mudanças no código são refletidas automaticamente:

- **Backend**: Watch mode ativo (NestJS recompila automaticamente)
- **Frontend**: Hot reload via React

### Editar código

1. Faça suas alterações normalmente no VS Code
2. O Docker detecta e recarrega automaticamente
3. Não precisa reconstruir imagens a cada mudança

### Quando reconstruir?

Só reconstrua se:
- Mudou `package.json` (novas dependências)
- Mudou `Dockerfile`
- Mudou variáveis de ambiente em `docker-compose.yml`

```powershell
docker-compose build backend
docker-compose up -d backend
```

---

## 🛠️ Comandos Úteis

### Executar comandos no backend
```powershell
# Shell interativo
docker exec -it conectsuite-backend sh

# Comando único
docker exec conectsuite-backend npm run migration:run
```

### Acessar banco de dados
```powershell
# CLI do PostgreSQL
docker exec -it conectsuite-postgres psql -U postgres -d conectcrm

# Listar tabelas
docker exec conectsuite-postgres psql -U postgres -d conectcrm -c "\dt"

# Query
docker exec conectsuite-postgres psql -U postgres -d conectcrm -c "SELECT * FROM users;"
```

### Limpar logs
```powershell
# Limpar logs de um container
docker logs conectsuite-backend --since 5m

# Ver último erro
docker logs conectsuite-backend --tail 50 | Select-String "ERROR"
```

---

## ⚠️ NÃO Rodar Localmente!

**EVITE** rodar `npm run start:dev` localmente (fora do Docker) porque:

❌ Precisa de PostgreSQL instalado no Windows  
❌ Precisa de Redis instalado no Windows  
❌ Conflito de portas  
❌ Configuração duplicada

✅ Use Docker para TUDO - já está configurado e funcionando!

---

## 📊 Monitoramento

### Ver métricas em tempo real
```powershell
# CPU/RAM dos containers
docker stats

# Logs agregados
docker-compose logs -f --tail=100
```

### Grafana Dashboards

1. Acesse http://localhost:3002
2. Login: `admin` / `admin`
3. Navegue para Dashboards → ConectSuite

---

## 🎯 Tasks do VS Code

Use as tasks configuradas no projeto:

- **Ctrl+Shift+B** → Abrir menu de tasks
- **Start Backend Dev (watch)** → Inicia backend Docker em watch mode
- **Health Check** → Verifica saúde do sistema

---

## 📦 Estrutura de Containers

```
conectsuite-postgres    → Banco de dados (porta 5432)
conectsuite-redis       → Cache (porta 6379)
conectsuite-backend     → API NestJS (porta 3001)
conectsuite-frontend    → React App (porta 3000)
conectsuite-grafana     → Dashboards (porta 3002)
conectsuite-prometheus  → Métricas (porta 9090)
conectsuite-jaeger      → Tracing (porta 16686)
conectsuite-loki        → Logs agregados
conectsuite-promtail    → Coleta de logs
conectsuite-alertmanager → Alertas
```

---

## 🚨 Problemas Comuns

### "Port already in use"
```powershell
# Verificar o que está usando a porta
netstat -ano | findstr :3001

# Matar processo
Stop-Process -Id <PID> -Force
```

### "Container unhealthy"
```powershell
# Ver logs do health check
docker inspect conectsuite-backend --format='{{json .State.Health}}' | ConvertFrom-Json

# Verificar logs completos
docker logs conectsuite-backend
```

### Banco de dados vazio após restart
```powershell
# Verificar se volumes estão persistindo
docker volume ls | Select-String "conectcrm"

# Re-executar seed
Get-Content backend/seed-production-data.sql | docker exec -i conectsuite-postgres psql -U postgres -d conectcrm
```

---

**Sistema 100% funcional via Docker! 🚀**

Para dúvidas, consulte também:
- `.github/copilot-instructions.md` (instruções do projeto)
- `backend/README.md`
- `frontend-web/README.md`
