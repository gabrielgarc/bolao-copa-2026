Write-Host "Iniciando a API (Backend)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend\Bolao.Copa2026.API; dotnet run`""

Write-Host "Iniciando o Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"npm run dev`""

Write-Host "Ambos os serviços foram iniciados em novas janelas!" -ForegroundColor Cyan
