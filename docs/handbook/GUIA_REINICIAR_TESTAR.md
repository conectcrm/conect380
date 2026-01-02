# 🚀 Guia Rápido - Reiniciar e Testar

## 📝 Problema Resolvido

✅ **JWT_SECRET agora está padronizado** entre módulos Auth e Atendimento  
✅ **WebSocket deve conectar sem erro `invalid signature`**

---

## 🔄 COMO REINICIAR

### 1. Parar Backend (se estiver rodando)

No terminal do backend, pressionar:
```
Ctrl + C
```

### 2. Reiniciar Backend

```bash
cd backend
npm run start:dev
```

**Aguarde até ver:**
```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG [NestApplication] Application is running on: http://localhost:3001
```

### 3. Recarregar Frontend

Se o frontend já estiver rodando:
- Apenas **recarregar a página** (F5) no navegador
- Não precisa reiniciar o servidor frontend

Se não estiver rodando:
```bash
cd frontend-web
npm start
```

---

## 🧪 TESTE RÁPIDO

### Verificar Conexão WebSocket

1. **Abrir DevTools** (F12)
2. **Ir para Console**
3. **Fazer login** e entrar na tela de atendimento
4. **Procurar por:**

**✅ SUCESSO:**
```
✅ WebSocket conectado! ID: abc123
```

**❌ ERRO (não deve mais aparecer):**
```
❌ Erro ao conectar cliente: invalid signature
```

---

## 📊 Logs Esperados no Backend

### ✅ CORRETO (Desenvolvimento):
```
[Nest] LOG [AtendimentoGateway] 🔌 Cliente abc123 tentando conectar...
[Nest] LOG [AtendimentoGateway] ✅ Token válido! User: user123, Role: atendente
[Nest] LOG [AtendimentoGateway] ✅ Cliente conectado: abc123 (User: user123, Role: atendente)
```

### ❌ ERRO (não deve mais acontecer):
```
[Nest] ERROR [AtendimentoGateway] ❌ Erro ao conectar cliente: invalid signature
```

---

## 🎯 Teste Completo de Tempo Real

Após confirmar conexão WebSocket:

1. **Abrir em 2 abas:** http://localhost:3000
2. **Fazer login** nas duas abas
3. **Ir para Atendimento** nas duas abas
4. **Selecionar mesmo ticket** nas duas abas
5. **Enviar mensagem na Aba 1**
6. **Verificar:** Mensagem aparece **instantaneamente** na Aba 2 ✅

---

## ⚠️ Se Ainda Tiver Erro

### Verificar .env

Abrir `backend/.env` e confirmar:

```properties
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_2024
```

### Limpar Cache do Navegador

1. DevTools (F12)
2. Aba **Application**
3. Clicar em **Clear storage**
4. Fazer login novamente

### Verificar Token Armazenado

No Console do navegador:
```javascript
console.log(localStorage.getItem('authToken'));
```

Deve retornar um token válido (string longa).

---

## 📚 Documentação

- `CORRECAO_JWT_SECRET_WEBSOCKET.md` - Detalhes do problema JWT
- `RESUMO_CORRECOES_TEMPO_REAL.md` - Todas as correções aplicadas
- `CHECKLIST_TEMPO_REAL.md` - Checklist de validação completo

---

**Status:** ✅ PRONTO PARA TESTE  
**Última correção:** JWT_SECRET padronizado  
**Data:** 14/10/2025
