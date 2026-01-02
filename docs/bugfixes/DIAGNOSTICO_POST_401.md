# 🔍 Diagnóstico: POST 401 Unauthorized

**Data**: 11 de outubro de 2025  
**Situação**: Usuário fez login mas recebe 401 ao salvar integração  
**Status**: 🔍 **EM INVESTIGAÇÃO**

---

## 🎉 Boa Notícia: Você Está Logado!

### Evidência

Você está vendo:
```
POST http://localhost:3000/api/atendimento/canais 401 (Unauthorized)
```

Isso é **diferente** do erro anterior:
- ✅ **POST** (não GET) → Você clicou em "Salvar"
- ✅ **Linha 198** → Função `salvarIntegracao`
- ✅ **onClick** → Você interagiu com o formulário

**Conclusão**: Você conseguiu fazer login e acessar a página! 🎊

---

## 🔍 Por Que Ainda Dá 401?

### Análise do Código

O código em `IntegracoesPage.tsx:198` está **correto**:

```typescript
const response = await fetch('/api/atendimento/canais', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,  // ← Token está sendo enviado!
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nome: `${tipo.toUpperCase()} Principal`,
    tipo,
    config: { credenciais }
  })
});
```

### Possíveis Causas

#### 1. Token Expirado Durante o Uso ⏰

**O que acontece:**
- Você fez login → token gerado (válido por X horas)
- Ficou na página por um tempo
- Token expirou enquanto você configurava
- Ao salvar → backend rejeita com 401

**Como verificar:**
```javascript
// Console do navegador (F12)
const token = localStorage.getItem('authToken');
console.log('Token:', token);

// Decodificar JWT (sem validar assinatura)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expira em:', new Date(payload.exp * 1000));
console.log('Agora:', new Date());
```

#### 2. Problema de Permissões (RBAC) 🔐

**O que acontece:**
- Você está logado com usuário que não tem permissão
- Role do usuário não permite criar/editar canais
- Backend rejeita com 401

**Usuários e Permissões:**

| Usuário | Email | Role | Pode Criar Canais? |
|---------|-------|------|-------------------|
| Admin | admin@conectsuite.com.br | `admin` | ✅ SIM |
| Gerente | gerente@conectcrm.com | `manager` | ⚠️ Talvez |
| Vendedor | vendedor@conectcrm.com | `user` | ❌ Provavelmente não |

**Solução:** Use o usuário **admin@conectsuite.com.br**

#### 3. Token Não Persistido Corretamente 💾

**O que acontece:**
- Login funciona
- Token não foi salvo no localStorage
- Requisições sem token válido

**Como verificar:**
```javascript
// Console do navegador (F12)
const token = localStorage.getItem('authToken');
if (!token) {
  console.log('❌ SEM TOKEN! Faça login novamente.');
} else {
  console.log('✅ Token encontrado:', token.substring(0, 50) + '...');
}
```

---

## ✅ Soluções

### Solução 1: Renovar Login (Mais Provável)

1. **Faça LOGOUT**
   - Clique no menu do usuário (canto superior direito)
   - Clique em "Sair" ou "Logout"

2. **Faça LOGIN novamente**
   - Acesse: `http://localhost:3000/login`
   - Use: `admin@conectsuite.com.br` / `admin123`

3. **Tente salvar novamente**
   - Vá em Configurações → Integrações
   - Preencha os dados
   - Clique em Salvar

### Solução 2: Limpar Cache e Fazer Login

```javascript
// Console do navegador (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Depois:
1. Faça login novamente
2. Teste salvar integração

### Solução 3: Verificar Role do Usuário

```javascript
// Console do navegador (F12)
const token = localStorage.getItem('authToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Role do usuário:', payload.role || payload.tipo);
  console.log('Email:', payload.email);
  console.log('Dados completos:', payload);
}
```

Se o role **não for `admin`**, faça logout e login com admin.

---

## 🧪 Teste Completo de Diagnóstico

Cole este código no **Console do navegador (F12)**:

```javascript
console.log('🔍 DIAGNÓSTICO COMPLETO - Problema 401 POST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Verificar token
const token = localStorage.getItem('authToken');
if (!token) {
  console.log('❌ SEM TOKEN - Você não está logado!');
  console.log('👉 Solução: Faça login em /login\n');
} else {
  console.log('✅ Token encontrado:', token.substring(0, 50) + '...\n');
  
  try {
    // 2. Decodificar token
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('📋 Informações do Token:');
    console.log('   User ID:', payload.sub || payload.userId);
    console.log('   Email:', payload.email);
    console.log('   Role:', payload.role || payload.tipo);
    console.log('   Empresa ID:', payload.empresaId);
    
    // 3. Verificar expiração
    const exp = new Date(payload.exp * 1000);
    const now = new Date();
    const horasRestantes = (exp - now) / 1000 / 60 / 60;
    
    console.log('\n⏰ Validade do Token:');
    console.log('   Expira em:', exp.toLocaleString('pt-BR'));
    console.log('   Agora:', now.toLocaleString('pt-BR'));
    
    if (horasRestantes > 0) {
      console.log(`   ✅ Token válido por mais ${horasRestantes.toFixed(2)} horas`);
    } else {
      console.log(`   ❌ Token EXPIROU há ${Math.abs(horasRestantes).toFixed(2)} horas!`);
      console.log('   👉 Solução: Faça logout e login novamente\n');
    }
    
    // 4. Testar GET (carregar dados)
    console.log('\n🧪 Testando GET /api/atendimento/canais...');
    fetch('/api/atendimento/canais', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => {
      console.log(`   Status: ${r.status} ${r.statusText}`);
      if (r.ok) {
        console.log('   ✅ GET funcionando!');
        return r.json();
      } else if (r.status === 401) {
        console.log('   ❌ GET retorna 401 - Token inválido ou expirado');
      }
      return null;
    })
    .then(data => {
      if (data) {
        console.log('   📦 Dados recebidos:', data);
      }
    });
    
    // 5. Testar POST (salvar dados)
    console.log('\n🧪 Testando POST /api/atendimento/canais...');
    fetch('/api/atendimento/canais', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Teste Diagnóstico',
        tipo: 'whatsapp',
        config: {
          credenciais: {
            whatsapp_phone_number_id: 'test',
            whatsapp_api_token: 'test'
          }
        }
      })
    })
    .then(r => {
      console.log(`   Status: ${r.status} ${r.statusText}`);
      if (r.ok) {
        console.log('   ✅ POST funcionando! Problema resolvido!');
        return r.json();
      } else if (r.status === 401) {
        console.log('   ❌ POST retorna 401');
        console.log('   Possíveis causas:');
        console.log('   1. Token expirado');
        console.log('   2. Permissões insuficientes (role não é admin)');
        console.log('   3. Token inválido');
      } else if (r.status === 403) {
        console.log('   ❌ POST retorna 403 - Sem permissão');
        console.log('   👉 Você precisa ser ADMIN para criar canais');
      }
      return r.json().catch(() => null);
    })
    .then(data => {
      if (data) {
        console.log('   📦 Resposta:', data);
      }
    });
    
  } catch (e) {
    console.error('❌ Erro ao decodificar token:', e);
    console.log('👉 Token pode estar corrompido. Faça logout e login.\n');
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 Após executar os testes acima, siga as orientações mostradas.');
```

---

## 📊 Interpretação dos Resultados

### Cenário 1: Token Expirado

**Console mostra:**
```
❌ Token EXPIROU há X horas!
❌ GET retorna 401
❌ POST retorna 401
```

**Solução:**
1. Faça logout
2. Faça login novamente
3. Tente salvar de novo

---

### Cenário 2: Sem Permissão

**Console mostra:**
```
✅ Token válido por mais X horas
Role: user (ou manager)
❌ POST retorna 403 ou 401
```

**Solução:**
1. Faça logout
2. Faça login com `admin@conectsuite.com.br`
3. Tente salvar de novo

---

### Cenário 3: Token Corrompido

**Console mostra:**
```
❌ Erro ao decodificar token
```

**Solução:**
```javascript
localStorage.clear();
location.reload();
// Depois faça login novamente
```

---

## 🔧 Verificação do Backend

Se o problema persistir, vamos verificar o backend:

### Teste 1: Backend Está Rodando?

```bash
curl http://localhost:3001/api/atendimento/canais
# Deve retornar 401 (não 404)
```

### Teste 2: Login Funciona?

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@conectsuite.com.br","senha":"admin123"}'

# Deve retornar token JWT
```

### Teste 3: POST com Token Funciona?

```bash
# 1. Obter token (resultado do login acima)
TOKEN="cole_o_token_aqui"

# 2. Testar POST
curl -X POST http://localhost:3001/api/atendimento/canais \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nome": "WhatsApp Teste",
    "tipo": "whatsapp",
    "config": {
      "credenciais": {
        "whatsapp_phone_number_id": "123456789",
        "whatsapp_api_token": "test_token"
      }
    }
  }'

# Deve retornar 201 Created ou 200 OK
```

---

## 📝 Checklist de Resolução

Execute na ordem:

- [ ] Executar script de diagnóstico no console
- [ ] Verificar se token está expirado
- [ ] Verificar role do usuário (deve ser `admin`)
- [ ] Se expirado: Fazer logout e login
- [ ] Se não é admin: Fazer logout e login com admin
- [ ] Se token corrompido: Limpar localStorage e fazer login
- [ ] Testar salvar integração novamente
- [ ] Se ainda falhar: Verificar logs do backend

---

## 🎯 Próximo Passo

**Execute o script de diagnóstico** acima e me mostre os resultados!

Isso vai nos dizer exatamente qual é o problema:
- ✅ Token expirado? → Renovar login
- ✅ Sem permissão? → Usar admin
- ✅ Token corrompido? → Limpar e renovar
- ✅ Outro problema? → Investigar backend

---

**Status**: 🔍 Aguardando diagnóstico  
**Próxima Ação**: Executar script no console e reportar resultados
