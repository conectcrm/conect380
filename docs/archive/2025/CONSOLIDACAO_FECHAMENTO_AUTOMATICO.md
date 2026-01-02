# 🤖 Sistema de Fechamento Automático por Inatividade

**Data**: 05/11/2025  
**Status**: ✅ ESTRUTURA CRIADA - AGUARDANDO INTEGRAÇÃO  
**Objetivo**: Fechar automaticamente tickets inativos baseado em configuração por empresa

---

## 🎯 Problema Resolvido

### **Cenário Atual** ❌
```
Cliente: "Oi, preciso de ajuda"
Atendente: "Olá! Como posso ajudar?"
Cliente: [não responde mais]
   ↓
Ticket fica ABERTO para sempre
   ↓
Fila fica poluída com tickets "fantasma"
   ↓
Atendente perde tempo verificando tickets inativos
```

### **Com Fechamento Automático** ✅
```
Cliente: "Oi, preciso de ajuda"
Atendente: "Olá! Como posso ajudar?"
Cliente: [não responde]
   ↓
[23 horas depois]
Sistema: "⚠️ Será fechado em 1h por inatividade"
   ↓
[1 hora depois - cliente ainda não respondeu]
Sistema: "✅ Atendimento encerrado por inatividade"
Status: AGUARDANDO → FECHADO
```

---

## 📋 Arquivos Criados

### 1. **Entity** - Configuração por Empresa
**Arquivo**: `backend/src/modules/atendimento/entities/configuracao-inatividade.entity.ts`

**Campos principais**:
```typescript
{
  empresaId: string;                    // Cada empresa tem sua config
  timeoutMinutos: number;               // Ex: 1440 (24h), 720 (12h)
  enviarAviso: boolean;                 // Avisar antes de fechar?
  avisoMinutosAntes: number;            // Ex: 60 (avisar 1h antes)
  mensagemAviso: string;                // Mensagem personalizada de aviso
  mensagemFechamento: string;           // Mensagem ao fechar
  ativo: boolean;                       // Pode desativar temporariamente
  statusAplicaveis: string[];           // Ex: ['AGUARDANDO', 'EM_ATENDIMENTO']
}
```

### 2. **Service** - Monitoramento Automático
**Arquivo**: `backend/src/modules/atendimento/services/inactivity-monitor.service.ts`

**Funcionalidades**:
- ✅ Roda a cada 5 minutos (cron job)
- ✅ Verifica tickets inativos por empresa
- ✅ Envia aviso X minutos antes
- ✅ Fecha automaticamente após timeout
- ✅ Logs estruturados de todas as ações

**Lógica**:
```typescript
verificarTicketsInativos() {
  Para cada empresa ativa:
    1. Buscar tickets inativos (ultima_mensagem_em < timeout)
    2. Filtrar por status aplicáveis
    3. Se já passou tempo do aviso:
       - Enviar mensagem de aviso
       - Registrar que foi avisado
    4. Se já passou timeout completo:
       - Enviar mensagem de fechamento
       - Mudar status para FECHADO
       - Atualizar data_fechamento
}
```

### 3. **Controller** - API de Configuração
**Arquivo**: `backend/src/modules/atendimento/controllers/configuracao-inatividade.controller.ts`

**Endpoints**:

#### `GET /atendimento/configuracao-inatividade/:empresaId`
Busca configuração da empresa (ou retorna padrão)

**Response**:
```json
{
  "sucesso": true,
  "dados": {
    "id": "uuid",
    "empresaId": "uuid",
    "timeoutMinutos": 1440,
    "enviarAviso": true,
    "avisoMinutosAntes": 60,
    "mensagemAviso": null,
    "mensagemFechamento": null,
    "ativo": false,
    "statusAplicaveis": ["AGUARDANDO", "EM_ATENDIMENTO"]
  },
  "sugestoes": {
    "timeouts": [
      { "valor": 60, "label": "1 hora" },
      { "valor": 720, "label": "12 horas" },
      { "valor": 1440, "label": "24 horas" }
    ]
  }
}
```

#### `POST /atendimento/configuracao-inatividade/:empresaId`
Cria ou atualiza configuração

**Request Body**:
```json
{
  "timeoutMinutos": 1440,
  "enviarAviso": true,
  "avisoMinutosAntes": 60,
  "mensagemAviso": "⚠️ Será fechado em {{minutos}} minutos",
  "mensagemFechamento": "✅ Encerrado por inatividade",
  "ativo": true,
  "statusAplicaveis": ["AGUARDANDO", "EM_ATENDIMENTO"]
}
```

#### `PUT /atendimento/configuracao-inatividade/:empresaId/ativar`
Ativa ou desativa rapidamente

**Request Body**:
```json
{
  "ativo": true
}
```

#### `POST /atendimento/configuracao-inatividade/verificar-agora`
Força verificação imediata (útil para testes)

**Query Params**:
- `empresaId` (opcional): Verificar apenas uma empresa

### 4. **Migration** - Criação da Tabela
**Arquivo**: `backend/src/migrations/1730854800000-CriarTabelaConfiguracaoInatividade.ts`

**Tabela criada**: `atendimento_configuracao_inatividade`

---

## 🔧 Integrações Necessárias

### 1. **Atualizar `ultima_mensagem_em` no Webhook** ⚠️

**Arquivo**: `backend/src/modules/atendimento/services/whatsapp-webhook.service.ts`

**Modificação necessária**:
```typescript
// No método processarMensagem() ou handleIncomingMessage()
async processarMensagem(mensagem: any) {
  // ... código existente ...
  
  // ✅ ADICIONAR ISTO:
  // Atualizar timestamp da última mensagem
  if (ticket) {
    ticket.ultima_mensagem_em = new Date();
    await this.ticketRepository.save(ticket);
  }
}
```

**Por quê?**: O serviço de inatividade usa `ultima_mensagem_em` para calcular tempo de inatividade.

---

### 2. **Registrar Entity no Module** ⚠️

**Arquivo**: `backend/src/modules/atendimento/atendimento.module.ts`

**Modificação necessária**:
```typescript
import { ConfiguracaoInatividade } from './entities/configuracao-inatividade.entity';
import { InactivityMonitorService } from './services/inactivity-monitor.service';
import { ConfiguracaoInactividadeController } from './controllers/configuracao-inatividade.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      // ... outras entities
      ConfiguracaoInatividade, // ← ADICIONAR
    ]),
  ],
  controllers: [
    // ... outros controllers
    ConfiguracaoInactividadeController, // ← ADICIONAR
  ],
  providers: [
    // ... outros services
    InactivityMonitorService, // ← ADICIONAR
  ],
})
export class AtendimentoModule {}
```

---

### 3. **Instalar `@nestjs/schedule` (Opcional)** 🔄

**Comando**:
```bash
cd backend
npm install @nestjs/schedule
```

**Depois descomentar no arquivo** `inactivity-monitor.service.ts`:
```typescript
// Linha 10: Descomentar
import { Cron, CronExpression } from '@nestjs/schedule';

// Linha 63: Descomentar
@Cron(CronExpression.EVERY_5_MINUTES)
async verificarTicketsInativos() {
```

**E remover o método `iniciarMonitoramento()` temporário.**

**Por enquanto**: Funciona com `setInterval()` (já implementado como fallback).

---

### 4. **Integrar Envio de Mensagens** 🔄

**Arquivos**: `inactivity-monitor.service.ts`

**Métodos a implementar**:

#### `enviarAvisoFechamento()`
```typescript
// Linha ~122
// TODO: Integrar com serviço de envio
// await this.whatsappService.enviarMensagem(ticket.contatoTelefone, mensagem);
```

#### `fecharPorInatividade()`
```typescript
// Linha ~152
// TODO: Integrar com serviço de envio
// await this.whatsappService.enviarMensagem(ticket.contatoTelefone, mensagem);
```

**Injetar WhatsAppService**:
```typescript
constructor(
  @InjectRepository(Ticket)
  private readonly ticketRepository: Repository<Ticket>,
  @InjectRepository(ConfiguracaoInatividade)
  private readonly configuracaoRepository: Repository<ConfiguracaoInatividade>,
  private readonly whatsappService: WhatsAppService, // ← ADICIONAR
) {}
```

---

### 5. **Adicionar Entity no Database Config** ⚠️

**Arquivo**: `backend/src/config/database.config.ts`

**Modificação necessária**:
```typescript
import { ConfiguracaoInatividade } from '../modules/atendimento/entities/configuracao-inatividade.entity';

// No array entities:
entities: [
  // ... outras entities
  ConfiguracaoInatividade, // ← ADICIONAR
],
```

---

## 🎨 Interface Frontend (Sugestão)

### **Tela de Configurações > Atendimento**

```tsx
// Página: Configurações de Inatividade

<div className="p-6 max-w-4xl mx-auto">
  <h1>🤖 Fechamento Automático por Inatividade</h1>
  
  {/* Toggle principal */}
  <div className="flex items-center gap-3 mb-6">
    <Switch checked={ativo} onChange={handleToggleAtivo} />
    <span>Fechar automaticamente tickets inativos</span>
  </div>

  {/* Timeout */}
  <div className="mb-4">
    <label>Tempo de inatividade</label>
    <select value={timeoutMinutos} onChange={handleChangeTimeout}>
      <option value={60}>1 hora</option>
      <option value={240}>4 horas</option>
      <option value={480}>8 horas</option>
      <option value={720}>12 horas</option>
      <option value={1440}>24 horas</option>
      <option value={2880}>48 horas</option>
    </select>
  </div>

  {/* Aviso */}
  <div className="mb-4">
    <label>
      <input 
        type="checkbox" 
        checked={enviarAviso} 
        onChange={handleToggleAviso}
      />
      Enviar aviso antes de fechar
    </label>
    
    {enviarAviso && (
      <div>
        <label>Avisar X minutos antes</label>
        <input 
          type="number" 
          value={avisoMinutosAntes}
          onChange={handleChangeAvisoMinutos}
          min={5}
          max={timeoutMinutos - 5}
        />
      </div>
    )}
  </div>

  {/* Mensagens personalizadas */}
  <div className="mb-4">
    <label>Mensagem de aviso (opcional)</label>
    <textarea 
      value={mensagemAviso}
      onChange={handleChangeMensagemAviso}
      placeholder="⚠️ Este atendimento será encerrado em {{minutos}} minutos por inatividade."
    />
  </div>

  <div className="mb-4">
    <label>Mensagem de fechamento (opcional)</label>
    <textarea 
      value={mensagemFechamento}
      onChange={handleChangeMensagemFechamento}
      placeholder="✅ Atendimento encerrado por inatividade. Inicie nova conversa se precisar!"
    />
  </div>

  {/* Status aplicáveis */}
  <div className="mb-4">
    <label>Aplicar em quais status?</label>
    <div className="flex gap-2">
      <label>
        <input type="checkbox" checked={statusAplicaveis.includes('AGUARDANDO')} />
        Aguardando
      </label>
      <label>
        <input type="checkbox" checked={statusAplicaveis.includes('EM_ATENDIMENTO')} />
        Em Atendimento
      </label>
    </div>
  </div>

  <button onClick={handleSalvar} className="btn-primary">
    Salvar Configuração
  </button>
</div>
```

---

## 🧪 Como Testar

### **Teste 1: Configuração Básica**
```bash
# 1. Rodar migration
cd backend
npm run migration:run

# 2. Criar configuração de teste (via Postman/Thunder Client)
POST http://localhost:3001/atendimento/configuracao-inatividade/EMPRESA_ID
{
  "timeoutMinutos": 5,     // 5 minutos para testes
  "enviarAviso": true,
  "avisoMinutosAntes": 2,  // Avisar 2 min antes
  "ativo": true,
  "statusAplicaveis": ["AGUARDANDO", "EM_ATENDIMENTO"]
}
```

### **Teste 2: Simular Ticket Inativo**
```sql
-- Atualizar ticket para ter última mensagem há 4 minutos (para testar aviso)
UPDATE atendimento_tickets
SET ultima_mensagem_em = NOW() - INTERVAL '4 minutes',
    status = 'AGUARDANDO'
WHERE numero = 123;
```

### **Teste 3: Forçar Verificação**
```bash
# Forçar verificação imediata (não esperar 5 minutos)
POST http://localhost:3001/atendimento/configuracao-inatividade/verificar-agora?empresaId=EMPRESA_ID
```

**Resultado Esperado**:
1. Após 3 minutos (5 - 2): Aviso enviado ⚠️
2. Após 5 minutos: Ticket fechado automaticamente 🔒

---

## 📊 Fluxo Completo End-to-End

```
1. Cliente inicia conversa
   Status: ABERTO
   ultima_mensagem_em: 2025-11-05 10:00:00
   ↓
   
2. Atendente assume
   Status: EM_ATENDIMENTO
   ultima_mensagem_em: 2025-11-05 10:05:00
   ↓
   
3. Atendente faz pergunta
   Atendente: "Qual o número do pedido?"
   Status: AGUARDANDO (tecla G)
   ultima_mensagem_em: 2025-11-05 10:10:00
   ↓
   
4. Cliente NÃO responde
   [23 horas sem resposta]
   ↓
   
5. Job roda (a cada 5 min)
   [05/11 09:00] Verifica: última mensagem há 23h
   Ainda não passou 24h → SKIP
   ↓
   
6. Job roda novamente
   [05/11 09:10] Verifica: última mensagem há 23h10min
   Passou tempo do aviso (24h - 1h = 23h) → AVISA
   Sistema: "⚠️ Será fechado em 1h por inatividade"
   ↓
   
7. Cliente continua sem responder
   [1 hora depois]
   ↓
   
8. Job roda novamente
   [05/11 10:10] Verifica: última mensagem há 24h
   Passou timeout completo → FECHA
   Sistema: "✅ Encerrado por inatividade"
   Status: AGUARDANDO → FECHADO
   data_fechamento: 2025-11-06 10:10:00
```

---

## ⚙️ Configurações Sugeridas por Tipo de Empresa

### **E-commerce (Alto Volume)**
```json
{
  "timeoutMinutos": 240,  // 4 horas
  "enviarAviso": true,
  "avisoMinutosAntes": 30,
  "statusAplicaveis": ["AGUARDANDO"]
}
```

### **Suporte Técnico (Complexo)**
```json
{
  "timeoutMinutos": 1440,  // 24 horas
  "enviarAviso": true,
  "avisoMinutosAntes": 120,
  "statusAplicaveis": ["AGUARDANDO", "EM_ATENDIMENTO"]
}
```

### **Vendas (Follow-up Manual)**
```json
{
  "timeoutMinutos": 2880,  // 48 horas
  "enviarAviso": false,
  "statusAplicaveis": ["AGUARDANDO"]
}
```

---

## 🚀 Checklist de Implementação

### Backend:
- [x] Entity `ConfiguracaoInatividade` criada
- [x] Service `InactivityMonitorService` criado
- [x] Controller `ConfiguracaoInactividadeController` criado
- [x] Migration criada
- [ ] Registrar entity no Module
- [ ] Registrar service no Module
- [ ] Registrar controller no Module
- [ ] Registrar entity no database.config.ts
- [ ] Atualizar `ultima_mensagem_em` no webhook
- [ ] Integrar envio de mensagens (WhatsApp)
- [ ] Rodar migration

### Frontend:
- [ ] Criar página de configuração
- [ ] Service para API de inatividade
- [ ] Formulário de configuração
- [ ] Toggle ativar/desativar
- [ ] Seletor de timeout (dropdown)
- [ ] Campos de mensagens personalizadas
- [ ] Checkboxes de status aplicáveis

### Testes:
- [ ] Teste unitário do validador
- [ ] Teste de integração do serviço
- [ ] Teste E2E do fluxo completo
- [ ] Testar com timeout de 5 minutos
- [ ] Testar envio de aviso
- [ ] Testar fechamento automático

---

## 📈 Métricas a Monitorar

```typescript
// Logs que o sistema vai gerar:

✅ "Verificação concluída: 10 tickets processados, 3 fechados, 2 avisados"
🔒 "Fechando ticket 123 por inatividade"
📤 "Enviando aviso de fechamento para ticket 456"
📊 "Empresa ABC123: 5 inativos, 2 fechados, 1 avisado"
```

---

## 🎯 Benefícios

✅ **Fila limpa**: Remove automaticamente tickets abandonados  
✅ **Atendente focado**: Não perde tempo com tickets inativos  
✅ **Experiência melhor**: Cliente recebe aviso antes de fechar  
✅ **Configurável**: Cada empresa define seu próprio timeout  
✅ **Flexível**: Pode desativar temporariamente  
✅ **Auditável**: Logs de todas as ações automáticas  

---

**Criado por**: GitHub Copilot + ConectCRM Team  
**Data**: 05/11/2025  
**Status**: Estrutura pronta - Aguardando integração e testes
