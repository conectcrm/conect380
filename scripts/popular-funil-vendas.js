// Configuração da API
const API_BASE_URL = 'http://localhost:3001';

// Função para fazer requisições HTTP
async function fetchAPI(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const responseText = await response.text();
  
  if (!response.ok) {
    console.error(`HTTP ${response.status} - ${responseText}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return JSON.parse(responseText);
}

// Dados de exemplo para o funil de vendas
const oportunidadesExemplo = [
  // LEADS
  {
    titulo: 'Software de Gestão - Padaria Central',
    descricao: 'Interessados em sistema de gestão completo para padaria',
    valor: 2500.00,
    estagio: 'leads',
    clienteNome: 'João Silva',
    clienteEmail: 'joao@padariacentral.com.br',
    clienteTelefone: '(11) 98765-4321',
    clienteEmpresa: 'Padaria Central Ltda',
    responsavel: 'Carlos Vendedor',
    dataVencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
    probabilidade: 20
  },
  {
    titulo: 'CRM para Imobiliária',
    descricao: 'Procuram CRM especializado para corretor de imóveis',
    valor: 4500.00,
    estagio: 'leads',
    clienteNome: 'Maria Santos',
    clienteEmail: 'maria@imoveissp.com.br',
    clienteTelefone: '(11) 91234-5678',
    clienteEmpresa: 'Imóveis SP Ltda',
    responsavel: 'Ana Vendedora',
    dataVencimento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias
    probabilidade: 25
  },
  {
    titulo: 'Sistema ERP - Metalúrgica',
    descricao: 'Necessitam ERP para controle de produção industrial',
    valor: 15000.00,
    estagio: 'leads',
    clienteNome: 'Roberto Ferreira',
    clienteEmail: 'roberto@metalurgicaferro.com.br',
    clienteTelefone: '(11) 94567-8901',
    clienteEmpresa: 'Metalúrgica Ferro & Aço',
    responsavel: 'Pedro Vendedor',
    dataVencimento: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 dias
    probabilidade: 15
  },

  // QUALIFICAÇÃO
  {
    titulo: 'E-commerce Completo - Loja Fashion',
    descricao: 'Implementação de plataforma e-commerce com integração',
    valor: 8500.00,
    estagio: 'qualification',
    clienteNome: 'Fernanda Costa',
    clienteEmail: 'fernanda@fashionstore.com.br',
    clienteTelefone: '(11) 95678-9012',
    clienteEmpresa: 'Fashion Store Brasil',
    responsavel: 'Carlos Vendedor',
    dataVencimento: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 dias
    probabilidade: 45
  },
  {
    titulo: 'Automação Restaurante',
    descricao: 'Sistema completo de automação para rede de restaurantes',
    valor: 12000.00,
    estagio: 'qualification',
    clienteNome: 'Alexandre Ribeiro',
    clienteEmail: 'alex@saborbrasil.com.br',
    clienteTelefone: '(11) 96789-0123',
    clienteEmpresa: 'Rede Sabor Brasil',
    responsavel: 'Ana Vendedora',
    dataVencimento: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 dias
    probabilidade: 50
  },

  // PROPOSTA
  {
    titulo: 'Sistema Médico - Clínica Saúde+',
    descricao: 'Software de gestão médica com prontuário eletrônico',
    valor: 18500.00,
    estagio: 'proposal',
    clienteNome: 'Dr. Ricardo Medeiros',
    clienteEmail: 'ricardo@clinicasaudemais.com.br',
    clienteTelefone: '(11) 97890-1234',
    clienteEmpresa: 'Clínica Saúde+ Ltda',
    responsavel: 'Pedro Vendedor',
    dataVencimento: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 dias
    probabilidade: 70
  },
  {
    titulo: 'ERP Educacional - Colégio Futuro',
    descricao: 'Sistema completo de gestão escolar e acadêmica',
    valor: 25000.00,
    estagio: 'proposal',
    clienteNome: 'Prof. Marina Silva',
    clienteEmail: 'marina@colegiofuturo.edu.br',
    clienteTelefone: '(11) 98901-2345',
    clienteEmpresa: 'Colégio Futuro',
    responsavel: 'Carlos Vendedor',
    dataVencimento: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 dias
    probabilidade: 75
  },

  // NEGOCIAÇÃO
  {
    titulo: 'CRM Avançado - Consultoria Tech',
    descricao: 'Plataforma CRM com IA e automação para consultoria',
    valor: 35000.00,
    estagio: 'negotiation',
    clienteNome: 'Luís Henrique',
    clienteEmail: 'luis@consultoriatech.com.br',
    clienteTelefone: '(11) 99012-3456',
    clienteEmpresa: 'Consultoria Tech Solutions',
    responsavel: 'Ana Vendedora',
    dataVencimento: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 dias
    probabilidade: 85
  },
  {
    titulo: 'Sistema Logístico - TransportaFácil',
    descricao: 'Solução completa para gestão de frotas e entregas',
    valor: 22000.00,
    estagio: 'negotiation',
    clienteNome: 'Marcos Oliveira',
    clienteEmail: 'marcos@transportafacil.com.br',
    clienteTelefone: '(11) 90123-4567',
    clienteEmpresa: 'TransportaFácil Logística',
    responsavel: 'Pedro Vendedor',
    dataVencimento: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 dias
    probabilidade: 90
  },

  // FECHAMENTO
  {
    titulo: 'Plataforma E-learning - Edutech',
    descricao: 'Ambiente virtual de aprendizagem corporativo',
    valor: 28000.00,
    estagio: 'closing',
    clienteNome: 'Carla Mendes',
    clienteEmail: 'carla@edutechbrasil.com.br',
    clienteTelefone: '(11) 91234-5678',
    clienteEmpresa: 'EduTech Brasil',
    responsavel: 'Carlos Vendedor',
    dataVencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
    probabilidade: 95
  },

  // GANHOS (últimos 30 dias)
  {
    titulo: 'Sistema Financeiro - InvestPro',
    descricao: 'Plataforma de gestão financeira para investimentos',
    valor: 45000.00,
    estagio: 'won',
    clienteNome: 'Eduardo Financeiro',
    clienteEmail: 'eduardo@investpro.com.br',
    clienteTelefone: '(11) 92345-6789',
    clienteEmpresa: 'InvestPro Gestão',
    responsavel: 'Ana Vendedora',
    dataVencimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
    probabilidade: 100,
    dataFechamento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    titulo: 'CRM Dentistas - OdontoSoft',
    descricao: 'Sistema especializado para clínicas odontológicas',
    valor: 12500.00,
    estagio: 'won',
    clienteNome: 'Dra. Patricia Dente',
    clienteEmail: 'patricia@odontosoft.com.br',
    clienteTelefone: '(11) 93456-7890',
    clienteEmpresa: 'OdontoSoft Clínicas',
    responsavel: 'Pedro Vendedor',
    dataVencimento: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 dias atrás
    probabilidade: 100,
    dataFechamento: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
  },

  // PERDIDOS
  {
    titulo: 'ERP Industrial - MetalTech',
    descricao: 'Sistema ERP para indústria metalúrgica pesada',
    valor: 85000.00,
    estagio: 'lost',
    clienteNome: 'José Industrial',
    clienteEmail: 'jose@metaltech.com.br',
    clienteTelefone: '(11) 94567-8901',
    clienteEmpresa: 'MetalTech Indústria',
    responsavel: 'Carlos Vendedor',
    dataVencimento: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 dias atrás
    probabilidade: 0,
    motivoPerda: 'Preço muito alto, optaram por concorrente'
  }
];

// Função para criar uma oportunidade
async function criarOportunidade(oportunidade) {
  try {
    console.log(`📝 Criando: ${oportunidade.titulo}...`);
    
    const response = await fetchAPI(`${API_BASE_URL}/oportunidades`, {
      method: 'POST',
      body: JSON.stringify({
        titulo: oportunidade.titulo,
        descricao: oportunidade.descricao,
        valor: oportunidade.valor,
        estagio: oportunidade.estagio,
        probabilidade: oportunidade.probabilidade,
        prioridade: 'medium', // Valor padrão válido
        origem: 'website', // Valor padrão válido
        dataFechamentoEsperado: oportunidade.dataVencimento.toISOString().split('T')[0],
        responsavel_id: 'mock-user', // ID do usuário mock que criamos
        nomeContato: oportunidade.clienteNome,
        emailContato: oportunidade.clienteEmail,
        telefoneContato: oportunidade.clienteTelefone,
        empresaContato: oportunidade.clienteEmpresa,
        tags: ['demo', 'exemplo']
      })
    });

    console.log(`✅ Criada: ${oportunidade.titulo} - ID: ${response.id}`);
    return response;
  } catch (error) {
    console.error(`❌ Erro ao criar ${oportunidade.titulo}:`, error.message);
    return null;
  }
}

// Função principal para popular o banco
async function popularBanco() {
  console.log('🚀 Iniciando população do banco de dados...');
  console.log(`📊 Total de oportunidades a criar: ${oportunidadesExemplo.length}`);
  console.log('');

  const resultados = [];
  
  for (const oportunidade of oportunidadesExemplo) {
    const resultado = await criarOportunidade(oportunidade);
    if (resultado) {
      resultados.push(resultado);
    }
    // Pequena pausa entre as criações
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('');
  console.log('📈 RESUMO DA POPULAÇÃO:');
  console.log(`✅ Oportunidades criadas: ${resultados.length}`);
  console.log(`❌ Falhas: ${oportunidadesExemplo.length - resultados.length}`);
  
  // Resumo por estágio
  const porEstagio = resultados.reduce((acc, op) => {
    acc[op.estagio] = (acc[op.estagio] || 0) + 1;
    return acc;
  }, {});

  console.log('');
  console.log('📊 DISTRIBUIÇÃO POR ESTÁGIO:');
  Object.entries(porEstagio).forEach(([estagio, quantidade]) => {
    const nomes = {
      'leads': 'Leads',
      'qualification': 'Qualificação', 
      'proposal': 'Proposta',
      'negotiation': 'Negociação',
      'closing': 'Fechamento',
      'won': 'Ganhos',
      'lost': 'Perdidos'
    };
    console.log(`   ${nomes[estagio] || estagio}: ${quantidade} oportunidades`);
  });

  // Valor total
  const valorTotal = resultados.reduce((acc, op) => acc + op.valor, 0);
  console.log('');
  console.log(`💰 VALOR TOTAL DO PIPELINE: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  
  console.log('');
  console.log('🎉 População do banco de dados concluída!');
  console.log('🌐 Acesse o frontend em: http://localhost:3900');
  console.log('📊 Vá para o Funil de Vendas para ver os dados!');
}

// Executar o script
if (require.main === module) {
  popularBanco().catch(console.error);
}

module.exports = { popularBanco, oportunidadesExemplo };
