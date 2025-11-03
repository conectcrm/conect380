# 🚀 ConectCRM - Guia de Deploy Profissional

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Deploy Local (Teste)](#deploy-local-teste)
5. [Deploy AWS (Produção)](#deploy-aws-produção)
6. [Troubleshooting](#troubleshooting)
7. [Rollback](#rollback)

---

## 🎯 Visão Geral

Este guia documenta o processo **profissional** de deploy do ConectCRM, substituindo o método antigo (copiar arquivos manualmente) por uma abordagem **baseada em Docker images**.

### ❌ Método Antigo (Obsoleto)
```powershell
# NÃO FAÇA MAIS ISSO!
scp middleware.js → AWS
docker cp → /app/dist/
docker restart
```

### ✅ Método Novo (Profissional)
```powershell
# Build + Deploy automatizado
.\.production\scripts\build-all.ps1      # Build completo
.\.production\scripts\deploy-aws.ps1     # Deploy na AWS
```

**Vantagens**:
- ✅ Build completo com todas as dependências
- ✅ Testes automatizados antes do deploy
- ✅ Rollback facilitado (imagens versionadas)
- ✅ Reproduzível em qualquer ambiente
- ✅ Sem "remendos" no container

---

## 📦 Pré-requisitos

### Software Necessário

| Ferramenta | Versão Mínima | Verificar |
|------------|---------------|-----------|
| Node.js | 20.x | `node --version` |
| npm | 10.x | `npm --version` |
| Docker | 24.x | `docker --version` |
| Docker Compose | 2.x | `docker-compose --version` |
| PowerShell | 7.x | `$PSVersionTable.PSVersion` |

### Arquivos de Configuração

1. **Chave SSH**: `c:\Projetos\conectcrm\conectcrm-key.pem`
2. **Variáveis de Ambiente**: Copie `.env.production` para `.env.production.local` e preencha:

```bash
cd .production
cp .env.production .env.production.local

# Edite .env.production.local com valores reais:
# - DATABASE_PASSWORD
# - JWT_SECRET
# - WHATSAPP_API_KEY
# - OPENAI_API_KEY
# - etc.
```

⚠️ **NUNCA commite `.env.production.local`!**

---

## 📁 Estrutura de Arquivos

```
conectcrm/
├── .production/                    ⭐ NOVA ESTRUTURA
│   ├── docker/
│   │   ├── Dockerfile.backend      # Build otimizado backend
│   │   └── Dockerfile.frontend     # Build otimizado frontend
│   ├── configs/
│   │   └── nginx.conf              # Config nginx
│   ├── scripts/
│   │   ├── build-all.ps1           # Build completo
│   │   └── deploy-aws.ps1          # Deploy AWS
│   ├── docker-compose.yml          # Orquestração completa
│   └── .env.production             # Template de variáveis
│
├── backend/                        # Código fonte backend
├── frontend-web/                   # Código fonte frontend
└── DEPLOY.md                       # Este arquivo
```

---

## 🧪 Deploy Local (Teste)

### Passo 1: Build Completo

```powershell
cd c:\Projetos\conectcrm\.production

# Build backend + frontend + Docker images
.\scripts\build-all.ps1

# Ou pular testes (mais rápido):
.\scripts\build-all.ps1 -SkipTests
```

**Saída esperada**:
```
✅ BUILD CONCLUÍDO COM SUCESSO!

Próximos passos:
  1. Testar localmente: docker-compose -f .production/docker-compose.yml up
  2. Deploy na AWS: .\.production\scripts\deploy-aws.ps1
```

### Passo 2: Testar Localmente

```powershell
# Copiar variáveis de ambiente
cp .env.production .env.production.local
# Editar .env.production.local com valores de teste

# Subir todos os serviços
docker-compose up -d

# Acompanhar logs
docker-compose logs -f

# Verificar status
docker-compose ps
```

**Endpoints de teste**:
- Backend: http://localhost:3500
- Frontend: http://localhost:3000
- API Docs: http://localhost:3500/api-docs
- Health: http://localhost:3500/health

### Passo 3: Validar Funcionalidades

```powershell
# Health check
curl http://localhost:3500/health

# Login (teste JWT)
curl -X POST http://localhost:3500/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@conectcrm.com","password":"senha123"}'

# Testar endpoint protegido (com JWT do login)
curl -X GET http://localhost:3500/oportunidades `
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Passo 4: Parar Serviços

```powershell
# Parar tudo
docker-compose down

# Parar e remover volumes (limpar dados)
docker-compose down -v
```

---

## ☁️ Deploy AWS (Produção)

### Passo 1: Preparação

```powershell
# 1. Verificar chave SSH
Test-Path "c:\Projetos\conectcrm\conectcrm-key.pem"

# 2. Testar conexão SSH
ssh -i c:\Projetos\conectcrm\conectcrm-key.pem ubuntu@56.124.63.239 "echo OK"

# 3. Verificar imagens Docker existem localmente
docker images | Select-String "conectcrm"
```

### Passo 2: Deploy Automatizado

```powershell
cd c:\Projetos\conectcrm\.production\scripts

# Deploy completo para AWS
.\deploy-aws.ps1 `
  -KeyPath "c:\Projetos\conectcrm\conectcrm-key.pem" `
  -ServerIP "56.124.63.239"

# Ou dry-run (simular sem executar):
.\deploy-aws.ps1 -DryRun
```

**O que o script faz**:
1. ✅ Exporta imagens Docker para arquivos `.tar`
2. ✅ Transfere via SCP para AWS
3. ✅ Para containers antigos
4. ✅ Carrega novas imagens (`docker load`)
5. ✅ Inicia novos containers
6. ✅ Testa health checks
7. ✅ Limpa arquivos temporários

### Passo 3: Validar Produção

```powershell
# Verificar containers rodando
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker ps"

# Verificar logs
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker logs conectcrm-backend-prod --tail 50"

# Testar endpoints
curl http://56.124.63.239:3500/health
curl http://56.124.63.239:3000
```

---

## 🐛 Troubleshooting

### Problema: Build Falha no Backend

**Erro**:
```
Error: Cannot find module '@nestjs/core'
```

**Solução**:
```powershell
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install --legacy-peer-deps
npm run build
```

---

### Problema: Docker Build Timeout

**Erro**:
```
ERROR: failed to solve: executor failed running [/bin/sh -c npm ci --legacy-peer-deps]
```

**Solução**:
```powershell
# Aumentar memória do Docker
# Docker Desktop → Settings → Resources → Memory: 8GB

# Limpar cache Docker
docker builder prune -a -f

# Retentar build
.\scripts\build-all.ps1
```

---

### Problema: Container Unhealthy na AWS

**Sintoma**:
```
STATUS: Up 2 minutes (unhealthy)
```

**Diagnóstico**:
```powershell
# 1. Verificar logs
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker logs conectcrm-backend-prod --tail 100"

# 2. Testar health check manualmente
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker exec conectcrm-backend-prod curl -f http://localhost:3500/health"

# 3. Verificar processos
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker exec conectcrm-backend-prod ps aux"
```

**Soluções comuns**:
1. **Porta errada**: Verificar se backend roda na porta 3500
2. **Banco não conectou**: Verificar `DATABASE_HOST` e credenciais
3. **Migração pendente**: Executar migrations manualmente

---

### Problema: Frontend não Carrega

**Sintoma**: Tela branca ou erro 404

**Solução**:
```powershell
# Verificar build do React
cd frontend-web
npm run build

# Verificar se REACT_APP_API_URL está correto
echo $env:REACT_APP_API_URL

# Rebuild frontend com URL correta
docker build `
  -f .production/docker/Dockerfile.frontend `
  --build-arg REACT_APP_API_URL="http://56.124.63.239:3500" `
  -t conectcrm-frontend:latest `
  .
```

---

### Problema: Erro de Permissão SSH

**Erro**:
```
Permission denied (publickey)
```

**Solução**:
```powershell
# Windows: Ajustar permissões da chave
icacls "c:\Projetos\conectcrm\conectcrm-key.pem" /inheritance:r
icacls "c:\Projetos\conectcrm\conectcrm-key.pem" /grant:r "$env:USERNAME:(R)"
```

---

## 🔄 Rollback

### Rollback Rápido (Imagens Anteriores)

```powershell
# 1. Listar imagens disponíveis na AWS
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker images | grep conectcrm"

# 2. Parar containers atuais
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker stop conectcrm-backend-prod conectcrm-frontend-prod"

# 3. Iniciar com imagem anterior (tagged com timestamp)
ssh -i <KEY> ubuntu@56.124.63.239 "
sudo docker run -d \
  --name conectcrm-backend-prod \
  --restart unless-stopped \
  -p 3500:3500 \
  conectcrm-backend:20251102-143000
"
```

### Rollback Completo (Código Anterior)

```powershell
# 1. Git checkout para commit anterior
git log --oneline -n 10
git checkout <commit-hash>

# 2. Rebuild
.\scripts\build-all.ps1

# 3. Deploy
.\scripts\deploy-aws.ps1
```

---

## 📊 Monitoramento

### Logs em Tempo Real

```powershell
# Backend
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker logs -f conectcrm-backend-prod"

# Frontend
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker logs -f conectcrm-frontend-prod"

# Todos os containers
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker logs -f \$(sudo docker ps -q)"
```

### Métricas de Recursos

```powershell
# Uso de CPU/Memória
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker stats --no-stream"

# Espaço em disco
ssh -i <KEY> ubuntu@56.124.63.239 "df -h"

# Tamanho das imagens
ssh -i <KEY> ubuntu@56.124.63.239 "sudo docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}'"
```

---

## 🎓 Boas Práticas

### ✅ DO (Faça)

1. **Sempre teste localmente antes de deploy**
   ```powershell
   docker-compose up -d
   # ... testes ...
   docker-compose down
   ```

2. **Versione suas imagens Docker**
   ```powershell
   docker tag conectcrm-backend:latest conectcrm-backend:v1.2.3
   ```

3. **Monitore logs após deploy**
   ```powershell
   ssh ... "sudo docker logs -f conectcrm-backend-prod"
   ```

4. **Faça backup do banco antes de migrations**
   ```powershell
   ssh ... "sudo docker exec conectcrm-postgres-prod pg_dump -U postgres conectcrm > backup.sql"
   ```

### ❌ DON'T (Não Faça)

1. **❌ Não copie arquivos manualmente no container**
   ```powershell
   # NÃO FAÇA ISSO!
   docker cp arquivo.js container:/app/
   ```

2. **❌ Não commite arquivos .env com credenciais**
   ```bash
   # .gitignore DEVE conter:
   .env.production.local
   ```

3. **❌ Não faça deploy direto da branch de desenvolvimento**
   ```powershell
   # Sempre use branch stable/production
   git checkout main  # ou production
   ```

---

## 📞 Suporte

**Problemas não resolvidos?**

1. Verifique este guia novamente
2. Consulte logs completos
3. Documente o erro exato
4. Abra issue no repositório

---

## 📝 Changelog

| Data | Versão | Alterações |
|------|--------|------------|
| 2025-11-02 | 1.0.0 | Versão inicial - Deploy profissional |

---

**Última atualização**: 2 de novembro de 2025
