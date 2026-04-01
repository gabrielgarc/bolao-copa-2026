@echo off
echo Iniciando a API (Backend)...
start cmd /k "cd backend\Bolao.Copa2026.API && dotnet run"

echo.
echo Iniciando o Frontend...
start cmd /k "npm run dev"

echo.
echo Ambos os servicos foram iniciados em novas janelas!
