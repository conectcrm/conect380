/**
 * 🔧 Configurador Final Chatwoot
 * 
 * Execute este script após coletar todas as informações
 * do Chatwoot para configurar automaticamente o sistema
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class ConfiguradorChatwoot {
  constructor() {
    this.config = {};
  }

  async pergunta(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async mostrarBanner() {
    console.clear();
    console.log(`
🔧 ===============================================
   CONFIGURADOR FINAL CHATWOOT - CONECTCRM
===============================================

Este script vai configurar automaticamente o Chatwoot
no seu sistema ConectCRM.

📋 Certifique-se de ter em mãos:
   ✓ Access Token do Chatwoot
   ✓ Account ID 
   ✓ Inbox ID (do WhatsApp)
   ✓ Base URL

Vamos começar! 🚀
`);
  }

  async coletarInformacoes() {
    console.log('📝 INSERINDO CONFIGURAÇÕES:\n');

    // Base URL
    const baseUrl = await this.pergunta('🌐 Base URL [https://app.chatwoot.com]: ');
    this.config.CHATWOOT_BASE_URL = baseUrl || 'https://app.chatwoot.com';

    // Access Token
    this.config.CHATWOOT_ACCESS_TOKEN = await this.pergunta('🔑 Access Token: ');

    // Account ID
    this.config.CHATWOOT_ACCOUNT_ID = await this.pergunta('🏢 Account ID: ');

    // Inbox ID
    this.config.CHATWOOT_INBOX_ID = await this.pergunta('📱 Inbox ID: ');

    console.log('\n📋 Configurações inseridas:');
    console.log(`   URL: ${this.config.CHATWOOT_BASE_URL}`);
    console.log(`   Token: ${this.config.CHATWOOT_ACCESS_TOKEN.substring(0, 10)}...`);
    console.log(`   Account: ${this.config.CHATWOOT_ACCOUNT_ID}`);
    console.log(`   Inbox: ${this.config.CHATWOOT_INBOX_ID}`);
  }

  async testarConexao() {
    this.log('🧪 Testando conexão com Chatwoot...');

    try {
      const url = `${this.config.CHATWOOT_BASE_URL}/api/v1/accounts/${this.config.CHATWOOT_ACCOUNT_ID}`;
      const headers = { 'api_access_token': this.config.CHATWOOT_ACCESS_TOKEN };

      const response = await axios.get(url, { headers, timeout: 10000 });

      if (response.data && response.data.id) {
        this.log(`Conectado à conta: "${response.data.name}"`, 'success');
        return true;
      }
    } catch (error) {
      this.log(`Erro na conexão: ${error.response?.data?.message || error.message}`, 'error');

      if (error.response?.status === 401) {
        this.log('Verifique se o Access Token está correto', 'warning');
      } else if (error.response?.status === 404) {
        this.log('Verifique se o Account ID está correto', 'warning');
      }

      return false;
    }
  }

  async testarInbox() {
    this.log('📱 Testando configuração do Inbox WhatsApp...');

    try {
      const url = `${this.config.CHATWOOT_BASE_URL}/api/v1/accounts/${this.config.CHATWOOT_ACCOUNT_ID}/inboxes/${this.config.CHATWOOT_INBOX_ID}`;
      const headers = { 'api_access_token': this.config.CHATWOOT_ACCESS_TOKEN };

      const response = await axios.get(url, { headers, timeout: 10000 });

      if (response.data && response.data.channel_type) {
        if (response.data.channel_type === 'Channel::Whatsapp') {
          this.log(`Inbox WhatsApp "${response.data.name}" configurado!`, 'success');
          if (response.data.phone_number) {
            this.log(`Número: ${response.data.phone_number}`);
          }
          return true;
        } else {
          this.log(`Inbox não é WhatsApp (${response.data.channel_type})`, 'error');
          return false;
        }
      }
    } catch (error) {
      this.log(`Erro ao verificar inbox: ${error.response?.data?.message || error.message}`, 'error');

      if (error.response?.status === 404) {
        this.log('Verifique se o Inbox ID está correto', 'warning');
      }

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
        this.log('Arquivo .env encontrado');
      } else {
        this.log('Criando novo arquivo .env');
      }

      // Remover configurações antigas do Chatwoot
      const linhasExistentes = envContent.split('\n');
      const linhasFiltradas = linhasExistentes.filter(linha =>
        !linha.startsWith('CHATWOOT_')
      );

      // Adicionar novas configurações
      const novasLinhas = [
        '',
        '# Chatwoot Configuration - ConectCRM',
        `CHATWOOT_BASE_URL=${this.config.CHATWOOT_BASE_URL}`,
        `CHATWOOT_ACCESS_TOKEN=${this.config.CHATWOOT_ACCESS_TOKEN}`,
        `CHATWOOT_ACCOUNT_ID=${this.config.CHATWOOT_ACCOUNT_ID}`,
        `CHATWOOT_INBOX_ID=${this.config.CHATWOOT_INBOX_ID}`,
        ''
      ];

      const novoConteudo = [...linhasFiltradas, ...novasLinhas].join('\n');

      // Salvar arquivo
      fs.writeFileSync(envPath, novoConteudo);
      this.log('Configurações salvas com sucesso!', 'success');

    } catch (error) {
      this.log(`Erro ao salvar configurações: ${error.message}`, 'error');
      throw error;
    }
  }

  async testarBackend() {
    this.log('🔄 Testando integração com backend ConectCRM...');

    try {
      // Tentar conectar com o backend local
      const response = await axios.get('http://localhost:3001/chatwoot/status', {
        timeout: 5000
      });

      this.log('Backend ConectCRM respondendo!', 'success');
      return true;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.log('Backend não está rodando', 'warning');
        this.log('Execute: cd backend && npm run start:dev', 'warning');
      } else {
        this.log(`Erro no backend: ${error.message}`, 'error');
      }
      return false;
    }
  }

  async mostrarProximosPassos() {
    console.log(`
🎉 CONFIGURAÇÃO CHATWOOT CONCLUÍDA!

📋 PRÓXIMOS PASSOS:

1. 🔄 REINICIAR O BACKEND:
   cd backend
   npm run start:dev
   
   ⏳ Aguarde os logs mostrarem:
   "ChatwootModule dependencies initialized"

2. 🌐 ACESSAR O FRONTEND:
   http://localhost:3000
   
   📍 Ir para: Configurações → Chatwoot (WhatsApp)
   🧪 Clicar: "Testar Conexão"
   ✅ Deve mostrar: "Conexão estabelecida com sucesso"

3. 📱 TESTAR ENVIO:
   • Criar uma proposta
   • Adicionar número WhatsApp do cliente
   • Clicar "Enviar por WhatsApp"
   • Verificar se mensagem foi enviada

4. 🔍 VERIFICAR NO CHATWOOT:
   • Acesse seu painel Chatwoot
   • Vá em "Conversations" 
   • Deve aparecer a conversa criada

🚀 SUA INTEGRAÇÃO WHATSAPP ESTÁ PRONTA!

❓ PROBLEMAS?
   • Verifique se backend reiniciou sem erros
   • Confirme se todas as informações estão corretas
   • Teste manualmente os endpoints da API
`);
  }

  async executar() {
    try {
      await this.mostrarBanner();
      await this.coletarInformacoes();

      console.log('\n🧪 TESTANDO CONFIGURAÇÕES...\n');

      const conexaoOk = await this.testarConexao();
      if (!conexaoOk) {
        throw new Error('Falha na conexão com Chatwoot');
      }

      const inboxOk = await this.testarInbox();
      if (!inboxOk) {
        throw new Error('Falha na configuração do Inbox WhatsApp');
      }

      await this.salvarConfiguracoes();

      console.log('\n🔄 VERIFICANDO BACKEND...\n');
      await this.testarBackend();

      await this.mostrarProximosPassos();

    } catch (error) {
      this.log(`Erro durante configuração: ${error.message}`, 'error');
      console.log('\n💡 DICAS PARA RESOLVER:');
      console.log('   • Verifique se todas as informações estão corretas');
      console.log('   • Confirme se o inbox WhatsApp está ativo no Chatwoot');
      console.log('   • Teste as informações manualmente com curl');
    } finally {
      rl.close();
    }
  }
}

// Executar configurador
if (require.main === module) {
  const configurador = new ConfiguradorChatwoot();
  configurador.executar().catch(console.error);
}

module.exports = ConfiguradorChatwoot;
