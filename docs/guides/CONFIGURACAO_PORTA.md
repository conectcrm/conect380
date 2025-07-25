# 🚀 Configuração de Porta - Fênix CRM Frontend

## 📋 Alterações Realizadas

### ✅ **Porta Modificada: 3000 → 3900**

O frontend do Fênix CRM foi configurado para executar na **porta 3900** conforme solicitado.

### 📁 **Arquivos Modificados:**

#### 1. **`package.json`**
```json
{
  "scripts": {
    "start": "set PORT=3900 && react-scripts start",
    // outros scripts...
  }
}
```

#### 2. **`.env`**
```bash
# API Backend
REACT_APP_API_URL=http://localhost:3001

# Configurações da aplicação
REACT_APP_NAME=Fênix CRM
REACT_APP_VERSION=1.0.0

# Configurações de desenvolvimento
REACT_APP_ENV=development
PORT=3900  # ← Nova configuração
```

#### 3. **`README.md`**
```bash
# O sistema estará disponível em:
# - Frontend: http://localhost:3900  # ← Porta atualizada
# - Backend API: http://localhost:3001
# - PostgreSQL: localhost:5432
```

### 🌐 **URLs de Acesso:**

- **Frontend Web**: `http://localhost:3900`
- **Backend API**: `http://localhost:3001` (inalterado)
- **PostgreSQL**: `localhost:5432` (inalterado)

### 🚀 **Como Executar:**

```bash
# Navegar para o diretório do frontend
cd c:\Projetos\fenixcrm\frontend-web

# Executar a aplicação na porta 3900
npm start

# Ou alternativamente (PowerShell):
$env:PORT=3900; npm start
```

### 📝 **Observações:**

1. **Windows (CMD)**: `set PORT=3900 && npm start`
2. **Windows (PowerShell)**: `$env:PORT=3900; npm start`
3. **Linux/Mac**: `PORT=3900 npm start`

### ✨ **Vantagens da Porta 3900:**

- ✅ Evita conflitos com outras aplicações React (porta 3000)
- ✅ Facilita desenvolvimento simultâneo de múltiplos projetos
- ✅ Configuração persistente através do arquivo `.env`
- ✅ Compatível com Docker e ambientes de produção

### 🔧 **Para Alterar a Porta:**

1. Modificar a variável `PORT` no arquivo `.env`
2. Ou alterar o script `start` no `package.json`
3. Reiniciar a aplicação

---

**🎉 Configuração concluída com sucesso!**

O frontend do Fênix CRM agora está configurado para executar na porta **3900**.
