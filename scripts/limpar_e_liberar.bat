@echo off
NET SESSION >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ------------------------------------------------------------
    echo ERRO: VOCE PRECISA EXECUTAR ESTE ARQUIVO COMO ADMINISTRADOR!
    echo ------------------------------------------------------------
    pause
    exit /b 1
)

echo Removendo regras antigas que podem estar conflitando...
netsh advfirewall firewall delete rule name=all genselect="GiantAnimator"

echo.
echo Criando regra limpa para o PROCESSO do servidor (mais robusto)...
powershell -Command "New-NetFirewallRule -DisplayName 'GiantAnimator_Network' -Program 'C:\Program Files\nodejs\node.exe' -Direction Inbound -Action Allow -Enabled True -Profile Any"

echo.
echo ✅ Ambiente limpo e porta liberada via processo!
echo Tente dar F5 no outro computador agora.
pause
