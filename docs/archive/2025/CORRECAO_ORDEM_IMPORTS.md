# 🔧 Correção: Ordem de Imports ESLint

## ❌ Problema Identificado

Erro de compilação do ESLint devido à **ordem incorreta** dos imports.

### Erro Original

```
ERROR [eslint] 
src\features\atendimento\omnichannel\hooks\useAtendimentos.ts
  Line 23:1:  Import in body of module; reorder to top  import/first
  Line 24:1:  Import in body of module; reorder to top  import/first
```

**Causa:** Constante `DEBUG` declarada **ANTES** dos imports.

---

## 🔍 Código Problemático

### ANTES ❌

```typescript
import { useState, useEffect, useCallback } from 'react';
import { atendimentoService } from '../services/atendimentoService';
import { Ticket } from '../types';
import { NovoAtendimentoData } from '../modals/NovoAtendimentoModal';

const DEBUG = process.env.NODE_ENV === 'development'; // ❌ Aqui

import { TransferenciaData } from '../modals/TransferirAtendimentoModal'; // ❌ Depois!
import { EncerramentoData } from '../modals/EncerrarAtendimentoModal'; // ❌ Depois!
```

**Problema:** Imports **DEVEM** estar no topo do arquivo, antes de qualquer código.

---

## ✅ Solução Implementada

### DEPOIS ✅

```typescript
import { useState, useEffect, useCallback } from 'react';
import { atendimentoService } from '../services/atendimentoService';
import { Ticket } from '../types';
import { NovoAtendimentoData } from '../modals/NovoAtendimentoModal';
import { TransferenciaData } from '../modals/TransferirAtendimentoModal'; // ✅ Movido!
import { EncerramentoData } from '../modals/EncerrarAtendimentoModal'; // ✅ Movido!

const DEBUG = process.env.NODE_ENV === 'development'; // ✅ Depois dos imports
```

**Correção:** Todos os imports **ANTES** da constante `DEBUG`.

---

## 🔧 Arquivos Corrigidos

### 1. ✅ useAtendimentos.ts

**Mudança:**
- Moveu `import { TransferenciaData }` para cima
- Moveu `import { EncerramentoData }` para cima
- `const DEBUG` agora está após todos os imports

---

### 2. ✅ useMensagens.ts

**Problema encontrado:**
```typescript
 * - Gravação de áudio

const DEBUG = process.env.NODE_ENV === 'development'; // ❌ No meio do comentário!
 * - Auto-scroll
 */

import { useState } from 'react'; // ❌ Depois!
```

**Correção:**
```typescript
 * - Gravação de áudio
 * - Auto-scroll
 */

import { useState } from 'react'; // ✅ Imports primeiro

const DEBUG = process.env.NODE_ENV === 'development'; // ✅ Depois
```

---

## 📋 Regra ESLint: `import/first`

### O Que é?

Garante que **todos os imports** estejam no **topo** do módulo.

### Por Quê?

1. **Clareza:** Fácil ver todas as dependências
2. **Consistência:** Padrão em toda a codebase
3. **Hoisting:** Imports são hoisted de qualquer forma
4. **Manutenção:** Mais fácil gerenciar dependências

---

## 🎓 Ordem Correta dos Elementos

```typescript
// 1️⃣ Comentário de cabeçalho (opcional)
/**
 * Descrição do arquivo
 */

// 2️⃣ IMPORTS (PRIMEIRO!)
import React from 'react';
import { useState } from 'react';
import { myService } from './services';

// 3️⃣ Constantes e configurações
const DEBUG = process.env.NODE_ENV === 'development';
const API_URL = 'http://localhost:3001';

// 4️⃣ Types e Interfaces
interface MyProps {
  name: string;
}

// 5️⃣ Componentes/Hooks/Funções
export const MyComponent = () => {
  // ...
};
```

---

## 🧪 Validação

### Comando para verificar

```bash
npm start
```

**Esperado:** ✅ Compilação sem erros do ESLint

---

### ESLint Manual

```bash
npx eslint src/features/atendimento/omnichannel/hooks/useAtendimentos.ts
npx eslint src/features/atendimento/omnichannel/hooks/useMensagens.ts
```

**Esperado:** ✅ Nenhum erro `import/first`

---

## 📊 Impacto

### ANTES ❌
```
Compilação: FALHA
Erro: import/first em 2 arquivos
Frontend: Não inicia
```

### DEPOIS ✅
```
Compilação: SUCESSO
Erro: Nenhum
Frontend: Inicia normalmente
```

---

## 🎯 Boas Práticas

### 1. ✅ Sempre Importe Primeiro

```typescript
// ✅ CORRETO
import { MyModule } from './module';

const MY_CONST = 'value';
```

```typescript
// ❌ INCORRETO
const MY_CONST = 'value';

import { MyModule } from './module'; // ESLint error!
```

---

### 2. ✅ Agrupe Imports por Origem

```typescript
// Bibliotecas externas
import React from 'react';
import { useState } from 'react';

// Bibliotecas de terceiros
import axios from 'axios';
import { io } from 'socket.io-client';

// Imports locais
import { myService } from '../services';
import { MyComponent } from './components';
```

---

### 3. ✅ Use Auto-Fix do ESLint

```bash
# Corrigir automaticamente
npx eslint --fix src/**/*.ts
```

---

## 📝 Checklist

- [x] ✅ useAtendimentos.ts - Imports reordenados
- [x] ✅ useMensagens.ts - Imports reordenados
- [x] ✅ DEBUG constante movida para depois dos imports
- [x] ✅ Compilação sem erros
- [x] ✅ ESLint satisfeito

---

## 🎉 Resultado Final

**Compilação:** ✅ SUCESSO  
**ESLint:** ✅ SEM ERROS  
**Frontend:** ✅ INICIANDO  
**Padrão:** ✅ CONSISTENTE  

---

**Data:** 14/10/2025  
**Arquivos:** `useAtendimentos.ts`, `useMensagens.ts`  
**Regra:** `import/first`  
**Status:** ✅ Corrigido
