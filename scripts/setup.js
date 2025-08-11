#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, cwd = process.cwd()) {
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd,
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    return true;
  } catch (error) {
    log(`❌ Erro ao executar: ${command}`, 'red');
    return false;
  }
}

async function setupProject() {
  log('🏗️  Setup do Sistema de Padronização ConectCRM', 'cyan');
  log('================================================', 'cyan');
  log('');

  // 1. Verificar dependências do sistema
  log('📋 Verificando dependências do sistema...', 'blue');
  
  try {
    execSync('node --version', { stdio: 'pipe' });
    log('✅ Node.js encontrado', 'green');
  } catch {
    log('❌ Node.js não encontrado. Instale em: https://nodejs.org/', 'red');
    process.exit(1);
  }

  try {
    execSync('npm --version', { stdio: 'pipe' });
    log('✅ npm encontrado', 'green');
  } catch {
    log('❌ npm não encontrado', 'red');
    process.exit(1);
  }

  log('');

  // 2. Instalar dependências root
  log('📦 Instalando dependências principais...', 'blue');
  if (!execCommand('npm install')) {
    log('❌ Falha ao instalar dependências principais', 'red');
    process.exit(1);
  }
  log('✅ Dependências principais instaladas', 'green');
  log('');

  // 3. Setup backend
  log('🔧 Configurando backend...', 'blue');
  if (fs.existsSync('./backend')) {
    if (!execCommand('npm install', './backend')) {
      log('❌ Falha ao instalar dependências do backend', 'red');
      process.exit(1);
    }
    log('✅ Backend configurado', 'green');
  } else {
    log('⚠️  Diretório backend não encontrado', 'yellow');
  }
  log('');

  // 4. Setup frontend
  log('🎨 Configurando frontend...', 'blue');
  if (fs.existsSync('./frontend-web')) {
    if (!execCommand('npm install', './frontend-web')) {
      log('❌ Falha ao instalar dependências do frontend', 'red');
      process.exit(1);
    }
    log('✅ Frontend configurado', 'green');
  } else {
    log('⚠️  Diretório frontend-web não encontrado', 'yellow');
  }
  log('');

  // 5. Criar arquivos de configuração
  log('⚙️  Criando arquivos de configuração...', 'blue');
  
  // .gitignore atualizado
  const gitignoreContent = `
# Dependencies
node_modules/
*/node_modules/

# Build outputs
build/
dist/
*/build/
*/dist/

# Environment files
.env
.env.local
.env.production
*.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
logs/

# Generated files
generated/
*.generated.*

# Temporary files
temp/
tmp/
*.tmp

# Database
*.db
*.sqlite

# Coverage
coverage/
.nyc_output/
`;

  fs.writeFileSync('./.gitignore', gitignoreContent);
  log('✅ .gitignore criado', 'green');

  // Configuração do VS Code
  if (!fs.existsSync('./.vscode')) {
    fs.mkdirSync('./.vscode');
  }

  const vscodeSettings = {
    "typescript.preferences.includePackageJsonAutoImports": "auto",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "files.associations": {
      "*.tsx": "typescriptreact"
    },
    "emmet.includeLanguages": {
      "typescriptreact": "html"
    }
  };

  fs.writeFileSync('./.vscode/settings.json', JSON.stringify(vscodeSettings, null, 2));
  log('✅ Configuração VS Code criada', 'green');

  log('');

  // 6. Verificar instalação
  log('🔍 Verificando instalação...', 'blue');
  
  const requiredFiles = [
    './templates/PageTemplate/PageTemplate.tsx',
    './scripts/generators/generatePage.js',
    './frontend-web/src/hooks/base/useEntityCRUD.ts',
    './frontend-web/src/hooks/base/useSecureForm.ts',
    './frontend-web/src/hooks/base/useDataTable.ts'
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} não encontrado`, 'red');
      allFilesExist = false;
    }
  }

  log('');

  if (allFilesExist) {
    log('🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!', 'green');
    log('', 'green');
    log('📋 Próximos passos:', 'cyan');
    log('1. Executar: npm run generate:page', 'cyan');
    log('2. Seguir o wizard interativo', 'cyan');
    log('3. Implementar APIs no backend', 'cyan');
    log('4. Configurar permissões', 'cyan');
    log('5. Testar a nova tela', 'cyan');
    log('');
    log('📖 Documentação completa em:', 'blue');
    log('   - ./SETUP_PADRONIZACAO.md', 'blue');
    log('   - ./docs/features/EXEMPLO_PRATICO_GERACAO.md', 'blue');
    log('');
    log('🚀 Sistema pronto para gerar telas em segundos!', 'bright');
  } else {
    log('❌ Instalação incompleta. Verifique os arquivos em falta.', 'red');
    process.exit(1);
  }
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
  setupProject().catch(error => {
    log(`❌ Erro durante setup: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = setupProject;
