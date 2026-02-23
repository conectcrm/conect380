# 📋 CONVENÇÕES DE DESENVOLVIMENTO - CONECTCRM

## 🚫 **ARQUIVOS QUE NÃO DEVEM SER COMMITADOS**

### **Scripts Temporários:**
- `test-*.js`, `debug-*.js`, `temp-*.js`
- `script-*.js`, `exemplo-*.js`, `demonstracao-*.js`
- `correcao-*.js`, `fix-*.js`, `setup-*.js`
- `assistente-*.js`, `monitor-*.js`, `verificar-*.js`

### **Documentação Temporária:**
- `*_IMPLEMENTADO*.md`, `*_COMPLETA*.md`, `*_CONCLUIDA*.md`
- `CORRECAO_*.md`, `DEBUG_*.md`, `FIX_*.md`
- `FASE*.md`, `RELATORIO_*.md`, `PLANO_*.md`
- `GUIA_*.md` (apenas guias temporários)

### **Scripts de Sistema:**
- `*.bat`, `*.ps1` (exceto os essenciais do projeto)
- `fix-*.bat`, `setup-*.bat`, `test-*.bat`
- `executar-*.bat`, `otimizar-*.ps1`

### **Arquivos SQL de Teste:**
- `create-test-*.sql`, `debug-*.sql`, `test-*.sql`
- `insert-*-teste.sql`

---

## ✅ **BOAS PRÁTICAS**

### **1. Nomenclatura de Arquivos:**
- **Permanentes:** Use nomes descritivos sem prefixos temporários
- **Temporários:** Use prefixos como `temp-`, `test-`, `debug-`, `exemplo-`

### **2. Organização de Testes:**
- Coloque testes em `tests/` ou `__tests__/`
- Use extensão `.test.js` ou `.spec.js`

### **3. Documentação:**
- Documentação oficial vai em `docs/`
- Documentação temporária use prefixos como `TEMP_`, `DRAFT_`

### **4. Scripts Utilitários:**
- Scripts permanentes vão em `scripts/`
- Scripts temporários use prefixos descritivos

### **5. Desenvolvimento Local:**
- Use pastas `playground/`, `sandbox/`, `experiments/` para testes
- Essas pastas estão no `.gitignore`

---

## 🤖 **ORIENTAÇÕES PARA IA/COPILOT**

### **Obrigatório: Registro de Arquivos**
**TODA VEZ** que criar um arquivo, você DEVE registrá-lo em `.copilot-registry.md`:

```
2025-08-06 TIPO nome-arquivo.ext ATIVO "Descrição do propósito"
```

### **Exemplos de registro obrigatório:**
```
2025-08-06 TEMP temp-teste-login.js ATIVO "Script temporário para testar sistema de login"
2025-08-06 DEBUG debug-api-error.js ATIVO "Debug do erro 500 na API de clientes"
2025-08-06 EXAMPLE exemplo-modal-proposta.tsx ATIVO "Exemplo de implementação do modal"
2025-08-06 DOC TEMP_DOCUMENTACAO_API.md ATIVO "Rascunho da documentação da API"
```

### **Sistema de Auto-Limpeza:**
O sistema irá automaticamente:
1. **Verificar** arquivos registrados vs arquivos reais
2. **Remover** arquivos temporários antigos (7+ dias)
3. **Detectar** arquivos órfãos não registrados
4. **Atualizar** status para REMOVIDO após limpeza

### **Quando criar arquivos temporários:**
1. **Use prefixos claros:** `temp-`, `test-`, `debug-`, `exemplo-`
2. **Registre imediatamente** no `.copilot-registry.md`
3. **Coloque em pastas adequadas:** `playground/`, `temp/`, `tests/`
4. **Documente o propósito:** Comente o que o arquivo faz
5. **Marque como OBSOLETO** quando não precisar mais

### **Exemplo de workflow correto:**
```
1. Criar arquivo: temp-teste-api.js
2. Registrar: 2025-08-06 TEMP temp-teste-api.js ATIVO "Teste da API de clientes"
3. Usar/testar conforme necessário
4. Quando terminar: Marcar como OBSOLETO no registro
5. Auto-limpeza remove automaticamente
```

### **Exemplo de nomenclatura correta:**
```
✅ CORRETO:
- temp-teste-api.js
- debug-conexao-db.js
- exemplo-modal-cliente.js
- TEMP_DOCUMENTACAO_FEATURE.md

❌ EVITAR:
- api.js (muito genérico)
- teste.js (sem contexto)
- arquivo1.js (sem propósito)
- DOC.md (não descritivo)
```

### **Estrutura recomendada:**
```
src/
├── components/     # Componentes permanentes
├── utils/          # Utilitários permanentes
├── services/       # Serviços permanentes
tests/
├── unit/          # Testes unitários
├── integration/   # Testes de integração
playground/        # Experimentos temporários (gitignore)
├── temp-*.js      # Arquivos temporários de teste
└── examples/      # Exemplos de uso
```

---

## 🧹 **LIMPEZA AUTOMÁTICA**

### **Script de Limpeza Periódica:**
Execute mensalmente: `.\limpeza-massa.ps1`

### **Pre-commit Hook (Recomendado):**
```bash
#!/bin/sh
# Verificar se há arquivos temporários sendo commitados
if git diff --cached --name-only | grep -E "(test-|debug-|temp-|exemplo-)" > /dev/null; then
    echo "❌ Arquivos temporários detectados! Execute limpeza antes do commit."
    exit 1
fi
```

### **Verificação Regular:**
- Revisar arquivos antes de cada commit
- Usar `git status` para verificar novos arquivos
- Executar limpeza antes de releases

---

## 📞 **CONTATO PARA DÚVIDAS**

Se tiver dúvidas sobre nomenclatura ou organização de arquivos, consulte este documento ou peça orientação à equipe.

**Última atualização:** 06/08/2025
