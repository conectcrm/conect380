# ✅ CHECKLIST RÁPIDO - CORREÇÃO DEPLOY PRODUÇÃO

**Imprima ou mantenha aberto durante execução**

---

## 📋 PRÉ-EXECUÇÃO

- [ ] Acesso SSH ao servidor AWS configurado
- [ ] Chave .pem disponível
- [ ] Backup do banco atual feito (se necessário)
- [ ] Credenciais de produção em mãos (senhas, tokens)

---

## 🔧 FASE 1: CONECTAR (2 min)

```bash
ssh -i sua-chave.pem ubuntu@seu-ip-aws
cd /home/ubuntu/conectcrm
```

- [ ] Conectado no servidor
- [ ] No diretório do projeto

---

## 🧹 FASE 2: LIMPAR (5 min)

```bash
.\remover-deploy-quebrado.ps1 -Force
docker ps -a  # Deve estar vazio
```

- [ ] Containers removidos
- [ ] Nenhum container conectcrm rodando

---

## ⚙️ FASE 3: CONFIGURAR (10 min)

**Copiar .env.production**:
```bash
# Do Windows local:
scp -i sua-chave.pem backend\.env.production ubuntu@ip:/home/ubuntu/conectcrm/backend/
```

**Editar valores**:
```bash
cd backend
nano .env.production
```

Substituir:
- [ ] DATABASE_HOST=<SEU_IP>
- [ ] DATABASE_PASSWORD=<SENHA>
- [ ] SMTP_USER=<EMAIL>
- [ ] SMTP_PASS=<SENHA_APP>
- [ ] WHATSAPP_ACCESS_TOKEN=<TOKEN>
- [ ] OPENAI_API_KEY=<KEY> (se usar)

**Validar**:
```bash
cd ..
.\validar-config-producao.ps1
```

- [ ] Validação passou (0 erros)

---

## 🗄️ FASE 4: BANCO (8 min)

**Criar banco**:
```sql
psql -h SEU_IP -U postgres
CREATE USER conectcrm_prod WITH PASSWORD 'senha';
CREATE DATABASE conectcrm_production WITH OWNER = conectcrm_prod;
GRANT ALL PRIVILEGES ON DATABASE conectcrm_production TO conectcrm_prod;
\q
```

**Migrations**:
```bash
cd backend
npm run migration:run
```

- [ ] Banco criado
- [ ] 51 migrations executadas

---

## 🚀 FASE 5: DEPLOY (5 min)

```bash
cd ..
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
docker-compose logs -f
```

- [ ] Build concluído
- [ ] Containers iniciados
- [ ] Logs sem erros críticos

---

## ✅ FASE 6: VALIDAÇÃO (10 min)

### Check 1: Containers
```bash
docker ps
```
- [ ] nginx rodando
- [ ] backend rodando
- [ ] frontend rodando

### Check 2: Health
```bash
curl http://localhost:3001/health
```
- [ ] Retornou: {"status":"ok"}

### Check 3: DATABASE (CRÍTICO!)
```bash
docker-compose exec backend env | grep DATABASE
```
- [ ] DATABASE_HOST ≠ localhost
- [ ] DATABASE_PORT = 5432 (NÃO 5434)
- [ ] DATABASE_NAME = conectcrm_production

### Check 4: NODE_ENV
```bash
docker-compose exec backend env | grep NODE_ENV
```
- [ ] NODE_ENV=production

### Check 5: Login
```bash
curl -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"123"}'
```
- [ ] Retornou resposta (erro ou token ok)

### Check 6: Frontend
```bash
curl -I http://seu-ip-aws
```
- [ ] Status 200 ou 301/302

### Check 7: Logs
```bash
docker-compose logs backend | grep -i error
```
- [ ] Sem erros críticos de conexão

---

## 🎯 CRITÉRIOS DE SUCESSO

**TODOS devem estar ✅**:

- [ ] DATABASE_HOST ≠ localhost
- [ ] DATABASE_PORT = 5432
- [ ] DATABASE_NAME = conectcrm_production
- [ ] NODE_ENV = production
- [ ] Health check OK
- [ ] Containers estáveis (sem restart)
- [ ] Logs limpos
- [ ] Frontend acessível

---

## 🚨 SE DER ERRO

**Container reiniciando**:
```bash
docker-compose logs backend --tail=100
```

**Banco não conecta**:
```bash
docker-compose exec backend ping -c 3 SEU_IP_BANCO
```

**502 Bad Gateway**:
```bash
docker-compose restart backend
docker-compose logs nginx
```

**Migration error**:
```bash
# Limpar e reexecutar:
psql -h SEU_IP -U conectcrm_prod -d conectcrm_production
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q
cd backend; npm run migration:run
```

---

## 📞 COMANDOS ÚTEIS

**Ver logs em tempo real**:
```bash
docker-compose logs -f backend
```

**Reiniciar serviço**:
```bash
docker-compose restart backend
```

**Status dos containers**:
```bash
docker ps
docker stats
```

**Testar conexão com banco**:
```bash
psql -h SEU_IP -U conectcrm_prod -d conectcrm_production
```

---

## ✅ FINALIZAÇÃO

Após todos os checks passarem:

- [ ] Documentar credenciais em local seguro
- [ ] Testar fluxo completo (criar ticket, etc)
- [ ] Configurar backup automático
- [ ] Configurar monitoramento/alertas
- [ ] Notificar equipe que sistema está OK

---

**🎯 SUCESSO = DATABASE_HOST correto + PORT 5432 + ENV production + Tudo funcionando!**

---

**Arquivos de Referência**:
- Guia Completo: `EXECUCAO_DEPLOY_CORRIGIDO.md`
- Documentação: `GUIA_REMOVER_DEPLOY_QUEBRADO.md`
- Scripts: `remover-deploy-quebrado.ps1`, `validar-config-producao.ps1`
