# 📋 Dependências Aprovadas - Fênix CRM Frontend

> ⚠️ **IMPORTANTE**: Antes de instalar qualquer nova dependência, consulte este documento.

## 🔧 **Versões de Runtime**
- **Node.js**: `22.16.0` (LTS)
- **NPM**: `10.9.2+`
- **TypeScript**: `4.8.4`

## 📦 **Dependências Principais (Não Remover)**

### **Framework Base**
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-scripts": "^5.0.1",
  "typescript": "^4.8.4"
}
```

### **Roteamento e Estado**
```json
{
  "react-router-dom": "^6.4.2",
  "react-query": "^3.39.2"
}
```

### **Formulários e Validação**
```json
{
  "react-hook-form": "^7.37.0",
  "@hookform/resolvers": "^2.9.11",
  "yup": "^0.32.11"
}
```

### **UI e Styling**
```json
{
  "tailwindcss": "^3.2.1",
  "postcss": "^8.4.17",
  "autoprefixer": "^10.4.12",
  "lucide-react": "^0.284.0",
  "react-icons": "^5.5.0",
  "clsx": "^1.2.1"
}
```

### **Comunicação HTTP**
```json
{
  "axios": "^1.1.3"
}
```

### **Notificações e Feedback**
```json
{
  "react-hot-toast": "^2.4.0"
}
```

### **Utilitários de Data**
```json
{
  "date-fns": "^2.29.3",
  "react-datepicker": "^4.8.0"
}
```

### **Gráficos e Visualização**
```json
{
  "recharts": "^2.8.0"
}
```

### **Internacionalização**
```json
{
  "i18next": "^22.0.4",
  "react-i18next": "^12.0.0",
  "i18next-browser-languagedetector": "^7.0.1"
}
```

### **Máscaras e Formatação**
```json
{
  "react-input-mask": "^2.0.4"
}
```

## 🚫 **Dependências Proibidas**

### **❌ Evitar Essas Bibliotecas:**
- `moment.js` → **Use:** `date-fns`
- `lodash` → **Use:** Métodos nativos do JS/TS
- `jquery` → **Use:** React hooks e eventos nativos
- `bootstrap` → **Use:** TailwindCSS
- `material-ui` → **Use:** Componentes base customizados
- `antd` → **Use:** Componentes base customizados
- `styled-components` → **Use:** TailwindCSS
- `emotion` → **Use:** TailwindCSS

### **❌ Versões Específicas a Evitar:**
- `ajv@6.x.x` → **Use:** `ajv@8.12.0`
- `@types/react@19.x.x` → **Use:** `@types/react@18.3.23`

## ✅ **Processo para Adicionar Novas Dependências**

### **1. Verificação Obrigatória**
Antes de instalar qualquer dependência:

```bash
# 1. Verificar se já existe alternativa aprovada
grep -r "funcionalidade_desejada" DEPENDENCIAS_APROVADAS.md

# 2. Verificar compatibilidade com React 18
npm info [pacote] peerDependencies

# 3. Verificar tamanho do bundle
npm info [pacote] | grep unpacked

# 4. Verificar vulnerabilidades conhecidas
npm audit [pacote]
```

### **2. Instalação Segura**
```bash
# Sempre usar versões exatas e legacy-peer-deps
npm install [pacote]@[versao-exata] --save-exact --legacy-peer-deps

# Para dev dependencies
npm install [pacote]@[versao-exata] --save-dev --save-exact --legacy-peer-deps
```

### **3. Documentação Obrigatória**
- Adicionar à lista de dependências aprovadas
- Documentar o motivo da escolha
- Listar alternativas consideradas
- Definir como será usada no projeto

## 🔍 **Auditoria Regular**

### **Comando de Limpeza (Executar Mensalmente)**
```bash
# 1. Verificar dependências não utilizadas
npx depcheck

# 2. Verificar vulnerabilidades
npm audit

# 3. Verificar atualizações disponíveis
npm outdated

# 4. Limpeza de cache
npm cache clean --force
```

### **Ferramentas de Análise**
```bash
# Instalar ferramentas de análise (apenas para dev)
npm install --save-dev depcheck bundle-analyzer-webpack-plugin

# Analisar bundle size
npm run build && npx webpack-bundle-analyzer build/static/js/*.js
```

## 📊 **Monitoramento de Performance**

### **Métricas a Monitorar:**
- Bundle size total < 2MB
- Número de dependências < 50
- Vulnerabilidades = 0 (high/critical)
- Build time < 60s

### **Alertas Automáticos:**
```json
{
  "scripts": {
    "check-deps": "depcheck && npm audit --audit-level high",
    "check-bundle": "npm run build && bundlesize",
    "health-check": "npm run check-deps && npm run check-bundle"
  }
}
```

## 🛠️ **Resolução de Conflitos**

### **Conflitos de Peer Dependencies:**
1. **Primeiro**: Tentar versão compatível
2. **Segundo**: Usar `--legacy-peer-deps`
3. **Último recurso**: Resolutions no package.json

### **Exemplo de Resolutions:**
```json
{
  "overrides": {
    "ajv": "8.12.0",
    "@types/react": "18.3.23"
  }
}
```

## 📝 **Notas Importantes**

- **Sempre testar** após instalar/atualizar dependências
- **Documentar mudanças** no changelog
- **Revisar em equipe** antes de aprovar novas dependências
- **Backup do package-lock.json** antes de mudanças grandes

---

**Última atualização:** 20 de julho de 2025  
**Responsável:** Equipe de Desenvolvimento Fênix CRM
