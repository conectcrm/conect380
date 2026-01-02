# 🚨 SOLUÇÃO URGENTE: Erro #133010 - Account not registered

**Data**: 11/12/2025 - 14:33  
**Status**: 🔴 CRÍTICO - WhatsApp não funcional  
**Erro**: `(#133010) Account not registered`

---

## 🔍 Diagnóstico Rápido

O erro indica que as **credenciais no banco de dados também estão incorretas/expiradas**.

A refatoração foi bem-sucedida (código lê do banco ✅), mas os **dados no banco estão ruins** ❌.

---

## ✅ Solução em 3 Passos

### Passo 1: Verificar Estado Atual

Execute o script de diagnóstico:

```powershell
# No DBeaver ou pgAdmin
# Abrir: scripts/diagnosticar-whatsapp-completo.sql
# Executar TODO o script

# Ou via terminal:
psql -U postgres -d conectcrm -f scripts/diagnosticar-whatsapp-completo.sql
```

**O que o script mostra**:
- ✅ Configurações existentes
- ⚠️ Duplicações (se houver)
- 🏢 Empresa default
- ❌ Problemas identificados
- 💡 Recomendação automática
- 📝 Template de UPDATE pronto

---

### Passo 2: Obter Credenciais Corretas da Meta

#### Onde Encontrar (Meta Business Suite)

1. **Acessar**: https://business.facebook.com/
2. **Navegar**: WhatsApp Manager → Configurações de API
3. **Copiar**:
   - 🔑 **Access Token** (começa com `EAA...`, ~180+ caracteres)
   - 📱 **Phone Number ID** (número longo, ex: `704423209430762`)
   - 🏢 **Business Account ID** (ex: `470859252785819`)

#### ⚠️ IMPORTANTE: Token Temporário vs Permanente

- **Token Temporário** (24h): Só para testes (NÃO use em produção!)
- **Token Permanente** (60 dias): Generate System User token
  - Business Settings → Users → System Users
  - Add → Assign WhatsApp permissions
  - Generate new token → Copy

**Recomendação**: Use token de **System User** para produção.

---

### Passo 3: Atualizar no Banco de Dados

#### Opção A: Via UI (Recomendado)

```
1. Acessar: http://localhost:3000/configuracoes/integracoes
2. Encontrar: WhatsApp Business API
3. Clicar: Editar/Configurar
4. Preencher:
   - Phone Number ID: [valor da Meta]
   - Access Token: [valor da Meta]
   - Business Account ID: [valor da Meta]
5. Salvar
```

**Vantagem**: Interface amigável, validação automática

#### Opção B: Via SQL (Se UI não funcionar)

```sql
-- 1. PRIMEIRO: Verificar ID da config existente
SELECT id, "empresaId", ativo 
FROM atendimento_canais_configuracao 
WHERE tipo = 'whatsapp_business_api'
ORDER BY "updatedAt" DESC 
LIMIT 1;

-- 2. COPIAR O ID acima e usar no UPDATE:
UPDATE atendimento_canais_configuracao 
SET 
  credenciais = jsonb_build_object(
    'whatsapp_api_token', 'EAA...SEU_TOKEN_COMPLETO_AQUI',
    'whatsapp_phone_number_id', '704423209430762',  -- Seu Phone Number ID
    'whatsapp_business_account_id', '470859252785819',  -- Seu Business Account ID
    'whatsapp_webhook_verify_token', 'meu_webhook_token_123'  -- Token do webhook (qualquer string)
  ),
  ativo = true,
  "updatedAt" = NOW()
WHERE id = 'UUID_DA_CONFIG_AQUI';  -- ⚠️ Substituir pelo ID do SELECT acima

-- 3. VERIFICAR se atualizou:
SELECT 
  id,
  ativo,
  credenciais->>'whatsapp_phone_number_id' as phone_id,
  LENGTH(credenciais->>'whatsapp_api_token') as token_length,
  "updatedAt"
FROM atendimento_canais_configuracao
WHERE tipo = 'whatsapp_business_api';

-- Espera: token_length > 100, phone_id preenchido, updatedAt = agora
```

---

## 🧪 Testar Imediatamente

### Teste 1: Via Backend Log

Após atualizar credenciais, no terminal do backend você deve ver:

```
[Nest] ... LOG [WhatsAppConfigService] 🔍 Buscando credenciais WhatsApp para empresa: <uuid>
[Nest] ... LOG [WhatsAppConfigService] ✅ Configuração encontrada: <config-id>
[Nest] ... LOG [WhatsAppConfigService] ✅ Credenciais validadas com sucesso
[Nest] ... LOG [WhatsAppConfigService]    Phone Number ID: 704423209430762
```

**NÃO DEVE aparecer**:
```
❌ Token do WhatsApp não encontrado
⚠️ Nenhuma configuração WhatsApp ativa encontrada
```

### Teste 2: Enviar Mensagem

```
1. Abrir: http://localhost:3000/atendimento/omnichannel
2. Selecionar: Qualquer ticket
3. Digitar: "Teste após atualização de credenciais"
4. Enviar
```

**Resultado Esperado**:
- ✅ `[WhatsAppSenderService] ✅ Mensagem enviada! ID: wamid.xxx`
- ✅ Mensagem aparece no chat do WhatsApp do cliente

**Se ainda der erro #133010**:
- ❌ Token/Phone Number ID estão **incorretos**
- ❌ Número WhatsApp **não está conectado** à WABA
- ❌ Token não tem **permissões** necessárias

---

## 🔧 Troubleshooting Avançado

### Erro Persiste Após Atualização?

#### 1. Verificar na Meta API

```bash
# Testar token diretamente na API da Meta
curl -X GET "https://graph.facebook.com/v21.0/704423209430762" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Resposta esperada:
{
  "id": "704423209430762",
  "display_phone_number": "+55 11 99999-9999",
  "verified_name": "Sua Empresa",
  "quality_rating": "GREEN"
}

# Se der erro 133010 aqui também:
# → Token ou Phone Number ID estão ERRADOS na Meta
```

#### 2. Verificar Permissões do Token

Na Meta Business Suite:
- System User deve ter role **Admin** ou **Developer**
- WhatsApp app deve ter permissões:
  - ✅ `whatsapp_business_messaging`
  - ✅ `whatsapp_business_management`

#### 3. Verificar Número Conectado

- Abrir: WhatsApp Manager → Phone Numbers
- Verificar: Status = "Connected" (verde)
- Se "Not Connected": Reconectar o número

#### 4. Regenerar Token

Se nada funcionar:
1. Meta Business Suite → System Users
2. Remover token antigo
3. Generate new token (60 days)
4. Copiar novo token
5. Atualizar no banco novamente

---

## 📊 Checklist de Validação

Após aplicar a solução, verificar:

- [ ] ✅ Script SQL executado sem erros
- [ ] ✅ Credenciais atualizadas no banco (verificar com SELECT)
- [ ] ✅ Backend mostra log "Configuração encontrada"
- [ ] ✅ Backend mostra log "Credenciais validadas com sucesso"
- [ ] ✅ Teste de envio de mensagem **SEM erro #133010**
- [ ] ✅ Mensagem chegou no WhatsApp do cliente
- [ ] ✅ Download de mídia funciona (testar com imagem/áudio)
- [ ] ✅ BUG-003 testado (reconexão WebSocket)

---

## 🎯 Próximos Passos (Após Resolver)

Uma vez que WhatsApp estiver funcional:

1. ✅ **Testar BUG-003** (WebSocket reconnection) - Finalmente!
2. ✅ **Testar notificações** via fila Bull
3. ✅ **Documentar** credenciais corretas (local seguro)
4. ✅ **Remover** variáveis `.env` obsoletas (após 1-2 semanas)
5. ✅ **Configurar** renovação automática de token (System User de 60 dias)

---

## 💡 Dicas Importantes

### ✅ Boas Práticas

1. **Token Permanente**: Sempre use System User token (não temporário)
2. **Renovação**: Configure alerta para renovar token antes de expirar (55 dias)
3. **Backup**: Documente Phone Number ID e Business Account ID
4. **Testes**: Após qualquer mudança, teste envio imediatamente
5. **Logs**: Monitore logs do backend para detectar problemas cedo

### ⚠️ Erros Comuns

- ❌ **Token Temporário**: Expira em 24h
- ❌ **Token Copiado Errado**: Falta caracteres no início/fim
- ❌ **Phone Number ID Errado**: Número de outro projeto
- ❌ **Permissões Insuficientes**: System User sem role Admin
- ❌ **Número Desconectado**: Reconectar no WhatsApp Manager

---

## 📞 Suporte

Se ainda não funcionar após seguir todos os passos:

1. **Verificar Meta Status**: https://developers.facebook.com/status/
2. **Consultar Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api/
3. **Verificar Logs**: Copiar logs completos do backend
4. **Verificar Payload**: Ver exatamente o que está sendo enviado

---

**Criado**: 11/12/2025 - 14:35  
**Autor**: GitHub Copilot AI Agent  
**Versão**: 1.0  
**Status**: 🔴 URGENTE - Resolver imediatamente
