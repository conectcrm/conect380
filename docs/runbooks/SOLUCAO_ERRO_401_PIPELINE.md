# 🔐 SOLUÇÃO: Erro 401 (Unauthorized) - Pipeline

**Data**: 10 de novembro de 2025  
**Erro**: Failed to load resource: 401 (Unauthorized)  
**Status**: ✅ **TRATADO**

---

## 🔍 Diagnóstico

### Erro Original
```
:3001/oportunidades/:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)
Erro ao carregar dados: AxiosError
```

### Causa Raiz
O backend está **exigindo autenticação** para acessar o endpoint `/oportunidades`, mas:
1. ❌ Não há token válido no `localStorage`
2. ❌ Ou a sessão expirou
3. ❌ Ou você não está logado

---

## ✅ Solução Implementada

### 1. **Verificação de Token** ✅

**Arquivo**: `frontend-web/src/pages/PipelinePage.tsx`

```typescript
const carregarDados = async () => {
  try {
    setLoading(true);
    setError(null);

    // ✅ Verificar se há token antes de fazer requisição
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Você precisa estar autenticado para acessar esta página.');
      setLoading(false);
      return;
    }

    // Carregar dados...
  } catch (err: any) {
    // Tratamento de erro...
  }
};
```

### 2. **Tratamento de Erro 401** ✅

```typescript
} catch (err: any) {
  console.error('Erro ao carregar dados:', err);
  
  // ✅ Detectar erro 401 especificamente
  if (err?.response?.status === 401) {
    setError('Sua sessão expirou. Por favor, faça login novamente.');
    
    // ✅ Redirecionar para login após 2 segundos
    setTimeout(() => {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }, 2000);
  } else {
    const errorMessage = err?.response?.data?.message || err.message || 'Erro ao carregar oportunidades';
    setError(errorMessage);
  }
}
```

### 3. **UI de Erro Melhorada** ✅

```tsx
{error && (
  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
    <div className="flex items-start gap-4">
      <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
        <X className="h-6 w-6 text-red-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-red-900 mb-1">
          Erro ao Carregar Dados
        </h3>
        <p className="text-red-800 mb-4">{error}</p>
        
        {/* ✅ Botões de ação */}
        <div className="flex gap-3">
          <button onClick={() => carregarDados()}>
            Tentar Novamente
          </button>
          
          {/* ✅ Botão de login aparece se for erro de autenticação */}
          {error.includes('sessão expirou') || error.includes('autenticado') ? (
            <button onClick={() => window.location.href = '/login'}>
              Fazer Login
            </button>
          ) : null}
        </div>
      </div>
    </div>
  </div>
)}
```

---

## 🔧 Como Resolver AGORA

### Opção 1: Fazer Login ✅

1. Acesse: **http://localhost:3000/login**
2. Faça login com suas credenciais
3. Volte para: **http://localhost:3000/pipeline**

### Opção 2: Verificar Token no Console ✅

1. Abra o DevTools (F12)
2. Vá para a aba **Console**
3. Execute:
   ```javascript
   console.log('Token:', localStorage.getItem('auth_token'));
   ```

**Resultado Esperado**:
- ✅ Se retornar um token longo (JWT): você está autenticado
- ❌ Se retornar `null`: você precisa fazer login

### Opção 3: Limpar e Relogar ✅

Se o token estiver corrompido:

```javascript
// No console do navegador
localStorage.removeItem('auth_token');
window.location.href = '/login';
```

---

## 🧪 Testar a Solução

### 1. **Cenário: Sem Token**
```
1. localStorage.clear() no console
2. Acessar /pipeline
3. Ver mensagem: "Você precisa estar autenticado para acessar esta página."
4. Clicar em "Fazer Login"
5. Redirecionar para /login
```

### 2. **Cenário: Token Expirado**
```
1. Token existe mas está expirado
2. Acessar /pipeline
3. Backend retorna 401
4. Ver mensagem: "Sua sessão expirou. Por favor, faça login novamente."
5. Aguardar 2 segundos
6. Redirecionar automaticamente para /login
```

### 3. **Cenário: Token Válido**
```
1. Token existe e está válido
2. Acessar /pipeline
3. Dados carregam normalmente ✅
```

---

## 📊 Melhorias Implementadas

### Antes ❌
```typescript
} catch (err) {
  console.error('Erro:', err);
  setError('Erro ao carregar oportunidades');
  // Sem ação clara para o usuário
}
```

### Depois ✅
```typescript
} catch (err: any) {
  console.error('Erro ao carregar dados:', err);
  
  if (err?.response?.status === 401) {
    setError('Sua sessão expirou. Por favor, faça login novamente.');
    setTimeout(() => {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }, 2000);
  } else {
    const errorMessage = err?.response?.data?.message || err.message || 'Erro ao carregar oportunidades';
    setError(errorMessage);
  }
}
```

**Benefícios**:
- ✅ Detecta especificamente erro 401
- ✅ Mensagem clara para o usuário
- ✅ Redireciona automaticamente para login
- ✅ Limpa token inválido
- ✅ Botão de ação visível

---

## 🚨 Outros Erros Comuns

### 403 (Forbidden)
- **Causa**: Usuário autenticado mas sem permissão
- **Solução**: Verificar módulos/roles do usuário

### 404 (Not Found)
- **Causa**: Endpoint não existe
- **Solução**: Verificar se backend está rodando

### 500 (Internal Server Error)
- **Causa**: Erro no backend
- **Solução**: Verificar logs do backend

---

## 📝 Checklist de Validação

Após fazer login:

- [ ] Abrir DevTools (F12)
- [ ] Console: `localStorage.getItem('auth_token')` retorna token
- [ ] Acessar http://localhost:3000/pipeline
- [ ] Página carrega sem erro 401
- [ ] KPI cards aparecem com dados
- [ ] Colunas do Kanban aparecem
- [ ] Botão "Nova Oportunidade" funciona

---

## 🎯 Próxima Ação

**FAÇA ISSO AGORA**:

1. **Abrir navegador**: http://localhost:3000/login
2. **Fazer login** com suas credenciais
3. **Voltar para**: http://localhost:3000/pipeline
4. **Verificar** se dados carregam corretamente

**Ou se backend não estiver rodando**:

```powershell
cd backend
npm run start:dev
```

---

## 📌 Resumo

**Erro**: 401 Unauthorized  
**Causa**: Falta de autenticação  
**Solução**: Fazer login  
**Status**: ✅ Código atualizado com tratamento adequado

**Próximo passo**: Fazer login e testar novamente! 🚀
