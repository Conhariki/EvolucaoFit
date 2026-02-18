# Script para restaurar backup do banco de dados
param(
    [Parameter(Mandatory=$true)]
    [string]$backupFile
)

# Verificar se o arquivo de backup existe
if (-not (Test-Path $backupFile)) {
    Write-Host "Arquivo de backup não encontrado: $backupFile"
    exit 1
}

# Ler variáveis de ambiente do arquivo .env
$envContent = Get-Content .env
$dbUrl = ($envContent | Where-Object { $_ -match "DATABASE_URL" }).Split("=")[1]

# Extrair informações do banco de dados da URL
$dbUrl = $dbUrl.Trim('"')
$dbInfo = $dbUrl -replace "postgresql://", ""
$dbParts = $dbInfo.Split("@")
$credentials = $dbParts[0].Split(":")
$hostParts = $dbParts[1].Split("/")
$host = $hostParts[0]
$dbName = $hostParts[1]

# Confirmar com o usuário
Write-Host "ATENÇÃO: Esta operação irá substituir todos os dados atuais do banco de dados."
Write-Host "Tem certeza que deseja continuar? (S/N)"
$confirmation = Read-Host

if ($confirmation -ne "S") {
    Write-Host "Operação cancelada pelo usuário."
    exit 0
}

# Executar restauração usando pg_restore
Write-Host "Iniciando restauração do banco de dados..."
pg_restore -h $host -U $credentials[0] -d $dbName -c $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restauração concluída com sucesso!"
} else {
    Write-Host "Erro ao restaurar backup"
} 