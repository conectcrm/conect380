# 🔧 Correção: Canais Duplicados no Sistema de Integrações

## 📋 Problema Identificado

O sistema estava **criando canais duplicados** toda vez que o usuário salvava configurações de integração na página de integrações.

### Evidências

Logs do console mostrando:
```
IntegracoesPage.tsx:109 🔍 [Frontend] Processando canal: whatsapp (11x repetido)
IntegracoesPage.tsx:228 🔍 [Frontend] Enviando configuração de IA
IntegracoesPage.tsx:247 ✅ [Frontend] Resposta de sucesso: Canal criado com sucesso
```

**Resultado**: 11 canais WhatsApp do mesmo tipo para a mesma empresa.

---

## 🐛 Causa Raiz

### Problema no Frontend (`IntegracoesPage.tsx`)

A função `salvarIntegracao()` estava **sempre fazendo POST** para criar novos canais:

```typescript
// ❌ CÓDIGO ANTIGO (PROBLEMÁTICO)
const response = await fetch('/api/atendimento/canais', {
  method: 'POST',  // SEMPRE POST = sempre cria novo
  headers: { ... },
  body: JSON.stringify(requestBody)
});
```

**Comportamento esperado**:
1. Verificar se canal já existe (por tipo + empresaId)
2. Se existe: **PUT** (atualizar)
3. Se não existe: **POST** (criar)

**Comportamento real**:
- Sempre **POST** → Sempre **cria novo canal**
- Cada clique em "Salvar" = +1 canal duplicado

---

## ✅ Solução Implementada

### 1. Frontend: Verificação Antes de Salvar

Modificado `salvarIntegracao()` em `frontend-web/src/pages/configuracoes/IntegracoesPage.tsx`:

```typescript
// ✅ CÓDIGO NOVO (CORRETO)
const salvarIntegracao = async (tipo: string, config: any) => {
  // 🔍 PASSO 1: Verificar se canal já existe
  const listaResponse = await fetch('/api/atendimento/canais', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  let canalExistente: any = null;
  if (listaResponse.ok) {
    const result = await listaResponse.json();
    const canais = result.data || [];
    // Buscar canal do mesmo tipo
    canalExistente = canais.find((c: any) => c.tipo === tipo);
  }

  // ✅ PASSO 2: Escolher método correto
  const method = canalExistente ? 'PUT' : 'POST';
  const url = canalExistente 
    ? `/api/atendimento/canais/${canalExistente.id}`  // PUT para atualizar
    : '/api/atendimento/canais';                      // POST para criar

  // 🚀 PASSO 3: Fazer requisição com método correto
  const response = await fetch(url, {
    method,
    headers: { ... },
    body: JSON.stringify(requestBody)
  });

  if (response.ok) {
    const acao = canalExistente ? 'atualizada' : 'criada';
    toast.success(`Integração ${tipo} ${acao} com sucesso!`);
  }
};
```

**Fluxo Corrigido**:
```
Usuário clica "Salvar"
  ↓
Verifica se canal WhatsApp já existe?
  ├─ SIM → PUT /api/atendimento/canais/{id} (ATUALIZA)
  └─ NÃO → POST /api/atendimento/canais (CRIA)
```

### 2. Backend: Endpoint PUT Já Existia

O backend **JÁ tinha suporte correto** para atualização com merge inteligente:

```typescript
// backend/src/modules/atendimento/controllers/canais.controller.ts
@Put(':id')
async atualizar(@Req() req, @Param('id') id: string, @Body() dto: AtualizarCanalDto) {
  // 🔧 MERGE inteligente para WhatsApp - preserva campos existentes
  if (canal.tipo === 'whatsapp') {
    const credenciaisExistentes = canal.configuracao?.credenciais || {};
    const novasCredenciais = dto.configuracao.credenciais || {};
    
    const credenciaisMerged = {
      whatsapp_api_token: novasCredenciais.whatsapp_api_token || credenciaisExistentes.whatsapp_api_token,
      whatsapp_phone_number_id: novasCredenciais.whatsapp_phone_number_id || credenciaisExistentes.whatsapp_phone_number_id,
      // ... merge de todos os campos
    };

    canal.configuracao = { credenciais: credenciaisMerged };
  }
  
  await this.canalRepo.save(canal);
  return { success: true, message: 'Canal atualizado' };
}
```

**Vantagem**: Preserva todas as propriedades WhatsApp (phone_number_id, business_account_id, webhook_verify_token) ao atualizar apenas o token.

---

## 🧹 Limpeza de Dados

### Scripts Criados

1. **`visualizar-canais.js`** - Verificar estado atual
   ```bash
   node visualizar-canais.js
   ```
   Output:
   ```
   📊 Total de canais: 1
   📋 Canais por tipo: WHATSAPP: 1 canal(is)
   ✅ Nenhum canal duplicado!
   ```

2. **`limpar-canais-duplicados.js`** - Remover duplicados
   ```bash
   node limpar-canais-duplicados.js
   ```
   - Mantém apenas o canal mais recente de cada tipo
   - Remove automaticamente todos os mais antigos

### Estado Atual do Banco

```sql
SELECT tipo, COUNT(*) FROM atendimento_canais GROUP BY tipo;
```

Resultado:
```
tipo      | count
----------|------
WHATSAPP  | 1
```

✅ **Banco limpo** - apenas 1 canal WhatsApp.

---

## 🔒 Prevenção de Duplicados

### Constraint no Banco de Dados (Recomendado)

Para **garantir** que nunca haverá duplicados, adicione constraint:

```sql
-- Criar índice único composto
CREATE UNIQUE INDEX idx_canal_tipo_empresa 
ON atendimento_canais (tipo, empresa_id) 
WHERE deleted_at IS NULL;
```

**Efeito**: Banco rejeitará automaticamente tentativas de criar canais duplicados.

### Validação no Backend

Adicionar verificação no método POST:

```typescript
@Post()
async criar(@Req() req, @Body() dto: any) {
  const empresaId = req.user.empresa_id;
  const tipo = dto.tipo;

  // ✅ Verificar se já existe
  const canalExistente = await this.canalRepo.findOne({
    where: { empresaId, tipo }
  });

  if (canalExistente) {
    return {
      success: false,
      message: `Canal ${tipo} já existe. Use PUT para atualizar.`,
      existingId: canalExistente.id
    };
  }

  // ... criar novo canal
}
```

---

## 📊 Impacto da Correção

| Métrica | Antes | Depois |
|---------|-------|--------|
| Canais WhatsApp | 11 (duplicados) | 1 (único) |
| Requisições por salvamento | 1 POST | 1 GET + 1 PUT/POST |
| Espaço no banco | 11x redundante | Otimizado |
| Comportamento | ❌ Sempre cria novo | ✅ Atualiza existente |

---

## ✅ Checklist de Validação

- [x] Frontend verifica existência antes de salvar
- [x] Frontend usa PUT para atualizar canais existentes
- [x] Frontend usa POST apenas para canais novos
- [x] Backend faz merge inteligente de propriedades WhatsApp
- [x] Scripts de limpeza criados e testados
- [x] Banco de dados limpo (1 canal por tipo)
- [ ] **TODO**: Adicionar constraint UNIQUE no banco
- [ ] **TODO**: Adicionar validação de duplicados no backend

---

## 🚀 Próximos Passos

1. **Testar integração completa**:
   ```bash
   cd frontend-web
   npm run start
   ```
   - Acessar Configurações → Integrações
   - Salvar configuração WhatsApp
   - Verificar logs: deve mostrar "atualizada" em vez de "criada"
   - Executar `node visualizar-canais.js` → deve continuar mostrando apenas 1 canal

2. **Aplicar constraint no banco** (produção):
   ```sql
   CREATE UNIQUE INDEX idx_canal_tipo_empresa 
   ON atendimento_canais (tipo, empresa_id);
   ```

3. **Adicionar testes automatizados**:
   - Teste: tentar criar canal duplicado deve falhar
   - Teste: atualizar canal existente deve preservar todas propriedades

---

## 📝 Resumo Técnico

**Problema**: Frontend sempre criava novos canais (POST) em vez de atualizar (PUT)

**Solução**: 
1. ✅ Frontend agora verifica se canal existe
2. ✅ Usa PUT para atualizar existente
3. ✅ Usa POST apenas para novos
4. ✅ Backend faz merge inteligente de configurações

**Resultado**: 
- ✅ Não há mais duplicados
- ✅ Configurações preservadas ao atualizar
- ✅ Banco de dados limpo

---

**Autor**: GitHub Copilot  
**Data**: 12/10/2025  
**Arquivos Modificados**: 
- `frontend-web/src/pages/configuracoes/IntegracoesPage.tsx`

**Scripts Criados**:
- `visualizar-canais.js`
- `limpar-canais-duplicados.js`
