const http = require('http');
const fs = require('fs');

// Ler o JSON do arquivo
const fluxoOriginal = JSON.parse(fs.readFileSync('FLUXO_ATENDIMENTO_COMPLETO.json', 'utf8'));

// Converter array de etapas para objeto (Record<string, EtapaDto>)
function converterEtapasParaObjeto(etapas) {
  const etapasObj = {};

  etapas.forEach(etapa => {
    const { id, tipo, config, proximaEtapa, proximaEtapaVerdadeiro, proximaEtapaFalso } = etapa;

    // Mapear para estrutura esperada pelo DTO
    etapasObj[id] = {
      id,
      tipo,
      mensagem: config.mensagem || config.mensagemBoasVindas || config.pergunta || '',
      ...(config.opcoes && { opcoes: config.opcoes }),
      ...(proximaEtapa && { proximaEtapa }),
      ...(proximaEtapaVerdadeiro && { proximaEtapa: proximaEtapaVerdadeiro }),
      aguardarResposta: config.aguardarResposta || false,
      timeout: config.timeout,
      validacao: config.validacao
    };

    // Se tem condições (tipo 'condicao')
    if (tipo === 'condicao' && config.variavel) {
      etapasObj[id].condicoes = [{
        variavel: config.variavel,
        operador: config.operador || 'existe',
        valor: config.valor || 'true',
        proximaEtapa: proximaEtapaVerdadeiro || proximaEtapa
      }];

      // Adicionar condição falsa se existir
      if (proximaEtapaFalso) {
        etapasObj[id].condicoes.push({
          variavel: config.variavel,
          operador: 'nao_existe',
          valor: 'false',
          proximaEtapa: proximaEtapaFalso
        });
      }
    }
  });

  return etapasObj;
}

// Mapear tipo do fluxo para enum TipoFluxo
function mapearTipoFluxo(tipoOriginal) {
  const mapeamento = {
    'atendimento': 'arvore_decisao',
    'menu': 'menu_opcoes',
    'coleta': 'coleta_dados'
  };
  return mapeamento[tipoOriginal] || 'arvore_decisao';
}

// Montar payload no formato esperado pelo DTO
const fluxoData = {
  nome: fluxoOriginal.nome,
  descricao: fluxoOriginal.descricao,
  codigo: fluxoOriginal.codigo || 'atendimento-completo-v1',
  tipo: mapearTipoFluxo(fluxoOriginal.tipo || 'atendimento'),
  canais: fluxoOriginal.canais || ['whatsapp'],
  palavrasGatilho: fluxoOriginal.palavrasGatilho || [],
  horarioAtivo: fluxoOriginal.horarioAtivo,
  prioridade: fluxoOriginal.prioridade || 10,
  ativo: fluxoOriginal.ativo !== undefined ? fluxoOriginal.ativo : true,
  estrutura: {
    versao: fluxoOriginal.estrutura.versao || '2.0',
    etapaInicial: fluxoOriginal.estrutura.etapas[0].id, // Primeira etapa
    etapas: converterEtapasParaObjeto(fluxoOriginal.estrutura.etapas),
    variaveis: fluxoOriginal.estrutura.variaveis || {}
  },
  permiteVoltar: fluxoOriginal.permiteVoltar !== undefined ? fluxoOriginal.permiteVoltar : true,
  permiteSair: fluxoOriginal.permiteSair !== undefined ? fluxoOriginal.permiteSair : true,
  salvarHistorico: fluxoOriginal.salvarHistorico !== undefined ? fluxoOriginal.salvarHistorico : true,
  tentarEntenderTextoLivre: fluxoOriginal.tentarEntenderTextoLivre || false,
  tags: fluxoOriginal.tags || [],
  versao: fluxoOriginal.versao || 1,
  configuracoes: fluxoOriginal.configuracoes || {}
};

console.log('📋 Estrutura convertida:');
console.log('   - Etapa inicial:', fluxoData.estrutura.etapaInicial);
console.log('   - Total de etapas:', Object.keys(fluxoData.estrutura.etapas).length);
console.log('   - Tipo do fluxo:', fluxoData.tipo);

// Salvar payload convertido para debug
fs.writeFileSync('fluxo-convertido-debug.json', JSON.stringify(fluxoData, null, 2));
console.log('✅ Payload salvo em fluxo-convertido-debug.json\n');

// Função de login
async function fazerLogin() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: 'admin@conectsuite.com.br',
      senha: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.data && response.data.access_token) {
            console.log('✅ Login realizado com sucesso');
            resolve(response.data.access_token);
          } else {
            reject(new Error('Token não encontrado na resposta'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// Função de importação
async function importarFluxo(token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(fluxoData);

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/fluxos',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('📊 Status da resposta:', res.statusCode);

        if (data) {
          console.log('📄 Resposta:', data.substring(0, 500));

          try {
            const response = JSON.parse(data);
            if (res.statusCode === 201 || res.statusCode === 200) {
              console.log('\n✅ Fluxo importado com sucesso!');
              console.log('📋 ID:', response.id);
              console.log('📋 Nome:', response.nome);
              console.log('📋 Ativo:', response.ativo);
              resolve(response);
            } else {
              console.error('❌ Erro:', response);
              reject(new Error(`Status ${res.statusCode}: ${JSON.stringify(response)}`));
            }
          } catch (err) {
            console.error('❌ Erro ao parsear resposta:', err.message);
            console.error('📄 Dados brutos:', data);
            reject(err);
          }
        } else {
          console.error('❌ Resposta vazia do servidor');
          reject(new Error('Resposta vazia'));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erro na requisição:', err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Executar
async function main() {
  try {
    console.log('🚀 Iniciando importação do fluxo...\n');

    console.log('🔐 Fazendo login...');
    const token = await fazerLogin();

    console.log('\n📥 Importando fluxo...');
    const resultado = await importarFluxo(token);

    console.log('\n🎉 SUCESSO! Fluxo importado!');
    console.log('\n📊 Próximos passos:');
    console.log('   1. Verificar fluxo no painel de administração');
    console.log('   2. Testar fluxo com WhatsApp');
    console.log('   3. Ajustar mensagens conforme necessário');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
