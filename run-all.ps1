Write-Host "Iniciando a API (Backend)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend\Bolao.Copa2026.API; dotnet run`""

Write-Host "Iniciando o Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"npm run dev`""

Write-Host "Aguardando os serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

Write-Host "Abrindo o navegador no localhost certo..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "Abrindo o Swagger..." -ForegroundColor Green
Start-Process "http://localhost:5000/swagger"

Write-Host "Ambos os serviços foram iniciados!" -ForegroundColor Cyan
