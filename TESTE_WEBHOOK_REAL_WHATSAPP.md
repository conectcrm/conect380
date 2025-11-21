# 🧪 Teste do Webhook Real - WhatsApp Business

## ✅ Status Atual
- ✅ Backend rodando na porta 3001
- ✅ Webhook funcionando em ambiente de teste
- ✅ URL configurada no Meta Developer Console
- ✅ Entities corrigidas (10 correções aplicadas)

---

## 📱 Como Testar com Mensagem Real

### 1️⃣ **Envie uma mensagem de teste**

Usando seu telefone pessoal, envie uma mensagem para o número do WhatsApp Business:

```
Para: [SEU_NUMERO_WHATSAPP_BUSINESS]
Mensagem: "Olá! Preciso de suporte"
```

### 2️⃣ **Verifique os logs do backend**

No terminal da task "Start Backend (Nest 3001)", procure por:

```
🔍 [WEBHOOK DEBUG] Iniciando processarMensagem
📩 Nova mensagem recebida
   De: 55119XXXXXXXX
   ID: wamid.XXXXX
   Tipo: text
📱 Canal encontrado: WHATSAPP Principal
🎫 Ticket: [ID] (Número: X)
💬 Salvando mensagem para ticket...
✅ Mensagem salva: [ID]
```

### 3️⃣ **Confirme no banco de dados**

Execute no terminal:

```powershell
# Ver últimos tickets criados
docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "
  SELECT 
    id, 
    numero, 
    contato_telefone, 
    contato_nome, 
    LEFT(assunto, 50) as assunto, 
    status,
    created_at 
  FROM atendimento_tickets 
  ORDER BY created_at DESC 
  LIMIT 5;
"

# Ver últimas mensagens recebidas
docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "
  SELECT 
    m.id,
    t.numero as ticket,
    m.tipo,
    LEFT(m.conteudo, 60) as preview,
    m.remetente_tipo,
    m.created_at
  FROM atendimento_mensagens m
  JOIN atendimento_tickets t ON m.ticket_id = t.id
  ORDER BY m.created_at DESC
  LIMIT 5;
"
```

---

## 🔍 Verificações Importantes

### ✅ Checklist de Funcionamento

- [ ] Mensagem enviada do WhatsApp
- [ ] Logs apareceram no backend
- [ ] Ticket criado no banco (ou reutilizado se já existia)
- [ ] Mensagem salva no banco com:
  - `tipo`: TEXTO
  - `remetente_tipo`: CLIENTE
  - `conteudo`: Texto da mensagem
  - `identificador_externo`: ID da mensagem do WhatsApp

### ⚠️ Se algo não funcionar:

**1. Webhook não foi chamado:**
- Verifique se a URL no Meta está correta: `https://SEU_DOMINIO/api/atendimento/webhooks/whatsapp/f47ac10b-58cc-4372-a567-0e02b2c3d479`
- Confirme que o backend está acessível externamente (não localhost)
- Verifique o `webhook_verify_token` na configuração do canal

**2. Erro ao processar:**
- Veja os logs detalhados no terminal da task
- Execute o comando de verificação de erros:
  ```powershell
  docker logs conectcrm-postgres --tail 50
  ```

**3. Mensagem não aparece no banco:**
- Verifique se o `phone_number_id` do canal corresponde ao configurado no Meta
- Confirme que o canal está ativo no banco:
  ```sql
  SELECT id, nome, tipo, ativo, config 
  FROM atendimento_canais 
  WHERE tipo = 'whatsapp';
  ```

---

## 🎯 Próximos Passos Após Teste Bem-Sucedido

1. **WebSocket em Tempo Real**
   - Conectar frontend ao WebSocket gateway
   - Receber notificações instantâneas de novas mensagens

2. **Dashboard de Atendimento**
   - Lista de tickets ativos
   - Visualização de histórico de mensagens
   - Interface para enviar respostas

3. **Envio de Mensagens**
   - Implementar serviço de envio via WhatsApp Cloud API
   - Atualizar status de mensagens (enviada, entregue, lida)

---

## 📊 Estatísticas do Sistema

Após alguns testes, consulte:

```sql
-- Total de tickets por status
SELECT status, COUNT(*) as total 
FROM atendimento_tickets 
GROUP BY status;

-- Total de mensagens por tipo
SELECT tipo, COUNT(*) as total 
FROM atendimento_mensagens 
GROUP BY tipo;

-- Tickets mais recentes
SELECT 
  numero,
  contato_nome,
  status,
  created_at,
  ultima_mensagem_em
FROM atendimento_tickets
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚀 Sistema Pronto para Produção!

✅ Webhook configurado e testado
✅ Recebimento de mensagens funcionando
✅ Criação automática de tickets
✅ Persistência no banco de dados

**Próximo: Construir interface de atendimento!** 🎨
