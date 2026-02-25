# 🚀 Comandos Rápidos - Debug e Teste

## 🔍 1. Verificar Status do Backend

```powershell
# Testar se backend está respondendo
Invoke-WebRequest -Uri 'http://localhost:3001/api-docs' -Method GET

# Se retornar 200 = Backend está ativo ✅
```

---

## 🔐 2. Fazer Login e Obter Token

```powershell
cd C:\Projetos\conectcrm

$body = @{ 
    email = 'teste.triagem@test.com'
    senha = 'teste123' 
} | ConvertTo-Json

$response = Invoke-RestMethod -Method POST -Uri 'http://localhost:3001/auth/login' -Body $body -ContentType 'application/json'
$token = $response.data.access_token

Write-Host "Token: $token" -ForegroundColor Green
```

---

## 🧪 3. Testar GET /nucleos

```powershell
# Com o $token da etapa anterior:

try {
    $nucleos = Invoke-RestMethod -Method GET -Uri 'http://localhost:3001/nucleos' -Headers @{ "Authorization" = "Bearer $token" }
    Write-Host "✅ SUCESSO! $($nucleos.Count) núcleos retornados" -ForegroundColor Green
    $nucleos | Format-Table nome, descricao, canais, ativo
} catch {
    Write-Host "❌ ERRO 500" -ForegroundColor Red
    Write-Host "Verificar logs no terminal 'Start Backend (Nest 3001)'" -ForegroundColor Yellow
}
```

---

## 📊 4. Verificar Database

```powershell
$env:PGPASSWORD='conectcrm123'
psql -h localhost -p 5434 -U conectcrm -d conectcrm_db

# Dentro do psql:
SELECT id, nome, empresa_id, canais FROM nucleos_atendimento LIMIT 5;
```

---

## 🔧 5. Recompilar Backend (se necessário)

```powershell
cd C:\Projetos\conectcrm\backend
npm run build

# Depois reiniciar a tarefa no VS Code:
# Ctrl+Shift+P → Tasks: Restart Running Task → Start Backend (Nest 3001)
```

---

## 🧹 6. Limpar e Reiniciar Tudo

```powershell
# Matar todos processos Node
taskkill /F /IM node.exe /T

# Recompilar
cd C:\Projetos\conectcrm\backend
npm run build

# Iniciar tarefa novamente
# No VS Code: Ctrl+Shift+P → Tasks: Run Task → Start Backend (Nest 3001)
```

---

## 🎯 7. Teste Completo dos 25 Endpoints

```powershell
cd C:\Projetos\conectcrm
powershell -ExecutionPolicy Bypass -File .\test-api.ps1
```

---

## 📝 8. Ver Logs em Tempo Real

No VS Code:
1. Abra o terminal **"Start Backend (Nest 3001)"**
2. Execute qualquer teste
3. Logs devem aparecer com `[DEBUG NUCLEO]`

Se não aparecer nada:
- Backend pode não estar usando o código recompilado
- Reinicie a tarefa

---

## 🔍 9. Buscar Logs Específicos

```powershell
# No terminal do backend, procurar por:
# - [DEBUG NUCLEO]
# - Error:
# - QueryFailedError
# - column does not exist
```

---

## 🔤 10. Verificar Encoding (UTF-8)

Use este passo quando aparecerem textos quebrados por encoding incorreto.

```powershell
cd C:\Projetos\conectcrm

# Verificar tudo (frontend-web/src e backend/src)
npm run check:encoding -- --all

# Verificar apenas arquivos específicos (exemplos)
node scripts\checkEncoding.js frontend-web\src\pages\LeadsPage.tsx
node scripts\checkEncoding.js backend\src\main.ts
```

---

## ✅ 11. Se Tudo Funcionar

```powershell
Write-Host "
🎉 SUCESSO! Backend MVP Funcionando!

Próximos passos:
1. Testar todos 25 endpoints (test-api.ps1)
2. Criar página Gestão de Núcleos (React)
3. Criar página Gestão de Fluxos (React)
4. Integrar webhook WhatsApp
" -ForegroundColor Green
```

---

## 🆘 11. Se Continuar com Erro 500

### Opção A: Ver Stack Trace Completo

No terminal onde executou o teste, adicione:
```powershell
try {
    Invoke-RestMethod -Method GET -Uri 'http://localhost:3001/nucleos' -Headers @{ "Authorization" = "Bearer $token" }
} catch {
    Write-Host $_.Exception.ToString() -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
}
```

### Opção B: Habilitar Logs Verbose no NestJS

Editar `backend/src/main.ts`:
```typescript
app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
```

### Opção C: Testar Query Direto no Database

```sql
-- No psql:
SELECT * FROM nucleos_atendimento 
WHERE empresa_id = (SELECT id FROM empresas LIMIT 1)
ORDER BY prioridade ASC, nome ASC;

-- Se retornar resultados = Database OK
-- Se falhar = Problema no schema
```

---

## 📞 Contatos Úteis

- **Porta Backend:** 3001
- **Porta Database:** 5434  
- **User Teste:** teste.triagem@test.com
- **Senha:** teste123
- **Database:** conectcrm_db

---

**Última Atualização:** 16/10/2025 14:52
