/**
 * Script para buscar um cliente existente e testar a correção
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNDdhYzEwYi01OGNjLTQzNzItYTU2Ny0wZTAyYjJjM2Q0ODAiLCJlbWFpbCI6InRlc3RlQGVtcHJlc2F0ZXN0ZS5jb20iLCJpYXQiOjE3Mzc3NzY1MjIsImV4cCI6MTczNzg2MjkyMn0.vJZmP6Oa44t_rAZ4L2E1qOpU5Zb_xNyGBJyeq4bJSv8';

async function buscarClienteETester() {
  try {
    console.log('🔍 Buscando clientes disponíveis...\n');

    // Buscar clientes
    const clientesResponse = await axios.get(`${BASE_URL}/clientes`, {
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`
      }
    });

    if (clientesResponse.status === 200 && clientesResponse.data.data.length > 0) {
      const cliente = clientesResponse.data.data[0];
      console.log(`✅ Cliente encontrado: ${cliente.nome} (ID: ${cliente.id})`);

      // Agora criar proposta de teste
      console.log('\n📋 Criando proposta de teste...');

      const numeroTeste = `TESTE-${Date.now()}`;
      const novaPropostaData = {
        numero: numeroTeste,
        titulo: 'Proposta de Teste - Correção Token',
        cliente: {
          id: cliente.id
        },
        produtos: [{
          nome: 'Produto Teste',
          descricao: 'Produto para teste de correção',
          quantidade: 1,
          valorUnitario: 100.00,
          total: 100.00
        }],
        subtotal: 100.00,
        descontoGlobal: 0,
        impostos: 0,
        total: 100.00,
        valor: 100.00,
        formaPagamento: 'pix',
        validadeDias: 30,
        observacoes: 'Proposta criada para testar correção do token',
        incluirImpostosPDF: false
      };

      const criarResponse = await axios.post(`${BASE_URL}/propostas`, novaPropostaData, {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (criarResponse.status === 201) {
        const proposta = criarResponse.data;
        console.log(`✅ Proposta criada: ${proposta.numero} (ID: ${proposta.id})`);

        // Testar acesso ao portal
        console.log('\n🌐 Testando acesso ao portal...');

        try {
          const portalResponse = await axios.get(`${BASE_URL}/api/portal/proposta/${proposta.numero}`);

          if (portalResponse.status === 200) {
            const propostaPortal = portalResponse.data;
            console.log(`✅ Portal retornou proposta: ${propostaPortal.numero}`);

            if (propostaPortal.numero === proposta.numero) {
              console.log('🎉 SUCESSO! A correção está funcionando!');
              console.log(`   ✓ Proposta criada: ${proposta.numero}`);
              console.log(`   ✓ Proposta do portal: ${propostaPortal.numero}`);
              console.log(`   ✓ IDs coincidem: ${propostaPortal.id === proposta.id}`);
            } else {
              console.log('❌ ERRO! Proposta diferente retornada pelo portal');
              console.log(`   - Esperado: ${proposta.numero}`);
              console.log(`   - Recebido: ${propostaPortal.numero}`);
            }
          }
        } catch (portalError) {
          console.log(`❌ Erro ao acessar portal: ${portalError.message}`);
          if (portalError.response && portalError.response.status === 404) {
            console.log('   Isso pode indicar que a proposta não foi encontrada pelo número');
          }
        }

        // Teste do problema original - verificar se PROP-685046 ainda aparece
        console.log('\n🔍 Testando se o token 685046 ainda causa problema...');

        try {
          const tokenProblematico = '685046';
          const problemaResponse = await axios.get(`${BASE_URL}/api/portal/proposta/${tokenProblematico}`);

          if (problemaResponse.status === 200) {
            const propostaProblema = problemaResponse.data;
            console.log(`⚠️  Token ${tokenProblematico} ainda retorna: ${propostaProblema.numero}`);
            console.log('   Pode indicar que ainda há propostas antigas com esse número');
          }
        } catch (problemaError) {
          if (problemaError.response && problemaError.response.status === 404) {
            console.log('✅ Token 685046 corretamente rejeitado (404)');
          } else {
            console.log(`⚠️  Erro inesperado ao testar token 685046: ${problemaError.message}`);
          }
        }

      } else {
        console.log(`❌ Erro ao criar proposta: ${criarResponse.status}`);
      }

    } else {
      console.log('❌ Nenhum cliente encontrado');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      if (error.response.data) {
        console.error(`Dados: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
}

buscarClienteETester();
