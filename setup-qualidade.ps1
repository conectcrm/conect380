# 🛠️ Script de Setup - Qualidade de Código

Write-Host "🚀 Configurando ambiente de qualidade de código..." -ForegroundColor Cyan

# ============================================
# 1. INSTALAR DEPENDÊNCIAS DE QUALIDADE
# ============================================

Write-Host "`n📦 Instalando dependências de qualidade..." -ForegroundColor Yellow

# Backend
Write-Host "  Backend..." -ForegroundColor Gray
Set-Location backend

npm install --save-dev `
  @typescript-eslint/eslint-plugin@latest `
  @typescript-eslint/parser@latest `
  eslint@latest `
  eslint-config-prettier@latest `
  eslint-plugin-prettier@latest `
  prettier@latest `
  husky@latest `
  lint-staged@latest `
  @commitlint/cli@latest `
  @commitlint/config-conventional@latest

# Frontend
Write-Host "  Frontend..." -ForegroundColor Gray
Set-Location ../frontend-web

npm install --save-dev `
  @typescript-eslint/eslint-plugin@latest `
  @typescript-eslint/parser@latest `
  eslint@latest `
  eslint-config-prettier@latest `
  eslint-plugin-prettier@latest `
  eslint-plugin-react@latest `
  eslint-plugin-react-hooks@latest `
  prettier@latest `
  husky@latest `
  lint-staged@latest `
  @testing-library/react@latest `
  @testing-library/jest-dom@latest `
  @testing-library/user-event@latest

Set-Location ..

Write-Host "✅ Dependências instaladas!" -ForegroundColor Green

# ============================================
# 2. CONFIGURAR ESLINT
# ============================================

Write-Host "`n⚙️ Configurando ESLint..." -ForegroundColor Yellow

# Backend ESLint
$backendEslintConfig = @'
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "tsconfig.json",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint/eslint-plugin"],
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "root": true,
  "env": {
    "node": true,
    "jest": true
  },
  "ignorePatterns": [".eslintrc.js", "dist", "node_modules"],
  "rules": {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error"
  }
}
'@

$backendEslintConfig | Out-File -FilePath "backend/.eslintrc.json" -Encoding UTF8

# Frontend ESLint
$frontendEslintConfig = @'
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
'@

$frontendEslintConfig | Out-File -FilePath "frontend-web/.eslintrc.json" -Encoding UTF8

Write-Host "✅ ESLint configurado!" -ForegroundColor Green

# ============================================
# 3. CONFIGURAR PRETTIER
# ============================================

Write-Host "`n🎨 Configurando Prettier..." -ForegroundColor Yellow

$prettierConfig = @'
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
'@

$prettierConfig | Out-File -FilePath "backend/.prettierrc" -Encoding UTF8
$prettierConfig | Out-File -FilePath "frontend-web/.prettierrc" -Encoding UTF8

Write-Host "✅ Prettier configurado!" -ForegroundColor Green

# ============================================
# 4. CONFIGURAR HUSKY (GIT HOOKS)
# ============================================

Write-Host "`n🪝 Configurando Husky..." -ForegroundColor Yellow

# Backend
Set-Location backend
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
npx husky add .husky/commit-msg "npx --no -- commitlint --edit \$1"

# Frontend
Set-Location ../frontend-web
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run type-check"

Set-Location ..

Write-Host "✅ Husky configurado!" -ForegroundColor Green

# ============================================
# 5. CONFIGURAR COMMITLINT
# ============================================

Write-Host "`n📝 Configurando Commitlint..." -ForegroundColor Yellow

$commitlintConfig = @'
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
        'style',    // Formatação
        'refactor', // Refatoração
        'test',     // Testes
        'chore',    // Tarefas gerais
        'perf',     // Performance
        'ci',       // CI/CD
        'build',    // Build
        'revert'    // Reverter commit
      ]
    ],
    'subject-case': [2, 'never', ['upper-case']]
  }
};
'@

$commitlintConfig | Out-File -FilePath "commitlint.config.js" -Encoding UTF8

Write-Host "✅ Commitlint configurado!" -ForegroundColor Green

# ============================================
# 6. ADICIONAR SCRIPTS NO PACKAGE.JSON
# ============================================

Write-Host "`n📜 Adicionando scripts de qualidade..." -ForegroundColor Yellow

# Backend
$backendPackageJsonPath = "backend/package.json"
if (Test-Path $backendPackageJsonPath) {
  $packageJson = Get-Content $backendPackageJsonPath | ConvertFrom-Json
    
  # Adicionar scripts
  $packageJson.scripts | Add-Member -NotePropertyName "lint" -NotePropertyValue "eslint . --ext .ts --max-warnings 0" -Force
  $packageJson.scripts | Add-Member -NotePropertyName "lint:fix" -NotePropertyValue "eslint . --ext .ts --fix" -Force
  $packageJson.scripts | Add-Member -NotePropertyName "type-check" -NotePropertyValue "tsc --noEmit" -Force
  $packageJson.scripts | Add-Member -NotePropertyName "format" -NotePropertyValue "prettier --write \`"src/**/*.ts\`"" -Force
    
  $packageJson | ConvertTo-Json -Depth 10 | Out-File $backendPackageJsonPath -Encoding UTF8
}

# Frontend
$frontendPackageJsonPath = "frontend-web/package.json"
if (Test-Path $frontendPackageJsonPath) {
  $packageJson = Get-Content $frontendPackageJsonPath | ConvertFrom-Json
    
  # Adicionar scripts
  $packageJson.scripts | Add-Member -NotePropertyName "lint" -NotePropertyValue "eslint . --ext .ts,.tsx --max-warnings 0" -Force
  $packageJson.scripts | Add-Member -NotePropertyName "lint:fix" -NotePropertyValue "eslint . --ext .ts,.tsx --fix" -Force
  $packageJson.scripts | Add-Member -NotePropertyName "type-check" -NotePropertyValue "tsc --noEmit" -Force
  $packageJson.scripts | Add-Member -NotePropertyName "format" -NotePropertyValue "prettier --write \`"src/**/*.{ts,tsx}\`"" -Force
    
  $packageJson | ConvertTo-Json -Depth 10 | Out-File $frontendPackageJsonPath -Encoding UTF8
}

Write-Host "✅ Scripts adicionados!" -ForegroundColor Green

# ============================================
# 7. CRIAR SCRIPT DE VERIFICAÇÃO
# ============================================

Write-Host "`n🔍 Criando script de verificação..." -ForegroundColor Yellow

$verificacaoScript = @'
# 🔍 Script de Verificação de Qualidade

Write-Host "🔍 VERIFICAÇÃO DE QUALIDADE DE CÓDIGO" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$erros = 0
$avisos = 0

# 1. LINT
Write-Host "`n📝 Executando Lint..." -ForegroundColor Yellow
Set-Location backend
npm run lint
if ($LASTEXITCODE -ne 0) {
    $erros++
    Write-Host "❌ Lint FALHOU no backend!" -ForegroundColor Red
} else {
    Write-Host "✅ Lint OK no backend" -ForegroundColor Green
}

Set-Location ../frontend-web
npm run lint
if ($LASTEXITCODE -ne 0) {
    $erros++
    Write-Host "❌ Lint FALHOU no frontend!" -ForegroundColor Red
} else {
    Write-Host "✅ Lint OK no frontend" -ForegroundColor Green
}

Set-Location ..

# 2. TYPE CHECK
Write-Host "`n🔧 Executando Type Check..." -ForegroundColor Yellow
Set-Location backend
npm run type-check
if ($LASTEXITCODE -ne 0) {
    $erros++
    Write-Host "❌ Type Check FALHOU no backend!" -ForegroundColor Red
} else {
    Write-Host "✅ Type Check OK no backend" -ForegroundColor Green
}

Set-Location ../frontend-web
npm run type-check
if ($LASTEXITCODE -ne 0) {
    $erros++
    Write-Host "❌ Type Check FALHOU no frontend!" -ForegroundColor Red
} else {
    Write-Host "✅ Type Check OK no frontend" -ForegroundColor Green
}

Set-Location ..

# 3. BUSCAR CONSOLE.LOG
Write-Host "`n🔍 Procurando console.log..." -ForegroundColor Yellow
$consoleLogs = Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx -Exclude node_modules,dist,build | 
    Select-String -Pattern "console\.log" -CaseSensitive

if ($consoleLogs) {
    $avisos++
    Write-Host "⚠️ console.log encontrado:" -ForegroundColor Yellow
    $consoleLogs | ForEach-Object {
        Write-Host "  $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Nenhum console.log encontrado" -ForegroundColor Green
}

# 4. BUSCAR ANY
Write-Host "`n🔍 Procurando tipo 'any'..." -ForegroundColor Yellow
$anyTypes = Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx -Exclude node_modules,dist,build | 
    Select-String -Pattern ": any" -CaseSensitive

if ($anyTypes) {
    $avisos++
    Write-Host "⚠️ Tipo 'any' encontrado:" -ForegroundColor Yellow
    $anyTypes | ForEach-Object {
        Write-Host "  $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Nenhum tipo 'any' encontrado" -ForegroundColor Green
}

# RESULTADO FINAL
Write-Host "`n=====================================" -ForegroundColor Cyan
if ($erros -eq 0 -and $avisos -eq 0) {
    Write-Host "✅ CÓDIGO LIMPO! Sem erros ou avisos." -ForegroundColor Green
    exit 0
} elseif ($erros -eq 0) {
    Write-Host "⚠️ $avisos avisos encontrados. Corrija antes de commitar." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ $erros erros encontrados. CORRIJA ANTES DE COMMITAR!" -ForegroundColor Red
    exit 1
}
'@

$verificacaoScript | Out-File -FilePath "verificar-qualidade.ps1" -Encoding UTF8

Write-Host "✅ Script de verificação criado!" -ForegroundColor Green

# ============================================
# 8. EXECUTAR VERIFICAÇÃO INICIAL
# ============================================

Write-Host "`n🧪 Executando verificação inicial..." -ForegroundColor Yellow

& .\verificar-qualidade.ps1

# ============================================
# FIM
# ============================================

Write-Host "`n🎉 SETUP COMPLETO!" -ForegroundColor Green
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "  1. Execute 'npm run lint:fix' para corrigir problemas automáticos" -ForegroundColor White
Write-Host "  2. Execute '.\verificar-qualidade.ps1' antes de cada commit" -ForegroundColor White
Write-Host "  3. Git hooks estão configurados e serão executados automaticamente" -ForegroundColor White
Write-Host "`n📚 Leia REGRAS_ANTI_GAMBIARRAS.md para todas as regras!" -ForegroundColor Yellow
