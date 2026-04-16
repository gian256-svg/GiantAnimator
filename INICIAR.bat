@echo off
chcp 65001 >nul
title GiantAnimator - Startup
color 0A

echo.
echo ==========================================
echo           GIANTANIMATOR
echo ==========================================
echo.

set PORT=3000
set ROOT_DIR=%~dp0
set SERVER_DIR=%~dp0server
set LOGS_DIR=%~dp0logs
set INPUT_DIR=%~dp0input
set OUTPUT_DIR=%~dp0output
set MAX_WAIT=60

if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if not exist "%INPUT_DIR%" mkdir "%INPUT_DIR%"
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao encontrado!
    pause
    exit /b 1
)

echo [2/5] Verificando dependencias...
if not exist "%SERVER_DIR%\node_modules" (
    echo Instalando dependencias...
    pushd "%SERVER_DIR%"
    call npm install
    popd
)

echo [3/5] Liberando porta %PORT%...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo [4/5] Iniciando servidor...
if exist "%LOGS_DIR%\server.log" del "%LOGS_DIR%\server.log"
pushd "%SERVER_DIR%"
start "GiantAnimator-Server" /min cmd /c "node_modules\.bin\ts-node --transpile-only index.ts > "%LOGS_DIR%\server.log" 2>&1"
popd

echo [5/5] Aguardando Health Check...
set WAITED=0

:WAIT_LOOP
timeout /t 2 /nobreak >nul
set /a WAITED+=2

powershell -NoProfile -Command "try{$r=Invoke-WebRequest -Uri 'http://localhost:%PORT%/health' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -eq 200){exit 0} else {exit 1}}catch{exit 1}" >nul 2>&1

if %ERRORLEVEL%==0 (
    goto :SERVER_READY
)

if %WAITED% LSS %MAX_WAIT% (
    echo Aguardando... %WAITED%s
    goto :WAIT_LOOP
)

echo ERRO: O servidor nao iniciou. Verifique server.log.
pause
exit /b 1

:SERVER_READY
echo OK: Servidor pronto!
echo.
echo Servidor: http://localhost:%PORT%
echo Entrada:  %INPUT_DIR%
echo Logs:     %LOGS_DIR%\server.log
echo.
pause
