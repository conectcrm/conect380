# 🚀 GUIA RÁPIDO: Configurar Webhook no Meta (AGORA!)

## ⚡ PASSO A PASSO (5 minutos)

### 📋 ANTES DE COMEÇAR - Pegue o Verify Token

**Execute no DBeaver/pgAdmin:**
```sql
SELECT webhook_verify_token 
FROM atendimento_canais_configuracao 
WHERE tipo = 'whatsapp_business_api'
AND empresa_id = '11111111-1111-1111-1111-111111111111';
```

**COPIE o valor retornado!** (você vai precisar no passo 6)

---

## 🔧 CONFIGURAR NO META

### 1. Abrir Meta Developer Console
👉 https://developers.facebook.com/apps

### 2. Selecionar App
- Procure seu app WhatsApp na lista
- Clique para abrir

### 3. Navegar para WhatsApp
- Menu lateral esquerdo
- Clique em **"WhatsApp"**
- Depois clique em **"Configuration"** (Configuração)

### 4. Encontrar Seção Webhook
- Role a página até encontrar a seção **"Webhook"**
- Você verá campos como "Callback URL" e "Verify Token"

### 5. Clicar em Edit
- Clique no botão **"Edit"** ao lado de Webhook

### 6. Preencher Campos

**Callback URL:**
```
https://conectcrm.loca.lt/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111
```

**Verify Token:**
```
[COLE O VALOR DO BANCO DE DADOS AQUI]
```

### 7. Selecionar Webhook Fields
- ✅ Marque a opção: **messages**
- (Pode marcar outras se quiser, mas `messages` é OBRIGATÓRIO)

### 8. Verificar e Salvar
- Clique no botão **"Verify and Save"**
- Meta vai enviar um GET request para seu webhook
- Se tudo estiver correto, verá: ✅ **"Verified"**

---

## 🎯 VERIFICAR SE FUNCIONOU

### Você deve ver no Meta:
- ✅ Status: **"Verified"** (com checkmark verde)
- ✅ Callback URL: `https://conectcrm.loca.lt/api/atendimento/...`
- ✅ Webhook Fields: **messages** (marcado)

### Se deu erro:
1. **"Verify Token doesn't match"**
   - O token do Meta não corresponde ao banco
   - Execute a query SQL novamente e copie o valor EXATO

2. **"URL is not reachable"**
   - LocalTunnel pode ter caído
   - Verifique se o backend está rodando (porta 3001)
   - Tente novamente

3. **"Invalid Callback URL"**
   - Verifique se copiou a URL completa corretamente
   - Deve começar com `https://` e terminar com o UUID

---

## 📱 TESTAR COM MENSAGEM REAL

### Depois de configurar:

1. **Pegue seu celular** (número: 5562996689991)
2. **Abra o WhatsApp**
3. **Envie mensagem para**: `+1 555 159 7121` (Test Number)
4. **Mensagem**: "Teste webhook LocalTunnel"

### O que deve acontecer:
1. Meta recebe sua mensagem
2. Meta envia webhook para: `https://conectcrm.loca.lt/...`
3. LocalTunnel redireciona para: `http://localhost:3001/...`
4. Backend processa e cria ticket + mensagem
5. Mensagem aparece no banco de dados
6. Mensagem aparece no frontend (Atendimento → Omnichannel)

---

## 🔍 VERIFICAR NO BANCO DE DADOS

**Execute após enviar mensagem:**
```sql
-- Ver última mensagem recebida
SELECT 
    m.id,
    m.conteudo_texto,
    m.remetente,
    m.created_at,
    t.numero as ticket
FROM atendimento_mensagens m
LEFT JOIN atendimento_tickets t ON m.ticket_id = t.id
WHERE m.remetente LIKE '%5562996689991%'
ORDER BY m.created_at DESC
LIMIT 1;
```

**Deve mostrar**: Sua mensagem "Teste webhook LocalTunnel" com timestamp recente!

---

## 🎉 SUCESSO = SISTEMA 100% FUNCIONAL!

Se você:
- ✅ Configurou URL no Meta
- ✅ Meta verificou com sucesso (✅ Verified)
- ✅ Enviou mensagem real do WhatsApp
- ✅ Mensagem apareceu no banco de dados

**PARABÉNS! 🎊 Seu webhook está funcionando perfeitamente!**

---

## ⏭️ DEPOIS (Opcional)

### Para produção, considere:
1. **Deploy real** (Railway/Render) → URL fixa permanente
2. **Ngrok pago** ($10/mês) → Mais estável, domínio fixo
3. **Domínio próprio** → Profissional

Mas **por enquanto, LocalTunnel está perfeito para desenvolvimento!** ✅

---

**Última atualização**: 11/12/2025 16:21  
**Status**: LocalTunnel ativo em `https://conectcrm.loca.lt`
