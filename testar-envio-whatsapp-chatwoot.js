/**
 * Teste do Envio de Propostas via WhatsApp com Chatwoot
 * 
 * Este script testa a funcionalidade completa de envio de propostas
 * por WhatsApp através do Chatwoot
 */

const axios = require('axios');

// Configuração
const BACKEND_URL = 'http://localhost:3001';
const TEST_CONFIG = {
  // Token de autenticação da empresa
  TOKEN: null, // Will be obtained from login

  // Dados de teste
  CLIENTE_TESTE: {
    nome: "Cliente Teste WhatsApp",
    email: "teste.whatsapp@example.com",
    telefone: "5511999887766", // Formato: DDI + DDD + Número
    tipo: "pessoa_fisica",
    documento: "12345678901",
    status: "ativo",
    endereco: "Rua de Teste, 123",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01310-100",
    origem: "telefone"
  },

  PROPOSTA_TESTE: {
    titulo: "Proposta de Teste - WhatsApp",
    descricao: "Esta é uma proposta de teste para envio via WhatsApp através do Chatwoot",
    valor: 1500.00,
    formaPagamento: "pix",
    status: "pendente",
    observacoes: "Proposta gerada automaticamente para teste de integração WhatsApp",
    produtos: [
      {
        nome: "Produto Teste",
        descricao: "Produto para teste de envio via WhatsApp",
        preco: 1500.00,
        quantidade: 1
      }
    ]
  }
};

class TesteChatwootWhatsApp {
  constructor() {
    this.token = null;
    this.clienteId = null;
    this.propostaId = null;
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toLocaleString('pt-BR');
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async makeRequest(method, endpoint, data = null, useAuth = true) {
    try {
      const config = {
        method,
        url: `${BACKEND_URL}${endpoint}`,
        headers: {}
      };

      if (useAuth && this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }

      if (data) {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  async autenticar() {
    this.log('Realizando autenticação...');

    // Tentativa de login com usuário de teste
    const loginData = {
      email: "admin@teste.com",
      senha: "123456"
    };

    const result = await this.makeRequest('POST', '/auth/login', loginData, false);

    if (result.success) {
      this.token = result.data.token;
      this.log('Autenticação realizada com sucesso', 'success');
      return true;
    } else {
      this.log(`Erro na autenticação: ${JSON.stringify(result.error)}`, 'error');
      return false;
    }
  }

  async verificarStatusChatwoot() {
    this.log('Verificando status do Chatwoot...');

    const result = await this.makeRequest('GET', '/chatwoot/status');

    if (result.success) {
      this.log(`Status Chatwoot: ${JSON.stringify(result.data, null, 2)}`, 'success');
      return result.data;
    } else {
      this.log(`Erro ao verificar status: ${JSON.stringify(result.error)}`, 'error');
      return null;
    }
  }

  async testarConexaoChatwoot() {
    this.log('Testando conexão com Chatwoot...');

    const result = await this.makeRequest('POST', '/chatwoot/test-connection');

    if (result.success) {
      this.log('Conexão com Chatwoot OK', 'success');
      return true;
    } else {
      this.log(`Erro na conexão Chatwoot: ${JSON.stringify(result.error)}`, 'error');
      return false;
    }
  }

  async criarClienteTeste() {
    this.log('Criando cliente de teste...');

    const result = await this.makeRequest('POST', '/clientes', TEST_CONFIG.CLIENTE_TESTE);

    if (result.success) {
      this.clienteId = result.data.id;
      this.log(`Cliente criado: ${result.data.nome} (ID: ${this.clienteId})`, 'success');
      return true;
    } else {
      this.log(`Erro ao criar cliente: ${JSON.stringify(result.error)}`, 'error');
      return false;
    }
  }

  async criarPropostaTeste() {
    this.log('Criando proposta de teste...');

    const propostaData = {
      ...TEST_CONFIG.PROPOSTA_TESTE,
      clienteId: this.clienteId
    };

    const result = await this.makeRequest('POST', '/propostas', propostaData);

    if (result.success) {
      this.propostaId = result.data.id;
      this.log(`Proposta criada: ${result.data.titulo} (ID: ${this.propostaId})`, 'success');
      return true;
    } else {
      this.log(`Erro ao criar proposta: ${JSON.stringify(result.error)}`, 'error');
      return false;
    }
  }

  async enviarPropostaWhatsApp() {
    this.log('Enviando proposta via WhatsApp...');

    const envioData = {
      propostaId: this.propostaId,
      telefone: TEST_CONFIG.CLIENTE_TESTE.telefone,
      mensagemPersonalizada: "Olá! Segue sua proposta. Qualquer dúvida, estou à disposição! 😊"
    };

    const result = await this.makeRequest('POST', '/chatwoot/send-proposal', envioData);

    if (result.success) {
      this.log('Proposta enviada via WhatsApp com sucesso!', 'success');
      this.log(`Detalhes: ${JSON.stringify(result.data, null, 2)}`);
      return true;
    } else {
      this.log(`Erro ao enviar proposta: ${JSON.stringify(result.error)}`, 'error');
      return false;
    }
  }

  async buscarConversas() {
    this.log('Buscando conversas no Chatwoot...');

    const result = await this.makeRequest('GET', '/chatwoot/conversations');

    if (result.success) {
      this.log(`Encontradas ${result.data.length} conversas`, 'success');
      if (result.data.length > 0) {
        this.log(`Última conversa: ${JSON.stringify(result.data[0], null, 2)}`);
      }
      return result.data;
    } else {
      this.log(`Erro ao buscar conversas: ${JSON.stringify(result.error)}`, 'error');
      return [];
    }
  }

  async limpezaTeste() {
    this.log('Realizando limpeza dos dados de teste...');

    if (this.propostaId) {
      await this.makeRequest('DELETE', `/propostas/${this.propostaId}`);
      this.log('Proposta de teste removida');
    }

    if (this.clienteId) {
      await this.makeRequest('DELETE', `/clientes/${this.clienteId}`);
      this.log('Cliente de teste removido');
    }
  }

  async executarTeste() {
    console.log('🚀 TESTE DE ENVIO DE PROPOSTAS VIA WHATSAPP - CHATWOOT\n');

    try {
      // 1. Autenticação
      if (!(await this.autenticar())) {
        throw new Error('Falha na autenticação');
      }

      // 2. Verificar status do Chatwoot
      const status = await this.verificarStatusChatwoot();
      if (!status) {
        throw new Error('Falha ao verificar status do Chatwoot');
      }

      // 3. Testar conexão
      if (!(await this.testarConexaoChatwoot())) {
        throw new Error('Falha na conexão com Chatwoot');
      }

      // 4. Criar cliente de teste
      if (!(await this.criarClienteTeste())) {
        throw new Error('Falha ao criar cliente');
      }

      // 5. Criar proposta de teste
      if (!(await this.criarPropostaTeste())) {
        throw new Error('Falha ao criar proposta');
      }

      // 6. Enviar proposta via WhatsApp
      if (!(await this.enviarPropostaWhatsApp())) {
        throw new Error('Falha ao enviar proposta via WhatsApp');
      }

      // 7. Verificar conversas
      await this.buscarConversas();

      this.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!', 'success');
      this.log('A integração WhatsApp via Chatwoot está funcionando corretamente.');

    } catch (error) {
      this.log(`\n❌ TESTE FALHOU: ${error.message}`, 'error');
    } finally {
      // Limpeza sempre executa
      await this.limpezaTeste();
    }
  }
}

// Executar teste
if (require.main === module) {
  const teste = new TesteChatwootWhatsApp();
  teste.executarTeste().catch(console.error);
}

module.exports = TesteChatwootWhatsApp;
