# Release com Smoke ADM-303 (Pos-Deploy)

## Objetivo
Executar o smoke de break-glass (ADM-303) imediatamente apos o deploy para validar login/admin-bff/fluxo emergencial no ambiente alvo.

## Opcoes disponiveis
- Script principal: `.production/scripts/release-azure-vm.ps1`
- Wrapper (perfil local): `.production/scripts/release-production.ps1`

## Parametros do smoke
- `-RunAdm303Smoke`
- `-Adm303BaseUrl`
- `-Adm303RequesterEmail`
- `-Adm303RequesterPassword`
- `-Adm303ApproverEmail`
- `-Adm303ApproverPassword`
- `-Adm303TargetEmail`
- `-Adm303TargetPassword`

Opcional (MFA manual):
- `-Adm303RequesterMfaCode`
- `-Adm303ApproverMfaCode`
- `-Adm303TargetMfaCode`

Opcional:
- `-Adm303SkipTargetAccessCheck`

## Exemplo com wrapper
```powershell
.\.production\scripts\release-production.ps1 `
  -ProfileName production `
  -AllowDirtyWorktree `
  -SkipPreflight `
  -Execute `
  -RunAdm303Smoke `
  -Adm303BaseUrl "https://api.conect360.com" `
  -Adm303RequesterEmail "<requester@email>" `
  -Adm303RequesterPassword "<senha>" `
  -Adm303ApproverEmail "<approver@email>" `
  -Adm303ApproverPassword "<senha>" `
  -Adm303TargetEmail "<target@email>" `
  -Adm303TargetPassword "<senha>"
```

## Exemplo direto (sem wrapper)
```powershell
.\.production\scripts\release-azure-vm.ps1 `
  -ProfileName production `
  -AllowDirtyWorktree `
  -SkipPreflight `
  -Execute `
  -RunAdm303Smoke `
  -Adm303BaseUrl "https://api.conect360.com" `
  -Adm303RequesterEmail "<requester@email>" `
  -Adm303RequesterPassword "<senha>" `
  -Adm303ApproverEmail "<approver@email>" `
  -Adm303ApproverPassword "<senha>" `
  -Adm303TargetEmail "<target@email>" `
  -Adm303TargetPassword "<senha>"
```

## Evidencias esperadas
- `docs/features/evidencias/ADM303_SMOKE_<timestamp>.json`
- `docs/features/evidencias/ADM303_SMOKE_<timestamp>.md`
