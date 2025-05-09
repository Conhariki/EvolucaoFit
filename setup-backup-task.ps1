# Script para configurar tarefa agendada de backup
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PSScriptRoot\backup.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

# Criar a tarefa agendada
Register-ScheduledTask -TaskName "DatabaseBackup" -Action $action -Trigger $trigger -Settings $settings -Description "Backup diário do banco de dados" -Force

Write-Host "Tarefa agendada de backup configurada com sucesso!"
Write-Host "O backup será executado diariamente às 2:00 AM" 