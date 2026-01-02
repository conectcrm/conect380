# 🚀 ConectCRM - Quick Reference

## 🌐 Acesso Rápido

```
Frontend:  http://56.124.63.239:3000
Backend:   http://56.124.63.239:3500
Swagger:   http://56.124.63.239:3500/api-docs
```

## 🔐 Login

```
Email: admin@conectsuite.com.br
Senha: admin123
```

## 📋 Comandos Mais Usados

### Ver Logs
```bash
# Backend
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 "docker logs conectcrm-backend-prod -f"

# Frontend
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 "docker logs conectcrm-frontend-prod -f"

# PostgreSQL
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 "docker logs conectcrm-postgres-prod -f"
```

### Reiniciar Serviços
```bash
# Apenas backend
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 "cd /home/ubuntu/apps && docker-compose -f docker-compose.prod.yml restart backend"

# Todos os containers
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 "cd /home/ubuntu/apps && docker-compose -f docker-compose.prod.yml restart"
```

### Acessar Banco
```bash
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 "docker exec -it conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod"
```

### Status
```bash
# Ver containers
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 "docker ps"

# Ver recursos
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 "docker stats --no-stream"

# Disco
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 "df -h"
```

## 🧪 Teste Rápido

```powershell
# Login via API
$body = @{ email = "admin@conectsuite.com.br"; senha = "admin123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://56.124.63.239:3500/auth/login" -Method Post -Body $body -ContentType "application/json"
```

## 🆘 Problemas Comuns

### Backend não responde
```bash
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 "cd /home/ubuntu/apps && docker-compose -f docker-compose.prod.yml restart backend"
```

### Login retorna 401
- Verificar se senha é `admin123` (sem espaços)
- Usar campo `senha` (não `password`)
- Email: `admin@conectsuite.com.br`

### Esqueci comandos
```bash
# Ver este arquivo
cat QUICK_REFERENCE.md

# Ver documentação completa
cat PRODUCTION_READY.md
```

---

**Para documentação completa, veja:** `PRODUCTION_READY.md`
