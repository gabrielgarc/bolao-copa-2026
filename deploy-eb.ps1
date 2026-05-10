param (
    [string]$Version = ""
)

if ([string]::IsNullOrWhiteSpace($Version)) {
    $Version = Read-Host "Digite a versao para o deploy (ex: v1.0.8)"
}

if ([string]::IsNullOrWhiteSpace($Version)) {
    Write-Host "A versao nao pode ser vazia." -ForegroundColor Red
    exit 1
}

$BucketName = "elasticbeanstalk-us-east-1-569931622417"
$S3Key = "deployments/bolao-2026-$Version.zip"
$AppName = "bolao-2026"
$EnvId = "e-kdpds6mvrt"
$ZipName = "backend-deploy.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Iniciando Deploy para o Elastic Beanstalk" -ForegroundColor Cyan
Write-Host " App: $AppName" -ForegroundColor Cyan
Write-Host " Env: $EnvId" -ForegroundColor Cyan
Write-Host " Version: $Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Entra na pasta do backend
Push-Location "backend\Bolao.Copa2026.API"

Write-Host "`n[1/5] Publicando o projeto .NET..." -ForegroundColor Yellow
dotnet publish -c Release -o publish
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no dotnet publish." -ForegroundColor Red
    Pop-Location
    exit $LASTEXITCODE
}

Write-Host "`n[2/5] Criando o arquivo ZIP com o formato correto (tar.exe)..." -ForegroundColor Yellow
if (Test-Path $ZipName) {
    Remove-Item $ZipName -Force
}
Push-Location publish
tar.exe -a -cf "../$ZipName" *
Pop-Location

Write-Host "`n[3/5] Fazendo upload para o S3 (s3://$BucketName/$S3Key)..." -ForegroundColor Yellow
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" s3 cp $ZipName "s3://$BucketName/$S3Key"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no upload para o S3." -ForegroundColor Red
    Pop-Location
    exit $LASTEXITCODE
}

Write-Host "`n[4/5] Registrando nova versao no Elastic Beanstalk..." -ForegroundColor Yellow
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" elasticbeanstalk create-application-version --application-name $AppName --version-label $Version --source-bundle S3Bucket="$BucketName",S3Key="$S3Key"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Aviso: Pode ser que a versao ja exista, tentando continuar..." -ForegroundColor DarkYellow
}

Write-Host "`n[5/5] Disparando atualizacao do ambiente..." -ForegroundColor Yellow
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" elasticbeanstalk update-environment --environment-id $EnvId --version-label $Version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao atualizar o ambiente. Verifique o console da AWS para detalhes." -ForegroundColor Red
    Pop-Location
    exit $LASTEXITCODE
}

# Volta pra raiz
Pop-Location

Write-Host "`n[SUCESSO] Deploy disparado! O Beanstalk ja esta aplicando a nova versao." -ForegroundColor Green
Write-Host "Acompanhe o status pelo painel da AWS ou usando 'aws elasticbeanstalk describe-environments --environment-ids $EnvId'" -ForegroundColor Green
