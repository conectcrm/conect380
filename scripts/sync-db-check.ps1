# ============================================================
# SCRIPT DE VERIFICAÇÃO DE SINCRONISMO BANCO DEV x PROD
# ============================================================
# Verifica se todas as migrations do dev estão aplicadas no prod
# e gera relatório de diferenças de schema

param(
  [switch]$GenerateReport,
  [switch]$ShowDetails
)

Write-Host "🔍 VERIFICAÇÃO DE SINCRONISMO BANCO DEV x PROD" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# ============================================================
# 1. LISTAR MIGRATIONS DISPONÍVEIS
# ============================================================
Write-Host "`n📂 MIGRATIONS DISPONÍVEIS NO CÓDIGO:" -ForegroundColor Yellow

$migrationsPath = "backend\src\migrations"
$migrations = Get-ChildItem -Path $migrationsPath -Filter "*.ts" | Sort-Object Name

Write-Host "Total de arquivos de migration: $($migrations.Count)" -ForegroundColor Green

if ($ShowDetails) {
  Write-Host "`nListando todas as migrations:" -ForegroundColor DarkGray
  $migrations | ForEach-Object {
    $timestamp = $_.BaseName.Split('-')[0]
    $name = $_.BaseName.Substring($timestamp.Length + 1)
    Write-Host "  ✓ $timestamp - $name" -ForegroundColor DarkGray
  }
}

# ============================================================
# 2. VERIFICAR MIGRATIONS EXECUTADAS NO DEV
# ============================================================
Write-Host "`n📊 VERIFICANDO BANCO DE DESENVOLVIMENTO..." -ForegroundColor Yellow

$devEnv = @"
DATABASE_HOST=localhost
DATABASE_PORT=5434
DATABASE_USERNAME=conectcrm
DATABASE_PASSWORD=conectcrm123
DATABASE_NAME=conectcrm_db
"@

Write-Host "Conectando em: localhost:5434/conectcrm_db" -ForegroundColor DarkGray

# Comando para listar migrations executadas
$checkMigrationsDev = @"
cd backend
npm run migration:show 2>&1
"@

Write-Host "`nExecutando: npm run migration:show (DEV)..." -ForegroundColor DarkGray
# Note: Você precisará executar isso manualmente no terminal

# ============================================================
# 3. VERIFICAR MIGRATIONS EXECUTADAS NO PROD
# ============================================================
Write-Host "`n📊 VERIFICANDO BANCO DE PRODUÇÃO..." -ForegroundColor Yellow

Write-Host "⚠️  INFORMAÇÃO NECESSÁRIA:" -ForegroundColor Red
Write-Host "Para verificar o banco de produção, você precisa:" -ForegroundColor White
Write-Host "1. Configurar as variáveis de ambiente para PROD" -ForegroundColor White
Write-Host "2. Executar: npm run migration:show" -ForegroundColor White
Write-Host "`nOu fornecer os dados de conexão do banco de produção:" -ForegroundColor Yellow
Write-Host "  - DATABASE_HOST_PROD" -ForegroundColor DarkGray
Write-Host "  - DATABASE_PORT_PROD" -ForegroundColor DarkGray
Write-Host "  - DATABASE_NAME_PROD" -ForegroundColor DarkGray
Write-Host "  - DATABASE_USERNAME_PROD" -ForegroundColor DarkGray
Write-Host "  - DATABASE_PASSWORD_PROD" -ForegroundColor DarkGray

# ============================================================
# 4. GERAR SCRIPT DE SINCRONIZAÇÃO
# ============================================================
if ($GenerateReport) {
  Write-Host "`n📝 GERANDO RELATÓRIO DE SINCRONIZAÇÃO..." -ForegroundColor Yellow
    
  $reportPath = "RELATORIO_SYNC_DB.md"
    
  $report = @"
# 📊 RELATÓRIO DE SINCRONIZAÇÃO DE BANCO DE DADOS

**Data**: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
**Branch**: consolidacao-atendimento

---

## 🎯 Objetivo

Verificar se TODAS as migrations do banco de desenvolvimento estão aplicadas no banco de produção.

---

## 📂 Migrations Disponíveis no Código

Total: **$($migrations.Count) migrations**

### Lista Completa:

"@

  $migrations | ForEach-Object {
    $timestamp = $_.BaseName.Split('-')[0]
    $name = $_.BaseName.Substring($timestamp.Length + 1)
    $report += "`n- [$timestamp] $name"
  }

  $report += @"

---

## ✅ Checklist de Verificação

### 1️⃣ Banco de Desenvolvimento (DEV)

```bash
cd backend
npm run migration:show
```

**O que verificar:**
- [ ] Todas as migrations acima estão listadas como "executed"
- [ ] Não há migrations pendentes
- [ ] Tabela "migrations" existe e está populada

### 2️⃣ Banco de Produção (PROD)

**Configurar variáveis de ambiente:**
``````env
DATABASE_HOST=<host-producao>
DATABASE_PORT=<porta-producao>
DATABASE_USERNAME=<usuario-producao>
DATABASE_PASSWORD=<senha-producao>
DATABASE_NAME=<banco-producao>
``````

**Executar:**
``````bash
cd backend
npm run migration:show
``````

**O que verificar:**
- [ ] Todas as migrations do DEV estão aplicadas
- [ ] Não há migrations faltando
- [ ] Versões das migrations coincidem

### 3️⃣ Comparação de Schemas

**Verificar tabelas críticas:**

- [ ] \`users\` - Campos: status_atendente, capacidade_maxima, tickets_ativos
- [ ] \`atendimento_tickets\` - Todas as colunas presentes
- [ ] \`atendimento_mensagens\` - Estrutura completa
- [ ] \`atendimento_equipes\` - Tabela existe
- [ ] \`atendimento_equipe_membros\` - Tabela existe
- [ ] \`atendimento_atribuicoes\` - Tabela existe
- [ ] \`notifications\` - Tabela existe
- [ ] \`message_templates\` - Tabela existe
- [ ] \`tags\` - Tabela existe
- [ ] \`ticket_tags\` - Tabela existe

---

## 🔍 Comandos Úteis

### Listar tabelas no banco:
``````sql
\dt
``````

### Ver estrutura de uma tabela:
``````sql
\d+ users
\d+ atendimento_tickets
\d+ atendimento_equipes
``````

### Ver migrations executadas:
``````sql
SELECT * FROM migrations ORDER BY timestamp DESC;
``````

### Comparar colunas entre DEV e PROD:
``````sql
-- DEV
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- PROD (rodar no banco de produção)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
``````

---

## ⚠️ AÇÕES NECESSÁRIAS SE HOUVER DIFERENÇAS

### Se PROD estiver DESATUALIZADO:

1. **Backup do banco de produção:**
   ``````bash
   pg_dump -h <host> -U <user> -d <database> > backup_prod_$(date +%Y%m%d_%H%M%S).sql
   ``````

2. **Executar migrations faltantes:**
   ``````bash
   # Configurar env para PROD
   export DATABASE_HOST=<prod-host>
   export DATABASE_PORT=<prod-port>
   # ... outras vars
   
   cd backend
   npm run migration:run
   ``````

3. **Verificar se aplicou tudo:**
   ``````bash
   npm run migration:show
   ``````

### Se DEV tiver migrations não commitadas:

1. **Gerar migration:**
   ``````bash
   npm run migration:generate -- src/migrations/MigrationName
   ``````

2. **Commitar:**
   ``````bash
   git add backend/src/migrations/*.ts
   git commit -m "feat(db): adicionar migration MigrationName"
   ``````

3. **Aplicar no DEV:**
   ``````bash
   npm run migration:run
   ``````

---

## 📋 Tabelas Críticas para Produção

### Módulo Atendimento:
- \`atendimento_tickets\`
- \`atendimento_mensagens\`
- \`atendimento_equipes\`
- \`atendimento_equipe_membros\`
- \`atendimento_atribuicoes\`
- \`atendimento_configuracao_inatividade\`
- \`departamentos\`
- \`filas\`

### Notificações:
- \`notifications\`

### Templates:
- \`message_templates\`

### Tags:
- \`tags\`
- \`ticket_tags\`

### Usuários (campos novos):
- \`users.status_atendente\`
- \`users.capacidade_maxima\`
- \`users.tickets_ativos\`

---

## 🎯 Resultado Esperado

✅ **PROD = DEV em schema**
- Todas as migrations aplicadas
- Todas as tabelas existem
- Todos os campos existem
- Sem diferenças estruturais

---

## 📝 Conclusão

**Status**: ⚠️ PENDENTE DE VERIFICAÇÃO

**Próximos passos:**
1. [ ] Executar \`npm run migration:show\` no DEV
2. [ ] Executar \`npm run migration:show\` no PROD
3. [ ] Comparar resultados
4. [ ] Aplicar migrations faltantes no PROD (se houver)
5. [ ] Validar que ambos estão sincronizados

---

**Data de Verificação**: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
**Responsável**: Equipe ConectCRM
"@

  $report | Out-File -FilePath $reportPath -Encoding UTF8
  Write-Host "✅ Relatório gerado: $reportPath" -ForegroundColor Green
}

# ============================================================
# 5. INSTRUÇÕES FINAIS
# ============================================================
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

Write-Host "`n1️⃣  VERIFICAR BANCO DE DESENVOLVIMENTO:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm run migration:show" -ForegroundColor White

Write-Host "`n2️⃣  OBTER ACESSO AO BANCO DE PRODUÇÃO:" -ForegroundColor Yellow
Write-Host "   Você precisa das credenciais:" -ForegroundColor White
Write-Host "   - Host/IP do servidor" -ForegroundColor DarkGray
Write-Host "   - Porta (geralmente 5432)" -ForegroundColor DarkGray
Write-Host "   - Nome do banco" -ForegroundColor DarkGray
Write-Host "   - Usuário e senha" -ForegroundColor DarkGray

Write-Host "`n3️⃣  VERIFICAR BANCO DE PRODUÇÃO:" -ForegroundColor Yellow
Write-Host "   Configurar variáveis de ambiente para PROD" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm run migration:show" -ForegroundColor White

Write-Host "`n4️⃣  COMPARAR RESULTADOS:" -ForegroundColor Yellow
Write-Host "   Se houver diferenças, rodar:" -ForegroundColor White
Write-Host "   npm run migration:run" -ForegroundColor White
Write-Host "   (no ambiente de PRODUÇÃO)" -ForegroundColor DarkGray

Write-Host "`n5️⃣  GERAR RELATÓRIO DETALHADO:" -ForegroundColor Yellow
Write-Host "   .\scripts\sync-db-check.ps1 -GenerateReport -ShowDetails" -ForegroundColor White

Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "   Sempre fazer BACKUP antes de rodar migrations em PROD!" -ForegroundColor Yellow

Write-Host "`n" -ForegroundColor White
