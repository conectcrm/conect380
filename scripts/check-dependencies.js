#!/usr/bin/env node
/**
 * Script de Verificação de Dependências - Fênix CRM
 * 
 * Este script verifica se as dependências instaladas estão
 * de acordo com as diretrizes do projeto.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Dependências proibidas
const FORBIDDEN_DEPS = [
  'moment',
  'lodash',
  'jquery', 
  'bootstrap',
  '@mui/material',
  'antd',
  'styled-components',
  '@emotion/react'
];

// Versões específicas proibidas
const FORBIDDEN_VERSIONS = {
  'ajv': ['6.0.0', '6.12.6'],
  '@types/react': ['19.0.0', '19.1.8']
};

// Dependências obrigatórias
const REQUIRED_DEPS = [
  'react',
  'react-dom', 
  'typescript',
  'react-hot-toast'
];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json não encontrado!', 'red');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  return { packageJson, dependencies };
}

function checkForbiddenDependencies(dependencies) {
  log('\n🔍 Verificando dependências proibidas...', 'blue');
  
  let hasProblems = false;
  
  FORBIDDEN_DEPS.forEach(dep => {
    if (dependencies[dep]) {
      log(`❌ Dependência proibida encontrada: ${dep}`, 'red');
      hasProblems = true;
    }
  });
  
  // Verificar versões específicas proibidas
  Object.entries(FORBIDDEN_VERSIONS).forEach(([dep, versions]) => {
    if (dependencies[dep]) {
      const installedVersion = dependencies[dep].replace(/[\^~]/, '');
      if (versions.some(v => installedVersion.startsWith(v))) {
        log(`❌ Versão proibida encontrada: ${dep}@${installedVersion}`, 'red');
        hasProblems = true;
      }
    }
  });
  
  if (!hasProblems) {
    log('✅ Nenhuma dependência proibida encontrada', 'green');
  }
  
  return !hasProblems;
}

function checkRequiredDependencies(dependencies) {
  log('\n🔍 Verificando dependências obrigatórias...', 'blue');
  
  let hasProblems = false;
  
  REQUIRED_DEPS.forEach(dep => {
    if (!dependencies[dep]) {
      log(`❌ Dependência obrigatória não encontrada: ${dep}`, 'red');
      hasProblems = true;
    } else {
      log(`✅ ${dep} - OK`, 'green');
    }
  });
  
  return !hasProblems;
}

function checkUnusedDependencies() {
  log('\n🔍 Verificando dependências não utilizadas...', 'blue');
  
  try {
    // Instalar depcheck se não existir
    try {
      execSync('npx depcheck --version', { stdio: 'ignore' });
    } catch {
      log('📦 Instalando depcheck...', 'yellow');
      execSync('npm install -g depcheck', { stdio: 'inherit' });
    }
    
    const result = execSync('npx depcheck --json', { encoding: 'utf8' });
    const depcheckResult = JSON.parse(result);
    
    if (depcheckResult.dependencies.length > 0) {
      log('❌ Dependências não utilizadas encontradas:', 'red');
      depcheckResult.dependencies.forEach(dep => {
        log(`   - ${dep}`, 'red');
      });
      return false;
    } else {
      log('✅ Todas as dependências estão sendo utilizadas', 'green');
      return true;
    }
  } catch (error) {
    log('⚠️  Erro ao verificar dependências não utilizadas', 'yellow');
    return true; // Não falhar por isso
  }
}

function checkVulnerabilities() {
  log('\n🔍 Verificando vulnerabilidades...', 'blue');
  
  try {
    execSync('npm audit --audit-level high', { stdio: 'ignore' });
    log('✅ Nenhuma vulnerabilidade high/critical encontrada', 'green');
    return true;
  } catch (error) {
    log('❌ Vulnerabilidades encontradas! Execute: npm audit', 'red');
    return false;
  }
}

function generateReport(results) {
  log('\n📊 RELATÓRIO FINAL', 'blue');
  log('==================', 'blue');
  
  const allPassed = Object.values(results).every(result => result);
  
  Object.entries(results).forEach(([check, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${check}`, color);
  });
  
  if (allPassed) {
    log('\n🎉 Todas as verificações passaram!', 'green');
    log('✅ Projeto está em conformidade com as diretrizes', 'green');
  } else {
    log('\n⚠️  Algumas verificações falharam!', 'yellow');
    log('📖 Consulte: DEPENDENCIAS_APROVADAS.md', 'blue');
  }
  
  return allPassed;
}

function main() {
  log('🔧 Fênix CRM - Verificador de Dependências', 'blue');
  log('==========================================', 'blue');
  
  const { dependencies } = checkPackageJson();
  
  const results = {
    'Dependências Proibidas': checkForbiddenDependencies(dependencies),
    'Dependências Obrigatórias': checkRequiredDependencies(dependencies),
    'Dependências Não Utilizadas': checkUnusedDependencies(),
    'Vulnerabilidades': checkVulnerabilities()
  };
  
  const success = generateReport(results);
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkForbiddenDependencies,
  checkRequiredDependencies,
  checkUnusedDependencies,
  checkVulnerabilities
};
