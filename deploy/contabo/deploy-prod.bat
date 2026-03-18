@echo off
setlocal EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "PROFILE_PATH=%SCRIPT_DIR%deploy-profile.local.psd1"
set "SCRIPT_PATH=%SCRIPT_DIR%deploy-prod.ps1"
set "MODE=run"

if /I "%~1"=="start" (
  set "MODE=start"
  shift
) else if /I "%~1"=="status" (
  set "MODE=status"
  shift
) else if /I "%~1"=="wait" (
  set "MODE=wait"
  shift
) else if /I "%~1"=="run" (
  set "MODE=run"
  shift
)

set "FORWARDED_ARGS="
:collect_args
if "%~1"=="" goto args_collected
set "FORWARDED_ARGS=!FORWARDED_ARGS! "%~1""
shift
goto collect_args
:args_collected

if not exist "%SCRIPT_PATH%" (
  echo [ERRO] Script nao encontrado: %SCRIPT_PATH%
  exit /b 1
)

if /I not "%MODE%"=="status" if /I not "%MODE%"=="wait" (
  if not exist "%PROFILE_PATH%" (
    echo [ERRO] Perfil nao encontrado: %PROFILE_PATH%
    echo Copie deploy-profile.example.psd1 para deploy-profile.local.psd1 e ajuste os dados.
    exit /b 1
  )

  powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -Mode %MODE% -ProfilePath "%PROFILE_PATH%" !FORWARDED_ARGS!
  exit /b %ERRORLEVEL%
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -Mode %MODE% !FORWARDED_ARGS!
exit /b %ERRORLEVEL%
