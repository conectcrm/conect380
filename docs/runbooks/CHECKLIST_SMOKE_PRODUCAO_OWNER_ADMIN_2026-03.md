# Checklist Smoke Producao Owner/Admin (2026-03)

## Objetivo
Validar rapidamente se a producao esta saudavel e se o acesso administrativo da empresa proprietaria esta funcionando com as regras endurecidas.

## Script oficial
`/.production/scripts/smoke-production-owner-admin.ps1`

## 1) Smoke publico (sem login)
Executa health, app, guardian, CORS e branding publico.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .production/scripts/smoke-production-owner-admin.ps1 -SkipAuthChecks
```

Esperado:
- `API health` PASS
- `App url responde` PASS
- `Guardian url responde` PASS
- `CORS app -> admin/system-branding` PASS
- `CORS guardian -> admin/system-branding` PASS
- `Branding publico` PASS

## 2) Smoke autenticado (superadmin)
Executa login, valida endpoint admin branding e admin companies.

Sem MFA (quando nao exigido):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .production/scripts/smoke-production-owner-admin.ps1 `
  -SuperAdminEmail "SEU_EMAIL_SUPERADMIN" `
  -SuperAdminPassword "SUA_SENHA"
```

Com MFA (quando exigido):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .production/scripts/smoke-production-owner-admin.ps1 `
  -SuperAdminEmail "SEU_EMAIL_SUPERADMIN" `
  -SuperAdminPassword "SUA_SENHA" `
  -SuperAdminMfaCode "123456"
```

Opcional (conferir tenant proprietario esperado):

```powershell
  -ExpectedOwnerEmpresaId "250cc3ac-617b-4d8b-be6e-b14901e4edde"
```

Esperado:
- `Login superadmin` PASS
- `Admin branding autenticado` PASS
- `Admin bff companies autenticado` PASS

## 3) Leitura rapida de erros comuns
- Falha em `CORS ... admin/system-branding`:
  - Ajustar `CORS_ORIGINS` para incluir `https://conect360.com`, `https://www.conect360.com`, `https://guardian.conect360.com`.
- Falha `401` no login/admin:
  - Credencial invalida, token expirado, MFA pendente, ou usuario sem papel/permissao correta.
- Falha `403` em endpoints admin:
  - Usuario fora da empresa proprietaria ou sem `admin.empresas.manage`.
  - Conferir `PLATFORM_OWNER_EMPRESA_IDS` e `PLATFORM_OWNER_ENFORCE_WHEN_EMPTY=true`.
- Falha `413` no update/upload de branding:
  - Aumentar limite de payload (`REQUEST_BODY_LIMIT`) e revisar `client_max_body_size` no Nginx da API.

## 4) Observacao
Erro `chrome-extension://... Unexpected token 'export'` no console e de extensao do navegador, nao do sistema.
