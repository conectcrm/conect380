// Teste para verificar fluxo completo de envio de proposta e sincronização de status
const http = require('http');

async function testarFluxoCompleto() {
  console.log('=== TESTE FLUXO COMPLETO PROPOSTA ===');

  try {
    // 1. Primeiro, vamos obter uma proposta existente
    console.log('1. Obtendo propostas existentes...');
    const responseLista = await axios.get('http://localhost:3001/propostas');

    if (!responseLista.data.success || responseLista.data.propostas.length === 0) {
      console.log('❌ Nenhuma proposta encontrada para teste');
      return;
    }

    const proposta = responseLista.data.propostas[0];
    console.log(`✅ Proposta encontrada: ${proposta.numero} - Status atual: ${proposta.status}`);

    // 2. Verificar cliente da proposta
    console.log('2. Dados do cliente:', {
      nome: proposta.cliente.nome,
      email: proposta.cliente.email,
      status: proposta.cliente.status
    });

    // 3. Simular envio por email (vamos usar endpoint do backend)
    console.log('3. Testando envio por email...');

    const dadosEnvio = {
      proposta: {
        id: proposta.id,
        numero: proposta.numero,
        titulo: proposta.titulo,
        valor: proposta.valor
      },
      emailCliente: proposta.cliente.email,
      linkPortal: `https://portal.conectcrm.com/${proposta.numero}/token123`
    };

    const responseEmail = await axios.post('http://localhost:3001/email/enviar-proposta', dadosEnvio);

    console.log('✅ Resultado do envio:', {
      success: responseEmail.data.success,
      message: responseEmail.data.message,
      timestamp: responseEmail.data.timestamp
    });

    // 4. Aguardar um pouco e verificar se o status foi atualizado
    console.log('4. Aguardando 2 segundos para verificar atualização...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const responseVerificacao = await axios.get('http://localhost:3001/propostas');
    const propostaAtualizada = responseVerificacao.data.propostas.find(p => p.id === proposta.id);

    console.log('5. Status após envio:', {
      statusAnterior: proposta.status,
      statusAtual: propostaAtualizada.status,
      mudou: proposta.status !== propostaAtualizada.status
    });

    // 6. Verificar se há informações de email na proposta
    if (propostaAtualizada.emailDetails) {
      console.log('✅ Email details encontrados:', {
        sentAt: propostaAtualizada.emailDetails.sentAt,
        emailCliente: propostaAtualizada.emailDetails.emailCliente,
        linkPortal: propostaAtualizada.emailDetails.linkPortal
      });
    } else {
      console.log('⚠️ Email details não encontrados na proposta');
    }

    // 7. Testar atualização de status via portal (simular cliente acessando)
    console.log('6. Testando acesso via portal...');

    try {
      const tokenTeste = 'test-token-123';
      const responsePortal = await axios.put(`http://localhost:3001/api/portal/proposta/${tokenTeste}/status`, {
        status: 'visualizada',
        timestamp: new Date().toISOString(),
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      console.log('✅ Portal respondeu:', {
        success: responsePortal.data.success,
        message: responsePortal.data.message
      });

    } catch (portalError) {
      console.log('⚠️ Portal não disponível ou token inválido:', portalError.response?.data?.message);
    }

    console.log('✅ TESTE CONCLUÍDO');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.response?.data || error.message);
  }
}

testarFluxoCompleto();
