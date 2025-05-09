# Script de backup do banco de dados
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupDir = "backups"
$backupFile = "$backupDir\backup_$date.sql"

# Criar diretório de backup se não existir
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
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

# Executar backup usando pg_dump
Write-Host "Iniciando backup do banco de dados..."
pg_dump -h $host -U $credentials[0] -d $dbName -F c -f $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup concluído com sucesso: $backupFile"
    
    # Manter apenas os últimos 7 backups
    Get-ChildItem $backupDir -Filter "backup_*.sql" | 
    Sort-Object CreationTime -Descending | 
    Select-Object -Skip 7 | 
    Remove-Item -Force
} else {
    Write-Host "Erro ao realizar backup"
} 