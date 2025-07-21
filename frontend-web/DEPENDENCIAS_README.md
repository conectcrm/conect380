# 🔧 Guia de Dependências - Fênix CRM Frontend

## 🚀 **Comandos Rápidos**

```bash
# Verificar saúde geral do projeto
npm run health-check

# Verificar dependências específicas
npm run deps:check

# Verificar vulnerabilidades
npm run deps:audit

# Encontrar dependências não utilizadas
npm run deps:unused

# Ver dependências desatualizadas
npm run deps:update

# Limpar e reinstalar dependências
npm run deps:clean
```

## 📦 **Como Instalar Nova Dependência**

### ✅ **Processo Correto**
```bash
# 1. Consultar dependências aprovadas
cat ../DEPENDENCIAS_APROVADAS.md

# 2. Verificar se já existe alternativa
npm run deps:check

# 3. Instalar com versão exata
npm install [pacote]@[versao-exata] --save-exact --legacy-peer-deps

# 4. Verificar saúde após instalação
npm run health-check

# 5. Testar aplicação
npm start
```

### ❌ **O que NÃO fazer**
```bash
# Nunca instalar sem versão específica
npm install [pacote]  # ❌

# Nunca ignorar peer dependency warnings
npm install --force  # ❌

# Nunca instalar dependências proibidas
npm install moment lodash  # ❌
```

## 🛡️ **Proteções Implementadas**

### **1. Arquivo .npmrc**
- ✅ Legacy peer deps habilitado
- ✅ Versões exatas por padrão
- ✅ Engine strict ativado

### **2. Scripts de Verificação**
- ✅ `npm run deps:check` - Verifica conformidade
- ✅ `npm run health-check` - Verifica tudo
- ✅ `preinstall` hook - Alerta antes de instalar

### **3. Engines Configuration**
- ✅ Node.js >=22.16.0
- ✅ NPM >=10.9.2

## 🔍 **Solução de Problemas Comuns**

### **Erro: "Cannot find module 'ajv/dist/compile/codegen'"**
```bash
npm install ajv@8.12.0 --save-exact --legacy-peer-deps
```

### **Conflitos de Peer Dependencies**
```bash
# Usar legacy peer deps
npm install --legacy-peer-deps

# Ou adicionar override no package.json
```

### **Dependências Não Utilizadas**
```bash
# Verificar quais não são usadas
npm run deps:unused

# Remover manualmente
npm uninstall [dependencia-nao-usada]
```

### **Vulnerabilidades de Segurança**
```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente (cuidado com breaking changes)
npm audit fix

# Corrigir forçadamente (último recurso)
npm audit fix --force
```

## 📊 **Métricas de Qualidade**

### **Limites Recomendados:**
- 📦 Total de dependências: < 50
- 🔐 Vulnerabilidades high/critical: 0
- 📏 Bundle size: < 2MB
- ⏱️ Build time: < 60s

### **Monitoramento:**
```bash
# Verificar tamanho do bundle
npm run build
ls -lh build/static/js/

# Verificar número de dependências
npm ls --depth=0 | wc -l

# Verificar tempo de build
time npm run build
```

## 🎯 **Boas Práticas**

### **✅ Faça:**
- Use versões exatas (`1.2.3` ao invés de `^1.2.3`)
- Leia documentação antes de instalar
- Teste após cada instalação
- Mantenha dependências atualizadas
- Remova dependências não utilizadas

### **❌ Evite:**
- Instalar dependências pesadas sem necessidade
- Usar bibliotecas com muitas vulnerabilidades
- Ignorrar avisos de peer dependencies
- Misturar diferentes bibliotecas para a mesma função

## 🔄 **Manutenção Regular**

### **Semanalmente:**
```bash
npm run health-check
npm run deps:update
```

### **Mensalmente:**
```bash
npm run deps:unused
npm audit
npm outdated
```

### **Antes de Deploy:**
```bash
npm run health-check
npm run build
npm test
```

---

**💡 Dica:** Sempre consulte o arquivo `DEPENDENCIAS_APROVADAS.md` antes de instalar novas dependências!
