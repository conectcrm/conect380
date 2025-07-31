/**
 * 🚀 Configuração Rápida Chatwoot
 * 
 * Script simplificado para configurar Chatwoot rapidamente
 */

const fs = require('fs');
const path = require('path');

// ===============================================
// 📝 CONFIGURAÇÕES - PREENCHA AQUI:
// ===============================================

const CONFIG = {
  // URL do seu Chatwoot (geralmente https://app.chatwoot.com)
  CHATWOOT_BASE_URL: 'https://app.chatwoot.com',

  // Token de acesso (Settings → Account Settings → Access Tokens)
  CHATWOOT_ACCESS_TOKEN: 'COLE_SEU_TOKEN_AQUI',

  // ID da conta (na URL: .../accounts/[ID]/dashboard)
  CHATWOOT_ACCOUNT_ID: 'COLE_SEU_ACCOUNT_ID_AQUI',

  // ID do inbox WhatsApp (Settings → Inboxes → WhatsApp → URL)
  CHATWOOT_INBOX_ID: 'COLE_SEU_INBOX_ID_AQUI'
};

// ===============================================
// 🛠️ FUNÇÕES DE CONFIGURAÇÃO
// ===============================================

function atualizarEnv() {
  console.log('🔧 Atualizando arquivo .env...');

  const envPath = path.join(__dirname, 'backend', '.env');

  try {
    let envContent = '';

    // Ler arquivo .env existente
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Arquivo .env encontrado');
    } else {
      console.log('⚠️ Arquivo .env não encontrado, criando novo...');
    }

    // Atualizar configurações do Chatwoot
    Object.keys(CONFIG).forEach(key => {
      const value = CONFIG[key];
      const regex = new RegExp(`^${key}=.*$`, 'm');

      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
        console.log(`🔄 Atualizado: ${key}`);
      } else {
        envContent += `\n# Chatwoot Configuration\n${key}=${value}`;
        console.log(`➕ Adicionado: ${key}`);
      }
    });

    // Salvar arquivo
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Configurações salvas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao atualizar .env:', error.message);
    throw error;
  }
}

function mostrarInstrucoes() {
  console.log(`
🚀 ===============================================
   CONFIGURAÇÃO RÁPIDA CHATWOOT - CONECTCRM
===============================================

📋 INSTRUÇÕES:

1. 🏢 CRIAR CONTA NO CHATWOOT:
   • Acesse: https://app.chatwoot.com/app/signup
   • Registre sua empresa
   • Confirme o email

2. 📱 CONFIGURAR INBOX WHATSAPP:
   • Settings → Inboxes → Add Inbox
   • Selecione "WhatsApp"
   • Configure WhatsApp Business API

3. 🔑 OBTER INFORMAÇÕES:
   
   📄 ACCESS TOKEN:
   • Settings → Account Settings → Access Tokens
   • Create new token → Nome: "ConectCRM"
   • Copie o token gerado
   
   🏢 ACCOUNT ID:
   • Na URL do painel: .../accounts/[ID]/dashboard
   • Exemplo: .../accounts/123/dashboard → ID = 123
   
   📱 INBOX ID:
   • Settings → Inboxes → Clique no WhatsApp
   • Na URL: .../inboxes/[ID]/settings
   • Exemplo: .../inboxes/456/settings → ID = 456

4. ✏️ PREENCHER CONFIGURAÇÕES:
   • Abra este arquivo: assistente-chatwoot-rapido.js
   • Preencha as variáveis no objeto CONFIG
   • Execute: node assistente-chatwoot-rapido.js

5. 🔄 REINICIAR SISTEMA:
   • cd backend && npm run start:dev
   • Acesse: http://localhost:3000
   • Vá em: Configurações → Chatwoot

===============================================
`);
}

function validarConfiguracao() {
  console.log('🔍 Validando configuração...');

  const erros = [];

  if (!CONFIG.CHATWOOT_ACCESS_TOKEN || CONFIG.CHATWOOT_ACCESS_TOKEN === 'COLE_SEU_TOKEN_AQUI') {
    erros.push('❌ ACCESS_TOKEN não configurado');
  }

  if (!CONFIG.CHATWOOT_ACCOUNT_ID || CONFIG.CHATWOOT_ACCOUNT_ID === 'COLE_SEU_ACCOUNT_ID_AQUI') {
    erros.push('❌ ACCOUNT_ID não configurado');
  }

  if (!CONFIG.CHATWOOT_INBOX_ID || CONFIG.CHATWOOT_INBOX_ID === 'COLE_SEU_INBOX_ID_AQUI') {
    erros.push('❌ INBOX_ID não configurado');
  }

  if (erros.length > 0) {
    console.log('\n⚠️ PROBLEMAS ENCONTRADOS:');
    erros.forEach(erro => console.log(`   ${erro}`));
    console.log('\n📝 Por favor, preencha as configurações no início deste arquivo.');
    return false;
  }

  console.log('✅ Configuração válida!');
  return true;
}

function mostrarProximosPassos() {
  console.log(`
🎉 CONFIGURAÇÃO CONCLUÍDA!

📋 PRÓXIMOS PASSOS:

1. 🔄 Reiniciar o backend:
   cd backend
   npm run start:dev

2. 🌐 Acessar frontend:
   http://localhost:3000

3. ⚙️ Testar configuração:
   • Vá em: Configurações → Chatwoot
   • Clique: "Testar Conexão"
   • Deve mostrar: "✅ Conectado"

4. 📱 Enviar primeira proposta:
   • Criar proposta
   • Adicionar WhatsApp do cliente
   • Enviar por WhatsApp

🚀 Sua integração WhatsApp está pronta!

❓ PROBLEMAS?
   • Verifique se o token está correto
   • Confirme os IDs da conta e inbox
   • Certifique-se que o inbox WhatsApp está ativo
`);
}

// ===============================================
// 🚀 EXECUÇÃO PRINCIPAL
// ===============================================

function main() {
  console.clear();
  mostrarInstrucoes();

  if (!validarConfiguracao()) {
    return;
  }

  try {
    atualizarEnv();
    mostrarProximosPassos();
  } catch (error) {
    console.error('❌ Erro durante configuração:', error.message);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { CONFIG, atualizarEnv, validarConfiguracao };
