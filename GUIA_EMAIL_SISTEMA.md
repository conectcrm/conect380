# 📧 Guia Completo - Sistema de E-mail Real ConectCRM

## 🎯 Visão Geral

O ConectCRM agora possui um sistema completo de envio de e-mails reais para propostas comerciais! Você pode configurar diferentes provedores de e-mail e enviar propostas automaticamente para seus clientes.

## 🚀 Configuração Rápida (Recomendado: Gmail)

### Passo 1: Configurar Gmail
1. **Acesse**: https://myaccount.google.com/security
2. **Ative**: "Verificação em 2 etapas"
3. **Gere**: Uma "Senha de app" para o ConectCRM
4. **Use**: Essa senha de 16 caracteres (não sua senha normal)

### Passo 2: Configurar no Sistema
1. **Acesse**: http://localhost:3000/configuracao-email
2. **Selecione**: Gmail SMTP
3. **Preencha**: Seu e-mail e senha de app
4. **Teste**: Envie um e-mail de teste

### Passo 3: Usar na Proposta
1. **Crie**: Uma nova proposta
2. **Confirme**: Envio por e-mail no final
3. **Cliente recebe**: E-mail com token de 6 dígitos
4. **Cliente acessa**: Portal usando o token

## 🎨 Como Funciona

### 📨 E-mail Enviado ao Cliente
```
🔐 Seu código de acesso: 123 456

📋 DETALHES:
• Proposta: #2024-001
• Valor Total: R$ 5.000,00
• Validade: 30 dias
• Vendedor: João Silva

🌐 ACESSE O PORTAL: 
http://localhost:3000/portal/2024-001/123456
```

### 🎯 Portal do Cliente
- Token de 6 dígitos formatado (123 456)
- Interface limpa e profissional
- Botões para aceitar/rejeitar proposta
- Download de PDF da proposta
- Informações completas da empresa

## ⚙️ Opções de Provedores

### 1. 📧 Gmail SMTP (Recomendado)
- **Custo**: Gratuito
- **Limite**: 500 e-mails/dia
- **Facilidade**: ⭐⭐⭐⭐⭐
- **Confiabilidade**: ⭐⭐⭐⭐⭐

### 2. 🚀 SendGrid (Profissional)
- **Custo**: 100 e-mails/dia grátis
- **Limite**: Ilimitado (pago)
- **Facilidade**: ⭐⭐⭐⭐
- **Confiabilidade**: ⭐⭐⭐⭐⭐

### 3. ☁️ AWS SES (Enterprise)
- **Custo**: Muito barato
- **Limite**: 200 e-mails/dia grátis
- **Facilidade**: ⭐⭐⭐
- **Confiabilidade**: ⭐⭐⭐⭐⭐

## 🛠️ Instalação do Servidor de E-mail

### Windows
```batch
# 1. Navegue até a pasta do backend
cd backend

# 2. Execute o setup automático
setup-email.bat

# 3. Configure o arquivo .env
# Edite o arquivo .env com suas credenciais

# 4. Inicie o servidor
npm start
```

### Manual
```bash
# 1. Instalar dependências
npm install express cors nodemailer @sendgrid/mail

# 2. Criar arquivo .env
cp .env.email .env

# 3. Configurar credenciais no .env
# Edite com suas credenciais

# 4. Iniciar servidor
node email-server.js
```

## 📁 Estrutura de Arquivos Criados

```
frontend-web/
├── src/
│   ├── config/
│   │   └── emailConfig.ts          # Configurações e templates
│   ├── services/
│   │   └── emailServiceReal.ts     # Serviço de e-mail
│   ├── pages/
│   │   └── ConfiguracaoEmailPage.tsx # Interface de configuração
│   ├── utils/
│   │   └── tokenUtils.ts           # Utilitários de token
│   └── .env.example                # Exemplo de configuração

backend/
├── email-server.js                 # Servidor de e-mail
├── package-email.json             # Dependências
├── .env.email                      # Configuração exemplo
└── setup-email.bat                # Script de instalação
```

## 🔧 Configuração Detalhada

### Gmail SMTP
```env
REACT_APP_EMAIL_PROVIDER=gmail
REACT_APP_EMAIL_USER=seu-email@gmail.com
REACT_APP_EMAIL_PASSWORD=sua-senha-de-app-aqui
```

### SendGrid
```env
REACT_APP_EMAIL_PROVIDER=sendgrid
REACT_APP_SENDGRID_API_KEY=SG.sua-api-key-aqui
```

### Dados da Empresa
```env
REACT_APP_EMPRESA_NOME=ConectCRM
REACT_APP_EMPRESA_EMAIL=contato@conectcrm.com
REACT_APP_EMPRESA_TELEFONE=(11) 99999-9999
REACT_APP_EMPRESA_ENDERECO=Rua das Empresas, 123 - São Paulo/SP
REACT_APP_PORTAL_URL=http://localhost:3000/portal
```

## 🧪 Como Testar

### 1. Teste de Configuração
```
1. Acesse: http://localhost:3000/configuracao-email
2. Configure seu provedor (Gmail recomendado)
3. Clique em "Enviar E-mail de Teste"
4. Verifique sua caixa de entrada
```

### 2. Teste com Proposta Real
```
1. Acesse: Propostas → Nova Proposta
2. Preencha todos os dados
3. Finalize a proposta
4. Confirme o envio por e-mail
5. Verifique o e-mail do cliente
6. Teste o acesso ao portal com o token
```

## 🎯 Fluxo Completo

### 1. **Vendedor cria proposta**
- Sistema gera token de 6 dígitos
- Proposta é salva no sistema

### 2. **Sistema envia e-mail**
- E-mail profissional com token
- Link direto para o portal
- Dados da proposta

### 3. **Cliente recebe e-mail**
- Design profissional
- Token destacado: 123 456
- Instruções claras

### 4. **Cliente acessa portal**
- Usa token de 6 dígitos
- Visualiza proposta completa
- Pode aceitar/rejeitar

### 5. **Feedback automático**
- Vendedor recebe notificação
- Status atualizado no CRM

## 🚨 Troubleshooting

### ❌ "Erro ao enviar e-mail"
- **Verifique**: Credenciais no .env
- **Teste**: Configuração na página de config
- **Gmail**: Use senha de app, não senha normal

### ❌ "Servidor de e-mail offline"
- **Inicie**: `node email-server.js` no backend
- **Porta**: Verifique se porta 3001 está livre
- **Dependências**: Execute `npm install`

### ❌ "Token não funciona"
- **Verifique**: URL do portal no .env
- **Token**: Deve ter exatamente 6 dígitos
- **Rota**: Verifique se rota do portal existe

## 🎉 Benefícios

### Para o Vendedor
- ✅ Envio automático de propostas
- ✅ Templates profissionais
- ✅ Tracking de abertura
- ✅ Processo padronizado

### Para o Cliente
- ✅ E-mail profissional
- ✅ Token fácil de usar (6 dígitos)
- ✅ Portal intuitivo
- ✅ Acesso 24/7

### Para a Empresa
- ✅ Imagem profissional
- ✅ Processo automatizado
- ✅ Controle total
- ✅ Escalabilidade

## 📞 Suporte

- **Documentação**: Consulte este guia
- **Testes**: Use a página de configuração
- **Logs**: Verifique console do navegador
- **Backend**: Verifique logs do email-server.js

---

🚀 **Pronto!** Agora você tem um sistema completo de e-mail para propostas comerciais!

Teste com suas próprias credenciais e veja como fica profissional o envio de propostas para seus clientes.
