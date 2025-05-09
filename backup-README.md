# Sistema de Backup do Banco de Dados

Este sistema realiza backups automáticos do banco de dados PostgreSQL e permite a restauração quando necessário.

## Arquivos

- `backup.ps1`: Script para realizar o backup do banco de dados
- `restore.ps1`: Script para restaurar um backup
- `setup-backup-task.ps1`: Script para configurar a tarefa agendada de backup

## Configuração

1. Certifique-se de ter o PostgreSQL instalado e as ferramentas `pg_dump` e `pg_restore` disponíveis no PATH
2. Execute o script de configuração como administrador:
   ```powershell
   .\setup-backup-task.ps1
   ```

## Uso

### Backup Manual
Para realizar um backup manual:
```powershell
.\backup.ps1
```

### Restauração
Para restaurar um backup:
```powershell
.\restore.ps1 -backupFile "backups\backup_YYYY-MM-DD_HH-mm.sql"
```

## Localização dos Backups
Os backups são armazenados na pasta `backups` e são mantidos por 7 dias.

## Segurança
- Os backups são realizados diariamente às 2:00 AM
- São mantidos os últimos 7 backups
- A restauração requer confirmação explícita do usuário

## Observações Importantes
- Sempre verifique se o backup foi realizado com sucesso
- Mantenha os backups em um local seguro
- Considere fazer cópias dos backups em outro dispositivo 