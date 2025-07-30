/**
 * Script de debug para testar o fluxo de ações do portal do cliente
 * Este script simula as ações que um cliente faria no portal
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3001';

class PortalActionsDebugger {
  constructor() {
    this.logs = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  async makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve({
              status: res.statusCode,
              ok: res.statusCode >= 200 && res.statusCode < 300,
              data: parsedData,
              text: responseData
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              ok: res.statusCode >= 200 && res.statusCode < 300,
              data: null,
              text: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async testarValidacaoToken(token) {
    this.log(`🔐 Testando validação do token: ${token}`);

    try {
      const response = await this.makeRequest(`${BASE_URL}/api/portal/proposta/${token}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.text}`);
      }

      this.log(`✅ Token válido - Proposta: ${response.data.proposta?.numero || 'N/A'}`, 'success');
      return response.data;
    } catch (error) {
      this.log(`❌ Erro na validação do token: ${error.message}`, 'error');
      return null;
    }
  }

  async testarAcaoCliente(token, acao, metadata = {}) {
    this.log(`📝 Testando ação: ${acao} com token: ${token}`);

    try {
      const requestData = {
        acao: acao,
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: 'Debug Script',
          ...metadata
        }
      };

      const response = await this.makeRequest(
        `${BASE_URL}/api/portal/proposta/${token}/acao`,
        'POST',
        requestData
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.text}`);
      }

      this.log(`✅ Ação "${acao}" executada com sucesso`, 'success');
      this.log(`   Resultado: ${JSON.stringify(response.data, null, 2)}`);
      return response.data;
    } catch (error) {
      this.log(`❌ Erro ao executar ação "${acao}": ${error.message}`, 'error');
      return null;
    }
  }

  async verificarStatusProposta(token) {
    this.log(`🔍 Verificando status atual da proposta para token: ${token}`);

    try {
      const response = await this.makeRequest(`${BASE_URL}/api/portal/proposta/${token}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.text}`);
      }

      const status = response.data.proposta?.status || 'desconhecido';
      this.log(`📊 Status atual: ${status}`, 'info');
      return { status: status, proposta: response.data.proposta };
    } catch (error) {
      this.log(`❌ Erro ao verificar status: ${error.message}`, 'error');
      return null;
    }
  }

  async testarFluxoCompleto(token) {
    this.log('🚀 Iniciando teste do fluxo completo de ações do portal', 'info');
    this.log('='.repeat(60));

    // 1. Validar token
    const tokenValidation = await this.testarValidacaoToken(token);
    if (!tokenValidation) {
      this.log('❌ Falha na validação do token - parando teste', 'error');
      return;
    }

    // 2. Verificar status inicial
    const statusInicial = await this.verificarStatusProposta(token);
    this.log(`📋 Status inicial: ${statusInicial?.status || 'desconhecido'}`);

    // 3. Testar ação de visualização
    this.log('\n--- Testando Visualização ---');
    await this.testarAcaoCliente(token, 'visualizada');
    await this.verificarStatusProposta(token);

    // 4. Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Testar ação de aprovação
    this.log('\n--- Testando Aprovação ---');
    await this.testarAcaoCliente(token, 'aprovada', {
      observacoes: 'Cliente aprovou via portal - teste de debug'
    });
    await this.verificarStatusProposta(token);

    // 6. Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 7. Testar ação de rejeição (para ver se muda novamente)
    this.log('\n--- Testando Rejeição ---');
    await this.testarAcaoCliente(token, 'rejeitada', {
      observacoes: 'Cliente rejeitou via portal - teste de debug'
    });
    const statusFinal = await this.verificarStatusProposta(token);

    this.log('\n' + '='.repeat(60));
    this.log(`🏁 Teste completo finalizado. Status final: ${statusFinal?.status || 'desconhecido'}`, 'success');

    return {
      statusInicial: statusInicial?.status,
      statusFinal: statusFinal?.status,
      logs: this.logs
    };
  }

  async testarAcoesIndividuais(token) {
    this.log('🧪 Testando ações individuais do portal', 'info');

    const acoes = ['visualizada', 'aprovada', 'rejeitada'];

    for (const acao of acoes) {
      this.log(`\n--- Testando: ${acao} ---`);
      await this.testarAcaoCliente(token, acao);
      await this.verificarStatusProposta(token);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Função principal para executar os testes
async function executarTestes() {
  const portalDebugger = new PortalActionsDebugger();

  // Substituir pelo token da proposta que está sendo testada
  const token = 'PROP-2025-045'; // Usar o número da proposta como token

  console.log('🔧 Debug do Portal de Ações do Cliente');
  console.log('=====================================\n');

  try {
    // Teste 1: Fluxo completo
    console.log('📋 TESTE 1: Fluxo Completo');
    await portalDebugger.testarFluxoCompleto(token);

    console.log('\n\n📋 TESTE 2: Ações Individuais');
    await portalDebugger.testarAcoesIndividuais(token);

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Exportar funções para uso individual
module.exports = {
  PortalActionsDebugger,
  executarTestes
};

// Executar se chamado diretamente
if (require.main === module) {
  executarTestes().then(() => {
    console.log('\n✅ Testes de debug finalizados');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}
