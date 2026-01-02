# 💾 Sistema de Backup e Restore - ConectCRM

Sistema automatizado de backup e restauração do banco de dados PostgreSQL.

## 📋 Visão Geral

O sistema de backup oferece:

✅ **Backup Automático** - Script PowerShell para criar backups do PostgreSQL
✅ **Restore Seguro** - Restauração com backup de segurança automático
✅ **Rotação Automática** - Remove backups antigos automaticamente
✅ **Compactação** - Suporte a gzip para economizar espaço
✅ **Verificação de Integridade** - Valida banco após restore
✅ **Docker-friendly** - Funciona com containers Docker

## 🚀 Uso Rápido

### Criar Backup

```powershell
# Backup básico
.\scripts\backup-database.ps1

# Backup com compactação
.\scripts\backup-database.ps1 -Compress

# Backup com modo verbose
.\scripts\backup-database.ps1 -Verbose -Compress
```

### Restaurar Backup

```powershell
# Restaurar com confirmação
.\scripts\restore-database.ps1 -BackupFile ".\backups\database\conectcrm_backup_2025-11-03_143000.sql"

# Restaurar sem confirmação (CUIDADO!)
.\scripts\restore-database.ps1 -BackupFile ".\backups\database\conectcrm_backup_2025-11-03_143000.sql" -Force

# Restaurar arquivo compactado
.\scripts\restore-database.ps1 -BackupFile ".\backups\database\conectcrm_backup_2025-11-03_143000.sql.gz"
```

## 📖 Documentação Detalhada

### backup-database.ps1

Cria backup do banco de dados PostgreSQL.

#### Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `BackupDir` | string | `.\backups\database` | Diretório onde salvar backups |
| `RetentionDays` | int | 7 | Quantos dias manter backups antigos |
| `Compress` | switch | false | Compactar backup com gzip |
| `Verbose` | switch | false | Mostrar detalhes da execução |
| `ContainerName` | string | `postgres` | Nome do container Docker |
| `Database` | string | `conectcrm` | Nome do banco de dados |
| `Username` | string | `postgres` | Usuário do PostgreSQL |

#### Exemplos

**Backup com retenção de 30 dias:**
```powershell
.\scripts\backup-database.ps1 -RetentionDays 30
```

**Backup em outro diretório:**
```powershell
.\scripts\backup-database.ps1 -BackupDir "D:\Backups\ConectCRM"
```

**Backup de outro banco:**
```powershell
.\scripts\backup-database.ps1 -Database "outro_banco" -Username "admin"
```

#### Saída Exemplo

```
═══════════════════════════════════════════════════════════════════
  💾 BACKUP DO BANCO DE DADOS - ConectCRM
═══════════════════════════════════════════════════════════════════

🔍 Verificando Docker...
✅ Container 'postgres' está rodando

📦 Criando backup do banco 'conectcrm'...
✅ Backup criado com sucesso!
   📁 Arquivo: .\backups\database\conectcrm_backup_2025-11-03_143045.sql
   📊 Tamanho: 5.42 MB

🗜️  Compactando backup...
✅ Backup compactado com sucesso!
   📁 Arquivo: .\backups\database\conectcrm_backup_2025-11-03_143045.sql.gz
   📊 Tamanho: 0.87 MB (redução de 84.0%)

🔄 Verificando backups antigos...
🗑️  Removendo backups com mais de 7 dias:
   ❌ conectcrm_backup_2025-10-25_120000.sql.gz (9 dias)
   ❌ conectcrm_backup_2025-10-26_120000.sql.gz (8 dias)
✅ 2 backup(s) antigo(s) removido(s)

═══════════════════════════════════════════════════════════════════
  📊 ESTATÍSTICAS DE BACKUP
     Total de backups: 8
     Espaço total: 6.95 MB
     Retenção: 7 dias
     Diretório: .\backups\database
═══════════════════════════════════════════════════════════════════

✅ Backup concluído com sucesso!
```

---

### restore-database.ps1

Restaura backup do banco de dados PostgreSQL.

#### Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `BackupFile` | string | **OBRIGATÓRIO** | Caminho para arquivo de backup (.sql ou .sql.gz) |
| `Force` | switch | false | Não pedir confirmação |
| `Verbose` | switch | false | Mostrar detalhes da execução |
| `ContainerName` | string | `postgres` | Nome do container Docker |
| `Database` | string | `conectcrm` | Nome do banco de dados |
| `Username` | string | `postgres` | Usuário do PostgreSQL |

#### Exemplos

**Restore básico (pede confirmação):**
```powershell
.\scripts\restore-database.ps1 -BackupFile ".\backups\database\conectcrm_backup_2025-11-03_143000.sql"
```

**Restore forçado (sem confirmação):**
```powershell
.\scripts\restore-database.ps1 -BackupFile ".\backups\database\conectcrm_backup_2025-11-03_143000.sql" -Force
```

**Restore de arquivo compactado:**
```powershell
.\scripts\restore-database.ps1 -BackupFile ".\backups\database\conectcrm_backup_2025-11-03_143000.sql.gz"
```

#### Saída Exemplo

```
═══════════════════════════════════════════════════════════════════
  🔄 RESTORE DO BANCO DE DADOS - ConectCRM
═══════════════════════════════════════════════════════════════════

📁 Arquivo de backup: .\backups\database\conectcrm_backup_2025-11-03_143000.sql
📊 Tamanho: 5.42 MB
📅 Data: 03/11/2025 14:30:45

🔍 Verificando Docker...
🔍 Verificando container 'postgres'...
✅ Container 'postgres' está rodando

⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER todos os dados do banco 'conectcrm'

Deseja continuar? Digite 'CONFIRMAR' para prosseguir: CONFIRMAR

💾 Criando backup de segurança antes do restore...
✅ Backup de segurança criado: .\backups\database\pre_restore_backup_20251103_143200.sql (5.41 MB)

🔄 Restaurando backup...
   1/4 Fechando conexões ativas...
   2/4 Recriando banco de dados...
   3/4 Copiando arquivo para container...
   4/4 Executando restore...

✅ Restore concluído com sucesso!

🔍 Verificando integridade do banco...
   Tabelas encontradas: 42
✅ Banco restaurado e íntegro!

═══════════════════════════════════════════════════════════════════
  ✅ RESTORE CONCLUÍDO
═══════════════════════════════════════════════════════════════════

💡 Próximo passo: Reinicie o backend para aplicar mudanças
   cd backend && npm run start:dev
```

## 🔧 Configuração

### Variáveis de Ambiente (Opcional)

Você pode configurar defaults em `docker-compose.yml`:

```yaml
services:
  postgres:
    container_name: postgres  # Nome usado nos scripts
    environment:
      POSTGRES_DB: conectcrm  # Banco padrão
      POSTGRES_USER: postgres # Usuário padrão
```

### Estrutura de Diretórios

```
conectcrm/
├── backups/
│   └── database/
│       ├── conectcrm_backup_2025-11-03_120000.sql
│       ├── conectcrm_backup_2025-11-03_120000.sql.gz
│       ├── conectcrm_backup_2025-11-03_140000.sql.gz
│       └── pre_restore_backup_20251103_143200.sql
└── scripts/
    ├── backup-database.ps1
    ├── restore-database.ps1
    └── README_BACKUP_RESTORE.md
```

## 🤖 Automação

### Backup Diário Automático

#### Windows (Task Scheduler)

1. Abrir **Task Scheduler** (Agendador de Tarefas)
2. Criar **Nova Tarefa**
3. **Acionadores**: Diariamente às 02:00
4. **Ações**: 
   - Programa: `powershell.exe`
   - Argumentos: `-ExecutionPolicy Bypass -File "C:\Projetos\conectcrm\scripts\backup-database.ps1" -Compress`
5. **Configurações**: 
   - ✅ Executar se conectado à energia
   - ✅ Acordar o computador para executar

#### Script PowerShell

Criar arquivo `daily-backup.ps1`:

```powershell
# Configurar logging
$logFile = ".\backups\backup-log-$(Get-Date -Format 'yyyy-MM').txt"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $logFile -Value "[$timestamp] Iniciando backup diário..."

try {
    # Executar backup
    $backupPath = .\scripts\backup-database.ps1 -Compress -RetentionDays 30
    
    Add-Content -Path $logFile -Value "[$timestamp] ✅ Backup concluído: $backupPath"
    
    # Opcional: Enviar notificação por email
    # Send-MailMessage -To "admin@conectsuite.com.br" -Subject "✅ Backup OK" ...
    
} catch {
    Add-Content -Path $logFile -Value "[$timestamp] ❌ Erro: $_"
    
    # Opcional: Alertar sobre falha
    # Send-MailMessage -To "admin@conectsuite.com.br" -Subject "❌ Backup FALHOU" ...
}
```

Agendar no Task Scheduler executando `daily-backup.ps1` diariamente.

### Backup Antes de Deploy

Adicionar no script de deploy:

```powershell
# pre-deploy.ps1
Write-Host "💾 Criando backup pré-deploy..."
$backupPath = .\scripts\backup-database.ps1 -Compress

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup criado: $backupPath"
    Write-Host "🚀 Prosseguindo com deploy..."
    
    # ... resto do deploy
} else {
    Write-Host "❌ Falha no backup. Deploy cancelado."
    exit 1
}
```

### Integração com CI/CD

#### GitHub Actions

```yaml
name: Backup Production

on:
  schedule:
    - cron: '0 2 * * *'  # Diariamente às 02:00 UTC
  workflow_dispatch:      # Permitir execução manual

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create Backup
        run: |
          pwsh ./scripts/backup-database.ps1 -Compress
      
      - name: Upload to S3 (Opcional)
        run: |
          aws s3 cp ./backups/database/ s3://conectcrm-backups/ --recursive
```

## 🛠️ Troubleshooting

### Erro: "Docker não está rodando"

**Sintoma:**
```
❌ Docker não está rodando ou não está instalado
```

**Solução:**
```powershell
# Iniciar Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Aguardar Docker iniciar
Start-Sleep -Seconds 30

# Tentar novamente
.\scripts\backup-database.ps1
```

---

### Erro: "Container postgres não está rodando"

**Sintoma:**
```
❌ Container 'postgres' não está rodando
```

**Solução:**
```powershell
# Verificar containers
docker ps -a

# Iniciar PostgreSQL
docker-compose up -d postgres

# Aguardar inicialização
Start-Sleep -Seconds 5

# Tentar novamente
.\scripts\backup-database.ps1
```

---

### Erro: "Arquivo de backup não encontrado"

**Sintoma:**
```
❌ Arquivo de backup não encontrado: .\backups\...
```

**Solução:**
```powershell
# Listar backups disponíveis
Get-ChildItem .\backups\database\conectcrm_backup_*.sql*

# Usar caminho completo
.\scripts\restore-database.ps1 -BackupFile "C:\Projetos\conectcrm\backups\database\conectcrm_backup_2025-11-03_143000.sql"
```

---

### Erro: "Não foi possível compactar o backup"

**Sintoma:**
```
⚠️  Não foi possível compactar o backup
```

**Solução:**

1. **Instalar Git Bash** (recomendado):
   - Download: https://git-scm.com/downloads
   - Inclui gzip nativo

2. **Ou usar sem compactação**:
   ```powershell
   .\scripts\backup-database.ps1  # Sem o parâmetro -Compress
   ```

---

### Backup está muito grande

**Problema**: Backup de 500 MB+ demora muito

**Solução 1: Compactar**
```powershell
# Usar gzip (reduz 70-90%)
.\scripts\backup-database.ps1 -Compress
```

**Solução 2: Dump com formato customizado**

Editar script para usar `-Fc` (formato compactado do pg_dump):

```powershell
# Em backup-database.ps1, trocar:
$dumpCommand = "docker exec $ContainerName pg_dump -U $Username -d $Database -Fc"
```

---

### Restore falhou, preciso reverter

**Problema**: Restore deu erro e banco está corrompido

**Solução**: Usar backup de segurança automático

```powershell
# O restore cria backup automático antes de sobrescrever
# Procurar arquivos pre_restore_backup_*
Get-ChildItem .\backups\database\pre_restore_backup_*.sql

# Restaurar o backup de segurança
.\scripts\restore-database.ps1 -BackupFile ".\backups\database\pre_restore_backup_20251103_143200.sql" -Force
```

## 📊 Monitoramento

### Verificar Tamanho dos Backups

```powershell
Get-ChildItem .\backups\database\*.sql* | 
    Select-Object Name, 
                  @{Name='Size(MB)';Expression={[math]::Round($_.Length/1MB,2)}},
                  LastWriteTime | 
    Sort-Object LastWriteTime -Descending
```

### Alertas de Espaço em Disco

```powershell
$backupSize = (Get-ChildItem .\backups\database\*.sql* | Measure-Object -Property Length -Sum).Sum / 1GB
$diskFree = (Get-PSDrive C).Free / 1GB

if ($diskFree -lt 10) {
    Write-Warning "⚠️  Espaço em disco crítico: $([math]::Round($diskFree, 2)) GB disponíveis"
}
```

## 🎯 Boas Práticas

✅ **Backup Diário**: Agende backups automáticos diariamente
✅ **Retenção Adequada**: Mantenha pelo menos 7 dias de backups
✅ **Compactação**: Use `-Compress` para economizar espaço (reduz 70-90%)
✅ **Teste de Restore**: Teste restore periodicamente (ex: mensalmente)
✅ **Off-site Backup**: Copie backups para outro local (S3, Google Drive, etc.)
✅ **Monitoramento**: Configure alertas de falha de backup
✅ **Segurança**: Mantenha backups em local seguro com acesso restrito

## 📚 Referências

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Manual](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Docker PostgreSQL Best Practices](https://docs.docker.com/samples/postgres/)
- [TROUBLESHOOTING_GUIDE.md](../TROUBLESHOOTING_GUIDE.md) - Guia geral de troubleshooting

---

**Última atualização**: 3 de novembro de 2025  
**Versão**: 1.0.0
