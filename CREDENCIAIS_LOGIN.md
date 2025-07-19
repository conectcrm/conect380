# 🔐 Credenciais de Login - Fênix CRM

## 📋 **Usuários Padrão do Sistema**

### 🔑 **Credenciais de Acesso**

O sistema **Fênix CRM** não possui usuários criados automaticamente. Você precisará criar os usuários manualmente através da API ou banco de dados.

#### **Para criar os primeiros usuários, você tem 3 opções:**

---

### 🚀 **Opção 1: Via API (Recomendado)**

Use o endpoint de registro para criar o primeiro usuário administrador:

```bash
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "nome": "Administrador",
  "email": "admin@fenixcrm.com",
  "senha": "admin123",
  "empresa": {
    "nome": "Fênix Tecnologia",
    "cnpj": "12.345.678/0001-99",
    "email": "contato@fenixtecnologia.com.br"
  }
}
```

---

### 🛠️ **Opção 2: Através do Banco de Dados**

Execute os seguintes comandos SQL no PostgreSQL:

```sql
-- 1. Criar empresa
INSERT INTO empresas (id, nome, slug, cnpj, email, telefone, ativo, plano, created_at, updated_at) 
VALUES (
  gen_random_uuid(), 
  'Fênix Tecnologia', 
  'fenix-tecnologia', 
  '12.345.678/0001-99', 
  'contato@fenixtecnologia.com.br', 
  '(11) 99999-9999', 
  true, 
  'premium', 
  NOW(), 
  NOW()
);

-- 2. Criar usuário admin (senha: admin123)
INSERT INTO users (id, nome, email, senha, role, ativo, empresa_id, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Administrador',
  'admin@fenixcrm.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'admin',
  true,
  (SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-99'),
  NOW(),
  NOW()
);
```

---

### 🎯 **Opção 3: Usuários de Demonstração Sugeridos**

Após criar o primeiro admin, você pode adicionar estes usuários via interface:

#### **👤 Administrador**
- **Email**: `admin@fenixcrm.com`
- **Senha**: `admin123`
- **Função**: Administrador do sistema
- **Permissões**: Acesso total

#### **🎯 Gerente**
- **Email**: `maria@fenixcrm.com`
- **Senha**: `manager123`
- **Função**: Gerente de vendas
- **Permissões**: Gestão de equipe e relatórios

#### **💼 Vendedor**
- **Email**: `joao@fenixcrm.com`
- **Senha**: `vendedor123`
- **Função**: Vendedor
- **Permissões**: Gestão de clientes e propostas

---

### 🔒 **Segurança**

> **⚠️ IMPORTANTE:** Essas são credenciais de desenvolvimento!
> 
> **Em produção:**
> - Altere todas as senhas padrão
> - Use senhas fortes e únicas
> - Ative autenticação de dois fatores
> - Configure políticas de senha

---

### 🌐 **URLs de Acesso**

- **Frontend**: `http://localhost:3900`
- **Backend API**: `http://localhost:3001`
- **Documentação**: `http://localhost:3001/api-docs`

---

### 📝 **Como Fazer Login**

1. Acesse o frontend em `http://localhost:3900`
2. Use uma das credenciais acima
3. O sistema redirecionará para o dashboard

---

### 🔧 **Endpoint de Login**

```bash
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "admin@fenixcrm.com",
  "password": "admin123"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "nome": "Administrador",
      "email": "admin@fenixcrm.com",
      "role": "admin",
      "empresa": {...}
    }
  }
}
```

---

### 🚨 **Problemas Comuns**

#### **❌ "Usuário não encontrado"**
- Verifique se o usuário foi criado no banco
- Confirme se o email está correto

#### **❌ "Senha incorreta"**
- Verifique se a senha foi criptografada corretamente
- Use bcrypt para gerar o hash da senha

#### **❌ "Empresa inativa"**
- Verifique se o campo `ativo` da empresa está como `true`

---

**🎉 Após criar os usuários, você poderá acessar o sistema e explorar todas as funcionalidades do Fênix CRM!**
