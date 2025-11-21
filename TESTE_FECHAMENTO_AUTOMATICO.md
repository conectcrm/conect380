# 🧪 Guia de Testes - Fechamento Automático por Inatividade

## ✅ Sistema Implementado

### Componentes
- ✅ Entity: `ConfiguracaoInatividade` (tabela criada)
- ✅ Service: `InactivityMonitorService` (verificação a cada 5 minutos)
- ✅ Controller: `ConfiguracaoInactividadeController` (REST API completa)
- ✅ WhatsApp: Integração para envio de avisos e mensagens de fechamento
- ✅ Migration: Executada com sucesso

### Funcionamento
1. **Monitoramento**: A cada 5 minutos, verifica tickets inativos
2. **Aviso**: Se configurado, envia aviso X minutos antes de fechar
3. **Fechamento**: Ao atingir timeout completo, fecha ticket e envia mensagem

---

## 🔧 Passo 1: Configurar Empresa (API)

### Criar Configuração Padrão (24h timeout)
```bash
POST http://localhost:3001/atendimento/configuracao-inatividade/{{EMPRESA_ID}}
Content-Type: application/json

{
  "timeoutMinutos": 1440,
  "enviarAviso": true,
  "avisoMinutosAntes": 60,
  "ativo": true,
  "statusAplicaveis": ["AGUARDANDO", "EM_ATENDIMENTO"]
}
```

### Criar Configuração para Teste Rápido (5 minutos)
```bash
POST http://localhost:3001/atendimento/configuracao-inatividade/{{EMPRESA_ID}}
Content-Type: application/json

{
  "timeoutMinutos": 5,
  "enviarAviso": true,
  "avisoMinutosAntes": 2,
  "mensagemAviso": "⚠️ Olá! Notamos que você ficou sem responder. Se não houver interação, este atendimento será encerrado em breve.",
  "mensagemFechamento": "✅ Atendimento encerrado por inatividade. Volte quando precisar!",
  "ativo": true,
  "statusAplicaveis": ["AGUARDANDO", "EM_ATENDIMENTO"]
}
```

### Verificar Configuração
```bash
GET http://localhost:3001/atendimento/configuracao-inatividade/{{EMPRESA_ID}}
```

---

## 🧪 Passo 2: Simular Ticket Inativo (SQL)

### Opção A: Atualizar Ticket Existente
```sql
-- Encontrar um ticket para teste
SELECT id, numero, status, contato_nome, ultima_mensagem_em
FROM atendimento_ticket
WHERE empresa_id = 'UUID_DA_EMPRESA'
  AND status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
ORDER BY created_at DESC
LIMIT 1;

-- Simular inatividade de 4 minutos (para teste de 5min)
UPDATE atendimento_ticket
SET ultima_mensagem_em = NOW() - INTERVAL '4 minutes'
WHERE id = 'UUID_DO_TICKET';
```

### Opção B: Verificar Tickets Naturalmente Inativos
```sql
-- Ver tickets inativos há mais de 1 hora
SELECT 
  numero,
  contato_nome,
  status,
  ultima_mensagem_em,
  EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo
FROM atendimento_ticket
WHERE empresa_id = 'UUID_DA_EMPRESA'
  AND status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
  AND ultima_mensagem_em < NOW() - INTERVAL '1 hour'
ORDER BY ultima_mensagem_em ASC;
```

---

## ⚡ Passo 3: Forçar Verificação Manual

### Endpoint de Teste (força execução imediata)
```bash
POST http://localhost:3001/atendimento/configuracao-inatividade/verificar-agora
```

**Resposta esperada:**
```json
{
  "message": "Verificação de inatividade iniciada manualmente",
  "empresasProcessadas": 1,
  "ticketsProcessados": 2
}
```

---

## 📊 Passo 4: Verificar Logs (Backend)

### No terminal onde backend está rodando, procure:

**Início da Verificação:**
```
[InactivityMonitorService] 🔍 Iniciando verificação de inatividade...
[InactivityMonitorService] 📋 Encontradas 1 empresas com fechamento automático ativo
```

**Processando Empresa:**
```
[InactivityMonitorService] 🏢 Processando empresa: Nome da Empresa
[InactivityMonitorService] 🔍 Buscando tickets inativos... (timeout: 5 minutos)
[InactivityMonitorService] 📋 Encontrados 2 tickets inativos para processar
```

**Enviando Aviso:**
```
[InactivityMonitorService] ⚠️ Enviando aviso para ticket 12345
[InactivityMonitorService] ✅ Aviso enviado com sucesso para 5511999999999
```

**Fechando Ticket:**
```
[InactivityMonitorService] 🔒 Fechando ticket 12345 por inatividade
[InactivityMonitorService] ✅ Mensagem de fechamento enviada com sucesso para 5511999999999
[InactivityMonitorService] ✅ Ticket 12345 fechado por inatividade
```

**Erro (se houver problema com WhatsApp):**
```
[InactivityMonitorService] ❌ Erro ao enviar aviso para ticket 12345: Connection refused
```

---

## 🎯 Cenários de Teste

### Cenário 1: Aviso + Fechamento (Teste Rápido - 5min)
1. Configurar timeout de 5 minutos com aviso aos 2 minutos
2. Atualizar ticket: `ultima_mensagem_em = NOW() - INTERVAL '3 minutes'`
3. Forçar verificação: POST `/verificar-agora`
4. **Esperado**: Aviso enviado via WhatsApp
5. Atualizar ticket: `ultima_mensagem_em = NOW() - INTERVAL '6 minutes'`
6. Forçar verificação novamente
7. **Esperado**: Ticket fechado + mensagem de fechamento enviada

### Cenário 2: Fechamento Direto (Sem Aviso)
1. Configurar com `enviarAviso: false`
2. Atualizar ticket: `ultima_mensagem_em = NOW() - INTERVAL '6 minutes'`
3. Forçar verificação
4. **Esperado**: Ticket fechado diretamente (sem aviso prévio)

### Cenário 3: Filtro por Status
1. Configurar com `statusAplicaveis: ["AGUARDANDO"]`
2. Ter tickets em AGUARDANDO e EM_ATENDIMENTO inativos
3. Forçar verificação
4. **Esperado**: Apenas tickets AGUARDANDO são fechados

### Cenário 4: Desativar Sistema
1. Configurar e ativar normalmente
2. Desativar: `PUT /:empresaId/ativar` com body `{ "ativo": false }`
3. Ter tickets inativos
4. Forçar verificação
5. **Esperado**: Nenhum ticket fechado (sistema inativo)

---

## 🔍 Verificações de Qualidade

### Backend
```bash
# Ver se service está registrado
grep -r "InactivityMonitorService" backend/src/modules/atendimento/atendimento.module.ts

# Ver se entity está registrada
grep -r "ConfiguracaoInatividade" backend/src/config/database.config.ts

# Ver imports WhatsApp
grep -r "WhatsAppSenderService" backend/src/modules/atendimento/services/inactivity-monitor.service.ts
```

### Banco de Dados
```sql
-- Verificar se tabela existe
SELECT * FROM atendimento_configuracao_inatividade LIMIT 1;

-- Ver estrutura
\d atendimento_configuracao_inatividade

-- Ver índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'atendimento_configuracao_inatividade';
```

### WhatsApp
```sql
-- Verificar se campo ultima_mensagem_em é atualizado pelo webhook
SELECT numero, ultima_mensagem_em, ultima_mensagem_cliente
FROM atendimento_ticket
WHERE empresa_id = 'UUID_DA_EMPRESA'
ORDER BY ultima_mensagem_em DESC
LIMIT 5;
```

---

## ⏱️ Timeouts Recomendados por Tipo de Negócio

### E-commerce
- **Timeout**: 2 horas (120 minutos)
- **Aviso**: 30 minutos antes
- **Motivo**: Cliente pode estar comparando preços

### Suporte Técnico
- **Timeout**: 4 horas (240 minutos)
- **Aviso**: 60 minutos antes
- **Motivo**: Cliente pode estar testando soluções

### Atendimento Geral
- **Timeout**: 24 horas (1440 minutos)
- **Aviso**: 2 horas antes
- **Motivo**: Cliente pode responder no dia seguinte

### Vendas B2B
- **Timeout**: 48 horas (2880 minutos)
- **Aviso**: 4 horas antes
- **Motivo**: Decisões corporativas levam mais tempo

### Testes / Desenvolvimento
- **Timeout**: 5 minutos
- **Aviso**: 2 minutos antes
- **Motivo**: Feedback rápido durante testes

---

## 🚨 Troubleshooting

### Problema: Tickets não estão sendo fechados
**Checklist:**
- [ ] Migration rodou? `SELECT * FROM atendimento_configuracao_inatividade`
- [ ] Configuração existe? `GET /:empresaId`
- [ ] Sistema está ativo? `ativo = true` na config
- [ ] Backend está rodando? Verificar processo Node.js
- [ ] Logs aparecem? Procurar `[InactivityMonitorService]` no console
- [ ] Webhook atualiza `ultima_mensagem_em`? Verificar banco após mensagem cliente

### Problema: Aviso não é enviado via WhatsApp
**Checklist:**
- [ ] WhatsAppSenderService está funcionando? Testar envio manual
- [ ] Token WhatsApp válido? Verificar tabela `whatsapp_api_configs`
- [ ] Número formatado corretamente? Deve ser 5511999999999 (sem +)
- [ ] Logs de erro? Procurar `❌ Erro ao enviar aviso`

### Problema: Verificação não roda automaticamente
**Solução:**
- O sistema usa `setInterval` a cada 5 minutos
- Verificar se service foi iniciado: procurar `✅ InactivityMonitorService iniciado` no log
- Para testes, use POST `/verificar-agora` ao invés de esperar 5min

---

## 📝 Próximos Passos (Opcional)

### Frontend - Tela de Configuração
```
Configurações > Atendimento > Fechamento Automático

[ ] Criar página GestaoInactividadePage.tsx
[ ] Form com campos:
    - Toggle: Ativar/Desativar
    - Input: Timeout (minutos) com sugestões por setor
    - Checkbox: Enviar aviso antes de fechar
    - Input: Minutos antes para enviar aviso
    - Textarea: Mensagem de aviso (customizável)
    - Textarea: Mensagem de fechamento (customizável)
    - Multi-select: Status aplicáveis
[ ] Registrar rota em App.tsx
[ ] Adicionar no menuConfig.ts (Configurações)
```

### Melhorias Backend
- [ ] Adicionar campo `aviso_enviado_em` na tabela `atendimento_ticket`
- [ ] Criar tabela de logs de fechamentos automáticos
- [ ] Webhook para notificar gestor quando ticket é fechado por inatividade
- [ ] Dashboard com métricas de fechamento automático

---

## ✅ Checklist Final

### Implementação
- [x] Entity criada e registrada
- [x] Service criado com lógica de monitoramento
- [x] Controller criado com REST API
- [x] Migration executada
- [x] WhatsApp integrado (aviso + fechamento)
- [x] Módulo atualizado (providers, controllers)

### Testes
- [ ] Criar configuração via API
- [ ] Simular ticket inativo (SQL)
- [ ] Forçar verificação manual
- [ ] Verificar logs no backend
- [ ] Confirmar aviso enviado via WhatsApp
- [ ] Confirmar ticket fechado + mensagem enviada
- [ ] Testar desativação do sistema

### Produção
- [ ] Ajustar timeouts por tipo de negócio
- [ ] Customizar mensagens por empresa
- [ ] Monitorar logs por 1 semana
- [ ] Ajustar intervalos de verificação se necessário
- [ ] Opcional: Criar frontend de configuração

---

**Última atualização**: Novembro 2025  
**Status**: ✅ Sistema pronto para testes
