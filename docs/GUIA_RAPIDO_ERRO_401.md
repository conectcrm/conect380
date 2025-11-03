# ⚡ GUIA RÁPIDO: Resolver Erro 401 WhatsApp

**Erro:** `Token de acesso inválido ou expirado`  
**Status Code:** 401 Unauthorized  
**Tempo de solução:** 2-5 minutos

---

## 🔴 O PROBLEMA

Seu **Access Token do Meta Business API expirou**!

- **Temporary Tokens** expiram em **24 horas** ⏰
- Você configurou ontem → Hoje já expirou
- Backend retorna: `401 Unauthorized`

---

## ✅ SOLUÇÃO RÁPIDA (2 minutos)

### 1️⃣ Obter Novo Token

Acesse: https://developers.facebook.com/

1. **Meus Aplicativos** → [Seu App WhatsApp]
2. Menu lateral: **WhatsApp** → **API Setup**
3. Procure: **"Temporary access token"**
4. Clique: **"Generate Token"** 🔄
5. ✅ **Copie o token** (começa com `EAA...`)

### 2️⃣ Atualizar Token

**Escolha uma opção:**

#### 🅰️ Via Script (Mais Rápido)

```powershell
.\atualizar-token-whatsapp.ps1
```

Cole o token quando solicitado → Pronto! ✅

#### 🅱️ Via Frontend

1. http://localhost:3000
2. **Configurações** → **Integrações** → **WhatsApp**
3. Cole o novo token
4. ☑ **"Ativar este canal"**
5. **SALVAR**

### 3️⃣ Testar

No frontend, clique em **"Testar Mensagem"**

✅ Deve funcionar!

---

## 🔄 PARA NÃO REPETIR TODO DIA

Use **System User Token** (não expira):

📖 Leia: `docs/RESOLVER_ERRO_401_WHATSAPP.md`  
→ Seção: **"OPÇÃO 2: Usar System User Token"**

---

## 📋 CHECKLIST

- [ ] Gerar novo token no Meta
- [ ] Atualizar via script OU frontend
- [ ] ✅ **ATIVAR o canal** (importante!)
- [ ] Testar mensagem
- [ ] (Opcional) Migrar para System User Token

---

## 🆘 AINDA COM ERRO?

### Verificar se canal está ativo:

```powershell
$env:PGPASSWORD='conectcrm123'
psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -c "SELECT nome, ativo, status FROM canais WHERE tipo = 'whatsapp';"
```

Deve mostrar: `ativo: t` e `status: ATIVO`

### Se ainda estiver inativo:

```sql
UPDATE canais 
SET ativo = true, status = 'ATIVO' 
WHERE tipo = 'whatsapp';
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Guia completo:** `docs/RESOLVER_ERRO_401_WHATSAPP.md`
- **Script:** `atualizar-token-whatsapp.ps1`
- **Webhook:** `docs/TESTE_WEBHOOK_WHATSAPP.md`

---

**Problema resolvido em 2 minutos!** ⚡
