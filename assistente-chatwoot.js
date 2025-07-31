/**
 * 🛠️ Assistente de Configuração Chatwoot
 * 
 * Este script ajuda a configurar o Chatwoot para WhatsApp
 * de forma interativa e guiada
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class ChatwootConfigAssistant {
  constructor() {
    this.config = {
      CHATWOOT_BASE_URL: '',
      CHATWOOT_ACCESS_TOKEN: '',
      CHATWOOT_ACCOUNT_ID: '',
      CHATWOOT_INBOX_ID: ''
    };
  }

  async pergunta(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toLocaleString('pt-BR');
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async mostrarBanner() {
    console.clear();
    console.log(`
🚀 ================================================
   ASSISTENTE DE CONFIGURAÇÃO CHATWOOT
   ConectCRM + WhatsApp Business Integration
================================================

Este assistente vai te guiar através da configuração
completa do Chatwoot para envio de propostas via WhatsApp.

📋 Você precisará ter:
   ✓ Conta no Chatwoot (app.chatwoot.com)
   ✓ Inbox WhatsApp configurado
   ✓ Access Token gerado

Vamos começar! 🎯
`);

    await this.pergunta('Pressione ENTER para continuar...');
  }

  async coletarInformacoes() {
    console.log('\n📝 COLETANDO INFORMAÇÕES DE CONFIGURAÇÃO\n');

    // 1. Base URL
    this.log('1. Configurando URL base do Chatwoot...');
    const urlPadrao = await this.pergunta('URL do Chatwoot [https://app.chatwoot.com]: ');
    this.config.CHATWOOT_BASE_URL = urlPadrao || 'https://app.chatwoot.com';

    // 2. Access Token
    console.log('\n📋 Para obter o Access Token:');
    console.log('   1. Acesse: Settings → Account Settings → Access Tokens');
    console.log('   2. Clique em "Create new token"');
    console.log('   3. Nome: "ConectCRM Integration"');
    console.log('   4. Copie o token gerado\n');

    this.config.CHATWOOT_ACCESS_TOKEN = await this.pergunta('Access Token: ');

    // 3. Account ID
    console.log('\n🏢 Para encontrar o Account ID:');
    console.log('   • Na URL do Chatwoot: .../accounts/[ACCOUNT_ID]/dashboard');
    console.log('   • Exemplo: se URL = .../accounts/123/dashboard, então Account ID = 123\n');

    this.config.CHATWOOT_ACCOUNT_ID = await this.pergunta('Account ID: ');

    // 4. Inbox ID
    console.log('\n📱 Para encontrar o Inbox ID:');
    console.log('   1. Acesse: Settings → Inboxes');
    console.log('   2. Clique no inbox WhatsApp');
    console.log('   3. Na URL: .../inboxes/[INBOX_ID]/settings\n');

    this.config.CHATWOOT_INBOX_ID = await this.pergunta('Inbox ID: ');
  }

  async testarConexao() {
    this.log('🧪 Testando conexão com Chatwoot...');

    try {
      const url = `${this.config.CHATWOOT_BASE_URL}/api/v1/accounts/${this.config.CHATWOOT_ACCOUNT_ID}`;
      const headers = {
        'api_access_token': this.config.CHATWOOT_ACCESS_TOKEN
      };

      const response = await axios.get(url, { headers });

      if (response.data && response.data.id) {
        this.log(`Conexão com conta "${response.data.name}" estabelecida!`, 'success');
        return true;
      } else {
        this.log('Resposta inesperada da API', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Erro na conexão: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }

  async testarInbox() {
    this.log('📱 Testando configuração do Inbox WhatsApp...');

    try {
      const url = `${this.config.CHATWOOT_BASE_URL}/api/v1/accounts/${this.config.CHATWOOT_ACCOUNT_ID}/inboxes/${this.config.CHATWOOT_INBOX_ID}`;
      const headers = {
        'api_access_token': this.config.CHATWOOT_ACCESS_TOKEN
      };

      const response = await axios.get(url, { headers });

      if (response.data && response.data.channel_type === 'Channel::Whatsapp') {
        this.log(`Inbox WhatsApp "${response.data.name}" configurado corretamente!`, 'success');
        this.log(`Número: ${response.data.phone_number || 'Não informado'}`);
        return true;
      } else {
        this.log('Inbox não é do tipo WhatsApp', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Erro ao verificar inbox: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }

  async salvarConfiguracoes() {
    this.log('💾 Salvando configurações no arquivo .env...');

    const envPath = path.join(__dirname, 'backend', '.env');

    try {
      let envContent = '';

      // Ler arquivo .env existente
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // Atualizar ou adicionar configurações do Chatwoot
      const chatwootVars = [
        'CHATWOOT_BASE_URL',
        'CHATWOOT_ACCESS_TOKEN',
        'CHATWOOT_ACCOUNT_ID',
        'CHATWOOT_INBOX_ID'
      ];

      chatwootVars.forEach(varName => {
        const varValue = this.config[varName];
        const regex = new RegExp(`^${varName}=.*$`, 'm');

        if (envContent.match(regex)) {
          // Substituir valor existente
          envContent = envContent.replace(regex, `${varName}=${varValue}`);
        } else {
          // Adicionar nova variável
          envContent += `\n${varName}=${varValue}`;
        }
      });

      // Salvar arquivo
      fs.writeFileSync(envPath, envContent);
      this.log('Configurações salvas com sucesso!', 'success');

    } catch (error) {
      this.log(`Erro ao salvar configurações: ${error.message}`, 'error');
      throw error;
    }
  }

  async mostrarProximosPassos() {
    console.log(`
🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!

📋 PRÓXIMOS PASSOS:

1. 🔄 Reiniciar o backend:
   cd backend
   npm run start:dev

2. 🌐 Acessar o frontend:
   http://localhost:3000

3. ⚙️ Ir para configurações:
   Configurações → Chatwoot (WhatsApp)

4. 🧪 Testar a integração:
   • Clique em "Testar Conexão"
   • Deve mostrar "✅ Conectado"

5. 📱 Enviar primeira proposta:
   • Crie uma proposta
   • Adicione número WhatsApp
   • Clique "Enviar por WhatsApp"

🚀 Sua integração WhatsApp está pronta!
`);
  }

  async corrigirProblema() {
    console.log('\n🔧 CORREÇÃO DE PROBLEMAS\n');

    const opcoes = [
      '1. Reconfigurar Access Token',
      '2. Verificar Account ID',
      '3. Reconfigurar Inbox ID',
      '4. Testar novamente',
      '5. Mostrar configurações atuais',
      '0. Sair'
    ];

    console.log('Escolha uma opção:');
    opcoes.forEach(opcao => console.log(`   ${opcao}`));

    const escolha = await this.pergunta('\nOpção: ');

    switch (escolha) {
      case '1':
        this.config.CHATWOOT_ACCESS_TOKEN = await this.pergunta('Novo Access Token: ');
        await this.testarConexao();
        break;
      case '2':
        this.config.CHATWOOT_ACCOUNT_ID = await this.pergunta('Novo Account ID: ');
        await this.testarConexao();
        break;
      case '3':
        this.config.CHATWOOT_INBOX_ID = await this.pergunta('Novo Inbox ID: ');
        await this.testarInbox();
        break;
      case '4':
        await this.testarConexao();
        await this.testarInbox();
        break;
      case '5':
        console.log('\n📋 Configurações atuais:');
        console.log(`   URL: ${this.config.CHATWOOT_BASE_URL}`);
        console.log(`   Token: ${this.config.CHATWOOT_ACCESS_TOKEN.substring(0, 10)}...`);
        console.log(`   Account ID: ${this.config.CHATWOOT_ACCOUNT_ID}`);
        console.log(`   Inbox ID: ${this.config.CHATWOOT_INBOX_ID}`);
        break;
      case '0':
        return false;
      default:
        this.log('Opção inválida', 'warning');
    }

    return true;
  }

  async executar() {
    try {
      await this.mostrarBanner();
      await this.coletarInformacoes();

      console.log('\n🧪 TESTANDO CONFIGURAÇÕES...\n');

      const conexaoOk = await this.testarConexao();
      if (!conexaoOk) {
        this.log('Problema na conexão. Vamos corrigir...', 'warning');
        const continuar = await this.corrigirProblema();
        if (!continuar) return;
      }

      const inboxOk = await this.testarInbox();
      if (!inboxOk) {
        this.log('Problema no inbox. Vamos corrigir...', 'warning');
        const continuar = await this.corrigirProblema();
        if (!continuar) return;
      }

      if (conexaoOk && inboxOk) {
        await this.salvarConfiguracoes();
        await this.mostrarProximosPassos();
      }

    } catch (error) {
      this.log(`Erro durante configuração: ${error.message}`, 'error');
    } finally {
      rl.close();
    }
  }
}

// Executar assistente
if (require.main === module) {
  const assistant = new ChatwootConfigAssistant();
  assistant.executar().catch(console.error);
}

module.exports = ChatwootConfigAssistant;
