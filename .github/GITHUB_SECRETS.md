# 🔐 Configuração de Secrets no GitHub

Este documento descreve todos os **GitHub Secrets** necessários para os workflows de CI/CD funcionarem corretamente.

## 📍 Como Adicionar Secrets

1. Acesse: `https://github.com/Dhonleno/conectsuite/settings/secrets/actions`
2. Clique em **"New repository secret"**
3. Adicione `Name` e `Value`
4. Clique em **"Add secret"**

---

## 🔑 Secrets Necessários

### 📊 Análise de Código (Opcional)

#### Codecov
```
CODECOV_TOKEN=<seu-token-do-codecov>
```
- **Obter em**: https://codecov.io/
- **Usado em**: `.github/workflows/ci.yml`
- **Propósito**: Upload de coverage reports

---

### 🚀 Deploy Backend

#### Opção 1: AWS EC2 (SSH Deploy)

```
AWS_EC2_HOST=<ip-ou-dominio-do-servidor>
AWS_EC2_USER=ubuntu
AWS_SSH_PRIVATE_KEY=<conteudo-da-chave-privada-pem>
```

**Como gerar a chave**:
```powershell
# Já deve ter conectcrm-key.pem
# Copiar conteúdo completo (incluindo BEGIN/END)
cat conectcrm-key.pem | clip
```

#### Opção 2: Azure App Service

```
AZURE_WEBAPP_NAME=conectsuite-backend
AZURE_WEBAPP_PUBLISH_PROFILE=<xml-do-publish-profile>
```

**Como obter**:
1. Azure Portal → App Service → "Download publish profile"
2. Copiar conteúdo completo do arquivo XML

#### Opção 3: Docker Hub

```
DOCKER_HUB_USERNAME=seu-usuario
DOCKER_HUB_PASSWORD=seu-token-de-acesso
```

**Como obter**:
1. https://hub.docker.com/settings/security
2. Criar "New Access Token"

---

### 🎨 Deploy Frontend

#### Opção 1: Vercel

```
VERCEL_TOKEN=<seu-token-vercel>
VERCEL_ORG_ID=<org-ou-team-id>
VERCEL_PROJECT_ID=<project-id>
```

**Como obter**:
1. https://vercel.com/account/tokens → Create Token
2. `VERCEL_ORG_ID`: https://vercel.com/teams/settings
3. `VERCEL_PROJECT_ID`: Settings do projeto

#### Opção 2: Netlify

```
NETLIFY_AUTH_TOKEN=<seu-token-netlify>
NETLIFY_SITE_ID=<site-id>
```

**Como obter**:
1. https://app.netlify.com/user/applications → New access token
2. `NETLIFY_SITE_ID`: Site settings → General → Site information

#### Opção 3: AWS S3 + CloudFront

```
AWS_S3_BUCKET=conectsuite-frontend
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_CLOUDFRONT_DISTRIBUTION=<distribution-id>
```

**Como obter**:
1. AWS IAM → Criar usuário com permissões S3 + CloudFront
2. Gerar Access Key
3. CloudFront Distribution ID no console

---

### 🗄️ Banco de Dados (Migrations)

```
DATABASE_HOST=<host-do-banco>
DATABASE_PORT=5432
DATABASE_USERNAME=<usuario>
DATABASE_PASSWORD=<senha>
DATABASE_NAME=conectcrm
```

**Atenção**:
- Use banco de **PRODUÇÃO** (não localhost)
- Recomendado: Criar usuário específico para CI/CD com permissões limitadas

---

### 🔗 URLs de Health Check

```
BACKEND_URL=https://api.conectsuite.com
FRONTEND_URL=https://conectsuite.com
REACT_APP_API_URL=https://api.conectsuite.com
```

---

### 📢 Notificações (Opcional)

#### Slack

```
SLACK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Como obter**:
1. Slack Workspace → Settings → Integrations
2. Incoming Webhooks → Add to Slack

#### Discord

```
DISCORD_WEBHOOK=https://discord.com/api/webhooks/123456789/abcdefg
```

**Como obter**:
1. Discord Server → Edit Channel → Integrations
2. Create Webhook

---

## 📋 Checklist de Configuração

### Mínimo para CI funcionar (Testes)
- [ ] Nenhum secret necessário! CI roda localmente

### Mínimo para CD funcionar (Deploy)

**Backend (escolher UMA opção)**:
- [ ] AWS EC2: `AWS_EC2_HOST`, `AWS_EC2_USER`, `AWS_SSH_PRIVATE_KEY`
- [ ] Azure: `AZURE_WEBAPP_NAME`, `AZURE_WEBAPP_PUBLISH_PROFILE`
- [ ] Docker: `DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD`

**Frontend (escolher UMA opção)**:
- [ ] Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Netlify: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`
- [ ] AWS: `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_CLOUDFRONT_DISTRIBUTION`

**Banco de Dados**:
- [ ] `DATABASE_HOST`
- [ ] `DATABASE_PORT`
- [ ] `DATABASE_USERNAME`
- [ ] `DATABASE_PASSWORD`
- [ ] `DATABASE_NAME`

**URLs**:
- [ ] `BACKEND_URL`
- [ ] `FRONTEND_URL`
- [ ] `REACT_APP_API_URL`

**Opcional**:
- [ ] `CODECOV_TOKEN`
- [ ] `SLACK_WEBHOOK`
- [ ] `DISCORD_WEBHOOK`

---

## 🧪 Testar Workflows

### Testar CI (Testes)
```powershell
# Fazer um commit em qualquer branch
git add .
git commit -m "test: testar CI workflow"
git push
```

Workflow: `.github/workflows/ci.yml` vai rodar automaticamente.

### Testar CD (Deploy)
```powershell
# 1. Push para main (deploy automático)
git push origin consolidacao-atendimento:main

# OU

# 2. Criar tag (release)
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# OU

# 3. Trigger manual
# GitHub → Actions → "CD - Deploy para Produção" → "Run workflow"
```

---

## 🔒 Segurança dos Secrets

### ✅ Boas Práticas

- **Nunca** commite secrets no código
- Use secrets diferentes para staging e produção
- Rotacione secrets regularmente (a cada 3-6 meses)
- Dê permissões mínimas necessárias
- Revogue secrets imediatamente se comprometidos
- Use GitHub Environments para separar staging/prod

### ❌ O Que NÃO Fazer

- Não use secrets em PRs de forks (segurança)
- Não logue secrets (mesmo ofuscados)
- Não compartilhe secrets por email/chat
- Não use mesma senha para tudo

---

## 🌍 GitHub Environments (Recomendado)

Para configuração avançada, crie environments:

1. **GitHub → Settings → Environments**
2. Criar:
   - `production` (requer approval, só branch main)
   - `staging` (deploy automático em develop)

3. Configurar secrets por environment:
   - `production/DATABASE_HOST` (banco de prod)
   - `staging/DATABASE_HOST` (banco de staging)

Isso permite usar **mesmos nomes de secrets** mas **valores diferentes** por ambiente.

---

## 📞 Suporte

Dúvidas sobre configuração?
- Issues: https://github.com/Dhonleno/conectsuite/issues
- Docs: https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0
