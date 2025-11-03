# 🚀 GUIA: Como Ativar o Webhook do WhatsApp

**Última atualização:** 11 de outubro de 2025  
**Status:** Webhook pronto para configuração  
**Tempo estimado:** 15-30 minutos

---

## 📋 PRÉ-REQUISITOS

Antes de começar, você precisa ter:

- [ ] **Conta no Meta Business Manager**
- [ ] **Aplicativo WhatsApp Business cadastrado**
- [ ] **Phone Number ID** (do Meta)
- [ ] **Access Token** (do Meta)
- [ ] **Business Account ID** (do Meta)
- [ ] **Servidor acessível** (localhost para testes, domínio público para produção)

---

## 📍 PASSO 1: OBTER CREDENCIAIS DO META

### 1.1 Acessar Meta Developer Console

1. Acesse: https://developers.facebook.com/
2. Faça login com sua conta
3. Vá para **Meus Aplicativos**
4. Selecione seu aplicativo WhatsApp Business

### 1.2 Obter Phone Number ID

1. No menu lateral, clique em **WhatsApp** → **API Setup**
2. Você verá algo como:
   ```
   Phone Number ID: 123456789012345
   ```
3. ✅ **Copie este ID**

### 1.3 Obter Access Token

1. Na mesma página (API Setup)
2. Procure por **Temporary access token** ou **System User Token**
3. Clique em **Generate Token**
4. ✅ **Copie o token** (começa com `EAA...`)

⚠️ **IMPORTANTE:** Para produção, use um **System User Token permanente**, não o temporário!

### 1.4 Obter Business Account ID

1. No menu lateral, clique em **WhatsApp** → **Settings**
2. Procure por **WhatsApp Business Account ID**
3. ✅ **Copie este ID**

---

## 📍 PASSO 2: CONFIGURAR NO FRONTEND

### 2.1 Acessar Configurações

1. Abra o navegador: http://localhost:3000
2. Faça login como administrador
3. Vá para: **Configurações** → **Integrações**
4. Clique na aba **WhatsApp**

### 2.2 Escolher um Canal

Você tem 4 canais "WHATSAPP Principal" cadastrados. **Escolha UM** para configurar:

```
ID: 2fe447a9-3547-427e-be9c-e7ef36eca202
ID: 5f162099-6990-40f3-8038-8efb024eef2c
ID: b701e629-e072-46e3-9f24-50215dac3588
ID: bff3a505-a9ef-433c-91a5-0ba1a1b16f89
```

💡 **Dica:** Depois, você pode deletar os outros 3 canais duplicados.

### 2.3 Preencher o Formulário

```
┌─────────────────────────────────────────────────────────────┐
│  📱 CONFIGURAÇÃO DO CANAL WHATSAPP                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Nome do Canal: *                                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ WhatsApp Atendimento                                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Phone Number ID: *                                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 123456789012345  (cole aqui)                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Access Token: *                                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ EAA... (cole aqui o token do Meta)                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Business Account ID: *                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 987654321098765  (cole aqui)                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Webhook Verify Token: *                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ meu_token_seguro_12345  (crie um token único)         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ☑ Ativar este canal                                        │
│                                                             │
│  [ SALVAR ]  [ CANCELAR ]                                   │
└─────────────────────────────────────────────────────────────┘
```

**Campos importantes:**
- **Nome:** Pode ser qualquer nome (ex: "WhatsApp Atendimento")
- **Phone Number ID:** Cole o ID obtido do Meta
- **Access Token:** Cole o token obtido do Meta
- **Business Account ID:** Cole o ID obtido do Meta
- **Webhook Verify Token:** **CRIE UM TOKEN ÚNICO E SEGURO**
  - Exemplo: `conectcrm_webhook_2024_abc123xyz`
  - Guarde este token! Você vai precisar dele no próximo passo
- ✅ **Marque "Ativar este canal"**

### 2.4 Salvar

1. Clique em **SALVAR**
2. Aguarde a confirmação de sucesso
3. ✅ O canal agora está **ATIVO** e pronto para uso!

---

## 📍 PASSO 3: CONFIGURAR WEBHOOK NO META

### 3.1 Montar a URL do Webhook

Sua URL do webhook será:

**Para Testes (localhost):**
```
http://localhost:3001/api/atendimento/webhooks/whatsapp/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Para Produção:**
```
https://seu-dominio.com/api/atendimento/webhooks/whatsapp/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

⚠️ **ATENÇÃO:** Para usar localhost, você precisa expor com **ngrok** ou similar:

```bash
# Instalar ngrok (se ainda não tiver)
choco install ngrok  # Windows
# ou baixe de https://ngrok.com/download

# Expor porta 3001
ngrok http 3001

# Vai retornar algo como:
# https://abc123def456.ngrok.io -> http://localhost:3001
```

Use a URL do ngrok + o path do webhook:
```
https://abc123def456.ngrok.io/api/atendimento/webhooks/whatsapp/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

### 3.2 Registrar no Meta Developer Console

1. Acesse: https://developers.facebook.com/
2. Vá no seu aplicativo WhatsApp Business
3. Menu lateral: **WhatsApp** → **Configuration**
4. Procure por **Webhook**

### 3.3 Preencher Configuração do Webhook

```
┌─────────────────────────────────────────────────────────────┐
│  🔗 WEBHOOK CONFIGURATION                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Callback URL: *                                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ https://abc123.ngrok.io/api/atendimento/webhooks/...  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Verify Token: *                                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ meu_token_seguro_12345  (mesmo do passo 2.3!)         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [ VERIFY AND SAVE ]                                        │
└─────────────────────────────────────────────────────────────┘
```

⚠️ **CRÍTICO:** O **Verify Token** DEVE ser EXATAMENTE o mesmo que você configurou no frontend!

### 3.4 Verificar

1. Clique em **Verify and Save**
2. O Meta vai fazer uma chamada GET para seu webhook
3. Seu backend vai validar o token e responder
4. Se tudo estiver correto: ✅ **"Verified Successfully!"**

---

## 📍 PASSO 4: SUBSCREVER EVENTOS

### 4.1 Selecionar Webhook Fields

Depois de verificar o webhook, você precisa subscrever aos eventos:

1. Na página de **Webhook Configuration**
2. Procure por **Webhook Fields** ou **Subscribe to Fields**
3. Marque as seguintes opções:

```
☑ messages           (Mensagens recebidas)
☑ message_status     (Status de entrega, leitura)
☑ messaging_events   (Eventos diversos)
```

4. Clique em **Subscribe**

---

## 📍 PASSO 5: TESTAR O WEBHOOK

### 5.1 Enviar Mensagem de Teste

#### Opção A: Via Frontend

1. No Meta Developer Console
2. Vá em **WhatsApp** → **API Setup**
3. Na seção **Send and receive messages**
4. Use o **Test phone number** fornecido
5. Envie uma mensagem de teste

#### Opção B: Via WhatsApp Real

1. Adicione o número do WhatsApp Business aos seus contatos
2. Envie uma mensagem: "Olá! Teste de webhook"
3. Aguarde alguns segundos

### 5.2 Verificar Recebimento

**No Backend (Terminal):**
```powershell
# Verificar logs do backend
# Você deve ver algo como:
📋 Verificação de webhook recebida
✅ Webhook verificado com sucesso!
📨 Mensagem recebida de: 5511988888888
```

**No Banco de Dados:**
```powershell
# Verificar mensagens recebidas
$env:PGPASSWORD='conectcrm123'
psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -c 'SELECT * FROM mensagens ORDER BY "createdAt" DESC LIMIT 5;'
```

### 5.3 Testar com Script

Execute o script de testes criado:

```powershell
# No terminal, na raiz do projeto
node test-webhook-whatsapp.js
```

Você deve ver:
```
╔════════════════════════════════════════════════════════════════════╗
║       🧪 TESTE COMPLETO DO WEBHOOK WHATSAPP                      ║
╚════════════════════════════════════════════════════════════════════╝

✅ SUCESSO: Challenge retornado corretamente!
✅ SUCESSO: Mensagem recebida!
✅ SUCESSO: Status de entrega processado!
✅ SUCESSO: Mensagem com mídia recebida!
✅ SUCESSO: Token inválido foi rejeitado corretamente!

🎉 TODOS OS TESTES PASSARAM!
```

---

## 📍 TROUBLESHOOTING

### ❌ Erro: "Token inválido"

**Problema:** Webhook Verify Token não corresponde

**Solução:**
1. Verifique no banco de dados:
   ```sql
   SELECT id, nome, webhook_secret 
   FROM canais 
   WHERE tipo = 'whatsapp' AND ativo = true;
   ```
2. Compare com o token no Meta Developer Console
3. Devem ser EXATAMENTE iguais

### ❌ Erro: "Webhook verification failed"

**Problema:** Backend não está acessível

**Solução:**
1. Confirme que o backend está rodando:
   ```powershell
   curl http://localhost:3001/api/atendimento/canais
   ```
2. Se usar ngrok, confirme que está ativo:
   ```powershell
   ngrok http 3001
   ```
3. Use a URL do ngrok no Meta

### ❌ Mensagens não chegam

**Problema:** Eventos não subscritos

**Solução:**
1. No Meta Developer Console
2. **Webhook Configuration** → **Webhook Fields**
3. Certifique-se que marcou:
   - ☑ messages
   - ☑ message_status

---

## ✅ CHECKLIST FINAL

Antes de considerar o webhook operacional:

- [ ] ✅ Credenciais do Meta obtidas
- [ ] ✅ Canal configurado no frontend
- [ ] ✅ Canal ATIVO no banco de dados
- [ ] ✅ Webhook registrado no Meta
- [ ] ✅ Webhook verificado com sucesso
- [ ] ✅ Eventos subscritos (messages, message_status)
- [ ] ✅ Mensagem de teste recebida
- [ ] ✅ Logs do backend mostrando recebimento
- [ ] ✅ Mensagem gravada no banco de dados
- [ ] ✅ Script de testes passou 100%

---

## 🚀 PRÓXIMOS PASSOS

Após o webhook estar funcionando:

1. **Integrar com Filas de Atendimento**
   - Configurar regras de distribuição
   - Atribuir atendentes

2. **Configurar Respostas Automáticas**
   - Mensagem de boas-vindas
   - Horário de atendimento
   - Respostas rápidas

3. **Monitorar Performance**
   - Tempo de resposta
   - Taxa de resolução
   - Satisfação do cliente

4. **Escalabilidade**
   - Adicionar mais canais WhatsApp
   - Configurar balanceamento de carga
   - Implementar cache

---

## 📚 REFERÊNCIAS

- [WhatsApp Business API - Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Meta Webhook Security](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
- [ngrok Documentation](https://ngrok.com/docs)

---

**Dúvidas?** Consulte o arquivo `docs/TESTE_WEBHOOK_WHATSAPP.md` para mais detalhes técnicos.
