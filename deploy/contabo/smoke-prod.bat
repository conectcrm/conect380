@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PROFILE_PATH=%SCRIPT_DIR%deploy-profile.local.psd1"
set "SCRIPT_PATH=%SCRIPT_DIR%smoke-prod.ps1"

if not exist "%SCRIPT_PATH%" (
  echo [ERRO] Script nao encontrado: %SCRIPT_PATH%
  exit /b 1
)

if not exist "%PROFILE_PATH%" (
  echo [ERRO] Perfil nao encontrado: %PROFILE_PATH%
  echo Copie deploy-profile.example.psd1 para deploy-profile.local.psd1 e ajuste os dados.
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -ProfilePath "%PROFILE_PATH%" %*
exit /b %ERRORLEVEL%

