# 🔥 SOLUÇÃO PROBLEMA CACHE WHATSAPP

## Diagnóstico Completo ✅

1. ✅ Backend rodando na porta 3001
2. ✅ Fluxo publicado (published_at: 2025-10-27 10:01:32)
3. ✅ Fluxo tem 18 etapas (boas-vindas, coleta-nome, coleta-email, confirmar-dados-cliente, etc.)
4. ✅ Sessões deletadas do banco (0 sessões com status='em_andamento')
5. ✅ Fluxo atualizado hoje (updated_at: 2025-10-27 13:02:02)

## ❌ Problema Identificado

O WhatsApp **ainda mostra mensagem antiga** com:
- "Olá! Seja bem-vindo ao ConectCRM!..."  
- "1️⃣ 1️⃣ Suporte Técnico"
- "❌ Digite SAIR para cancelar"

Esta é a mensagem CORRETA do fluxo (boas-vindas), mas os BOTÕES estão errados!

## 🔍 Causa Raiz

**O webhook do WhatsApp está enviando a estrutura antiga da etapa `boas-vindas`!**

Possibilidades:
1. Backend carregou fluxo na memória ANTES da atualização no banco
2. Meta WhatsApp API tem cache de respostas
3. Sessão existe em outro lugar (não em sessoes_triagem)

## ✅ SOLUÇÃO PASSO A PASSO

### Opção 1: Reiniciar Backend (Forçar Reload do Fluxo)

**Já fizemos** mas vamos garantir que carregou o fluxo correto:

```bash
# 1. Matar TODOS os processos Node
Get-Process -Name node | Stop-Process -Force

# 2. Aguardar 5 segundos
Start-Sleep -Seconds 5

# 3. Iniciar backend limpo
cd backend
npm run start:dev
```

### Opção 2: Verificar se Backend Carregou Fluxo Correto

Adicionar log temporário em `triagem-bot.service.ts`:

```typescript
// Linha ~115 em processarMensagemWhatsApp
const fluxoPadrao = await this.fluxoRepository...;

// ⚡ ADICIONAR ESTE LOG:
this.logger.debug(`🔍 Fluxo carregado: ${fluxoPadrao.id}`);
this.logger.debug(`📊 Total etapas: ${Object.keys(fluxoPadrao.estrutura.etapas).length}`);
this.logger.debug(`🎯 Etapas: ${Object.keys(fluxoPadrao.estrutura.etapas).join(', ')}`);
```

### Opção 3: Forçar Atualização do Fluxo no Banco

Marcar fluxo como "modificado" para forçar reload:

```sql
UPDATE fluxos_triagem 
SET updated_at = NOW()
WHERE id = 'c87c962a-74bf-402e-b9e4-aaae09403c15';
```

### Opção 4: Limpar Cache do WhatsApp (Meta)

**Não controlamos o cache da Meta**, mas podemos:

1. **Testar com OUTRO número de telefone** (número diferente = sem cache)
2. **Aguardar ~15 minutos** (cache do WhatsApp expira)
3. **Reconfigurar webhook** (forçar Meta a reconectar)

## 🎯 TESTE RÁPIDO

Envie mensagem para o WhatsApp e veja logs do backend:

```bash
# Abrir terminal backend logs
cd backend
npm run start:dev

# Aguardar mensagem WhatsApp
# Procurar no log:
# - "Fluxo padrão encontrado: ..."
# - "Iniciando triagem para ..."
# - "Etapa atual: boas-vindas"
```

Se o log mostrar **"Etapa atual: boas-vindas"** mas o WhatsApp mostrar botões antigos, 
então o problema É cache do WhatsApp Cloud API (Meta).

## 🚀 AÇÃO IMEDIATA

**TESTE COM OUTRO NÚMERO DE TELEFONE!**

Se outro número funcionar, confirma que é cache do número de teste.

---

**Status**: Aguardando teste com novo número ou logs do backend.
