@echo off
echo Iniciando a API (Backend)...
start cmd /k "cd backend\Bolao.Copa2026.API && dotnet run"

echo.
echo Iniciando o Frontend...
start cmd /k "npm run dev"

echo.
echo Aguardando a API (Backend) ficar pronta...
:WAIT_API
curl -s -I http://localhost:5000/swagger > NUL
if %ERRORLEVEL% NEQ 0 (
    timeout /t 2 /nobreak > NUL
    goto WAIT_API
)

echo.
echo Aguardando o Frontend ficar pronto...
:WAIT_FRONT
curl -s -I http://localhost:3000 > NUL
if %ERRORLEVEL% NEQ 0 (
    timeout /t 2 /nobreak > NUL
    goto WAIT_FRONT
)

echo.
echo Abrindo o navegador...
start http://localhost:3000
start http://localhost:3000/bolao-adm

echo Abrindo o Swagger...
start http://localhost:5000/swagger

echo Ambos os servicos foram iniciados!
