# 🛠️ CONFIGURAÇÃO RÁPIDA - PostgreSQL Local

## 📥 **1. Instalar PostgreSQL**

### Download e Instalação:
1. Baixe PostgreSQL em: https://www.postgresql.org/download/windows/
2. Durante a instalação, defina uma senha para o usuário `postgres`
3. Anote a porta (padrão: 5432)

## 🎯 **2. Configurar Banco para o Fênix CRM**

### Abra o Command Prompt como Administrador e execute:

```cmd
# Navegar para o diretório do PostgreSQL (ajuste o caminho se necessário)
cd "C:\Program Files\PostgreSQL\15\bin"

# Conectar ao PostgreSQL
psql -U postgres

# Executar os comandos SQL (um por vez):
CREATE USER fenixcrm WITH PASSWORD 'fenixcrm123';
CREATE DATABASE fenixcrm_db OWNER fenixcrm;
GRANT ALL PRIVILEGES ON DATABASE fenixcrm_db TO fenixcrm;
\q
```

## 🔄 **3. Executar Script de Usuários**

```cmd
# Ainda no diretório bin do PostgreSQL
psql -U fenixcrm -d fenixcrm_db -f "C:\Projetos\fenixcrm\init-users.sql"
```

## ✅ **4. Verificar Configuração**

```cmd
# Testar conexão
psql -U fenixcrm -d fenixcrm_db -c "SELECT version();"
```

## 🚀 **5. Reiniciar o Backend**

Após configurar o banco, o backend deve conectar automaticamente!

---

## 🆘 **ALTERNATIVA: USAR DADOS MOCK**

Se você não quiser configurar PostgreSQL agora, posso configurar o frontend para usar dados simulados (mock) que já funcionarão com o dashboard que criamos.

**Escolha:**
- ✅ **Configurar PostgreSQL**: Seguir instruções acima
- ✅ **Usar dados mock**: Eu configuro dados falsos para testar o frontend

Qual prefere?
