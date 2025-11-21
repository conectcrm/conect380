# 📤 COMANDOS PARA TRANSFERIR .env.production PARA AWS

**Objetivo**: Copiar arquivo de configuração do Windows local para servidor AWS

---

## 🔐 IMPORTANTE - SEGURANÇA

⚠️ **NUNCA** commite o arquivo `.env.production` no Git!  
✅ Arquivo já adicionado ao `.gitignore`  
✅ Transferência deve ser feita via SCP (SSH Copy)

---

## 📋 PRÉ-REQUISITOS

Antes de executar os comandos:

1. ✅ Você tem a chave SSH (.pem) do servidor AWS
2. ✅ Você sabe o IP público do servidor AWS
3. ✅ Você editou `backend\.env.production` com valores reais:
   - DATABASE_HOST (IP do banco de produção)
   - DATABASE_PASSWORD (senha real)
   - SMTP_USER e SMTP_PASS (email real)
   - WHATSAPP_ACCESS_TOKEN (token real)
   - Outros placeholders

---

## 🚀 MÉTODO 1: SCP (Recomendado)

### PowerShell no Windows Local:

```powershell
# Sintaxe:
# scp -i <caminho-para-chave.pem> <arquivo-local> <usuario>@<ip-aws>:<caminho-destino>

# Exemplo completo:
scp -i "C:\Users\SeuUsuario\chaves\aws-key.pem" `
    "C:\Projetos\conectcrm\backend\.env.production" `
    ubuntu@54.123.45.67:/home/ubuntu/conectcrm/backend/.env.production

# OU se sua chave está em ~/.ssh/:
scp -i ~/.ssh/aws-key.pem `
    backend\.env.production `
    ubuntu@54.123.45.67:/home/ubuntu/conectcrm/backend/
```

### Verificar Transferência:

```powershell
# Após executar SCP, verificar no servidor:
ssh -i "C:\Users\SeuUsuario\chaves\aws-key.pem" ubuntu@54.123.45.67 `
    "ls -lh /home/ubuntu/conectcrm/backend/.env.production"

# Deve mostrar o arquivo com tamanho ~4KB
```

---

## 🚀 MÉTODO 2: Manual (Alternativa)

Se SCP não funcionar por algum motivo:

### Passo 1: Copiar conteúdo

No Windows local:

```powershell
# Exibir conteúdo para copiar
Get-Content backend\.env.production
```

### Passo 2: Criar arquivo no servidor

No servidor AWS (via SSH):

```bash
# Conectar via SSH
ssh -i sua-chave.pem ubuntu@seu-ip-aws

# Navegar para projeto
cd /home/ubuntu/conectcrm/backend

# Criar arquivo
nano .env.production

# Colar o conteúdo copiado
# Salvar: Ctrl+O, Enter, Ctrl+X
```

### Passo 3: Verificar permissões

```bash
# Garantir permissões corretas (apenas owner pode ler)
chmod 600 .env.production

# Verificar
ls -la .env.production
# Deve mostrar: -rw------- (600)
```

---

## 🚀 MÉTODO 3: SFTP (Alternativa GUI)

Se preferir interface gráfica, use **WinSCP** ou **FileZilla**:

### WinSCP:
1. Abrir WinSCP
2. Protocolo: SFTP
3. Host: seu-ip-aws
4. User: ubuntu
5. Private key: selecionar seu .pem
6. Login
7. Navegar para `/home/ubuntu/conectcrm/backend/`
8. Arrastar `backend\.env.production` do Windows para o servidor

### FileZilla:
1. Editar → Configurações → SFTP → Adicionar chave .pem
2. Arquivo → Site Manager → Novo Site
3. Protocolo: SFTP
4. Host: seu-ip-aws
5. User: ubuntu
6. Conectar
7. Transferir arquivo

---

## ✅ VERIFICAÇÃO PÓS-TRANSFERÊNCIA

Após copiar o arquivo, **SEMPRE verificar** no servidor:

```bash
# 1. Arquivo existe
ls -lh /home/ubuntu/conectcrm/backend/.env.production

# 2. Tamanho correto (~4KB)
du -h /home/ubuntu/conectcrm/backend/.env.production

# 3. Conteúdo correto (primeiras linhas)
head -20 /home/ubuntu/conectcrm/backend/.env.production

# 4. Permissões seguras
ls -la /home/ubuntu/conectcrm/backend/.env.production
# Deve ser: -rw------- (600) ou -rw-r----- (640)

# 5. Variáveis críticas presentes
grep "DATABASE_HOST" /home/ubuntu/conectcrm/backend/.env.production
grep "NODE_ENV" /home/ubuntu/conectcrm/backend/.env.production
grep "JWT_SECRET" /home/ubuntu/conectcrm/backend/.env.production
```

**Resultado esperado**:
```
DATABASE_HOST=<seu-ip-real>  # NÃO localhost!
NODE_ENV=production
JWT_SECRET=pXxUleS5Mm/lDkVTeKuglwKwR4RNnQ5odhB+6koQLMA=
```

---

## 🚨 TROUBLESHOOTING

### Erro: "Permission denied (publickey)"

**Causa**: Chave SSH incorreta ou sem permissões

**Solução**:
```powershell
# No Windows, garantir permissões corretas da chave:
icacls "C:\Users\SeuUsuario\chaves\aws-key.pem" /inheritance:r
icacls "C:\Users\SeuUsuario\chaves\aws-key.pem" /grant:r "$($env:USERNAME):R"
```

### Erro: "No such file or directory"

**Causa**: Caminho do destino não existe

**Solução**:
```bash
# No servidor, criar diretório:
mkdir -p /home/ubuntu/conectcrm/backend
```

### Erro: "Connection refused"

**Causa**: Firewall bloqueando SSH (porta 22)

**Solução**:
- Verificar Security Group no AWS (porta 22 liberada)
- Verificar se IP está na whitelist

---

## 📋 CHECKLIST DE TRANSFERÊNCIA

Antes de prosseguir para deploy:

- [ ] Arquivo `.env.production` copiado para servidor
- [ ] Tamanho do arquivo correto (~4KB)
- [ ] Permissões corretas (600 ou 640)
- [ ] DATABASE_HOST não é localhost
- [ ] NODE_ENV=production
- [ ] JWT_SECRET preenchido (não placeholder)
- [ ] Credenciais reais preenchidas (senhas, tokens)

---

## 🎯 PRÓXIMO PASSO

Após transferência bem-sucedida:

```bash
# No servidor AWS:
cd /home/ubuntu/conectcrm

# Executar validação
.\validar-config-producao.ps1

# Se tudo OK (0 erros), prosseguir para:
# EXECUCAO_DEPLOY_CORRIGIDO.md - FASE 2
```

---

## 📚 REFERÊNCIAS

- **Guia completo**: `EXECUCAO_DEPLOY_CORRIGIDO.md`
- **Checklist**: `CHECKLIST_DEPLOY_CORRIGIDO.md`
- **Validação**: `validar-config-producao.ps1`

---

**⚠️ LEMBRETE FINAL**: Após o deploy bem-sucedido, **NUNCA** commite `.env.production` no Git!
