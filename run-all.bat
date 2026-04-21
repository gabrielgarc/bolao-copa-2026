@echo off
echo Iniciando a API (Backend)...
start cmd /k "cd backend\Bolao.Copa2026.API && dotnet run"

echo.
echo Iniciando o Frontend...
start cmd /k "npm run dev"

echo.
echo Aguardando os servicos iniciarem...
timeout /t 4 /nobreak > NUL

echo Abrindo o navegador no localhost certo...
start http://localhost:3000

echo Abrindo o Swagger...
start http://localhost:5000/swagger

echo Ambos os servicos foram iniciados!
