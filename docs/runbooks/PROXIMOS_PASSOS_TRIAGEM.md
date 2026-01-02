# 🎯 PRÓXIMOS PASSOS - SISTEMA DE TRIAGEM

## ✅ Status Atual (16/10/2025)
- **Backend MVP Completo:** 28/28 endpoints testados e funcionando
- **Webhook WhatsApp:** Implementado com suporte a payloads simples e Meta oficial
- **Taxa de Sucesso:** 100% nos testes automatizados
- **Autenticação:** Decorator `@Public()` implementado para endpoints sem auth

---

## 🚀 Roadmap de Implementação

### **FASE 1: Validação e Segurança** (Prioridade ALTA)

#### 1.1 Testar Webhook com Payloads Reais
**Objetivo:** Validar comportamento com mensagens reais do WhatsApp Business API

**Tarefas:**
- [ ] Configurar ngrok ou túnel similar para expor `http://localhost:3001`
- [ ] Registrar URL do webhook no Meta Business Manager
- [ ] Enviar mensagens reais de um número WhatsApp
- [ ] Monitorar logs do backend (`npm run start:dev`)
- [ ] Validar que sessões são criadas/retomadas corretamente
- [ ] Confirmar que respostas do bot chegam ao WhatsApp

**Ferramentas:**
```bash
# Instalar ngrok (se necessário)
choco install ngrok

# Criar túnel
ngrok http 3001

# Webhook URL a registrar no Meta
https://<seu-id>.ngrok.io/triagem/webhook/whatsapp
```

**Arquivos de Referência:**
- `test-triagem-endpoints.ps1` - Exemplos de payloads
- `backend/src/modules/triagem/services/triagem-bot.service.ts` - Lógica de processamento

---

#### 1.2 Implementar Validação de Assinatura
**Objetivo:** Garantir que requisições vêm do Meta (não de terceiros)

**Tarefas:**
- [ ] Buscar `App Secret` do canal no banco de dados
- [ ] Calcular HMAC SHA-256 do body usando o secret
- [ ] Comparar com header `X-Hub-Signature-256`
- [ ] Rejeitar requisições com assinatura inválida (200 OK mas log de warning)

**Implementação:**
```typescript
// backend/src/modules/triagem/controllers/triagem.controller.ts
@Public()
@Post('webhook/whatsapp')
async webhookWhatsApp(@Body() body: any, @Headers('x-hub-signature-256') signature: string) {
  const empresaId = process.env.DEFAULT_EMPRESA_ID || '...';
  
  // Validar assinatura
  const appSecret = await this.canaisService.getAppSecret(empresaId);
  const isValid = this.validateSignature(body, signature, appSecret);
  
  if (!isValid) {
    this.logger.warn(`⚠️ Assinatura inválida do webhook - empresaId: ${empresaId}`);
    // Retornar 200 para não causar reenvio do Meta, mas não processar
    return { success: true, processed: false };
  }
  
  // ... continuar processamento
}
```

---

### **FASE 2: Interface de Usuário** (Prioridade MÉDIA)

#### 2.1 Página de Gestão de Núcleos
**Objetivo:** Permitir criação/edição de núcleos pelo frontend

**Tarefas:**
- [ ] Criar `frontend-web/src/pages/GestaoNucleosPage.tsx`
- [ ] Implementar tabela com colunas: Nome, Código, Tipo Distribuição, Capacidade, Status
- [ ] Criar modal para CRUD (criar/editar/visualizar)
- [ ] Adicionar filtros: nome, ativo, tipo distribuição
- [ ] Implementar service: `frontend-web/src/services/nucleoService.ts`
- [ ] Adicionar rota no menu lateral (Dashboard Layout)

**Design de Referência:**
- Tabela similar a `ClientesPage.tsx` ou `PropostasPage.tsx`
- Modal similar ao padrão do sistema

---

#### 2.2 Página de Gestão de Fluxos
**Objetivo:** Criar/editar fluxos de triagem visualmente

**Tarefas:**
- [ ] Criar `frontend-web/src/pages/GestaoFluxosPage.tsx`
- [ ] Implementar cards de fluxos (nome, canal, status publicação)
- [ ] Criar editor de fluxo (JSON ou form builder)
- [ ] Implementar preview visual do fluxo (diagrama de etapas)
- [ ] Adicionar ações: Publicar, Despublicar, Duplicar, Deletar
- [ ] Implementar service: `frontend-web/src/services/fluxoService.ts`

**Bibliotecas Sugeridas:**
- `react-flow` ou `reactflow` - Para diagrama visual
- `react-json-view` - Para edição JSON (fallback)

---

### **FASE 3: Integração WhatsApp Business API** (Prioridade ALTA)

#### 3.1 Configurar Webhook na Meta
**Objetivo:** Conectar sistema ao WhatsApp Business oficial

**Tarefas:**
- [ ] Acessar Meta Business Manager → WhatsApp → Configuração
- [ ] Adicionar URL do webhook (produção ou ngrok)
- [ ] Configurar `verify_token` (buscar do banco via `canais` table)
- [ ] Subscrever eventos: `messages`, `message_status`
- [ ] Testar envio de mensagem real
- [ ] Validar recebimento no backend

**Documentação Oficial:**
https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks

---

#### 3.2 Envio de Respostas via WhatsApp
**Objetivo:** Bot deve enviar mensagens via API oficial do Meta

**Status Atual:**
- ✅ Webhook recebe mensagens
- ✅ Bot processa fluxo e gera resposta
- ⚠️ Resposta ainda não é enviada de volta ao WhatsApp

**Tarefas:**
- [ ] Implementar `WhatsAppSenderService` (se não existir)
- [ ] Configurar token de acesso do Meta (armazenar em `canais` table)
- [ ] Chamar API do Meta para envio:
  ```
  POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
  ```
- [ ] Tratar erros de envio (rate limit, número inválido, etc)
- [ ] Registrar mensagens enviadas no banco (`mensagens_triagem` table?)

**Implementação Sugerida:**
```typescript
// backend/src/modules/triagem/services/whatsapp-sender.service.ts
async enviarMensagem(empresaId: string, telefone: string, mensagem: string) {
  const canal = await this.canaisService.findByEmpresa(empresaId, 'whatsapp');
  
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${canal.phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: telefone,
      type: 'text',
      text: { body: mensagem }
    },
    {
      headers: {
        'Authorization': `Bearer ${canal.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}
```

---

### **FASE 4: Documentação e Manutenção** (Prioridade MÉDIA)

#### 4.1 Documentar Arquitetura
**Tarefas:**
- [ ] Criar `backend/src/modules/triagem/README.md`
- [ ] Documentar fluxo de dados (diagrama)
- [ ] Explicar estrutura de núcleos/fluxos/sessões
- [ ] Adicionar exemplos de uso da API
- [ ] Criar troubleshooting guide

#### 4.2 Melhorias de Código
**Tarefas:**
- [ ] Adicionar testes unitários (Jest) para services
- [ ] Adicionar testes E2E para fluxos críticos
- [ ] Implementar retry logic para falhas de envio
- [ ] Adicionar métricas/monitoramento (APM)

---

## 🎯 Quick Wins (Próximas 2 horas)

1. **Testar Webhook Real** (45 min)
   - Configurar ngrok
   - Registrar no Meta
   - Enviar 5 mensagens de teste
   - Validar logs

2. **Implementar Validação de Assinatura** (30 min)
   - Adicionar lógica de HMAC no controller
   - Testar com payload válido/inválido

3. **Criar Página de Núcleos (Básica)** (45 min)
   - Tabela read-only
   - Listagem dos 3 núcleos existentes
   - Adicionar no menu lateral

---

## 📊 Métricas de Sucesso

- **Webhook funcionando em produção:** Recebe e responde mensagens reais
- **Interface de gestão:** Usuários podem criar/editar núcleos sem tocar no código
- **Taxa de resposta:** 95%+ das mensagens recebem resposta em <3s
- **Segurança:** 100% dos webhooks validam assinatura Meta

---

## 🔗 Links Úteis

- **Meta Webhooks:** https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **WhatsApp Business API:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Ngrok Docs:** https://ngrok.com/docs
- **Test Script:** `test-triagem-endpoints.ps1`

---

**Última Atualização:** 16/10/2025 19:10  
**Próxima Revisão:** Após FASE 1 estar completa
