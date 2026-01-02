# 🚀 Deploy ConectCRM na AWS

Este guia documenta o processo completo de deploy do ConectCRM na AWS.

## 📋 Pré-requisitos

### Conta AWS
- [ ] Conta AWS ativa
- [ ] AWS CLI instalado e configurado
- [ ] Credenciais IAM com permissões adequadas

### Ferramentas Locais
- [ ] Docker e Docker Compose
- [ ] Node.js 20+
- [ ] Git

## 🏗️ Arquitetura AWS

```
┌─────────────────────────────────────────────────┐
│              AWS Cloud (us-east-1)              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐         ┌──────────────┐    │
│  │   Route 53   │────────▶│     ALB      │    │
│  │     DNS      │         │ Load Balancer│    │
│  └──────────────┘         └──────┬───────┘    │
│                                   │             │
│           ┌───────────────────────┼──────┐     │
│           │                       │      │     │
│  ┌────────▼────────┐    ┌────────▼──────▼──┐  │
│  │  EC2/ECS        │    │   EC2/ECS        │  │
│  │  Frontend       │    │   Backend        │  │
│  │  (React+Nginx)  │    │   (NestJS)       │  │
│  └─────────────────┘    └──────────┬───────┘  │
│                                     │           │
│                           ┌─────────▼───────┐  │
│                           │  RDS PostgreSQL │  │
│                           │  (Multi-AZ)     │  │
│                           └─────────────────┘  │
│                                                 │
│  ┌─────────────┐  ┌──────────────────┐        │
│  │  S3 Bucket  │  │ AWS Secrets Mgr  │        │
│  │  (Uploads)  │  │  (Credenciais)   │        │
│  └─────────────┘  └──────────────────┘        │
│                                                 │
│  ┌─────────────┐  ┌──────────────────┐        │
│  │ CloudWatch  │  │  CloudFront      │        │
│  │ (Logs/Mon.) │  │  (CDN)           │        │
│  └─────────────┘  └──────────────────┘        │
└─────────────────────────────────────────────────┘
```

## 🔧 Opções de Deploy

### Opção 1: EC2 com Docker (Mais Simples)
✅ Recomendado para começar
- Controle total sobre o ambiente
- Fácil debug e manutenção
- Custo previsível

### Opção 2: ECS/Fargate (Serverless)
✅ Recomendado para produção escalável
- Auto-scaling automático
- Sem gerenciamento de servidores
- Paga apenas pelo uso

### Opção 3: Elastic Beanstalk
✅ Mais simples, porém menos flexível
- Deploy com um comando
- Gerenciamento automático
- Limitações de customização

## 📦 Passo 1: Preparar Infraestrutura AWS

### 1.1 Criar VPC e Subnets

```bash
# Via AWS Console ou Terraform
# VPC: 10.0.0.0/16
# Public Subnets: 10.0.1.0/24, 10.0.2.0/24 (para ALB)
# Private Subnets: 10.0.10.0/24, 10.0.11.0/24 (para EC2/RDS)
```

### 1.2 Criar RDS PostgreSQL

```bash
# Via AWS Console
1. RDS → Create Database
2. PostgreSQL 15.x
3. Templates: Production
4. DB Instance: db.t3.micro (começar pequeno)
5. Storage: 20 GB SSD (auto-scaling ativado)
6. Multi-AZ: Sim (produção) ou Não (staging)
7. VPC: Selecionar VPC criada
8. Security Group: Permitir porta 5432 apenas das subnets privadas
9. Backup: 7 dias de retenção
10. Enhanced Monitoring: Ativado
```

**Anotar:**
- Endpoint: `conectcrm-db.xxxxx.us-east-1.rds.amazonaws.com`
- Porta: `5432`
- Username: `conectcrm_admin`
- Password: `<gerado>`

### 1.3 Criar S3 Bucket (Upload de Arquivos)

```bash
aws s3 mb s3://conectcrm-uploads --region us-east-1

# Configurar CORS
aws s3api put-bucket-cors --bucket conectcrm-uploads --cors-configuration file://s3-cors.json
```

**s3-cors.json:**
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.conectcrm.com.br"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 1.4 Configurar AWS Secrets Manager

```bash
# Criar secret para credenciais do banco
aws secretsmanager create-secret \
    --name conectcrm/database \
    --description "ConectCRM Database Credentials" \
    --secret-string '{
      "host":"conectcrm-db.xxxxx.us-east-1.rds.amazonaws.com",
      "port":"5432",
      "username":"conectcrm_admin",
      "password":"<SUA_SENHA_SEGURA>",
      "database":"conectcrm_production"
    }'

# Criar secret para WhatsApp
aws secretsmanager create-secret \
    --name conectcrm/whatsapp \
    --description "WhatsApp Business API Credentials" \
    --secret-string '{
      "access_token":"<TOKEN>",
      "phone_number_id":"<PHONE_ID>",
      "business_account_id":"<ACCOUNT_ID>",
      "webhook_verify_token":"<WEBHOOK_TOKEN>"
    }'

# Criar secret para OpenAI/Anthropic
aws secretsmanager create-secret \
    --name conectcrm/ai-keys \
    --description "AI API Keys" \
    --secret-string '{
      "openai_api_key":"<OPENAI_KEY>",
      "anthropic_api_key":"<ANTHROPIC_KEY>"
    }'
```

## 🖥️ Passo 2: Deploy com EC2 + Docker

### 2.1 Criar Instância EC2

```bash
# Via AWS Console
1. EC2 → Launch Instance
2. Name: conectcrm-prod
3. AMI: Amazon Linux 2023 ou Ubuntu 22.04
4. Instance Type: t3.medium (2 vCPU, 4 GB RAM)
5. Key Pair: Criar ou selecionar existente
6. Network: VPC criada, subnet privada
7. Security Group: 
   - SSH (22) - apenas seu IP
   - HTTP (80) - do ALB
   - HTTPS (443) - do ALB
   - Custom (3001) - do ALB (backend)
8. Storage: 30 GB GP3
9. IAM Role: Criar com permissões:
   - AmazonEC2ContainerRegistryReadOnly
   - SecretsManagerReadWrite
   - S3 Read/Write (bucket específico)
```

### 2.2 Conectar na Instância

```bash
chmod 400 sua-chave.pem
ssh -i sua-chave.pem ec2-user@<IP_PUBLICO>
```

### 2.3 Instalar Dependências no EC2

```bash
# Atualizar sistema
sudo yum update -y

# Instalar Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Git
sudo yum install git -y

# Instalar AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Logout e login novamente para aplicar grupo docker
exit
```

### 2.4 Clonar Repositório

```bash
ssh -i sua-chave.pem ec2-user@<IP_PUBLICO>

# Clonar repo (via HTTPS ou SSH)
git clone https://github.com/Dhonleno/conectcrm.git
cd conectcrm
```

### 2.5 Configurar Variáveis de Ambiente

```bash
# Criar .env.production a partir do secrets manager
cd backend

# Buscar secrets do AWS Secrets Manager e popular .env.production
aws secretsmanager get-secret-value --secret-id conectcrm/database --query SecretString --output text > /tmp/db.json

# Criar .env.production manualmente ou via script
cat > .env.production << 'EOF'
# Configurações do Banco
DATABASE_HOST=conectcrm-db.xxxxx.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USERNAME=conectcrm_admin
DATABASE_PASSWORD=<SENHA_DO_SECRETS_MANAGER>
DATABASE_NAME=conectcrm_production

# JWT
JWT_SECRET=<GERAR_NOVO_256_BITS>
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=<GERAR_NOVO_256_BITS>
JWT_REFRESH_EXPIRES_IN=7d

# App
APP_PORT=3001
APP_ENV=production
NODE_ENV=production

# CORS
CORS_ORIGINS=https://app.conectcrm.com.br

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads
AWS_S3_BUCKET=conectcrm-uploads
AWS_REGION=us-east-1

# Email (AWS SES)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<AWS_SES_USER>
SMTP_PASS=<AWS_SES_PASS>
EMAIL_FROM=noreply@conectcrm.com.br
EMAIL_FROM_NAME=Conect CRM

# Frontend URL
FRONTEND_URL=https://app.conectcrm.com.br

# WhatsApp
WHATSAPP_ACCESS_TOKEN=<TOKEN>
WHATSAPP_PHONE_NUMBER_ID=<PHONE_ID>
WHATSAPP_BUSINESS_ACCOUNT_ID=<BUSINESS_ID>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<WEBHOOK_TOKEN>

# AI
OPENAI_API_KEY=<OPENAI_KEY>
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=<ANTHROPIC_KEY>
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Logs
LOG_LEVEL=info
EOF
```

### 2.6 Executar Deploy

```bash
cd /home/ec2-user/conectcrm

# Tornar script executável
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

### 2.7 Verificar Aplicação

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Testar backend
curl http://localhost:3001/health

# Testar frontend
curl http://localhost/health
```

## 🔒 Passo 3: Configurar Application Load Balancer (ALB)

### 3.1 Criar Target Groups

**Target Group Backend:**
```
Name: conectcrm-backend-tg
Protocol: HTTP
Port: 3001
Health Check: /health
```

**Target Group Frontend:**
```
Name: conectcrm-frontend-tg
Protocol: HTTP
Port: 80
Health Check: /health
```

### 3.2 Criar ALB

```bash
1. EC2 → Load Balancers → Create
2. Type: Application Load Balancer
3. Name: conectcrm-alb
4. Scheme: Internet-facing
5. VPC: Selecionar VPC criada
6. Subnets: Selecionar 2+ public subnets
7. Security Group: 
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
```

### 3.3 Configurar Listeners

**Listener 1: HTTP → HTTPS Redirect**
```
Port: 80
Action: Redirect to HTTPS (443)
```

**Listener 2: HTTPS → Frontend**
```
Port: 443
Default Action: Forward to conectcrm-frontend-tg
Certificate: Criar/Importar SSL via ACM
```

**Rule: /api/* → Backend**
```
Path: /api/*
Action: Forward to conectcrm-backend-tg
```

**Rule: /socket.io/* → Backend**
```
Path: /socket.io/*
Action: Forward to conectcrm-backend-tg
Stickiness: Enabled
```

### 3.4 Registrar Instâncias EC2 nos Target Groups

```bash
# Via AWS Console
1. Target Groups → conectcrm-backend-tg → Targets → Register
2. Selecionar instância EC2
3. Port: 3001
4. Include as pending below → Register

# Repetir para frontend-tg com port 80
```

## 🌐 Passo 4: Configurar DNS (Route 53)

### 4.1 Criar Hosted Zone

```bash
1. Route 53 → Hosted Zones → Create
2. Domain: conectcrm.com.br
3. Type: Public Hosted Zone
```

### 4.2 Criar Records

**Record A (Frontend):**
```
Name: app.conectcrm.com.br
Type: A
Alias: Yes
Target: ALB DNS name
```

**Record A (API):**
```
Name: api.conectcrm.com.br
Type: A
Alias: Yes
Target: ALB DNS name
```

### 4.3 Atualizar Nameservers no Registrador

```
Copiar nameservers do Route 53 e configurar no seu registrador de domínio (registro.br, GoDaddy, etc.)
```

## 📊 Passo 5: Monitoramento e Logs

### 5.1 CloudWatch Logs

```bash
# Instalar CloudWatch Agent no EC2
sudo yum install amazon-cloudwatch-agent -y

# Configurar agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Enviar logs do Docker para CloudWatch
# Editar docker-compose.prod.yml:
logging:
  driver: awslogs
  options:
    awslogs-region: us-east-1
    awslogs-group: /conectcrm/prod
    awslogs-stream: backend
```

### 5.2 CloudWatch Alarms

```bash
# Criar alarmes via Console:
1. CPU > 80%
2. Memory > 85%
3. Disk > 90%
4. RDS Connections > 80%
5. ALB Target Response Time > 1s
```

## 💰 Estimativa de Custos (Região us-east-1)

| Serviço | Configuração | Custo Mensal (USD) |
|---------|--------------|-------------------|
| EC2 t3.medium | 2 vCPU, 4GB RAM | ~$30 |
| RDS db.t3.micro | Multi-AZ | ~$30 |
| ALB | + 1GB transferência | ~$25 |
| S3 | 10GB storage + requests | ~$5 |
| Route 53 | 1 hosted zone | ~$0.50 |
| CloudWatch | Logs + métricas | ~$10 |
| **TOTAL** | | **~$100/mês** |

*Valores aproximados. Verifique calculadora AWS para precisão.*

## 🔄 CI/CD com GitHub Actions

### 5.1 Criar Workflow

Arquivo: `.github/workflows/deploy-aws.yml` (será criado no próximo passo se solicitado)

## 📝 Comandos Úteis

```bash
# SSH na instância
ssh -i sua-chave.pem ec2-user@<IP>

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Restart serviços
docker-compose -f docker-compose.prod.yml restart

# Executar migrations
docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:run

# Backup manual do banco
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U conectcrm_admin conectcrm_production > backup.sql

# Atualizar aplicação
git pull
./deploy.sh
```

## 🆘 Troubleshooting

### Backend não conecta no RDS
```bash
# Verificar security group do RDS permite conexão da instância EC2
# Verificar se .env.production tem credenciais corretas
docker-compose -f docker-compose.prod.yml logs backend
```

### Frontend não carrega
```bash
# Verificar se REACT_APP_API_URL aponta para ALB
# Verificar CORS no backend
docker-compose -f docker-compose.prod.yml logs frontend
```

### WhatsApp webhook não recebe mensagens
```bash
# Verificar se webhook URL está configurada no Meta:
# https://api.conectcrm.com.br/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>
# Verificar se security group permite HTTPS (443) do Facebook IPs
```

## 📞 Suporte

- Documentação AWS: https://docs.aws.amazon.com
- Fórum AWS: https://repost.aws
- Suporte ConectCRM: support@conectcrm.com.br

---

**Última atualização:** 30 de outubro de 2025
