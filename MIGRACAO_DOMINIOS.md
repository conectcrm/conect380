# 🔄 Atualização de Domínios - Conect CRM

## 📋 **Resumo das Mudanças**

O projeto foi renomeado de **"Fênix CRM"** para **"Conect CRM"**, e todos os domínios e referências foram atualizados para refletir a nova identidade.

## 🏢 **Empresa Atualizada**

| Campo | Valor Anterior | Valor Atual |
|-------|---------------|-------------|
| **Nome** | Fênix Tecnologia | **Conect Tecnologia** |
| **Email** | contato@fenixtecnologia.com.br | **contato@conectcrm.com.br** |
| **Slug** | fenix-tecnologia | **conect-tecnologia** |
| **CNPJ** | 12.345.678/0001-99 | *(mantido)* |

## 👥 **Usuários Atualizados**

### 🔐 **Credenciais de Acesso**

| Perfil | Email Anterior | **Email Atual** | **Senha** |
|--------|---------------|----------------|-----------|
| **Administrador** | admin@fenixcrm.com | **admin@conectcrm.com** | **admin123** |
| **Gerente** | maria@fenixcrm.com | **maria@conectcrm.com** | **manager123** |
| **Vendedor** | joao@fenixcrm.com | **joao@conectcrm.com** | **vendedor123** |

## 🛠️ **Scripts de Migração**

### **Arquivos Criados:**
- `init-users.sql` - ✅ **Atualizado** com novos domínios
- `update-domains.sql` - 🆕 **Novo** script para atualizar dados existentes
- `migrate-domains.js` - 🆕 **Novo** script Node.js para migração
- `migrate-domains.bat` - 🆕 **Novo** script Windows para migração
- `migrate-domains.sh` - 🆕 **Novo** script Linux/Mac para migração

### **Para Novos Projetos:**
```sql
-- Execute o script atualizado
psql -U conectcrm -d conectcrm_db -f init-users.sql
```

### **Para Projetos Existentes:**
```sql
-- Execute o script de atualização
psql -U conectcrm -d conectcrm_db -f update-domains.sql
```

## 🌐 **Acesso às Interfaces**

### **Aplicação CRM:**
- **URL:** http://localhost:3900
- **Login:** admin@conectcrm.com
- **Senha:** admin123

### **pgAdmin (Gerenciamento do Banco):**
- **URL:** http://localhost:5050
- **Email:** admin@conectcrm.com
- **Senha:** admin123

### **Backend API:**
- **URL:** http://localhost:3001
- **Docs:** http://localhost:3001/api-docs

## 📊 **Banco de Dados PostgreSQL**

- **Host:** localhost
- **Porta:** 5434
- **Banco:** conectcrm_db
- **Usuário:** conectcrm
- **Senha:** conectcrm123

## ✅ **Verificação**

Para verificar se a migração foi aplicada corretamente, execute:

```sql
-- Verificar empresa
SELECT nome, email, slug FROM empresas WHERE cnpj = '12.345.678/0001-99';

-- Verificar usuários
SELECT u.nome, u.email, u.role 
FROM users u 
JOIN empresas e ON u.empresa_id = e.id 
WHERE e.cnpj = '12.345.678/0001-99';
```

## 🎯 **Próximos Passos**

1. ✅ **Arquivos atualizados** - Todos os scripts e configurações
2. ⏳ **Migração do banco** - Execute os scripts de atualização conforme necessário
3. ✅ **Frontend atualizado** - Interface já usa os novos domínios
4. ✅ **Backend funcionando** - API funcionando na porta 3001

---

*Documentação atualizada em: 24 de julho de 2025*
