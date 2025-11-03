# ⚠️ AÇÃO NECESSÁRIA: Reiniciar Backend Manualmente

## 🎯 Situação

O código para **baixar áudios do WhatsApp** foi implementado com sucesso, MAS o backend precisa ser reiniciado para carregar o novo código.

**Erro atual:** URLs do WhatsApp (`lookaside.fbsbx.com`) expiram em 1 hora.  
**Solução implementada:** Download automático ao receber webhook.

---

## 🚀 Como Reiniciar o Backend (PASSO A PASSO)

### Opção 1: PowerShell (Recomendado)

```powershell
# 1. Matar processos node antigos
Get-Process -Name node | Stop-Process -Force

# 2. Navegar para pasta do backend
cd c:\Projetos\conectcrm\backend

# 3. Build (compilar código novo)
npm run build

# 4. Iniciar backend
npm run start:dev
```

### Opção 2: VS Code Terminal

1. Abrir terminal no VS Code (Ctrl + `)
2. Executar:
   ```bash
   cd backend
   npm run build
   npm run start:dev
   ```

### Opção 3: Restart do Sistema (se tiver problemas)

1. Fechar VS Code completamente
2. Abrir PowerShell como Administrador
3. Executar:
   ```powershell
   Get-Process -Name node, Code | Stop-Process -Force
   ```
4. Reabrir VS Code
5. Executar Opção 1

---

## ✅ Como Verificar Se Funcinou

### 1. Logs do Backend

Ao iniciar, procure por:
```
✅ [NestJS] AppModule criado com sucesso
🚀 Servidor rodando na porta 3001
```

### 2. Enviar Áudio de Teste

1. Enviar áudio pelo WhatsApp Business
2. Ver logs no backend:
   ```
   🎵 Detectado áudio/mídia temporária do WhatsApp - baixando...
   📥 Baixando mídia do WhatsApp: https://lookaside.fbsbx.com/...
   ✅ Mídia baixada e salva: C:\Projetos\conectcrm\backend\uploads\atendimento\whatsapp-...
   ```

### 3. Verificar Arquivo Salvo

```powershell
Get-ChildItem c:\Projetos\conectcrm\backend\uploads\atendimento\whatsapp-*.ogg
```

Deve listar os áudios baixados!

### 4. Testar no Frontend

1. Abrir chat no frontend
2. Clicar em play no áudio
3. **Deve reproduzir normalmente** (sem erro "Format error")

---

## 🐛 Troubleshooting

### Problema: "EADDRINUSE: port 3001 already in use"

**Solução:**
```powershell
# Matar processo na porta 3001
Get-Process -Name node | Where-Object { 
  (Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 3001 
} | Stop-Process -Force

# Tentar novamente
cd c:\Projetos\conectcrm\backend
npm run start:dev
```

### Problema: Backend para de inicializar (trava em "query: SELECT version()")

**Causa:** Problema de conexão com PostgreSQL

**Solução:**
1. Verificar se PostgreSQL está rodando:
   ```powershell
   Get-Service -Name postgresql*
   ```
2. Se não estiver, iniciar:
   ```powershell
   Start-Service postgresql-x64-15  # Ajustar nome se necessário
   ```
3. Reiniciar backend

### Problema: Erro "Cannot find module 'axios'"

**Causa:** Dependências não instaladas

**Solução:**
```powershell
cd c:\Projetos\conectcrm\backend
npm install
npm run build
npm run start:dev
```

### Problema: TypeScript compilation errors

**Solução:**
```powershell
cd c:\Projetos\conectcrm\backend
# Limpar dist
Remove-Item -Recurse -Force dist

# Reinstalar e recompilar
npm install
npm run build
```

---

## 📊 O Que Mudou no Código

### Arquivo: `backend/src/modules/atendimento/services/mensagem.service.ts`

#### 1. Novo Método: `baixarMidiaWhatsApp()`

```typescript
/**
 * 🎵 Baixa áudio/mídia da URL temporária do WhatsApp e salva localmente
 */
async baixarMidiaWhatsApp(
  midiaWhatsApp: any,
  tipoMidia: 'audio' | 'image' | 'video' | 'document' = 'audio',
): Promise<{ caminhoLocal: string; tipo: string; nome: string } | null>
```

**O que faz:**
- Detecta URLs do Facebook (`lookaside.fbsbx.com`)
- Baixa arquivo via axios
- Salva em `backend/uploads/atendimento/`
- Retorna caminho local

#### 2. Método `salvar()` Modificado

**Antes:**
```typescript
const mensagem = this.mensagemRepository.create({
  midia: dados.midia,  // URL temporária direto
});
```

**Depois:**
```typescript
// Detecta URL temporária
if (dados.midia?.url && dados.midia.url.includes('lookaside.fbsbx.com')) {
  // Baixa arquivo ANTES de salvar
  const midiaLocal = await this.baixarMidiaWhatsApp(dados.midia);
  
  // Substitui URL por caminho local
  midiaFinal = {
    ...dados.midia,
    caminhoAnexo: midiaLocal.caminhoLocal,  // ⬅️ ARQUIVO LOCAL
    urlOriginal: dados.midia.url,  // Mantém original para referência
  };
}

const mensagem = this.mensagemRepository.create({
  midia: midiaFinal,  // ⬅️ AGORA TEM CAMINHO LOCAL
});
```

---

## 🎉 Resultado Esperado

### Antes (❌)
```
ChatArea.tsx:210 ❌ [AudioPlayer] Error code: 4
ChatArea.tsx:211 ❌ [AudioPlayer] Error message: MEDIA_ELEMENT_ERROR: Format error
```

### Depois (✅)
```
Backend logs:
🎵 Detectado áudio/mídia temporária do WhatsApp - baixando...
✅ Mídia baixada e salva: ...\whatsapp-1729450000000-abc123.ogg

Frontend:
[Player reproduz normalmente sem erro]
```

---

##  Próximos Passos

1. ✅ Código implementado
2. ⏳ **VOCÊ ESTÁ AQUI** → Reiniciar backend manualmente
3. ⏳ Enviar áudio de teste
4. ⏳ Verificar logs
5. ⏳ Confirmar reprodução no frontend

---

**Data:** 20 de outubro de 2025, 13:45  
**Status:** ⏳ Aguardando reinício manual do backend  
**Prioridade:** 🔴 CRÍTICO - Código pronto, precisa apenas reiniciar!
