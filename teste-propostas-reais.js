// Teste da API de propostas - apenas dados reais
console.log('🧪 Testando API de Propostas - Dados Reais Apenas');

const API_BASE = 'http://localhost:3001';

// Simular um token de autenticação (você pode usar um real se tiver)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.teste';

async function testarPropostas() {
  try {
    console.log('\n📊 1. Listando propostas existentes...');
    const responseListar = await fetch(`${API_BASE}/propostas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const propostas = await responseListar.json();
    console.log('✅ Resposta completa:', propostas);
    const listaPropostas = propostas.propostas || propostas;
    console.log('✅ Propostas existentes:', listaPropostas.length);
    console.log('📋 Lista:', propostas);

    console.log('\n➕ 2. Criando nova proposta real...');
    const novaProposta = {
      titulo: 'Proposta Sistema CRM Real',
      cliente: {
        id: 'cliente-real-001',
        nome: 'Empresa Cliente Real Ltda',
        email: 'contato@clientereal.com',
        telefone: '11999999999',
        documento: '12345678000199',
        status: 'cliente'
      },
      produtos: [
        {
          id: 'prod-real-001',
          nome: 'Sistema CRM Completo',
          precoUnitario: 15000,
          quantidade: 1,
          desconto: 0,
          subtotal: 15000
        },
        {
          id: 'prod-real-002',
          nome: 'Suporte Técnico (12 meses)',
          precoUnitario: 2000,
          quantidade: 12,
          desconto: 5,
          subtotal: 22800
        }
      ],
      subtotal: 37800,
      descontoGlobal: 0,
      impostos: 0,
      total: 37800,
      valor: 37800,
      formaPagamento: 'boleto',
      validadeDias: 30,
      observacoes: 'Proposta para implementação completa do sistema CRM com suporte',
      incluirImpostosPDF: true,
      status: 'rascunho',
      source: 'api-teste-real'
      // vendedor: null // Vamos criar sem vendedor primeiro
    };

    const responseCriar = await fetch(`${API_BASE}/propostas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(novaProposta)
    });

    if (responseCriar.ok) {
      const propostaCriada = await responseCriar.json();
      console.log('✅ Proposta criada com sucesso!');
      console.log('📄 Resposta completa:', propostaCriada);
      console.log('🆔 ID:', propostaCriada.proposta?.id || propostaCriada.id);
      console.log('📄 Número:', propostaCriada.proposta?.numero || propostaCriada.numero);
      console.log('💰 Valor:', propostaCriada.proposta?.total || propostaCriada.total);

      console.log('\n📋 3. Listando propostas após criação...');
      const responseListarNovo = await fetch(`${API_BASE}/propostas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const propostasAtualizadas = await responseListarNovo.json();
      console.log('✅ Resposta completa:', propostasAtualizadas);
      const listaAtualizada = propostasAtualizadas.propostas || propostasAtualizadas;
      console.log('✅ Total de propostas:', listaAtualizada.length);
      if (Array.isArray(listaAtualizada)) {
        console.log('📊 Propostas:', listaAtualizada.map(p => ({
          id: p.id,
          numero: p.numero,
          titulo: p.titulo,
          total: p.total,
          status: p.status
        })));
      }

    } else {
      const erro = await responseCriar.text();
      console.error('❌ Erro ao criar proposta:', erro);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarPropostas();
