# 🔍 DEBUG: Por Que Ainda Mostra 5 Opções?

## Verificações Necessárias

### 1️⃣ Ver Logs do Backend

Quando o cliente envia "Oi", você deve ver nos logs:

```
[TriagemBotService] Menu dinâmico montado com 2 núcleos visíveis
```

**Se NÃO aparecer este log:**
- A busca de núcleos falhou
- Bot está usando fallback (5 opções hardcoded)

---

### 2️⃣ Testar Endpoint Direto

Abra PowerShell e teste:

```powershell
# Obter token (se não tiver)
# Faça login no sistema e copie o token do navegador (F12 > Application > Local Storage)

# Testar endpoint
$token = "SEU_TOKEN_AQUI"
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3001/nucleos/bot/opcoes" -Headers $headers | ConvertTo-Json -Depth 10
```

**Resultado esperado:**
```json
[
  {
    "id": "uuid-1",
    "nome": "Suporte",
    "cor": "#3B82F6",
    "descricao": "...",
    "departamentos": [...]
  },
  {
    "id": "uuid-2",
    "nome": "Financeiro",
    "cor": "#0EA5E9",
    "descricao": "...",
    "departamentos": [...]
  }
]
```

**Se retornar 5 núcleos:**
- Problema está na configuração do banco
- Núcleos não estão marcados como ocultos

**Se retornar erro:**
- Endpoint não está funcionando
- Problema na injeção do NucleoService

---

### 3️⃣ Verificar Configuração no Banco

```sql
-- Ver núcleos e status de visibilidade
SELECT 
  nome,
  ativo,
  visivel_no_bot,
  prioridade
FROM nucleos_atendimento
ORDER BY prioridade;
```

**Resultado esperado:**
```
nome              | ativo | visivel_no_bot | prioridade
------------------|-------|----------------|------------
Suporte           | true  | true           | 100
Financeiro        | true  | true           | 120
Comercial         | true  | false          | 110  ← Oculto
Atendimento Geral | true  | false          | 90   ← Oculto
```

**Se todos tiverem `visivel_no_bot = true`:**
- Você precisa atualizar os valores no banco!
- A edição via frontend não salvou

---

### 4️⃣ Limpar Sessão WhatsApp

A sessão antiga pode estar em cache:

```sql
-- Ver sessões ativas
SELECT 
  id,
  telefone,
  etapa_atual,
  created_at,
  status
FROM sessoes_triagem
WHERE telefone = 'SEU_NUMERO'
ORDER BY created_at DESC
LIMIT 5;
```

**Deletar sessão antiga:**
```sql
DELETE FROM sessoes_triagem
WHERE telefone = 'SEU_NUMERO'
  AND status = 'em_andamento';
```

**Depois envie "Oi" novamente no WhatsApp.**

---

### 5️⃣ Verificar Erro de Injeção

Se o NucleoService não foi injetado corretamente, verá erro no backend:

```
Cannot read property 'findOpcoesParaBot' of undefined
```

**Solução:**
```typescript
// Verificar se no triagem-bot.service.ts está assim:
@Inject(forwardRef(() => NucleoService))
private readonly nucleoService: NucleoService,
```

---

## 🎯 Testes Práticos

### Teste A: Endpoint Manual

```powershell
# Teste sem autenticação (debug)
curl http://localhost:3001/nucleos/bot/opcoes
```

**Se retornar 401 Unauthorized:** Endpoint OK, precisa token

**Se retornar JSON:** Conte quantos núcleos vêm

---

### Teste B: Log com Console.log

Adicione log temporário no código:

```typescript
// Em triagem-bot.service.ts, linha ~865
if (sessao.etapaAtual === 'boas-vindas') {
  console.log('🔍 [DEBUG] Buscando núcleos para empresaId:', sessao.empresaId);
  
  const nucleosVisiveis = await this.nucleoService.findOpcoesParaBot(sessao.empresaId);
  
  console.log('🔍 [DEBUG] Núcleos retornados:', nucleosVisiveis.length);
  console.log('🔍 [DEBUG] Núcleos:', JSON.stringify(nucleosVisiveis.map(n => n.nome)));
  
  // ... resto do código
}
```

**Recompilar:**
```powershell
npm run build --prefix backend
# Reiniciar backend
```

**Ver logs ao enviar "Oi":**
```
🔍 [DEBUG] Buscando núcleos para empresaId: f47ac10b-58cc-4372-a567-0e02b2c3d479
🔍 [DEBUG] Núcleos retornados: 5  ← PROBLEMA AQUI!
🔍 [DEBUG] Núcleos: ["Suporte","Financeiro","Comercial","Atendimento Geral","Outro"]
```

Se mostrar **5 núcleos**, o problema está no banco de dados.

---

### Teste C: Atualizar Núcleos Manualmente

```sql
-- Ocultar 3 núcleos, deixar só 2 visíveis
UPDATE nucleos_atendimento 
SET visivel_no_bot = false
WHERE nome IN ('Comercial', 'Atendimento Geral');

-- Confirmar
SELECT nome, visivel_no_bot FROM nucleos_atendimento;
```

**Enviar "Oi" novamente.**

---

## 🚨 Problemas Comuns

### Problema 1: Campo Não Atualiza

**Sintoma:** Editou núcleo, desmarcou checkbox, mas banco não muda.

**Causa:** Bug no método `update()` do NucleoService (já corrigimos antes).

**Verificar:**
```sql
-- Ver se coluna existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'nucleos_atendimento'
  AND column_name = 'visivel_no_bot';
```

**Se não existir:**
```sql
-- Criar coluna
ALTER TABLE nucleos_atendimento
ADD COLUMN visivel_no_bot BOOLEAN DEFAULT true;

ALTER TABLE departamentos
ADD COLUMN visivel_no_bot BOOLEAN DEFAULT true;
```

---

### Problema 2: NucleoService Não Injetado

**Sintoma:** Erro no backend ao iniciar:
```
Nest can't resolve dependencies of TriagemBotService
```

**Causa:** Circular dependency não resolvida.

**Solução:** Usar `forwardRef()` em AMBOS os lados:

```typescript
// Em triagem.module.ts
providers: [
  TriagemBotService,
  NucleoService,
  // ...
],
exports: [
  TriagemBotService,
  NucleoService, // ← EXPORTAR
],
```

---

### Problema 3: Sessão Antiga Persistente

**Sintoma:** Mesmo deletando sessão, continua igual.

**Causa:** Fluxo está salvo na tabela `fluxos_triagem` com opções hardcoded.

**IMPORTANTE:** O código que fizemos **SOBRESCREVE** o fluxo dinamicamente, não muda o banco.

**Verificar se sobrescrita funciona:**
```typescript
// triagem-bot.service.ts linha ~865
// Deve ter este bloco:
if (sessao.etapaAtual === 'boas-vindas') {
  const nucleosVisiveis = await this.nucleoService.findOpcoesParaBot(sessao.empresaId);
  
  if (nucleosVisiveis && nucleosVisiveis.length > 0) {
    // Monta opções dinâmicas
    opcoesMenu = nucleosVisiveis.map(...);
  }
}
```

**Se esse bloco não executar**, o bot usa as opções do fluxo (5 opções).

---

## ✅ Checklist de Debug

Execute na ordem:

- [ ] 1. Ver logs do backend ao enviar "Oi"
- [ ] 2. Procurar log: "Menu dinâmico montado com X núcleos"
- [ ] 3. Testar endpoint `/nucleos/bot/opcoes` manualmente
- [ ] 4. Verificar quantidade de núcleos retornados
- [ ] 5. Consultar `visivel_no_bot` no banco
- [ ] 6. Atualizar núcleos manualmente via SQL
- [ ] 7. Deletar sessão WhatsApp antiga
- [ ] 8. Enviar "Oi" novamente
- [ ] 9. Adicionar console.log temporário
- [ ] 10. Ver quantidade de núcleos no log

---

## 🎯 Próximos Passos

**1. Execute o SQL de verificação:**
```sql
SELECT 
  nome,
  codigo,
  ativo,
  visivel_no_bot
FROM nucleos_atendimento
ORDER BY prioridade;
```

**2. Me envie o resultado.**

**3. Vamos ver juntos:**
- Quantos núcleos têm `visivel_no_bot = true`
- Se todos estão visíveis, precisamos atualizar

**4. Se tiver 5 núcleos com `true`:**
```sql
-- Deixar só 2 visíveis
UPDATE nucleos_atendimento
SET visivel_no_bot = false
WHERE codigo IN ('NUC_COMERCIAL_WHATS', 'NUC_GERAL_WHATS');
```

---

**Me envie os logs do backend quando você testar, assim posso ver exatamente o que está acontecendo!** 🔍
