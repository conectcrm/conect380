# 🚀 Guia Completo de Deploy AWS - ConectCRM

**Atualizado**: 20 de novembro de 2025  
**Status**: ✅ Sistema pronto para produção

---

## 📋 Pré-requisitos

### Contas e Acessos
- [ ] Conta AWS ativa
- [ ] AWS CLI instalado e configurado
- [ ] Docker instalado localmente
- [ ] Credenciais de serviços externos:
  - SendGrid (email)
  - OpenAI (IA)
  - Anthropic (IA)
  - Stripe (pagamentos)
  - Evolution API (WhatsApp)

### Conhecimentos Necessários
- Docker e containers
- AWS ECS/Fargate ou EC2
- AWS RDS (PostgreSQL)
- Configuração de DNS e SSL

---

## 🏗️ Arquitetura AWS Recomendada

```
┌─────────────────────────────────────────────────────────┐
│                      CloudFront (CDN)                    │
│                   + SSL/TLS Certificate                  │
└─────────────────┬───────────────────────┬───────────────┘
                  │                       │
        ┌─────────▼─────────┐   ┌────────▼────────┐
        │   S3 Bucket       │   │  Application    │
        │   (Frontend)      │   │  Load Balancer  │
        └───────────────────┘   └────────┬────────┘
                                         │
                        ┌────────────────┼────────────────┐
                        │                │                │
                 ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
                 │ ECS Fargate │  │ ECS Fargate│  │ ECS Fargate│
                 │  (Backend)  │  │  (Backend) │  │  (Backend) │
                 └──────┬──────┘  └─────┬──────┘  └─────┬──────┘
                        └────────────────┼────────────────┘
                                         │
                        ┌────────────────┼────────────────┐
                        │                │                │
                 ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
                 │     RDS     │  │ ElastiCache│  │     S3     │
                 │ PostgreSQL  │  │   (Redis)  │  │  (Uploads) │
                 └─────────────┘  └────────────┘  └────────────┘
```

**Componentes**:
- **CloudFront**: CDN para frontend (baixa latência)
- **S3**: Hospedagem estática do React
- **ALB**: Load balancer para backend
- **ECS Fargate**: Containers backend (escalável, sem gerenciar servidores)
- **RDS PostgreSQL**: Banco de dados gerenciado
- **ElastiCache Redis**: Cache e filas (Bull)
- **S3**: Upload de arquivos (avatares, anexos)

**Custo estimado**: ~$100-200/mês (mínimo) + tráfego

---

## 📦 Opções de Deploy

### Opção A: ECS Fargate (RECOMENDADO)
✅ **Prós**: Serverless, escalável, sem gerenciar VMs  
❌ **Contras**: Custo um pouco maior  
💰 **Custo**: ~$150/mês + RDS

### Opção B: EC2 + Docker Compose
✅ **Prós**: Custo menor, controle total  
❌ **Contras**: Gerenciar servidor, menos escalável  
💰 **Custo**: ~$80/mês (t3.medium)

### Opção C: Elastic Beanstalk
✅ **Prós**: Setup rápido, gerenciado pela AWS  
❌ **Contras**: Menos flexível  
💰 **Custo**: ~$120/mês

**👉 Este guia foca na Opção A (ECS Fargate) e Opção B (EC2)**

---

## 🎯 PASSO 1: Criar RDS PostgreSQL

### 1.1. Pelo Console AWS

1. Acessar **AWS RDS Console**
2. Clicar em **Create database**
3. **Configurações**:
   ```
   Engine: PostgreSQL 15
   Template: Production
   DB instance: db.t3.micro (dev) ou db.t3.small (prod)
   Storage: 20 GB SSD (aumenta automaticamente)
   Multi-AZ: Não (dev) / Sim (prod)
   Public access: No
   VPC: Criar nova ou usar existente
   Security group: Criar novo "conectcrm-db-sg"
   ```

4. **Credenciais**:
   ```
   Master username: conectcrm_prod
   Master password: [SENHA FORTE - ANOTAR]
   Initial database: conectcrm_production
   ```

5. **Advanced settings**:
   ```
   Backup retention: 7 days
   Encryption: Enabled
   Performance Insights: Enabled (opcional)
   ```

6. Clicar em **Create database**

### 1.2. Pela AWS CLI

```bash
aws rds create-db-instance \
  --db-instance-identifier conectcrm-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username conectcrm_prod \
  --master-user-password SENHA_FORTE_AQUI \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-name conectcrm_production \
  --backup-retention-period 7 \
  --no-publicly-accessible \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name default \
  --storage-encrypted \
  --region us-east-1
```

### 1.3. Anotar Endpoint

Após criação (5-10 min), anotar:
```
Endpoint: conectcrm-prod.xxxxxx.us-east-1.rds.amazonaws.com
Port: 5432
Username: conectcrm_prod
Password: [sua senha]
Database: conectcrm_production
```

---

## 🔐 PASSO 2: Configurar Security Groups

### 2.1. Security Group do RDS

**Nome**: `conectcrm-db-sg`

**Inbound Rules**:
```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: Security Group do Backend (conectcrm-backend-sg)
Description: Allow backend access to database
```

### 2.2. Security Group do Backend

**Nome**: `conectcrm-backend-sg`

**Inbound Rules**:
```
Type: Custom TCP
Port: 3001
Source: Security Group do Load Balancer
Description: Allow ALB to backend

Type: SSH (apenas se EC2)
Port: 22
Source: Seu IP
Description: SSH access
```

**Outbound Rules**:
```
Type: All traffic
Destination: 0.0.0.0/0
Description: Allow all outbound
```

---

## 📝 PASSO 3: Criar ElastiCache Redis (Opcional mas recomendado)

### 3.1. Pelo Console

1. Acessar **ElastiCache Console**
2. Clicar em **Create**
3. **Configurações**:
   ```
   Engine: Redis
   Version: 7.0
   Node type: cache.t3.micro
   Number of replicas: 0 (dev) / 1+ (prod)
   Subnet group: Usar VPC do RDS
   Security group: conectcrm-cache-sg
   ```

4. **Security Group** `conectcrm-cache-sg`:
   ```
   Inbound:
   Type: Custom TCP
   Port: 6379
   Source: conectcrm-backend-sg
   ```

### 3.2. Anotar Endpoint

```
Primary Endpoint: conectcrm-cache.xxxxxx.0001.use1.cache.amazonaws.com
Port: 6379
```

---

## 🐳 PASSO 4A: Deploy com ECS Fargate

### 4.1. Criar ECR (Repositório de Imagens)

```bash
# Criar repositório
aws ecr create-repository \
  --repository-name conectcrm/backend \
  --region us-east-1

# Anotar URI do repositório
# Exemplo: 123456789012.dkr.ecr.us-east-1.amazonaws.com/conectcrm/backend
```

### 4.2. Build e Push da Imagem

```bash
# Login no ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build da imagem
cd backend
docker build -f Dockerfile.prod -t conectcrm-backend .

# Tag da imagem
docker tag conectcrm-backend:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/conectcrm/backend:latest

# Push para ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/conectcrm/backend:latest
```

### 4.3. Criar Task Definition

Criar arquivo `task-definition.json`:

```json
{
  "family": "conectcrm-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/conectcrm/backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "APP_ENV", "value": "production"},
        {"name": "APP_PORT", "value": "3001"},
        {"name": "DATABASE_SYNCHRONIZE", "value": "false"}
      ],
      "secrets": [
        {
          "name": "DATABASE_HOST",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:conectcrm/database:host::"
        },
        {
          "name": "DATABASE_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:conectcrm/database:password::"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:conectcrm/jwt:secret::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/conectcrm-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))\""],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Registrar:
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### 4.4. Criar ECS Cluster

```bash
aws ecs create-cluster --cluster-name conectcrm-prod
```

### 4.5. Criar Application Load Balancer

1. **EC2 Console** → **Load Balancers** → **Create**
2. **Tipo**: Application Load Balancer
3. **Nome**: `conectcrm-alb`
4. **Scheme**: Internet-facing
5. **IP**: IPv4
6. **VPC**: Mesma do RDS
7. **Subnets**: Selecionar 2+ zonas de disponibilidade
8. **Security Group**: Criar `conectcrm-alb-sg`:
   ```
   Inbound:
   - HTTP (80) de 0.0.0.0/0
   - HTTPS (443) de 0.0.0.0/0
   ```

9. **Target Group**:
   - Nome: `conectcrm-backend-tg`
   - Target type: IP
   - Protocol: HTTP
   - Port: 3001
   - Health check: `/health`

### 4.6. Criar Service ECS

```bash
aws ecs create-service \
  --cluster conectcrm-prod \
  --service-name conectcrm-backend \
  --task-definition conectcrm-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/conectcrm-backend-tg/xxx,containerName=backend,containerPort=3001"
```

---

## 🖥️ PASSO 4B: Deploy com EC2 + Docker Compose (Alternativa)

### 4.1. Criar Instância EC2

1. **EC2 Console** → **Launch Instance**
2. **Configurações**:
   ```
   Name: conectcrm-prod
   AMI: Ubuntu Server 22.04 LTS
   Instance type: t3.medium (2 vCPU, 4 GB RAM)
   Key pair: Criar ou usar existente
   VPC: Mesma do RDS
   Subnet: Pública
   Auto-assign public IP: Enable
   Security group: conectcrm-backend-sg
   Storage: 30 GB gp3
   ```

### 4.2. Conectar via SSH

```bash
ssh -i "sua-chave.pem" ubuntu@ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com
```

### 4.3. Instalar Dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Git
sudo apt install git -y

# Reiniciar sessão para aplicar grupo docker
exit
# Reconectar via SSH
```

### 4.4. Clonar Repositório

```bash
cd /home/ubuntu
git clone https://github.com/Dhonleno/conectsuite.git
cd conectsuite
git checkout main  # ou sua branch de produção
```

### 4.5. Configurar Variáveis de Ambiente

```bash
cd backend

# Criar .env.production
nano .env.production

# Colar conteúdo de .env.production.example e preencher com valores reais
# CRITICAL: DATABASE_HOST = endpoint do RDS
# CRITICAL: DATABASE_SYNCHRONIZE = true (APENAS na primeira vez!)
```

### 4.6. Build e Iniciar

#### **PRIMEIRA EXECUÇÃO** (criar schema):

```bash
# Habilitar synchronize temporariamente
# No .env.production: DATABASE_SYNCHRONIZE=true

# Build
docker build -f Dockerfile.prod -t conectcrm-backend .

# Iniciar
docker run -d \
  --name conectcrm-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env.production \
  conectcrm-backend

# Aguardar 30 segundos para schema ser criado
sleep 30

# Verificar logs
docker logs conectcrm-backend

# Parar container
docker stop conectcrm-backend
docker rm conectcrm-backend
```

#### **Validar Schema Criado**:

```bash
# Conectar no RDS
psql -h conectcrm-prod.xxxxxx.us-east-1.rds.amazonaws.com \
     -U conectcrm_prod \
     -d conectcrm_production \
     -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Esperado: 57 tabelas
```

#### **SEGUNDA EXECUÇÃO** (produção normal):

```bash
# Desabilitar synchronize
# No .env.production: DATABASE_SYNCHRONIZE=false

# Rebuild (com novo .env)
docker build -f Dockerfile.prod -t conectcrm-backend .

# Iniciar definitivamente
docker run -d \
  --name conectcrm-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env.production \
  conectcrm-backend

# Verificar health
curl http://localhost:3001/health
# Esperado: {"status":"ok","database":"connected"}
```

### 4.7. Configurar Nginx (Frontend)

```bash
sudo apt install nginx -y

# Configurar site
sudo nano /etc/nginx/sites-available/conectcrm

# Colar configuração:
```

```nginx
server {
    listen 80;
    server_name app.conectcrm.com.br;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.conectcrm.com.br;

    # SSL (configurar depois com Certbot)
    ssl_certificate /etc/letsencrypt/live/app.conectcrm.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.conectcrm.com.br/privkey.pem;

    # Frontend (servir build do React)
    root /var/www/conectcrm/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API (proxy para backend)
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/conectcrm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Instalar SSL com Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d app.conectcrm.com.br
```

---

## 🌐 PASSO 5: Deploy Frontend (S3 + CloudFront)

### 5.1. Build do Frontend

```bash
cd frontend-web

# Criar .env.production
echo "REACT_APP_API_URL=https://api.conectcrm.com.br" > .env.production
echo "REACT_APP_WS_URL=wss://api.conectcrm.com.br" >> .env.production

# Build
npm install
npm run build

# Resultado em: build/
```

### 5.2. Criar Bucket S3

```bash
aws s3 mb s3://app-conectcrm --region us-east-1

# Habilitar website hosting
aws s3 website s3://app-conectcrm --index-document index.html --error-document index.html

# Tornar público (para CloudFront)
aws s3api put-bucket-policy --bucket app-conectcrm --policy file://bucket-policy.json
```

**bucket-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::app-conectcrm/*"
    }
  ]
}
```

### 5.3. Upload do Build

```bash
aws s3 sync build/ s3://app-conectcrm/ --delete
```

### 5.4. Criar CloudFront Distribution

1. **CloudFront Console** → **Create Distribution**
2. **Configurações**:
   ```
   Origin domain: app-conectcrm.s3.us-east-1.amazonaws.com
   Origin path: (vazio)
   Name: ConectCRM Frontend
   S3 bucket access: Yes, use OAI
   Origin access identity: Create new
   Bucket policy: Yes, update
   
   Viewer protocol: Redirect HTTP to HTTPS
   Allowed HTTP methods: GET, HEAD, OPTIONS
   Cache policy: CachingOptimized
   
   Alternate domain names (CNAMEs): app.conectcrm.com.br
   Custom SSL certificate: Criar no ACM (us-east-1)
   
   Default root object: index.html
   Error pages: 
     - 403 -> /index.html (200)
     - 404 -> /index.html (200)
   ```

3. Anotar **Distribution domain**: `d1234567890.cloudfront.net`

### 5.5. Configurar DNS

No seu provedor de DNS (Route 53, Cloudflare, etc.):

```
Type: CNAME
Name: app
Value: d1234567890.cloudfront.net
TTL: 300
```

---

## ✅ PASSO 6: Validação Final

### 6.1. Health Checks

```bash
# Backend health
curl https://api.conectcrm.com.br/health
# Esperado: {"status":"ok","database":"connected"}

# Frontend
curl -I https://app.conectcrm.com.br
# Esperado: HTTP 200
```

### 6.2. Teste de Login

1. Acessar: https://app.conectcrm.com.br
2. Criar conta de empresa
3. Login
4. Verificar se dados são salvos (criar produto, cliente, etc.)

### 6.3. Teste Multi-Tenant

```sql
-- Conectar no RDS
psql -h conectcrm-prod.xxxxxx.us-east-1.rds.amazonaws.com \
     -U conectcrm_prod \
     -d conectcrm_production

-- Criar 2 empresas
INSERT INTO empresas (...) VALUES (...);

-- Criar dados em cada
INSERT INTO produtos (empresa_id, ...) VALUES (...);

-- Verificar isolamento
SELECT * FROM produtos WHERE empresa_id = 'empresa-a-id';
SELECT * FROM produtos WHERE empresa_id = 'empresa-b-id';
```

---

## 🔒 PASSO 7: Segurança Adicional

### 7.1. AWS Secrets Manager

Armazenar senhas com segurança:

```bash
# Criar secret para database
aws secretsmanager create-secret \
  --name conectcrm/database \
  --secret-string '{"password":"SENHA_DO_RDS","host":"conectcrm-prod.xxx.rds.amazonaws.com"}' \
  --region us-east-1

# Criar secret para JWT
aws secretsmanager create-secret \
  --name conectcrm/jwt \
  --secret-string '{"secret":"CHAVE_JWT_64_CHARS"}' \
  --region us-east-1
```

### 7.2. WAF (Web Application Firewall)

1. **WAF Console** → **Create web ACL**
2. **Associar**: CloudFront distribution
3. **Rules**:
   - Rate limiting (1000 req/5min por IP)
   - SQL injection protection
   - XSS protection
   - Geo-blocking (opcional)

### 7.3. CloudWatch Alarms

```bash
# Alarme: CPU alta
aws cloudwatch put-metric-alarm \
  --alarm-name conectcrm-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=conectcrm-backend \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:alerts

# Alarme: Muitos erros 500
aws cloudwatch put-metric-alarm \
  --alarm-name conectcrm-high-5xx \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=LoadBalancer,Value=app/conectcrm-alb/xxx
```

---

## 📊 PASSO 8: Monitoramento

### 8.1. Acessar Dashboards

- **Grafana**: https://grafana.conectcrm.com.br (porta 3002)
- **Jaeger**: https://jaeger.conectcrm.com.br (porta 16686)
- **Prometheus**: https://prometheus.conectcrm.com.br (porta 9090)

### 8.2. CloudWatch Logs

```bash
# Ver logs do backend
aws logs tail /ecs/conectcrm-backend --follow
```

### 8.3. RDS Performance Insights

- Acessar **RDS Console** → **conectcrm-prod** → **Performance Insights**
- Ver queries lentas, CPU, conexões

---

## 🔄 PASSO 9: CI/CD (Opcional)

### 9.1. GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: conectcrm/backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -f Dockerfile.prod -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster conectcrm-prod \
            --service conectcrm-backend \
            --force-new-deployment
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Build frontend
        run: |
          cd frontend-web
          npm install
          npm run build
      
      - name: Deploy to S3
        run: |
          aws s3 sync frontend-web/build/ s3://app-conectcrm/ --delete
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id E1234567890ABC \
            --paths "/*"
```

---

## 💰 Estimativa de Custos

### Opção A: ECS Fargate

| Serviço | Especificação | Custo/mês |
|---------|---------------|-----------|
| ECS Fargate (2 tasks) | 0.5 vCPU, 1GB RAM | $30 |
| RDS PostgreSQL | db.t3.micro | $15 |
| ElastiCache Redis | cache.t3.micro | $12 |
| ALB | Application Load Balancer | $20 |
| S3 + CloudFront | Frontend + CDN | $5 |
| Data Transfer | 100GB/mês | $10 |
| **TOTAL** | | **~$92/mês** |

### Opção B: EC2

| Serviço | Especificação | Custo/mês |
|---------|---------------|-----------|
| EC2 | t3.medium | $30 |
| RDS PostgreSQL | db.t3.micro | $15 |
| ElastiCache Redis | cache.t3.micro | $12 |
| S3 + CloudFront | Frontend + CDN | $5 |
| Data Transfer | 100GB/mês | $10 |
| **TOTAL** | | **~$72/mês** |

*Custos aproximados para região us-east-1*

---

## 🆘 Troubleshooting

### Problema: Backend não conecta no RDS

**Solução**:
1. Verificar security group do RDS permite conexão do backend
2. Verificar variáveis DATABASE_HOST, DATABASE_PORT corretas
3. Testar conexão manual:
   ```bash
   psql -h SEU_RDS_ENDPOINT -U conectcrm_prod -d conectcrm_production
   ```

### Problema: Nenhuma tabela criada

**Solução**:
1. Verificar `DATABASE_SYNCHRONIZE=true` na primeira execução
2. Ver logs do backend: `docker logs conectcrm-backend`
3. Verificar se 64 entities foram carregadas nos logs

### Problema: Frontend não conecta no backend

**Solução**:
1. Verificar CORS no backend permite domínio do frontend
2. Verificar `REACT_APP_API_URL` correto no frontend
3. Testar API diretamente: `curl https://api.conectcrm.com.br/health`

### Problema: 502 Bad Gateway

**Solução**:
1. Backend não está respondendo
2. Verificar health check: `/health` retorna 200
3. Ver logs do backend
4. Verificar target group health no ALB

---

## 📚 Recursos Adicionais

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [NestJS Production Best Practices](https://docs.nestjs.com/recipes/deployment)
- [TypeORM Migrations](https://typeorm.io/migrations)

---

## ✅ Checklist Final

- [ ] RDS PostgreSQL criado e acessível
- [ ] ElastiCache Redis criado (opcional)
- [ ] Security groups configurados corretamente
- [ ] Backend deployado (ECS ou EC2)
- [ ] Schema do banco criado (57 tabelas)
- [ ] Synchronize desabilitado após primeira execução
- [ ] Frontend buildado e enviado para S3
- [ ] CloudFront distribution criada
- [ ] DNS configurado (CNAME para CloudFront)
- [ ] SSL configurado (Let's Encrypt ou ACM)
- [ ] Health checks passando
- [ ] Teste de login funciona
- [ ] Teste multi-tenant validado
- [ ] Monitoramento configurado
- [ ] Backups automáticos habilitados
- [ ] Alertas configurados

---

**Autor**: GitHub Copilot  
**Revisão**: ConectCRM Team  
**Suporte**: devops@conectcrm.com.br
