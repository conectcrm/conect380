# 🔇 Desabilitar TODOS os Logs DEBUG

## Problema
Mesmo com `DEBUG` flag, os logs aparecem porque estamos em `NODE_ENV=development`.

## Solução
Substituir **TODOS** os `const DEBUG = process.env.NODE_ENV === 'development'` por `const DEBUG = false`.

---

## Arquivos para Corrigir

### 1️⃣ useWebSocket.ts
```typescript
// ❌ ANTES
const DEBUG = process.env.NODE_ENV === 'development';

// ✅ DEPOIS
const DEBUG = false; // 🔇 Logs desabilitados
```

### 2️⃣ useAtendimentos.ts
```typescript
const DEBUG = false; // 🔇 Logs desabilitados
```

### 3️⃣ useMensagens.ts
```typescript
const DEBUG = false; // 🔇 Logs desabilitados
```

### 4️⃣ api.ts
```typescript
const DEBUG = false; // 🔇 Logs desabilitados
```

### 5️⃣ AtendimentosSidebar.tsx
Remover **COMPLETAMENTE** o useEffect de debug (linhas 63-91)

### 6️⃣ ChatOmnichannel.tsx
```typescript
const DEBUG = false; // 🔇 Logs desabilitados
```

### 7️⃣ atendimentoService.ts
```typescript
const DEBUG = false; // 🔇 Logs desabilitados
```

### 8️⃣ useContextoCliente.ts
```typescript
const DEBUG = false; // 🔇 Logs desabilitados
```

---

## Comando Rápido (PowerShell)

```powershell
cd C:\Projetos\conectcrm\frontend-web\src

# Substituir todas as ocorrências
Get-ChildItem -Recurse -Include *.ts,*.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace "const DEBUG = process\.env\.NODE_ENV === 'development';", "const DEBUG = false; // 🔇 Logs desabilitados"
    
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "✅ Atualizado: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Todos os logs DEBUG desabilitados!" -ForegroundColor Cyan
```

---

## Resultado Esperado

Console **LIMPO**:
```
✅ WebSocket conectado! ID: abc123
✅ 1 tickets carregados
✅ Mensagem enviada
```

**SEM** logs verbose:
```
❌ 🔍 [AuthContext] Inicializando autenticação...
❌ 🎯 [ATENDIMENTO] empresaId adicionado automaticamente
❌ 💬 [ATENDIMENTO] Enviando requisição
❌ 🎫 [AtendimentosSidebar] Total de tickets recebidos
❌ 📊 [AtendimentosSidebar] Tab ativa
❌ 🔥 [DEBUG] Evento recebido
```

---

## Alternativa: Criar Variável de Ambiente

Se quiser **reativar** logs no futuro:

```env
# .env.local
REACT_APP_DEBUG_LOGS=false
```

```typescript
const DEBUG = process.env.REACT_APP_DEBUG_LOGS === 'true';
```

---

**Executar agora?** `powershell -File C:\Projetos\conectcrm\desabilitar-logs.ps1`
