# 🔄 Guia de Sincronização Entre Máquinas

Este guia explica como trabalhar em duas máquinas diferentes sem perder trabalho e mantendo tudo sincronizado.

## 📋 Índice

1. [Scripts Disponíveis](#scripts-disponíveis)
2. [Fluxo de Trabalho Diário](#fluxo-de-trabalho-diário)
3. [Comandos Rápidos](#comandos-rápidos)
4. [Resolução de Problemas](#resolução-de-problemas)
5. [Boas Práticas](#boas-práticas)

---

## 🛠️ Scripts Disponíveis

### 1. `sync-start.ps1` - Iniciar Trabalho
**Use ao CHEGAR em qualquer máquina**

```powershell
.\scripts\sync-start.ps1
```

O que faz:
- ✅ Verifica versão do Node.js (22.16+)
- ✅ Faz git pull do repositório
- ✅ Atualiza dependências (npm install) se necessário
- ✅ Executa migrations do banco de dados
- ✅ Verifica se backend compila
- ✅ Verifica se .env existe

**Opções:**
```powershell
.\scripts\sync-start.ps1 -SkipTests    # Pula testes de compilação (mais rápido)
.\scripts\sync-start.ps1 -Verbose      # Mostra mais detalhes
```

---

### 2. `sync-end.ps1` - Finalizar Trabalho
**Use ao SAIR de qualquer máquina**

```powershell
.\scripts\sync-end.ps1
```

O que faz:
- ✅ Verifica mudanças locais
- ✅ Solicita mensagem de commit
- ✅ Faz git add de todos os arquivos
- ✅ Faz commit com a mensagem
- ✅ Faz push para o repositório remoto
- ✅ Verifica se sincronizou com sucesso

**Opções:**
```powershell
.\scripts\sync-end.ps1 -Message "feat: nova feature"   # Mensagem direto
.\scripts\sync-end.ps1 -SkipPush                       # Só commit (sem push)
.\scripts\sync-end.ps1 -Verbose                        # Mais detalhes
```

**Exemplos de mensagens:**
```powershell
# Nova funcionalidade
.\scripts\sync-end.ps1 -Message "feat(atendimento): adicionar gestão de equipes"

# Correção de bug
.\scripts\sync-end.ps1 -Message "fix(chat): corrigir scroll automático"

# Trabalho em progresso
.\scripts\sync-end.ps1 -Message "wip: implementando módulo comercial"

# Documentação
.\scripts\sync-end.ps1 -Message "docs: atualizar guia de sincronização"
```

---

### 3. `sync-status.ps1` - Verificar Estado
**Use quando quiser saber se está tudo OK**

```powershell
.\scripts\sync-status.ps1
```

O que mostra:
- 💻 Informações da máquina atual
- 📊 Estado do Git (branch, commits, mudanças)
- 📝 Último commit
- 📦 Estado das dependências (node_modules)
- ⚙️ Configurações (.env)
- 🗄️ Migrations disponíveis
- 🚀 Processos Node.js ativos (backend/frontend)

**Opções:**
```powershell
.\scripts\sync-status.ps1 -Detailed    # Mostra mais informações
```

---

## 🔄 Fluxo de Trabalho Diário

### 📥 Ao CHEGAR na Máquina A ou B

```powershell
# 1. Sincronizar ambiente
.\scripts\sync-start.ps1

# 2. Verificar se está tudo OK (opcional)
.\scripts\sync-status.ps1

# 3. Iniciar backend
cd backend
npm run start:dev

# 4. Iniciar frontend (em outro terminal)
cd frontend-web
npm start

# 5. Trabalhar normalmente... 🚀
```

### 📤 Ao SAIR da Máquina A ou B

```powershell
# 1. Finalizar e sincronizar
.\scripts\sync-end.ps1

# 2. Verificar se push funcionou (opcional)
.\scripts\sync-status.ps1

# 3. Pode desligar a máquina! ✅
```

---

## ⚡ Comandos Rápidos

### Workflow Completo (Copiar e Colar)

**Início do dia:**
```powershell
.\scripts\sync-start.ps1 && cd backend && npm run start:dev
```

**Fim do dia:**
```powershell
.\scripts\sync-end.ps1 -Message "wip: trabalho do dia"
```

**Verificar status rápido:**
```powershell
.\scripts\sync-status.ps1
```

### Atalhos Úteis

```powershell
# Ver últimos commits
git log --oneline -5

# Ver diferenças locais
git diff

# Ver arquivos modificados
git status --short

# Desfazer última mudança (CUIDADO!)
git checkout -- arquivo.ts

# Ver histórico de um arquivo
git log --follow -- caminho/arquivo.ts
```

---

## 🔧 Resolução de Problemas

### Problema 1: "Mudanças não commitadas"

**Situação:** Você executou `sync-start.ps1` mas tinha mudanças não commitadas.

**Solução:**
```powershell
# Opção 1: Commitar antes
.\scripts\sync-end.ps1 -Message "wip: salvando progresso"
.\scripts\sync-start.ps1

# Opção 2: Fazer stash (salvar temporariamente)
git stash push -m "trabalho temporário"
.\scripts\sync-start.ps1
git stash pop  # Recuperar depois
```

---

### Problema 2: "Conflito no Git"

**Situação:** Você editou o mesmo arquivo nas duas máquinas.

**Solução:**
```powershell
# 1. Tentar pull
git pull origin consolidacao-atendimento

# 2. Se houver conflito, Git mostrará:
#    "CONFLICT (content): Merge conflict in arquivo.ts"

# 3. Abrir arquivo e resolver conflitos manualmente
#    Procure por: <<<<<<< HEAD
#                 =======
#                 >>>>>>> branch

# 4. Após resolver, commitar
git add .
git commit -m "fix: resolver conflitos de merge"
git push origin consolidacao-atendimento
```

---

### Problema 3: "node_modules diferente"

**Situação:** Dependências não batem entre máquinas.

**Solução:**
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules
npm install

# Frontend
cd ../frontend-web
Remove-Item -Recurse -Force node_modules
npm install
```

---

### Problema 4: "Migration não rodou"

**Situação:** Banco de dados desatualizado.

**Solução:**
```powershell
cd backend

# Ver migrations pendentes
npm run migration:show

# Rodar migrations
npm run migration:run

# Se erro, reverter última
npm run migration:revert
```

---

### Problema 5: "Backend não sobe"

**Solução passo a passo:**
```powershell
# 1. Verificar Node.js
node --version  # Deve ser 22.16+

# 2. Verificar .env
Test-Path backend\.env  # Deve retornar True

# 3. Reinstalar dependências
cd backend
Remove-Item -Recurse -Force node_modules, dist
npm install

# 4. Compilar
npm run build

# 5. Rodar migrations
npm run migration:run

# 6. Iniciar
npm run start:dev
```

---

### Problema 6: "Esqueci de fazer push!"

**Situação:** Já está na outra máquina e percebeu que não fez push.

**Solução:**
```powershell
# Se tiver acesso remoto à máquina anterior:
# 1. Conectar remotamente (TeamViewer, AnyDesk, etc.)
# 2. Na máquina anterior:
.\scripts\sync-end.ps1 -Message "feat: recuperando commits"

# Se NÃO tiver acesso remoto:
# 1. Trabalhe normalmente na máquina atual
# 2. Quando voltar à máquina anterior, resolva conflitos
```

---

## ✅ Boas Práticas

### 1. Commits Frequentes

```powershell
# ❌ RUIM: Commitar só no fim do dia
# (Se der problema, perde tudo!)

# ✅ BOM: Commitar a cada feature/fix
.\scripts\sync-end.ps1 -Message "feat: adicionar botão de salvar"
# ... continua trabalhando ...
.\scripts\sync-end.ps1 -Message "fix: corrigir validação de email"
```

### 2. Mensagens Descritivas

```powershell
# ❌ RUIM
.\scripts\sync-end.ps1 -Message "mudanças"
.\scripts\sync-end.ps1 -Message "update"
.\scripts\sync-end.ps1 -Message "fix"

# ✅ BOM
.\scripts\sync-end.ps1 -Message "feat(chat): adicionar upload de imagens"
.\scripts\sync-end.ps1 -Message "fix(auth): corrigir timeout de sessão"
.\scripts\sync-end.ps1 -Message "docs: atualizar README com instruções"
```

### 3. Nunca Commitar Credenciais

```powershell
# ❌ NUNCA commitar:
# - .env
# - senhas
# - tokens de API
# - chaves privadas

# ✅ Usar .env.template
cp backend/.env backend/.env.template
# Remover valores sensíveis do template
git add backend/.env.template
git commit -m "docs: adicionar template de .env"
```

### 4. Sincronizar SEMPRE

```powershell
# ✅ Regra de ouro:

# AO CHEGAR:
.\scripts\sync-start.ps1

# AO SAIR:
.\scripts\sync-end.ps1

# SEM EXCEÇÕES!
```

### 5. Verificar Antes de Sair

```powershell
# Checklist mental:
.\scripts\sync-status.ps1

# Verificar:
# [ ] Sem mudanças não commitadas?
# [ ] Sincronizado com remoto?
# [ ] Push foi feito?
# [ ] Tudo OK? ✅
```

---

## 🎯 Resumo dos Scripts

| Script | Quando Usar | O Que Faz |
|--------|-------------|-----------|
| `sync-start.ps1` | **AO CHEGAR** | Pull, install, migrations |
| `sync-end.ps1` | **AO SAIR** | Add, commit, push |
| `sync-status.ps1` | **VERIFICAR** | Estado da sincronização |

---

## 💡 Dicas Extras

### Alias PowerShell (Facilita Muito!)

Adicione no seu `$PROFILE`:

```powershell
# Abrir perfil
notepad $PROFILE

# Adicionar aliases:
function sync-start { .\scripts\sync-start.ps1 $args }
function sync-end { .\scripts\sync-end.ps1 $args }
function sync-status { .\scripts\sync-status.ps1 $args }

# Salvar e recarregar
. $PROFILE
```

Agora pode usar:
```powershell
sync-start
sync-end -Message "feat: nova feature"
sync-status -Detailed
```

### Monitorar Mudanças em Tempo Real

```powershell
# Watch git status
while ($true) { 
    Clear-Host
    git status --short
    Start-Sleep -Seconds 5
}
```

### Backup de Segurança

```powershell
# Antes de mudanças grandes, fazer backup
git branch backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')
```

---

## 🆘 Ajuda Rápida

**Precisa de ajuda?**

```powershell
# Ver ajuda do script
Get-Help .\scripts\sync-start.ps1
Get-Help .\scripts\sync-end.ps1
Get-Help .\scripts\sync-status.ps1

# Ver opções disponíveis
.\scripts\sync-start.ps1 -?
```

---

**Última atualização:** Dezembro 2025  
**Versão:** 1.0.0
