# ✅ Checklist Pré-Deploy AWS - ConectCRM

**Data de preenchimento**: ____/____/2025  
**Responsável**: _______________________  
**Ambiente**: [ ] Staging  [ ] Production

---

## 🔐 1. Credenciais e Acessos

### AWS
- [ ] Conta AWS criada e ativa
- [ ] AWS CLI instalado e configurado (`aws configure`)
- [ ] IAM User com permissões necessárias
- [ ] Access Key ID e Secret anotadas

### Serviços Externos
- [ ] **SendGrid**: API Key criada
- [ ] **OpenAI**: API Key criada
- [ ] **Stripe**: Secret Key criada
- [ ] **WhatsApp API**: URL e Key configuradas

### DNS
- [ ] Domínio registrado
- [ ] Acesso ao painel DNS
- [ ] Subdomínios planejados (app, api, grafana)

---

## 🗄️ 2. Banco de Dados (RDS)

- [ ] Instância RDS PostgreSQL 15 criada
- [ ] Credenciais anotadas (username, password, endpoint)
- [ ] Security group configurado
- [ ] Backup retention: 7 dias
- [ ] Encryption enabled
- [ ] Testado conexão com psql

---

## 🐳 3. Backend

- [ ] Docker image buildada
- [ ] .env.production configurado
- [ ] DATABASE_SYNCHRONIZE=true (primeira vez)
- [ ] Todas variáveis obrigatórias preenchidas
- [ ] Health check endpoint funcionando

---

## 🌐 4. Frontend

- [ ] Build do React concluído
- [ ] S3 bucket criado
- [ ] CloudFront distribution configurada
- [ ] SSL certificate instalado
- [ ] DNS apontando para CloudFront

---

## ✅ 5. Primeira Execução

- [ ] Backend iniciado com synchronize=true
- [ ] 57 tabelas criadas no banco
- [ ] Synchronize desabilitado após verificação
- [ ] Backend redeploy com synchronize=false

---

## 🧪 6. Testes

- [ ] Criar conta de empresa funciona
- [ ] Login funciona
- [ ] Multi-tenant isolado (0 vazamentos)
- [ ] API responde < 500ms
- [ ] Frontend carrega < 3s

---

**PRONTO PARA DEPLOY**: [ ] SIM  [ ] NÃO

**Assinatura**: _________________  
**Data**: ____/____/2025
