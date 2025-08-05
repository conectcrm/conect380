/**
 * Debug específico para a proposta PROP-2025-045
 * Verifica status no backend e testa ações do portal
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3001';

class PropostaDebugger {
  constructor(numeroProposta) {
    this.numeroProposta = numeroProposta;
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

  async verificarStatusBackend() {
    this.log(`🔍 Verificando status da ${this.numeroProposta} no backend...`);

    try {
      // Tentar via portal
      const responsePortal = await this.makeRequest(`${BASE_URL}/api/portal/proposta/${this.numeroProposta}`);

      if (responsePortal.ok) {
        const status = responsePortal.data.proposta?.status;
        this.log(`📊 Status via portal: ${status}`, 'success');
        return { fonte: 'portal', status, proposta: responsePortal.data.proposta };
      }

      // Tentar via API de propostas direta
      const responseApi = await this.makeRequest(`${BASE_URL}/api/propostas/${this.numeroProposta}`);

      if (responseApi.ok) {
        const status = responseApi.data?.status;
        this.log(`📊 Status via API: ${status}`, 'success');
        return { fonte: 'api', status, proposta: responseApi.data };
      }

      this.log(`❌ Proposta não encontrada em nenhuma API`, 'error');
      return null;

    } catch (error) {
      this.log(`❌ Erro ao verificar status: ${error.message}`, 'error');
      return null;
    }
  }

  async verificarHistoricoAcoes() {
    this.log(`📚 Verificando histórico de ações para ${this.numeroProposta}...`);

    try {
      const response = await this.makeRequest(`${BASE_URL}/api/portal/proposta/${this.numeroProposta}/historico`);

      if (response.ok) {
        this.log(`✅ Histórico encontrado:`, 'success');
        console.log(JSON.stringify(response.data, null, 2));
        return response.data;
      } else {
        this.log(`❌ Histórico não encontrado: ${response.text}`, 'error');
        return null;
      }

    } catch (error) {
      this.log(`❌ Erro ao buscar histórico: ${error.message}`, 'error');
      return null;
    }
  }

  async simularAcaoPortal(acao) {
    this.log(`🎭 Simulando ação "${acao}" no portal...`);

    try {
      const requestData = {
        acao: acao,
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: 'Debug Específico',
          ip: '127.0.0.1',
          observacoes: `Teste de debug para ${this.numeroProposta}`
        }
      };

      const response = await this.makeRequest(
        `${BASE_URL}/api/portal/proposta/${this.numeroProposta}/acao`,
        'POST',
        requestData
      );

      if (response.ok) {
        this.log(`✅ Ação "${acao}" executada com sucesso`, 'success');
        this.log(`   Resultado: ${JSON.stringify(response.data, null, 2)}`);
        return response.data;
      } else {
        this.log(`❌ Erro na ação "${acao}": ${response.text}`, 'error');
        return null;
      }

    } catch (error) {
      this.log(`❌ Erro ao executar ação "${acao}": ${error.message}`, 'error');
      return null;
    }
  }

  async diagnosticoCompleto() {
    this.log(`🔧 Iniciando diagnóstico completo para ${this.numeroProposta}`, 'info');
    this.log('='.repeat(60));

    // 1. Verificar status atual
    const statusAtual = await this.verificarStatusBackend();

    if (!statusAtual) {
      this.log('❌ Não foi possível obter status da proposta', 'error');
      return;
    }

    this.log(`📋 Status atual no backend: ${statusAtual.status}`);

    // 2. Verificar histórico de ações
    await this.verificarHistoricoAcoes();

    // 3. Se ainda está como "enviada", simular aprovação
    if (statusAtual.status === 'enviada') {
      this.log('\n🚨 Status ainda está como "enviada" - simulando aprovação...');

      const resultado = await this.simularAcaoPortal('aprovada');

      if (resultado && resultado.success) {
        // Verificar novamente após a ação
        await new Promise(resolve => setTimeout(resolve, 1000));
        const novoStatus = await this.verificarStatusBackend();

        if (novoStatus && novoStatus.status === 'aprovada') {
          this.log('✅ Status atualizado com sucesso!', 'success');
        } else {
          this.log('❌ Status não foi atualizado mesmo após ação bem-sucedida', 'error');
        }
      }
    } else if (statusAtual.status === 'aprovada') {
      this.log('✅ Status já está correto como "aprovada"', 'success');
    } else {
      this.log(`⚠️ Status atual é "${statusAtual.status}" - diferente do esperado`, 'warning');
    }

    this.log('\n' + '='.repeat(60));
    this.log('🏁 Diagnóstico finalizado', 'success');
  }
}

// Executar diagnóstico para PROP-2025-045
async function executarDiagnostico() {
  const propostaDebugger = new PropostaDebugger('PROP-2025-045');

  console.log('🔧 Debug Específico - Proposta PROP-2025-045');
  console.log('=============================================\n');

  try {
    await propostaDebugger.diagnosticoCompleto();
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
}

// Exportar para uso modular
module.exports = { PropostaDebugger };

// Executar se chamado diretamente
if (require.main === module) {
  executarDiagnostico().then(() => {
    console.log('\n✅ Diagnóstico finalizado');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}
