# 🎯 SOLUÇÃO RÁPIDA: Sistema funciona só no Opera

## 🔍 Problema Identificado
- ✅ **Opera**: Funciona perfeitamente
- ❌ **Chrome/Edge/Firefox**: Não funciona

**Causa**: Cache, Service Workers ou LocalStorage diferente entre navegadores.

---

## ⚡ SOLUÇÃO EM 3 PASSOS (Faça no navegador com problema)

### 1️⃣ Abrir Console (F12)

### 2️⃣ Copiar e Colar este código:

```javascript
// 🧹 LIMPEZA COMPLETA
console.log('🧹 Iniciando limpeza...');
localStorage.clear();
sessionStorage.clear();
if ('caches' in window) {
  caches.keys().then(keys => {
    keys.forEach(key => caches.delete(key));
    console.log('✅ Cache limpo');
  });
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
    console.log('✅ Service Workers removidos');
  });
}
console.log('✅ Limpeza concluída! Recarregando...');
setTimeout(() => location.reload(), 1000);
```

### 3️⃣ Aguardar recarregar e fazer login

---

## 🧪 TESTE DE CONECTIVIDADE

Se ainda não funcionar, cole este código no Console:

```javascript
// Testar backend
fetch('http://localhost:3001')
  .then(r => console.log('✅ Backend OK:', r.status))
  .catch(e => console.error('❌ Backend FALHOU:', e));

// Testar login
fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@conectsuite.com.br',
    password: 'admin123'
  })
})
  .then(r => r.json())
  .then(d => console.log('✅ Login:', d.success ? 'OK' : 'FALHOU'))
  .catch(e => console.error('❌ Login FALHOU:', e.message));
```

**O que verificar:**
- ✅ `Backend OK: 404` = Backend está rodando (404 é esperado na raiz)
- ✅ `Login: OK` = Autenticação funcionando
- ❌ `Backend FALHOU` = Backend não está acessível

---

## 🌐 SOLUÇÕES ESPECÍFICAS POR NAVEGADOR

### Chrome/Edge
1. `F12` → **Application** tab
2. **Storage** → **Clear site data**
3. **Service Workers** → **Unregister** (se existir)
4. **Hard Reload**: `Ctrl + Shift + R`

**Alternativa**: `chrome://settings/clearBrowserData`
- Selecione **"All time"**
- Marque **"Cached images and files"**
- Click **"Clear data"**

### Firefox
1. `F12` → **Storage** tab
2. **Local Storage** → **Limpar tudo**
3. Click no escudo 🛡️ → **Turn off protection for this site**
4. **Hard Reload**: `Ctrl + Shift + R`

**Alternativa**: `about:preferences#privacy`
- **Cookies and Site Data** → **Clear Data**

---

## 🚨 SE NADA FUNCIONAR

### Opção 1: Modo Anônimo
- **Chrome/Edge**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`
- Acessar: `http://localhost:3000`

### Opção 2: Reiniciar Tudo
```powershell
# 1. Limpar DNS
ipconfig /flushdns

# 2. Verificar se backend está rodando
Get-NetTCPConnection -LocalPort 3001

# 3. Se não estiver, iniciar:
cd C:\Projetos\conectcrm\backend
npm run start:dev

# 4. Novo terminal - Frontend:
cd C:\Projetos\conectcrm\frontend-web
npm start
```

### Opção 3: Verificar Extensões
Desabilitar temporariamente:
- AdBlock / uBlock Origin
- Privacy Badger
- NoScript
- HTTPS Everywhere

---

## ✅ CHECKLIST DE RESOLUÇÃO

- [ ] Executei script de limpeza no Console
- [ ] Fiz Hard Reload (Ctrl+Shift+R)
- [ ] Limpei Service Workers (F12 → Application)
- [ ] Testei conectividade com backend
- [ ] Desabilitei extensões temporariamente
- [ ] Testei em modo anônimo
- [ ] Verifiquei se backend está rodando
- [ ] Limpei cache do navegador (settings)

---

## 📊 COMPARAÇÃO

| Item | Opera (✅ Funciona) | Outros (❌ Não) |
|------|---------------------|-----------------|
| LocalStorage | authToken válido | Token ausente/expirado |
| Service Worker | Não registrado | Pode estar em cache |
| Cache | Limpo/atualizado | Desatualizado |
| CORS | Aceito | Pode estar bloqueado |
| Extensões | Não bloqueiam | Podem bloquear |

---

## 🎯 RESUMO

**Problema**: Cache/Storage diferente entre navegadores.

**Solução**: Limpar LocalStorage, Cache e Service Workers.

**Se persistir**: Modo anônimo ou verificar extensões bloqueando requisições.
