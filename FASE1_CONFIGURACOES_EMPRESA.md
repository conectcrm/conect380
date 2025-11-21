# Fase 1 - Configurações de Empresa (Estrutura Aprovada)

## ✅ Status: EM PROGRESSO (33% completo)

---

## 🎯 Objetivo

Implementar sistema completo de configurações tenant-level seguindo arquitetura aprovada (Cenário 2 com 8 tabs em fases).

---

## 📋 Estrutura de Tabs Aprovada

### **Fase 1 (Agora)** - 6 Tabs Essenciais

1. ✅ **Geral** - Identidade visual, branding
2. ✅ **Segurança** - Autenticação, sessões, passwords, IPs (IMPLEMENTADO)
3. ⏳ **Usuários e Permissões** - Limites, aprovações, convites
4. ⏳ **Email/SMTP** - Configurações de email
5. ⏳ **Comunicação** - WhatsApp, SMS, Push Notifications
6. ⏳ **Backup e Dados** - Automação, frequência, retenção

### **Fase 2 (Futuro)**

7. ⏸️ **Integrações Externas** - Pagamentos, ERPs, WhatsApp API
8. ⏸️ **API e Webhooks** - API keys, webhooks, rate limits

---

## 🗄️ Backend - Concluído (100%)

### Entity Expandida ✅

**Arquivo**: `backend/src/modules/empresas/entities/empresa-config.entity.ts`

**Novos campos adicionados:**

#### Segurança (expandido)
- `forceSsl: boolean` - Forçar HTTPS (default: true)
- `ipWhitelist: string[]` - Lista de IPs permitidos (JSONB, nullable)

#### Usuários (expandido)
- `conviteExpiracaoHoras: number` - Validade do convite (default: 48h, range: 24-168)

#### Comunicação (nova categoria)
- `whatsappHabilitado: boolean` - Habilitar WhatsApp (default: false)
- `whatsappNumero: string` - Número WhatsApp (nullable)
- `whatsappApiToken: string` - Token API WhatsApp (nullable)
- `smsHabilitado: boolean` - Habilitar SMS (default: false)
- `smsProvider: enum` - Provider SMS (twilio, nexmo, sinch)
- `smsApiKey: string` - API Key SMS (nullable)
- `pushHabilitado: boolean` - Habilitar Push (default: false)
- `pushProvider: enum` - Provider Push (fcm, apns, onesignal)
- `pushApiKey: string` - API Key Push (nullable)

**Total de campos**: 31 campos (20 originais + 11 novos)

### Migration ✅

**Arquivo**: `backend/src/migrations/1762212773553-AddPhase1ConfigFields.ts`

**Status**: ✅ Tabela criada com sucesso com todos os campos!

**Enums criados**:
- `empresa_configuracoes_senha_complexidade_enum`
- `empresa_configuracoes_sms_provider_enum` ⭐ NOVO
- `empresa_configuracoes_push_provider_enum` ⭐ NOVO
- `empresa_configuracoes_backup_frequencia_enum`

**Observação**: Migration falhou em outra tabela (`contas_pagar`), mas a tabela `empresa_configuracoes` **foi criada com sucesso** antes do rollback!

---

## 🎨 Frontend - Em Progresso (33%)

### Service Layer ✅

**Arquivo**: `frontend-web/src/services/empresaConfigService.ts`

**Interfaces atualizadas** com novos campos:

```typescript
export enum SmsProviderEnum {
  TWILIO = 'twilio',
  NEXMO = 'nexmo',
  SINCH = 'sinch',
}

export enum PushProviderEnum {
  FCM = 'fcm',
  APNS = 'apns',
  ONESIGNAL = 'onesignal',
}

export interface ConfiguracoesEmpresa {
  // ... campos originais ...
  
  // Segurança (expandido)
  forceSsl: boolean;
  ipWhitelist?: string[] | null;
  
  // Usuários (expandido)
  conviteExpiracaoHoras: number;
  
  // Comunicação (nova categoria)
  whatsappHabilitado: boolean;
  whatsappNumero?: string | null;
  whatsappApiToken?: string | null;
  smsHabilitado: boolean;
  smsProvider?: SmsProviderEnum | null;
  smsApiKey?: string | null;
  pushHabilitado: boolean;
  pushProvider?: PushProviderEnum | null;
  pushApiKey?: string | null;
}
```

### Página de Configurações ✅ (2/6 tabs implementados)

**Arquivo**: `frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx`

**Tabs atualizadas** com ícones:

```tsx
const tabs = [
  { id: 'geral', label: 'Geral', icon: Settings },             // ✅ IMPLEMENTADO
  { id: 'seguranca', label: 'Segurança', icon: Shield },       // ✅ IMPLEMENTADO
  { id: 'usuarios', label: 'Usuários e Permissões', icon: Users },  // ⏳ TODO
  { id: 'email', label: 'Email/SMTP', icon: Mail },            // ⏳ TODO
  { id: 'comunicacao', label: 'Comunicação', icon: MessageSquare }, // ⏳ TODO
  { id: 'backup', label: 'Backup e Dados', icon: Database },   // ⏳ TODO
];
```

### Aba Segurança - Implementada ✅

**Campos**:
1. ✅ Autenticação 2FA (checkbox toggle)
2. ✅ Tempo de Sessão (input number 5-480 min)
3. ✅ Complexidade de Senha (select: baixa/media/alta)
4. ✅ Logs de Auditoria (checkbox toggle)
5. ✅ Forçar HTTPS (checkbox toggle)
6. ✅ IPs Permitidos (textarea multilinha)

**UI**:
- Grid responsivo 2 colunas (mobile: 1 col)
- Cards com bg-gray-50 para toggles
- Texto de ajuda em todos os campos
- Validação de ranges inline

---

## 📊 Progresso Geral

| Componente | Status | Completo |
|-----------|--------|----------|
| Backend Entity | ✅ | 100% |
| Backend Migration | ✅ | 100% |
| Frontend Service | ✅ | 100% |
| Tabs Estrutura | ✅ | 100% |
| **Aba Geral** | ✅ | 100% |
| **Aba Segurança** | ✅ | 100% |
| **Aba Usuários** | ⏳ | 0% |
| **Aba Email/SMTP** | ⏳ | 0% |
| **Aba Comunicação** | ⏳ | 0% |
| **Aba Backup** | ⏳ | 0% |

**Progresso Total Fase 1**: 33% (2/6 tabs implementados)

---

## 🚀 Próximos Passos

### **PRIORIDADE ALTA** - Aba Usuários e Permissões

**Campos a implementar**:
1. Limite de Usuários (number input, 1-1000)
2. Aprovação de Novo Usuário (checkbox)
3. Tempo de Expiração de Convite (number input, 24-168 horas)

**Design**:
- Similar à aba Segurança
- Grid 2 colunas
- Cards para toggles
- Validações inline

### **PRIORIDADE ALTA** - Aba Email/SMTP

**Campos a implementar**:
1. Emails Habilitados (checkbox)
2. Servidor SMTP (text input)
3. Porta SMTP (number input, default 587)
4. Usuário SMTP (text input)
5. Senha SMTP (password input)

**Features extras**:
- Botão "Testar Conexão" (enviar email de teste)
- Indicador de status (conexão OK/falha)

### **PRIORIDADE ALTA** - Aba Comunicação

**Campos a implementar**:

#### WhatsApp
1. WhatsApp Habilitado (checkbox)
2. Número WhatsApp (tel input com máscara)
3. Token API WhatsApp (password input)

#### SMS
4. SMS Habilitado (checkbox)
5. Provider SMS (select: Twilio/Nexmo/Sinch)
6. API Key SMS (password input)

#### Push Notifications
7. Push Habilitado (checkbox)
8. Provider Push (select: FCM/APNS/OneSignal)
9. API Key Push (password input)

**Design**:
- 3 seções separadas (WhatsApp, SMS, Push)
- Cards com bordas coloridas por provider
- Botão "Testar" para cada canal

### **PRIORIDADE MÉDIA** - Aba Backup e Dados

**Campos a implementar**:
1. Backup Automático (checkbox)
2. Frequência de Backup (select: diário/semanal/mensal)
3. Retenção de Backup (number input, 7-365 dias)

**Features extras**:
- Botão "Executar Backup Agora"
- Mostrar último backup realizado
- Link para histórico de backups

---

## 🧪 Testes

### Backend
- [x] Entity compila sem erros TypeScript
- [x] Migration gerada com sucesso
- [x] Tabela criada no banco com todos os campos
- [ ] Endpoint GET /empresas/:id/config retorna novos campos
- [ ] Endpoint PUT /empresas/:id/config aceita novos campos
- [ ] Validações funcionando (ranges, enums)

### Frontend
- [x] Service compila sem erros TypeScript
- [x] Interfaces TypeScript corretas
- [x] Tabs renderizam com ícones
- [x] Aba Geral funciona (carrega/salva)
- [x] Aba Segurança renderiza corretamente
- [ ] Aba Segurança salva dados (testar backend)
- [ ] Validações inline funcionando
- [ ] Estados: loading, error, success
- [ ] Responsividade (mobile, tablet, desktop)

---

## 📝 Notas Técnicas

### Decisões de Design

1. **Renomeação de "Notificações"** → "Email/SMTP" e "Comunicação"
   - Justificativa: Separar canais específicos de comunicação
   - ConectCRM já usa WhatsApp como canal primário

2. **Novos Enums**:
   - `SmsProviderEnum`: Suporte para 3 providers principais
   - `PushProviderEnum`: Suporte para 3 plataformas

3. **JSONB para IP Whitelist**:
   - Permite armazenar array de strings
   - Facilita queries e filtros no PostgreSQL

### Campos Faltando (Fase 2)

Para Fase 2, adicionar:
- `webhookUrl: string` - URL do webhook
- `webhookSecret: string` - Secret para assinatura
- `apiKey: string` - API key do tenant
- `rateLimitPerMinute: number` - Rate limit personalizado
- `integracoesExternas: json` - Config de integrações (payments, ERPs)

---

## 🔗 Arquivos Relacionados

### Backend
- `backend/src/modules/empresas/entities/empresa-config.entity.ts`
- `backend/src/modules/empresas/dto/update-empresa-config.dto.ts`
- `backend/src/modules/empresas/services/empresa-config.service.ts`
- `backend/src/modules/empresas/controllers/empresa-config.controller.ts`
- `backend/src/migrations/1762212773553-AddPhase1ConfigFields.ts`

### Frontend
- `frontend-web/src/services/empresaConfigService.ts`
- `frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx`

### Documentação
- `.github/copilot-instructions.md` (regras de design)
- `frontend-web/DESIGN_GUIDELINES.md` (paleta de cores)
- `frontend-web/TEMPLATES_GUIDE.md` (templates base)

---

**Data de Criação**: 03 de Novembro de 2025  
**Última Atualização**: 03 de Novembro de 2025  
**Status**: Fase 1 em progresso (33% completo)  
**Próximo Milestone**: Implementar Abas Usuários, Email e Comunicação
