# 🔍 ORIGEM DO EMAIL: dhonleno.freitas@cliente.com

## 📍 **FONTE IDENTIFICADA**

O email `dhonleno.freitas@cliente.com` está sendo **gerado automaticamente** pelo **BACKEND** do sistema.

### 🎯 **Localização Exata:**

**Arquivo**: `backend/src/modules/propostas/propostas.service.ts`  
**Linha**: 196  
**Função**: `criarProposta()`

### 🔧 **Código Responsável:**

```typescript
if (typeof dadosProposta.cliente === 'string') {
  // Se é string, criar objeto com o nome fornecido
  const nomeCliente = dadosProposta.cliente as string;
  clienteProcessado = {
    id: 'cliente-temp',
    nome: nomeCliente,
    email: `${nomeCliente.toLowerCase().replace(/\s+/g, '.')}@cliente.com`  // ← AQUI!
  };
}
```

## 🔄 **PROCESSO DE GERAÇÃO**

### 1. **Input Original**
- Nome: `"Dhonleno Freitas"`
- Tipo: `string` (não é um objeto cliente completo)

### 2. **Processamento Automático**
```javascript
"Dhonleno Freitas"
  .toLowerCase()        // → "dhonleno freitas"
  .replace(/\s+/g, '.') // → "dhonleno.freitas"
  + '@cliente.com'      // → "dhonleno.freitas@cliente.com"
```

### 3. **Resultado Final**
```typescript
{
  id: 'cliente-temp',
  nome: 'Dhonleno Freitas',
  email: 'dhonleno.freitas@cliente.com'  // EMAIL FICTÍCIO GERADO
}
```

## 📊 **FLUXO COMPLETO**

```
1. Frontend → Backend: { cliente: "Dhonleno Freitas" }
2. Backend detecta: typeof cliente === 'string'
3. Backend gera: cliente-temp com email fictício
4. Banco salva: { nome: "Dhonleno Freitas", email: "dhonleno.freitas@cliente.com" }
5. Frontend recebe: Email fictício nas propostas
6. Tela mostra: dhonleno.freitas@cliente.com
```

## 🔍 **ANÁLISE DO BANCO DE DADOS**

Baseado na análise executada:

```
👤 CLIENTE ENCONTRADO:
   • ID: cliente-temp
   • Nome: "Dhonleno Freitas"
   • Email: "dhonleno.freitas@cliente.com"
   • Status: ⚠️ EMAIL FICTÍCIO
   • Tipo: 🔄 CLIENTE TEMPORÁRIO (não salvo na tabela clientes)
```

## ❓ **POR QUE ISSO ACONTECE?**

1. **Cliente não existe na tabela `clientes`**
2. **Proposta foi criada apenas com o nome** (formato string)
3. **Backend gera automaticamente um email fictício** para completar os dados
4. **Cliente fica "temporário"** com ID `cliente-temp`

## 💡 **SOLUÇÕES POSSÍVEIS**

### 🎯 **Solução 1: Criar Cliente Real (Recomendada)**
```sql
-- Criar cliente real na tabela clientes
INSERT INTO clientes (nome, email, telefone, documento) 
VALUES ('Dhonleno Freitas', 'dhonlenofreitas@hotmail.com', '(62) 99999-9999', '000.000.000-00');

-- Atualizar proposta para referenciar cliente real
UPDATE propostas SET cliente = { id: <novo_id>, nome: 'Dhonleno Freitas', email: 'dhonlenofreitas@hotmail.com' }
WHERE numero = 'PROP-2025-023';
```

### 🔧 **Solução 2: Modificar Backend**
```typescript
// Não gerar email fictício, deixar vazio
email: '' // Sistema solicitará email real na hora do envio
```

### ✅ **Solução 3: Usar Sistema Atual (Já Implementada)**
- Manter email fictício
- Sistema detecta automática e solicita email real
- Usuário informa email correto no momento do envio

## 🎯 **RESUMO**

**ORIGEM**: Backend gera automaticamente  
**MOTIVO**: Cliente é string, não objeto completo  
**PADRÃO**: `{nome.toLowerCase().replace(' ', '.')}@cliente.com`  
**SOLUÇÃO**: Sistema já detecta e solicita email real ✅

---

**Data da análise**: 29 de julho de 2025  
**Status**: 🔍 **ORIGEM IDENTIFICADA**
