# 🧪 Guia de Teste - Fechamento Automático de Tickets

## 📋 Objetivo

Este guia detalha como executar testes completos do sistema de fechamento automático por inatividade.

---

## 🚀 Pré-requisitos

### 1. Backend Rodando
```powershell
cd backend
npm run start:dev
```

**Verificação**: Acesse http://localhost:3001/health e confirme resposta 200 OK

### 2. Banco de Dados Configurado
- Migrations executadas (ConfiguracaoInatividade e Ticket.departamentoId)
- PostgreSQL rodando e acessível

### 3. Empresa Teste
- Tenha o UUID de uma empresa para testes
- Padrão do script: `f47ac10b-58cc-4372-a567-0e02b2c3d479`

---

## 🎯 Método 1: Script Automatizado

### Executar Script Completo

```powershell
cd c:\Projetos\conectcrm
.\scripts\test-fechamento-automatico.ps1
```

### Parâmetros Opcionais

```powershell
# Com empresa específica
.\scripts\test-fechamento-automatico.ps1 -EmpresaId "seu-uuid-aqui"

# Com timeout personalizado (3 minutos)
.\scripts\test-fechamento-automatico.ps1 -TimeoutMinutos 3

# Manter configuração após teste
.\scripts\test-fechamento-automatico.ps1 -SkipCleanup
```

### O Que o Script Faz

1. ✅ Verifica se backend está rodando
2. ✅ Busca configuração existente (ou cria nova)
3. ✅ Solicita ID de ticket para teste
4. ✅ Fornece SQL para simular inatividade
5. ✅ Executa verificação manual via API
6. ✅ Aguarda timeout e verifica fechamento
7. ✅ Gera relatório de resultados

---

## 🔧 Método 2: Teste Manual Passo a Passo

### Passo 1: Criar Configuração de Teste

**Via UI** (Recomendado):
1. Acesse: http://localhost:3000/nuclei/atendimento/configuracoes
2. Clique na aba "Fechamento Automático"
3. Configure:
   - **Escopo**: Global (todos departamentos)
   - **Timeout**: `00:05:00` (5 minutos)
   - **Enviar aviso**: ✅ Ativo
   - **Aviso antes**: `00:04:00` (4 minutos)
   - **Mensagem aviso**: "⚠️ Este ticket será fechado em {{minutos}} minutos"
   - **Mensagem fechamento**: "✅ Ticket fechado por inatividade"
   - **Status aplicáveis**: AGUARDANDO, EM_ATENDIMENTO
   - **Ativo**: ✅ Sim
4. Clique em **Salvar**

**Via API** (Alternativo):
```powershell
$body = @{
    departamentoId = $null
    timeoutMinutos = 5
    enviarAviso = $true
    avisoMinutosAntes = 4
    mensagemAviso = "⚠️ Teste: Será fechado em {{minutos}} minutos"
    mensagemFechamento = "✅ Teste: Fechado por inatividade"
    ativo = $true
    statusAplicaveis = @("AGUARDANDO", "EM_ATENDIMENTO")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/atendimento/configuracao-inatividade/f47ac10b-58cc-4372-a567-0e02b2c3d479" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Passo 2: Preparar Ticket para Teste

**Opção A - Ticket Existente**:
```sql
-- Buscar ticket elegível
SELECT id, protocolo, status, updated_at, empresa_id, departamento_id
FROM atendimento_tickets
WHERE status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
  AND empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
LIMIT 1;
```

**Opção B - Criar Ticket Teste**:
```sql
INSERT INTO atendimento_tickets (
    id, protocolo, status, empresa_id, cliente_id, 
    origem, assunto, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'TEST-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
    'AGUARDANDO',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    (SELECT id FROM clientes LIMIT 1),  -- Ajuste conforme necessário
    'WHATSAPP',
    'Ticket de teste - Fechamento automático',
    NOW(),
    NOW()
) RETURNING id, protocolo;
```

### Passo 3: Simular Inatividade

**Importante**: Precisamos que o ticket esteja inativo por **mais tempo** que o configurado.

```sql
-- Substituir 'TICKET-ID-AQUI' pelo ID do ticket
UPDATE atendimento_tickets 
SET updated_at = NOW() - INTERVAL '6 minutes'  -- 6 min > 5 min timeout
WHERE id = 'TICKET-ID-AQUI';

-- Confirmar atualização
SELECT id, protocolo, status, 
       updated_at,
       NOW() - updated_at AS tempo_inativo
FROM atendimento_tickets
WHERE id = 'TICKET-ID-AQUI';
```

### Passo 4: Forçar Verificação Manual

**Via API**:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/atendimento/configuracao-inatividade/verificar-agora?empresaId=f47ac10b-58cc-4372-a567-0e02b2c3d479" `
    -Method Post
```

**Resposta Esperada**:
```json
{
  "sucesso": true,
  "fechados": 0,      // Primeira vez = 0 (apenas aviso)
  "avisados": 1,      // Deve ser 1 se ticket elegível
  "configuracoes": 1
}
```

### Passo 5: Verificar Aviso Enviado

**Checar logs do backend**:
```
[InactivityMonitorService] ⚠️ Aviso enviado para ticket TEST-... (4 minutos restantes)
```

**Verificar mensagem no WhatsApp**:
- Deve aparecer: "⚠️ Teste: Será fechado em 4 minutos"

**Confirmar banco de dados**:
```sql
SELECT aviso_inatividade_enviado_em
FROM atendimento_tickets
WHERE id = 'TICKET-ID-AQUI';
-- Deve ter timestamp preenchido
```

### Passo 6: Aguardar e Verificar Fechamento

**Aguardar**: 5 minutos após o aviso (ou executar novamente)

**Simular passagem do tempo**:
```sql
-- Forçar que o aviso foi há 5+ minutos
UPDATE atendimento_tickets 
SET aviso_inatividade_enviado_em = NOW() - INTERVAL '6 minutes'
WHERE id = 'TICKET-ID-AQUI';
```

**Executar verificação novamente**:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/atendimento/configuracao-inatividade/verificar-agora?empresaId=f47ac10b-58cc-4372-a567-0e02b2c3d479" `
    -Method Post
```

**Resposta Esperada**:
```json
{
  "sucesso": true,
  "fechados": 1,      // Agora deve ser 1!
  "avisados": 0,
  "configuracoes": 1
}
```

### Passo 7: Confirmar Fechamento

**Verificar status do ticket**:
```sql
SELECT id, protocolo, status, 
       fechado_automaticamente_em,
       updated_at
FROM atendimento_tickets
WHERE id = 'TICKET-ID-AQUI';

-- Esperado:
-- status = 'FECHADO'
-- fechado_automaticamente_em = timestamp preenchido
```

**Verificar mensagem final no WhatsApp**:
- Deve aparecer: "✅ Teste: Fechado por inatividade"

---

## 📊 Checklist de Validação

### ✅ Testes Funcionais

- [ ] **Configuração Global**: Salva e carrega corretamente
- [ ] **Configuração por Departamento**: Prioridade funciona
- [ ] **Validação de Timeout**: Mínimo 5 minutos, máximo 30 dias
- [ ] **Validação de Aviso**: Deve ser < timeout
- [ ] **Máscara HH:MM:SS**: Formata e valida corretamente
- [ ] **Conversão**: Minutos ↔ HH:MM:SS bidirecionalmente

### ✅ Testes de Inatividade

- [ ] **Ticket Elegível**: Status AGUARDANDO detectado
- [ ] **Ticket Elegível**: Status EM_ATENDIMENTO detectado
- [ ] **Ticket Não Elegível**: Status FECHADO ignorado
- [ ] **Ticket Não Elegível**: Status CANCELADO ignorado
- [ ] **Cálculo de Tempo**: Inatividade calculada corretamente
- [ ] **Envio de Aviso**: Mensagem enviada no momento certo
- [ ] **Substituição de Variável**: {{minutos}} substituído corretamente
- [ ] **Fechamento Automático**: Ticket fechado após timeout

### ✅ Testes de Integração

- [ ] **WhatsApp**: Mensagens realmente enviadas
- [ ] **Cron Job**: Executa automaticamente a cada 5 minutos
- [ ] **Performance**: Processa 100+ tickets sem travamento
- [ ] **Concorrência**: Múltiplas empresas processadas sem conflito
- [ ] **Error Handling**: Erros não travam o sistema

---

## 🔍 Monitoramento e Debug

### Verificar Logs do Backend

```powershell
# Terminal onde backend está rodando
# Procurar por:
[InactivityMonitorService] 🔄 Verificando inatividade...
[InactivityMonitorService] 📊 Empresa: ...
[InactivityMonitorService] ✅ Tickets fechados: X
[InactivityMonitorService] ⚠️ Avisos enviados: X
```

### Verificar Cron Job

```sql
-- Última execução do cron
SELECT 
    COUNT(*) as total_tickets,
    MAX(fechado_automaticamente_em) as ultimo_fechamento,
    MAX(aviso_inatividade_enviado_em) as ultimo_aviso
FROM atendimento_tickets
WHERE fechado_automaticamente_em IS NOT NULL 
   OR aviso_inatividade_enviado_em IS NOT NULL;
```

### Queries Úteis

```sql
-- Tickets inativos elegíveis para fechamento
SELECT 
    t.id, t.protocolo, t.status,
    t.updated_at,
    NOW() - t.updated_at AS tempo_inativo,
    c.timeout_minutos,
    t.aviso_inatividade_enviado_em
FROM atendimento_tickets t
LEFT JOIN configuracao_inatividade c ON c.empresa_id = t.empresa_id
WHERE t.status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
  AND c.ativo = true
  AND (NOW() - t.updated_at) > (c.timeout_minutos || ' minutes')::INTERVAL;

-- Histórico de fechamentos automáticos (últimos 7 dias)
SELECT 
    DATE(fechado_automaticamente_em) as data,
    COUNT(*) as total_fechamentos,
    COUNT(DISTINCT empresa_id) as empresas_afetadas
FROM atendimento_tickets
WHERE fechado_automaticamente_em >= NOW() - INTERVAL '7 days'
GROUP BY DATE(fechado_automaticamente_em)
ORDER BY data DESC;

-- Efetividade dos avisos (% de tickets salvos após aviso)
SELECT 
    COUNT(*) FILTER (WHERE aviso_inatividade_enviado_em IS NOT NULL) as total_avisos,
    COUNT(*) FILTER (WHERE aviso_inatividade_enviado_em IS NOT NULL AND fechado_automaticamente_em IS NULL) as tickets_salvos,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE aviso_inatividade_enviado_em IS NOT NULL AND fechado_automaticamente_em IS NULL) / 
        NULLIF(COUNT(*) FILTER (WHERE aviso_inatividade_enviado_em IS NOT NULL), 0),
        2
    ) as taxa_recuperacao_percent
FROM atendimento_tickets
WHERE aviso_inatividade_enviado_em >= NOW() - INTERVAL '30 days';
```

---

## 🚨 Troubleshooting

### Problema: Configuração não salva

**Sintomas**: 
- Frontend mostra sucesso mas não persiste
- Backend recebe DTO vazio `{}`

**Solução**:
1. Verificar que DTO tem decorators: `@IsNumber()`, `@Min()`, etc.
2. Confirmar ValidationPipe ativo em `main.ts`
3. Checar logs do controller: `console.log('🔍 DTO recebido:', dto)`

### Problema: Ticket não fecha automaticamente

**Checklist**:
- [ ] Configuração está `ativo = true`
- [ ] Ticket status está em `statusAplicaveis`
- [ ] Tempo de inatividade > timeout configurado
- [ ] Aviso já foi enviado (se `enviarAviso = true`)
- [ ] Cron job está rodando
- [ ] Logs do backend mostram processamento

**Debug**:
```sql
-- Ver exatamente o que o sistema vê
SELECT 
    t.id,
    t.protocolo,
    t.status,
    t.updated_at,
    c.timeout_minutos,
    c.ativo,
    c.status_aplicaveis,
    (NOW() - t.updated_at) as tempo_inativo_atual,
    (c.timeout_minutos || ' minutes')::INTERVAL as timeout_configurado
FROM atendimento_tickets t
INNER JOIN configuracao_inatividade c ON c.empresa_id = t.empresa_id
WHERE t.id = 'TICKET-ID-AQUI';
```

### Problema: Mensagens WhatsApp não enviam

**Checklist**:
- [ ] Serviço WhatsApp está rodando
- [ ] Token válido e não expirado
- [ ] Número do cliente está correto
- [ ] Mensagem não está vazia
- [ ] Logs mostram tentativa de envio

**Testar isoladamente**:
```typescript
// Criar endpoint de teste no controller
@Post('testar-envio')
async testarEnvio(@Body() body: { ticketId: string }) {
  const ticket = await this.ticketRepository.findOne({ 
    where: { id: body.ticketId },
    relations: ['cliente']
  });
  
  // Enviar mensagem teste
  await this.whatsappService.enviarMensagem(
    ticket.cliente.telefone,
    '🧪 Mensagem de teste'
  );
  
  return { sucesso: true };
}
```

---

## 📈 Próximos Passos Após Testes

1. **Se todos os testes passarem** ✅:
   - Remover logs de debug excessivos
   - Documentar comportamento observado
   - Planejar deploy em produção

2. **Se houver falhas** ❌:
   - Documentar bugs encontrados
   - Criar issues no GitHub
   - Priorizar correções críticas

3. **Melhorias Identificadas** 💡:
   - Adicionar ao backlog
   - Estimar esforço
   - Planejar próxima sprint

---

## 📝 Relatório de Teste (Template)

```markdown
# Relatório de Teste - Fechamento Automático
**Data**: DD/MM/YYYY
**Testador**: Nome
**Ambiente**: Desenvolvimento

## Configuração Testada
- Timeout: X minutos
- Aviso: X minutos antes
- Escopo: Global / Departamento X

## Resultados
- [x] Configuração salva corretamente
- [x] Ticket detectado como inativo
- [x] Aviso enviado no tempo correto
- [x] Ticket fechado após timeout
- [x] Mensagens recebidas no WhatsApp

## Bugs Encontrados
1. [Descrever bug se houver]

## Observações
- [Notas adicionais]

## Status Final
✅ APROVADO / ❌ REPROVADO
```

---

**Última atualização**: 06/11/2025  
**Autor**: Sistema ConectCRM
