# 🧪 ROTEIRO DE TESTES - Quick Wins do Bot

**Objetivo**: Validar os 4 Quick Wins implementados  
**Tempo Estimado**: 2-3 horas  
**Pré-requisito**: Migrations executadas no banco

---

## ⚙️ PREPARAÇÃO DO AMBIENTE

### 1. Executar Migrations

```bash
# 1. Adicionar etapa de confirmação de atalho
cd backend
node adicionar-etapa-atalho.js

# 2. Melhorar mensagem de boas-vindas
node melhorar-mensagem-boas-vindas.js

# 3. Verificar no banco
psql -U postgres -d conectcrm -c "SELECT id, nome, estrutura->'etapas'->'confirmar-atalho' FROM fluxos_triagem WHERE ativo = true;"
```

**Resultado Esperado**:
```
✅ Etapa 'confirmar-atalho' criada
✅ Mensagem de boas-vindas atualizada
✅ Fluxo publicado com novas etapas
```

### 2. Iniciar Backend

```bash
cd backend
npm run start:dev

# Verificar logs:
# - ✅ TimeoutCheckerJob registrado
# - ✅ TriagemBotService carregado com KeywordShortcuts
```

### 3. Configurar Número de Teste

Registrar número de WhatsApp de teste no sistema:
- **Telefone**: +55 11 99999-9999 (seu número de teste)
- **Canal**: Criar canal WhatsApp vinculado

---

## 🎯 TESTE 1: Atalhos de Palavras-Chave

### Teste 1.1: Atalho Financeiro (Boleto)

**Ação**:
```
WhatsApp: "quero 2ª via do boleto"
```

**Resultado Esperado**:
```
Bot: ✅ Entendi! Você precisa de ajuda com Financeiro.

Posso te encaminhar agora para nossa equipe?

1️⃣ Sim, pode encaminhar
2️⃣ Não, quero escolher outra opção
```

**Logs Esperados** (Backend):
```
🎯 [ATALHO] Detectado: financeiro (90% confiança)
🎯 [ATALHO] Palavras encontradas: ['boleto', '2via']
✅ Contexto salvo: destinoNucleoId = <uuid do Financeiro>
```

**Verificações**:
- [ ] Bot detectou "boleto"
- [ ] Bot identificou núcleo Financeiro
- [ ] Mostrou opções de confirmação
- [ ] Logs mostram confiança > 80%

---

### Teste 1.2: Atalho Suporte (Erro)

**Ação**:
```
WhatsApp: "sistema está com erro, não consigo acessar"
```

**Resultado Esperado**:
```
Bot: ✅ Entendi! Você precisa de ajuda com Suporte.

Posso te encaminhar agora?

1️⃣ Sim, pode encaminhar
2️⃣ Não, quero escolher outra opção
```

**Logs Esperados**:
```
🎯 [ATALHO] Detectado: suporte (85% confiança)
🎯 [ATALHO] Palavras encontradas: ['erro', 'acessar']
```

**Verificações**:
- [ ] Detectou "erro"
- [ ] Identificou núcleo Suporte
- [ ] Confiança > 80%

---

### Teste 1.3: Atalho Comercial (Plano)

**Ação**:
```
WhatsApp: "quero fazer upgrade do meu plano"
```

**Resultado Esperado**:
```
Bot: ✅ Entendi! Você precisa de ajuda com Comercial.

Posso te encaminhar agora?

1️⃣ Sim, pode encaminhar
2️⃣ Não, quero escolher outra opção
```

**Logs Esperados**:
```
🎯 [ATALHO] Detectado: comercial (90% confiança)
🎯 [ATALHO] Palavras encontradas: ['upgrade', 'plano']
```

**Verificações**:
- [ ] Detectou "upgrade" e "plano"
- [ ] Identificou núcleo Comercial
- [ ] Confiança > 80%

---

### Teste 1.4: Urgência Detectada

**Ação**:
```
WhatsApp: "URGENTE! preciso falar com alguém AGORA"
```

**Resultado Esperado**:
```
Bot: ✅ Entendi que é urgente!

Vou te conectar com um atendente imediatamente.

🎫 Ticket #12345 criado (ALTA PRIORIDADE)
```

**Logs Esperados**:
```
🚨 [URGENCIA] Detectada! Palavras: ['urgente', 'agora']
🎯 [ATALHO] Detectado: transferir_geral (95% confiança)
🎫 Ticket criado com prioridade ALTA
```

**Verificações**:
- [ ] Detectou urgência
- [ ] Criou ticket com prioridade alta
- [ ] Transferiu imediatamente (sem confirmação)

---

### Teste 1.5: Frustração Detectada

**Ação**:
```
WhatsApp: "isso é ridículo, péssimo atendimento"
```

**Resultado Esperado**:
```
Bot: 😔 Desculpe pela experiência negativa.

Vou te conectar com um supervisor agora mesmo.

🎫 Ticket #12346 criado (ALTA PRIORIDADE)
```

**Logs Esperados**:
```
😤 [FRUSTRACAO] Detectada! Palavras: ['ridiculo', 'pessimo']
🎯 [ATALHO] Detectado: transferir_geral (100% confiança)
🎫 Ticket criado com flag de frustração
```

**Verificações**:
- [ ] Detectou frustração
- [ ] Prioridade elevada
- [ ] Contexto salvo para supervisor

---

### Teste 1.6: Confiança Baixa (< 80%)

**Ação**:
```
WhatsApp: "oi tudo bem"
```

**Resultado Esperado**:
```
Bot: 👋 Olá! Como posso ajudar?

💡 DICA RÁPIDA: Você pode digitar livremente!
Exemplos:
• "Quero 2ª via do boleto"
• "Sistema está com erro"

Ou escolha:
1️⃣ Suporte
2️⃣ Financeiro
3️⃣ Comercial
```

**Logs Esperados**:
```
🔍 [ATALHO] Nenhuma palavra-chave detectada
📋 Mostrando menu padrão
```

**Verificações**:
- [ ] Não detectou atalho
- [ ] Mostrou menu normalmente
- [ ] Manteve fluxo padrão

---

## 🎯 TESTE 2: Botão "Não Entendi"

### Teste 2.1: Clique no Botão

**Ação**:
1. Iniciar conversa
2. Bot mostra menu com núcleos
3. Clicar em "❓ Não entendi essas opções"

**Resultado Esperado**:
```
Bot: Sem problemas! Vou te conectar com um atendente humano agora.

🎫 Ticket #12347 criado
Aguarde, alguém vai te atender em breve!
```

**Logs Esperados**:
```
❓ [AJUDA] Usuário solicitou atendente (botão Não Entendi)
🎫 Criando ticket no núcleo geral
```

**Verificações**:
- [ ] Botão aparece em todos os menus
- [ ] Transfere para núcleo geral
- [ ] Ticket criado corretamente

---

### Teste 2.2: Botão em Menu de Departamentos

**Ação**:
1. Escolher núcleo
2. Bot mostra departamentos
3. Clicar "❓ Não entendi"

**Resultado Esperado**:
```
Bot: Entendi! Vou te conectar diretamente com a equipe do [Núcleo X].

🎫 Ticket #12348 criado
```

**Verificações**:
- [ ] Botão aparece em menu de departamentos
- [ ] Transfere para núcleo correto (não geral)

---

## 🎯 TESTE 3: Timeout Automático

### Teste 3.1: Aviso de Timeout (5 minutos)

**Preparação**:
```sql
-- Forçar sessão inativa há 5min
UPDATE "SessaoTriagem"
SET "updatedAt" = NOW() - INTERVAL '5 minutes 30 seconds'
WHERE "telefone" = '+5511999999999'
  AND "status" = 'em_andamento';
```

**Aguardar**: 1 minuto (cron executa)

**Resultado Esperado**:
```
Bot: ⏰ Oi! Percebi que você ficou um tempo sem responder.

Gostaria de:

1️⃣ Continuar de onde parou
2️⃣ Falar com atendente agora
3️⃣ Cancelar (pode voltar depois)

💡 Se não responder em 5 minutos, o atendimento será cancelado automaticamente.
```

**Logs Esperados**:
```
⏰ Verificando sessões inativas...
📊 Timeout Check: 1 para avisar, 0 para cancelar
⏰ Enviando aviso de timeout para sessão <uuid>
✅ Aviso de timeout enviado para +5511999999999
```

**Verificações**:
- [ ] Mensagem recebida após ~1 minuto
- [ ] Flag `timeoutAvisoEnviado = true` no banco
- [ ] Campo `timeoutAvisoDataHora` preenchido

---

### Teste 3.2: Resposta "1 - Continuar"

**Ação**:
```
WhatsApp: "1"
```

**Resultado Esperado**:
```
Bot: [Continua fluxo normalmente do ponto onde parou]
```

**Logs Esperados**:
```
⏰ Processando resposta após aviso de timeout
✅ Usuário escolheu continuar após timeout
🔄 Resetando flag timeoutAvisoEnviado
```

**Verificações**:
- [ ] Fluxo continua de onde parou
- [ ] Flag `timeoutAvisoEnviado = false`
- [ ] Flag `timeoutContinuado = true`

---

### Teste 3.3: Resposta "2 - Atendente"

**Ação**:
```
WhatsApp: "2"
```

**Resultado Esperado**:
```
Bot: ✅ Entendi! Vou te conectar com um atendente agora.

🎫 Ticket #12349 criado
```

**Logs Esperados**:
```
⏰ Processando resposta após aviso de timeout
✅ Usuário escolheu falar com atendente após timeout
🎫 Criando ticket (motivo: timeout_escolheu_atendente)
```

**Verificações**:
- [ ] Ticket criado
- [ ] Transferido para núcleo geral
- [ ] Flag `timeoutTransferido = true`
- [ ] Motivo `timeout_escolheu_atendente`

---

### Teste 3.4: Resposta "3 - Cancelar"

**Ação**:
```
WhatsApp: "3"
```

**Resultado Esperado**:
```
Bot: ✅ Atendimento cancelado.

Quando precisar, é só chamar! 👋
```

**Logs Esperados**:
```
⏰ Processando resposta após aviso de timeout
✅ Usuário escolheu cancelar após timeout
🔚 Finalizando sessão (motivo: timeout_usuario_cancelou)
```

**Verificações**:
- [ ] Sessão finalizada (`status = 'cancelada'`)
- [ ] Campo `finalizadaEm` preenchido
- [ ] Motivo `timeout_usuario_cancelou`

---

### Teste 3.5: Resposta Não Reconhecida

**Ação**:
```
WhatsApp: "oi estava ocupado"
```

**Resultado Esperado**:
```
Bot: [Processa "oi estava ocupado" no contexto do fluxo]
```

**Logs Esperados**:
```
⏰ Processando resposta após aviso de timeout
⚠️ Resposta não reconhecida após timeout, continuando fluxo
✅ Flag timeoutAvisoEnviado resetada
```

**Verificações**:
- [ ] Interpreta como "continuar"
- [ ] Processa texto normalmente
- [ ] Flag `timeoutContinuadoAutomatico = true`

---

### Teste 3.6: Cancelamento Automático (10 minutos)

**Preparação**:
```sql
-- Forçar sessão inativa há 10min
UPDATE "SessaoTriagem"
SET "updatedAt" = NOW() - INTERVAL '10 minutes 30 seconds',
    metadados = jsonb_set(
      COALESCE(metadados, '{}'::jsonb),
      '{timeoutAvisoEnviado}',
      'true'
    )
WHERE "telefone" = '+5511999999999'
  AND "status" = 'em_andamento';
```

**Aguardar**: 1 minuto

**Resultado Esperado**:
```
Bot: ⏰ Seu atendimento foi cancelado por inatividade.

Caso precise de ajuda novamente, é só mandar uma mensagem! 👋

Até logo!
```

**Logs Esperados**:
```
⚠️ Cancelando sessão <uuid> por timeout (10min sem resposta)
✅ Sessão <uuid> cancelada por timeout
```

**Verificações**:
- [ ] Mensagem de cancelamento recebida
- [ ] Sessão cancelada (`status = 'cancelada'`)
- [ ] Motivo `timeout_automatico`
- [ ] Campo `timeoutCanceladoDataHora` preenchido

---

## 🎯 TESTE 4: Mensagem de Boas-Vindas

### Teste 4.1: Nova Conversa

**Ação**:
```
WhatsApp: "oi" (primeira mensagem)
```

**Resultado Esperado**:
```
Bot: 👋 Olá! Eu sou a assistente virtual da ConectCRM.

💡 DICA RÁPIDA: Você pode digitar livremente o que precisa!
Exemplos:
• "Quero 2ª via do boleto"
• "Sistema está com erro"
• "Preciso de uma proposta"

Ou escolha uma das opções:

1️⃣ 🔧 Suporte Técnico
2️⃣ 💰 Financeiro
3️⃣ 📊 Comercial
4️⃣ 📋 Acompanhar atendimento
0️⃣ 👤 Falar com humano

❌ Digite SAIR para cancelar
```

**Verificações**:
- [ ] Mensagem com emoji 👋
- [ ] Seção "💡 DICA RÁPIDA" presente
- [ ] Exemplos de texto livre mostrados
- [ ] Opções numeradas corretas

---

## 📊 CHECKLIST FINAL

### Quick Win #1: Atalhos de Palavras-Chave
- [ ] ✅ Detecta "boleto" → Financeiro
- [ ] ✅ Detecta "erro" → Suporte
- [ ] ✅ Detecta "plano" → Comercial
- [ ] ✅ Detecta "urgente" → Prioridade alta
- [ ] ✅ Detecta frustração → Supervisor
- [ ] ✅ Confiança < 80% → Menu padrão

### Quick Win #2: Mensagem de Boas-Vindas
- [ ] ✅ Emoji 👋 presente
- [ ] ✅ Seção "💡 DICA RÁPIDA"
- [ ] ✅ Exemplos de texto livre
- [ ] ✅ Opções numeradas mantidas

### Quick Win #3: Botão "Não Entendi"
- [ ] ✅ Aparece em menus de núcleos
- [ ] ✅ Aparece em menus de departamentos
- [ ] ✅ Transfere para atendente humano
- [ ] ✅ Ticket criado corretamente

### Quick Win #4: Timeout Automático
- [ ] ✅ Aviso enviado após 5 minutos
- [ ] ✅ Opção "1 - Continuar" funciona
- [ ] ✅ Opção "2 - Atendente" cria ticket
- [ ] ✅ Opção "3 - Cancelar" finaliza
- [ ] ✅ Resposta não reconhecida = continuar
- [ ] ✅ Cancelamento automático após 10min

---

## 📝 RELATÓRIO DE BUGS

Use esta seção para documentar problemas encontrados:

### Bug #1:
**Descrição**:  
**Passo a passo**:  
**Resultado esperado**:  
**Resultado obtido**:  
**Logs**:  
**Prioridade**: Alta / Média / Baixa

---

## ✅ CONCLUSÃO DO TESTE

**Data**: ___/___/2025  
**Testador**: __________________  
**Tempo Total**: ___ horas

**Resumo**:
- Testes executados: ___ / 22
- Testes passaram: ___ / 22
- Bugs encontrados: ___
- Quick Wins prontos: ___ / 4

**Próximos Passos**:
- [ ] Corrigir bugs encontrados
- [ ] Re-testar funcionalidades com falha
- [ ] Validar com equipe de produto
- [ ] Deploy em staging
- [ ] Monitorar métricas por 1 semana

---

**Observações Finais**:

(Espaço para notas livres sobre os testes)
