# 🔒 Git Hooks e Pre-commit - Automação de Qualidade

**Objetivo**: Bloquear commits de código com problemas de qualidade automaticamente.

---

## 📦 Instalar Husky (Git Hooks)

### Passo 1: Instalar Dependências

```powershell
cd c:\Projetos\conectcrm\backend
npm install --save-dev husky lint-staged

cd c:\Projetos\conectcrm\frontend-web
npm install --save-dev husky lint-staged
```

### Passo 2: Inicializar Husky

```powershell
# Backend
cd c:\Projetos\conectcrm\backend
npx husky init
git add .husky/pre-commit

# Frontend
cd c:\Projetos\conectcrm\frontend-web  
npx husky init
git add .husky/pre-commit
```

---

## ⚙️ Configurar Pre-commit Hook

### Backend - package.json

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --max-warnings 0",
    "lint:fix": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.ts\"",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix --max-warnings 0",
      "prettier --write",
      "git add"
    ]
  }
}
```

### Frontend - package.json

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,scss,md}\"",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write",
      "git add"
    ],
    "*.{json,css,scss,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

---

## 🔧 Configurar .husky/pre-commit

### Backend - .husky/pre-commit

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Executando verificações de qualidade..."

# Lint + Type Check
npm run lint || {
  echo "❌ ESLint falhou! Corrija os erros antes de commitar."
  exit 1
}

npm run type-check || {
  echo "❌ Type Check falhou! Corrija os erros de tipo antes de commitar."
  exit 1
}

# Lint-staged (formatar apenas arquivos modificados)
npx lint-staged || {
  echo "❌ Lint-staged falhou! Corrija os erros de formatação."
  exit 1
}

echo "✅ Verificações de qualidade passaram!"
```

### Frontend - .husky/pre-commit

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Executando verificações de qualidade..."

# Lint + Type Check
npm run lint || {
  echo "❌ ESLint falhou! Corrija os erros antes de commitar."
  exit 1
}

npm run type-check || {
  echo "❌ Type Check falhou! Corrija os erros de tipo antes de commitar."
  exit 1
}

# Lint-staged (formatar apenas arquivos modificados)
npx lint-staged || {
  echo "❌ Lint-staged falhou! Corrija os erros de formatação."
  exit 1
}

echo "✅ Verificações de qualidade passaram!"
```

---

## 🚫 Regras de Bloqueio (Pre-commit)

O commit será **BLOQUEADO** se:

### ❌ 1. ESLint Errors (0 tolerância)
```typescript
// ❌ BLOQUEADO
const data: any = response.data;
console.log(data); // Warning

// ✅ PERMITIDO
const data: ResponseDto = response.data;
this.logger.log('Data received', 'ServiceName');
```

### ❌ 2. TypeScript Errors (0 tolerância)
```typescript
// ❌ BLOQUEADO
function enviar(mensagem) { // Sem tipo
  return mensagem.id;
}

// ✅ PERMITIDO
function enviar(mensagem: Mensagem): string {
  return mensagem.id;
}
```

### ❌ 3. Formatação Incorreta (Prettier)
```typescript
// ❌ BLOQUEADO (espaçamento errado)
const obj={foo:1,bar:2};

// ✅ PERMITIDO (formatado pelo Prettier)
const obj = { foo: 1, bar: 2 };
```

### ❌ 4. Imports Não Usados
```typescript
// ❌ BLOQUEADO
import { Injectable, Logger } from '@nestjs/common'; // Logger não usado

// ✅ PERMITIDO
import { Injectable } from '@nestjs/common';
```

---

## 🔓 Bypass do Pre-commit (Emergências)

### Quando Usar
- ⚠️ **APENAS EM EMERGÊNCIAS**: Bug crítico em produção
- ⚠️ **NUNCA** use rotineiramente
- ⚠️ Crie issue para corrigir depois

### Como Fazer
```powershell
git commit -m "fix: corrigir bug crítico" --no-verify

# OU
$env:HUSKY=0
git commit -m "fix: corrigir bug crítico"
```

---

## 📋 Commit Message Linter (Commitlint)

### Instalar Commitlint

```powershell
cd c:\Projetos\conectcrm
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### Configurar commitlint.config.js

**Arquivo**: `commitlint.config.js` (raiz do projeto)

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nova funcionalidade
        'fix',      // Correção de bug
        'docs',     // Documentação
        'style',    // Formatação (sem mudança de código)
        'refactor', // Refatoração
        'test',     // Adicionar/modificar testes
        'chore',    // Tarefas de build, configs
        'perf',     // Melhoria de performance
        'revert',   // Reverter commit anterior
      ],
    ],
    'type-case': [2, 'always', 'lowerCase'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};
```

### Configurar .husky/commit-msg

**Arquivo**: `.husky/commit-msg`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no-install commitlint --edit "$1" || {
  echo ""
  echo "❌ Mensagem de commit inválida!"
  echo ""
  echo "Formato correto:"
  echo "  <tipo>(<escopo>): <descrição>"
  echo ""
  echo "Exemplos:"
  echo "  feat(atendimento): implementar store centralizada"
  echo "  fix(chat): corrigir scroll automático"
  echo "  docs: atualizar README"
  echo ""
  echo "Tipos permitidos:"
  echo "  feat | fix | docs | style | refactor | test | chore | perf"
  echo ""
  exit 1
}
```

---

## ✅ Exemplos de Mensagens Válidas

```bash
# ✅ Nova funcionalidade
git commit -m "feat(atendimento): implementar store centralizada com Zustand"

# ✅ Correção de bug
git commit -m "fix(chat): corrigir scroll automático ao receber mensagem"

# ✅ Documentação
git commit -m "docs: adicionar guia de contribuição"

# ✅ Refatoração
git commit -m "refactor(websocket): extrair lógica de reconexão"

# ✅ Performance
git commit -m "perf(mensagens): otimizar query de listagem"

# ✅ Testes
git commit -m "test(atendimento): adicionar testes unitários do service"
```

---

## ❌ Exemplos de Mensagens Inválidas

```bash
# ❌ Sem tipo
git commit -m "implementar store"

# ❌ Tipo inválido
git commit -m "add(atendimento): implementar store"

# ❌ Sem descrição
git commit -m "feat(atendimento):"

# ❌ Com ponto final
git commit -m "feat(atendimento): implementar store."

# ❌ Muito longa (> 100 caracteres)
git commit -m "feat(atendimento): implementar store centralizada com Zustand para gerenciar estado de tickets mensagens e clientes"
```

---

## 🔄 Fluxo de Commit Completo

```powershell
# 1. Fazer alterações no código
# ...

# 2. Adicionar arquivos
git add .

# 3. Tentar commitar (pre-commit hooks rodam automaticamente)
git commit -m "feat(atendimento): implementar store centralizada"

# 4. Hooks executam:
#    ✅ ESLint
#    ✅ Type Check
#    ✅ Prettier
#    ✅ Commitlint

# 5a. Se tudo passar:
#     ✅ Commit criado com sucesso!

# 5b. Se algo falhar:
#     ❌ Commit bloqueado
#     📝 Corrigir erros
#     🔄 Tentar novamente
```

---

## 🎯 Checklist de Instalação

Execute estes comandos para configurar tudo:

```powershell
# Backend
cd c:\Projetos\conectcrm\backend
npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
echo 'npx lint-staged' > .husky/pre-commit
echo 'npx commitlint --edit $1' > .husky/commit-msg

# Frontend
cd c:\Projetos\conectcrm\frontend-web
npm install --save-dev husky lint-staged
npx husky init
echo 'npx lint-staged' > .husky/pre-commit

# Raiz (commitlint)
cd c:\Projetos\conectcrm
# Criar commitlint.config.js (usar template acima)

# Testar
git add .
git commit -m "chore: configurar git hooks e commitlint"
```

---

## 📊 Benefícios dos Git Hooks

### Antes (Sem Hooks)
- ❌ Código com `any` chegava no repositório
- ❌ console.log esquecidos em produção
- ❌ Erros de tipo só descobertos depois
- ❌ Formatação inconsistente
- ❌ Mensagens de commit ruins

### Depois (Com Hooks)
- ✅ **100% de código limpo** no repositório
- ✅ Erros detectados **antes** do commit
- ✅ Formatação automática
- ✅ Mensagens de commit padronizadas
- ✅ Economia de tempo em code review

---

## 🚨 Avisos Importantes

1. **Performance**: Pre-commit pode demorar 5-10 segundos
   - Aceitar este tempo para garantir qualidade

2. **Bypass**: Use `--no-verify` **APENAS EM EMERGÊNCIAS**
   - Crie issue para corrigir depois

3. **CI/CD**: Configure mesmas verificações no pipeline
   - Pre-commit é primeira linha de defesa
   - CI/CD é segunda linha

4. **Onboarding**: Novos desenvolvedores precisam:
   - Instalar Node.js 16+
   - Executar `npm install` (instala hooks automaticamente)
   - Ler este documento

---

## 🎓 Treinamento da Equipe

### Comunicar aos Desenvolvedores

> **Atenção**: A partir de agora, todos os commits passarão por verificação automática de qualidade.
> 
> - ✅ **Sem `any` types**
> - ✅ **Sem console.log**
> - ✅ **Formatação automática**
> - ✅ **Mensagens de commit padronizadas**
> 
> Se o commit falhar, **corrija os erros antes de tentar novamente**.
> 
> **Documentação completa**: `GIT_HOOKS_PRECOMMIT.md`

---

**Próxima Etapa**: Testar hooks com commit real após implementar store Zustand
