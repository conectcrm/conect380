# 🧹 GUIA DE LIMPEZA E ORGANIZAÇÃO - CONECTCRM

## 🎯 **OBJETIVO**
Manter o projeto limpo, organizado e sem arquivos temporários que possam comprometer a qualidade do código e a experiência de desenvolvimento.

---

## 🚨 **PROBLEMAS QUE ESTAMOS EVITANDO**
- ✋ Commits acidentais de arquivos temporários
- 🗂️ Repositório bagunçado com scripts de teste
- 🔍 Dificuldade para encontrar arquivos importantes
- 📦 Builds desnecessariamente pesados
- 👥 Confusão para novos desenvolvedores

---

## 🛠️ **FERRAMENTAS IMPLEMENTADAS**

### **1. `.gitignore` Melhorado**
- Bloqueia automaticamente arquivos com padrões temporários
- Inclui pastas de desenvolvimento como `playground/`, `sandbox/`
- Previne commit de scripts de teste e debug

### **2. Pre-commit Hook**
- Verifica arquivos antes de cada commit
- Rejeita commits que contenham arquivos temporários
- Orientações automáticas para correção

### **3. Script de Limpeza Automática**
```powershell
# Execute quando necessário
.\limpeza-massa.ps1
```

### **4. Tasks do VS Code**
- **Ctrl+Shift+P** → "Tasks: Run Task"
- Escolha: "🧹 Limpeza de Arquivos Temporários"
- Ou: "📋 Verificar Arquivos Temporários"

---

## 📋 **CONVENÇÕES DE NOMENCLATURA**

### **✅ ARQUIVOS PERMANENTES:**
```
src/
├── components/AuthModal.tsx
├── services/apiService.js
├── utils/dateHelper.js
└── hooks/useAuth.js

docs/
├── API_DOCUMENTATION.md
├── DEPLOYMENT_GUIDE.md
└── USER_MANUAL.md
```

### **⚠️ ARQUIVOS TEMPORÁRIOS (usar com cuidado):**
```
playground/
├── temp-test-api.js
├── debug-connection-issue.js
└── example-modal-usage.jsx

tests/
├── auth.test.js
├── api.spec.js
└── components.test.tsx
```

---

## 🔄 **WORKFLOW RECOMENDADO**

### **Para Desenvolvimento Diário:**
1. **Antes de começar:** Verifique se há arquivos temporários
   ```bash
   # Use a task do VS Code ou:
   git status
   ```

2. **Durante desenvolvimento:** Use pastas adequadas
   ```
   ✅ CORRETO: playground/temp-feature-test.js
   ❌ EVITAR: feature-test.js (na raiz)
   ```

3. **Antes de commit:** O pre-commit hook verificará automaticamente

4. **Semanalmente:** Execute limpeza
   ```powershell
   .\limpeza-massa.ps1
   ```

### **Para Releases:**
1. Execute limpeza completa
2. Verifique estrutura do projeto
3. Confirme que apenas arquivos essenciais estão incluídos

---

## 🤖 **ORIENTAÇÕES PARA IA/COPILOT**

Quando solicitar criação de arquivos ao Copilot, seja específico sobre:

### **Arquivos Permanentes:**
```
"Crie um serviço para autenticação em src/services/authService.js"
"Adicione documentação em docs/AUTH_GUIDE.md"
```

### **Arquivos Temporários:**
```
"Crie um teste temporário em playground/temp-auth-test.js"
"Faça um exemplo em examples/modal-usage-example.tsx"
```

### **Testes:**
```
"Crie testes unitários em tests/auth.test.js"
"Adicione testes de integração em tests/integration/"
```

---

## 🚨 **SINAIS DE ALERTA**

### **Quando executar limpeza imediatamente:**
- ⚠️ Mais de 10 arquivos com prefixos temporários
- ⚠️ Documentos `.md` com nomes estranhos na raiz
- ⚠️ Scripts `.js` com nomes genéricos (`teste.js`, `script.js`)
- ⚠️ Muitos arquivos `.bat` ou `.ps1` na raiz
- ⚠️ Pastas com nomes como `backup`, `old`, `temp`

### **Verificação rápida:**
```powershell
# Contar arquivos suspeitos
Get-ChildItem -Recurse -File | Where-Object { 
    $_.Name -match "^(test-|debug-|temp-|script-)" 
} | Measure-Object
```

---

## 📞 **SUPORTE**

### **Problemas comuns:**
1. **"Pre-commit rejeitou meu commit"**
   - Execute `.\limpeza-massa.ps1`
   - Ou mova arquivos para `playground/`

2. **"Não sei se posso remover um arquivo"**
   - Se tem prefixo temporário → pode remover
   - Se está na raiz e não é essencial → mover para pasta adequada
   - Na dúvida, consulte `CONVENCOES_DESENVOLVIMENTO.md`

3. **"Script de limpeza não funcionou"**
   - Verifique se está na pasta correta
   - Execute como administrador se necessário

### **Contato:**
- Consulte `CONVENCOES_DESENVOLVIMENTO.md`
- Abra issue no repositório para dúvidas

---

**✨ Projeto limpo = Desenvolvimento produtivo!**
