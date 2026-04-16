@echo off
:: Verifica se tem privilégios de Admin
NET SESSION >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ------------------------------------------------------------
    echo ERRO: VOCE PRECISA EXECUTAR ESTE ARQUIVO COMO ADMINISTRADOR!
    echo Clique com o botao direito e escolha 'Executar como Administrador'.
    echo ------------------------------------------------------------
    pause
    exit /b 1
)

echo Ativando regras de firewall do GiantAnimator...

netsh advfirewall firewall set rule name="GiantAnimator_Server" new enable=yes
netsh advfirewall firewall set rule name="GiantAnimator_Studio" new enable=yes
netsh advfirewall firewall set rule name="GiantAnimator_8080" new enable=yes
netsh advfirewall firewall set rule name="GiantAnimator-Server" new enable=yes

echo.
echo Verificando status...
netsh advfirewall firewall show rule name="GiantAnimator_Server" | findstr "Habilitado"

echo.
echo Se o status acima for "Sim", o acesso esta liberado!
pause
