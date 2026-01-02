# 🚀 Guia Rápido: Ativar WhatsApp em 5 Minutos

**Sistema**: ConectCRM  
**Integração**: WhatsApp Business API (Meta)  
**Tempo**: 5-10 minutos

---

## 📱 Passo a Passo

### PASSO 1: Obter Credenciais da Meta (5 min)

#### 1.1 Acessar Meta Developer Console
```
🌐 https://developers.facebook.com/apps
```

#### 1.2 Criar/Selecionar App WhatsApp
- Se não tiver app: **Criar App** → Tipo: Business
- Se já tiver: Selecionar app existente

#### 1.3 Copiar Credenciais

**Phone Number ID**:
```
WhatsApp → API Setup → "Phone number ID"
Exemplo: 123456789012345
```

**API Token**:
```
WhatsApp → API Setup → "Temporary access token"
OU gerar "Permanent token" (recomendado)
Exemplo: EAAxxxxxxxxxxxxxxxxxxxxx
```

**Business Account ID**:
```
App Settings → Basic → "WhatsApp Business Account ID"
Exemplo: 123456789012345
```

**Webhook Verify Token**:
```
Criar um token personalizado (qualquer string)
Exemplo: meu-token-secreto-123-xyz
```

---

### PASSO 2: Configurar no ConectCRM (2 min)

#### 2.1 Acessar Tela de Integrações
```
Menu: Configurações → Integrações
OU
URL direta: http://localhost:3000/nuclei/configuracoes/integracoes
```

#### 2.2 Localizar Card "WhatsApp Business API"

#### 2.3 Preencher Campos
```
✅ Phone Number ID:        [colar aqui]
✅ API Token:              [colar aqui]
✅ Webhook Verify Token:   [colar aqui]
✅ Business Account ID:    [colar aqui]
```

#### 2.4 Ativar Switch
```
[X] Ativar WhatsApp
```

#### 2.5 Salvar
```
[Salvar Configurações]
```

---

### PASSO 3: Configurar Webhook na Meta (2 min)

#### 3.1 Expor Backend (Desenvolvimento)
```bash
# Instalar ngrok (se não tiver)
choco install ngrok

# Expor porta 3001
ngrok http 3001

# Copiar URL gerada (exemplo):
https://abc123def456.ngrok.io
```

#### 3.2 Configurar na Meta
```
WhatsApp → Configuration → Webhook

Callback URL:
https://abc123def456.ngrok.io/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>

Verify Token:
meu-token-secreto-123-xyz
(MESMO token que você criou no Passo 1.3)

Headers:
Meta enviará `X-Hub-Signature-256` (configure o App Secret e valide no backend)

[Verify and Save]
```

#### 3.3 Subscrever Eventos
```
Marcar:
☑ messages
☑ messaging_postbacks

[Subscribe]
```

---

### PASSO 4: Testar! (1 min)

#### 4.1 Teste de Conexão
```
Na tela de integrações do ConectCRM:
[Testar Conexão]

Resultado esperado:
✅ "Conexão estabelecida com sucesso!"
```

#### 4.2 Enviar Mensagem de Teste
```
1. Preencher número (com código país):
   +5511999887766

2. Mensagem:
   "Olá! Esta é uma mensagem de teste 🚀"

3. Clicar:
   [Enviar Mensagem de Teste]

4. Verificar WhatsApp:
   Mensagem deve chegar!
```

#### 4.3 Testar Bot (Teste Real)
```
1. No WhatsApp, enviar mensagem para o número configurado:
   "Olá"

2. Bot deve responder com menu:
   1️⃣ Suporte Técnico
   2️⃣ Comercial
   3️⃣ Financeiro

3. Responder:
   "1"

4. Sistema cria ticket automaticamente!
```

---

## ✅ Checklist de Validação

### Meta Developer Console:
- [ ] App WhatsApp criado/selecionado
- [ ] Phone Number ID copiado
- [ ] API Token gerado (permanente de preferência)
- [ ] Business Account ID copiado
- [ ] Webhook Verify Token criado
- [ ] Callback URL configurada
- [ ] Eventos subscritos (messages)

### ConectCRM:
- [ ] Acessou `/nuclei/configuracoes/integracoes`
- [ ] Preencheu Phone Number ID
- [ ] Preencheu API Token
- [ ] Preencheu Webhook Verify Token
- [ ] Preencheu Business Account ID
- [ ] Ativou switch "Ativar WhatsApp"
- [ ] Clicou "Salvar Configurações"
- [ ] Teste de conexão retornou ✅

### Webhook:
- [ ] ngrok rodando (ou servidor em produção)
- [ ] URL pública configurada na Meta
- [ ] Verify token idêntico em ambos os lados
- [ ] Webhook verificado pela Meta (✅ verde)
- [ ] Eventos subscritos

### Testes:
- [ ] Mensagem de teste enviada com sucesso
- [ ] WhatsApp recebeu mensagem
- [ ] Enviou "Olá" para o bot
- [ ] Bot respondeu com menu
- [ ] Escolheu opção "1"
- [ ] Ticket criado no sistema

---

## 🚨 Troubleshooting

### ❌ "Token inválido"
**Solução**: Gerar novo token permanente na Meta

### ❌ "Webhook verification failed"
**Solução**: Verify token deve ser IDÊNTICO na Meta e no ConectCRM

### ❌ "Callback URL não responde"
**Solução**: 
- Verificar se ngrok está rodando
- Verificar se backend está online (porta 3001)
- URL deve ser HTTPS

### ❌ "Bot não responde"
**Solução**:
- Verificar se fluxo está publicado (ver banco de dados)
- Verificar se núcleos estão visíveis no bot
- Ver logs do backend para detalhes

### ❌ "Mensagem não chega no WhatsApp"
**Solução**:
- Verificar se número está no formato correto (+5511999887766)
- Verificar se Phone Number ID está correto
- Ver logs de erro no console do ConectCRM

---

## 📊 Status Esperado Após Configuração

```
Sistema de Atendimento: 100% OPERACIONAL ✅

✅ Backend recebendo webhooks
✅ Bot respondendo automaticamente
✅ Tickets sendo criados
✅ Distribuição funcionando
✅ Chat integrado ativo
✅ Histórico de mensagens salvando
```

---

## 🎓 Resumo Ultra-Rápido

```bash
# 1. Meta Developer Console
Phone Number ID + API Token + Business Account ID + Verify Token

# 2. ConectCRM
Integrações → WhatsApp → Preencher campos → Salvar

# 3. Webhook (Dev)
ngrok http 3001 → Copiar URL → Configurar na Meta

# 4. Testar
Enviar "Olá" no WhatsApp → Bot responde → Ticket criado ✅
```

**Tempo total**: 5-10 minutos  
**Resultado**: Sistema de atendimento WhatsApp COMPLETO! 🚀

---

## 📞 Suporte

**Documentação Completa**: `STATUS_INTEGRACAO_WHATSAPP_META.md`  
**Relatório de Sistema**: `SISTEMA_ATENDIMENTO_PRONTO.md`  
**Análise Técnica**: `RELATORIO_SIMULACAO_ATENDIMENTO_BOT.md`
