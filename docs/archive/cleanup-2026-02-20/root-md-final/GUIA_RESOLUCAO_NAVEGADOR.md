# 🔍 GUIA DE RESOLUÇÃO: Sistema abre só o frontend em um navegador

## ✅ Status dos Serviços
- **Backend**: Rodando na porta 3001
- **Frontend**: Rodando na porta 3000
- **CORS**: Configurado corretamente

## 🎯 CAUSA PROVÁVEL

O problema **NÃO está no código**, mas sim em **diferenças entre navegadores**:

1. **LocalStorage diferente** - Cada navegador tem seu próprio storage
2. **Cache desatualizado** - Um navegador pode ter versão antiga do JS
3. **Extensões bloqueando** - AdBlock, Privacy Badger, NoScript
4. **Service Worker antigo** - Cache do PWA

---

## 🔧 SOLUÇÃO RÁPIDA (Faça no navegador com problema)

### Passo 1: Abrir DevTools
Pressione **F12** ou **Ctrl+Shift+I**

### Passo 2: Verificar Console
Veja se há erros em vermelho, especialmente:
- ❌ `CORS error`
- ❌ `net::ERR_CONNECTION_REFUSED`
- ❌ `401 Unauthorized`
- ❌ `Failed to fetch`

### Passo 3: Verificar Network Tab
1. Vá para aba **Network** (Rede)
2. Recarregue a página (F5)
3. Procure requisições para `localhost:3001`
4. Veja se elas estão:
   - ✅ **200 OK** (verde) = Funcionando
   - ❌ **Failed** (vermelho) = Bloqueado
   - ❌ **401** = Token inválido

### Passo 4: Limpar LocalStorage
No **Console**, execute:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Passo 5: Force Reload (Limpar Cache)
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- Ou: `Ctrl + F5`

### Passo 6: Desabilitar Extensões
1. Abrir menu de extensões
2. Desabilitar temporariamente:
   - AdBlock
   - uBlock Origin
   - Privacy Badger
   - NoScript
3. Recarregar página

### Passo 7: Modo Anônimo/Privado
- **Chrome/Edge**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`

Se funcionar no modo anônimo = problema é cache/extensão

---

## 📊 COMPARAÇÃO DE COMPORTAMENTOS

### ✅ Navegador que FUNCIONA
```
Console: Sem erros
Network: localhost:3001 → 200 OK
LocalStorage: authToken presente e válido
```

### ❌ Navegador que NÃO funciona
```
Console: Pode ter erros CORS ou 401
Network: localhost:3001 → Failed ou 401
LocalStorage: authToken ausente ou expirado
```

---

## 🔍 O QUE VERIFICAR NO NAVEGADOR COM PROBLEMA

### 1. LocalStorage (F12 → Application/Storage → Local Storage)
Verificar se existe:
- `authToken` - Token JWT
- `user_data` - Dados do usuário
- `empresaAtiva` - UUID da empresa

**Se NÃO existir ou estiver expirado**: O login não foi feito neste navegador

**SOLUÇÃO**: Fazer login novamente

### 2. Network Tab (F12 → Network)
Procurar requisições para:
- `http://localhost:3001/auth/login`
- `http://localhost:3001/atendimento/*`
- `http://localhost:3001/comercial/*`

**Se aparecer "Failed" ou "CORS error"**:
- CORS bloqueado por extensão
- Backend não está respondendo neste navegador

**SOLUÇÃO**: Desabilitar extensões ou usar modo anônimo

### 3. Console Errors
Procurar mensagens como:
```
Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**SOLUÇÃO**: Desabilitar extensões de privacidade

---

## 💡 SOLUÇÕES POR TIPO DE ERRO

### Erro: "CORS policy has blocked..."
**Causa**: Extensão bloqueando ou configuração incorreta
**Solução**:
1. Desabilitar extensões de privacidade
2. Usar modo anônimo
3. Verificar se backend está rodando: `netstat -ano | findstr :3001`

### Erro: "401 Unauthorized"
**Causa**: Token expirado ou ausente
**Solução**:
1. Limpar LocalStorage: `localStorage.clear()`
2. Fazer login novamente
3. Verificar se authToken está sendo salvo

### Erro: "Failed to fetch" ou "net::ERR_CONNECTION_REFUSED"
**Causa**: Backend não está respondendo
**Solução**:
1. Verificar se backend está rodando
2. Verificar porta: `Get-NetTCPConnection -LocalPort 3001`
3. Reiniciar backend: `cd backend && npm run start:dev`

### Erro: "Mixed Content"
**Causa**: Frontend em HTTPS tentando acessar backend HTTP
**Solução**:
1. Acessar frontend via HTTP: `http://localhost:3000`
2. Ou configurar backend para HTTPS

---

## 🚀 COMANDOS ÚTEIS PARA DEBUGGING

### Verificar se serviços estão rodando
```powershell
Get-NetTCPConnection -LocalPort 3001,3000
```

### Testar backend diretamente
```powershell
Invoke-WebRequest -Uri "http://localhost:3001" -Method Get
```

### Ver logs do backend
```powershell
# Se rodando em terminal separado, verificar o terminal
```

### Limpar TUDO e recomeçar
```powershell
# Backend
cd backend
npm run start:dev

# Frontend (novo terminal)
cd frontend-web
npm start

# No navegador com problema:
# F12 → Console → localStorage.clear() → F5
```

---

## 📱 INFORMAÇÕES PARA SUPORTE

Se o problema persistir, colete estas informações:

1. **Qual navegador funciona?** (Chrome, Edge, Firefox, Safari...)
2. **Qual navegador NÃO funciona?**
3. **Versão do navegador** (Ajuda → Sobre)
4. **Erros no Console** (F12 → Console → tirar screenshot)
5. **Network tab** (F12 → Network → filtrar "localhost:3001" → tirar screenshot)
6. **LocalStorage** (F12 → Application → Local Storage → localhost:3000 → tirar screenshot)

---

## ✅ CHECKLIST DE RESOLUÇÃO

- [ ] Abri DevTools (F12)
- [ ] Verifiquei Console por erros
- [ ] Verifiquei Network tab (requisições para :3001)
- [ ] Executei `localStorage.clear()` no Console
- [ ] Fiz Force Reload (Ctrl+Shift+R)
- [ ] Desabilitei extensões temporariamente
- [ ] Testei em modo anônimo
- [ ] Verifiquei se backend está rodando
- [ ] Fiz login novamente
- [ ] Ainda não funciona? Coletei informações acima para suporte

---

**🎯 RESUMO**: O código está correto, o problema é cache/storage/extensões do navegador específico.
