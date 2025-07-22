// Script de teste para o sistema de registro empresarial
const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testarRegistroEmpresa() {
  console.log('🧪 Testando Sistema de Registro Empresarial...\n');
  
  // Dados de teste
  const empresaTeste = {
    nome: 'Empresa Teste SaaS',
    cnpj: '12345678000195',
    email: 'teste@empresateste.com',
    telefone: '(11) 99999-9999',
    endereco: 'Rua Teste, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    plano: 'pro',
    nomeContato: 'João da Silva',
    cargoContato: 'Diretor',
    setorEmpresa: 'Tecnologia',
    numeroFuncionarios: '50-100'
  };

  try {
    console.log('📝 1. Testando registro de empresa...');
    
    const response = await axios.post(`${API_BASE}/empresas/registro`, empresaTeste);
    
    if (response.status === 201) {
      console.log('✅ Registro realizado com sucesso!');
      console.log('📧 Email de verificação deve ter sido enviado.');
      console.log('📊 Dados retornados:', response.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Erro na API:', error.response.status);
      console.log('📝 Mensagem:', error.response.data.message);
      
      if (error.response.status === 409) {
        console.log('ℹ️  Empresa já existe - isso é esperado se você já testou antes.');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Erro: Servidor backend não está rodando na porta 3001');
      console.log('💡 Execute: npm run start:dev no diretório backend');
    } else {
      console.log('❌ Erro inesperado:', error.message);
    }
  }
}

async function testarValidacaoCNPJ() {
  console.log('\n🧪 2. Testando validação de CNPJ...');
  
  try {
    const response = await axios.get(`${API_BASE}/empresas/validar-cnpj?cnpj=12345678000195`);
    console.log('✅ Validação CNPJ funcionando:', response.data);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validação CNPJ funcionando (CNPJ já existe)');
    } else {
      console.log('❌ Erro na validação CNPJ:', error.message);
    }
  }
}

async function testarValidacaoEmail() {
  console.log('\n🧪 3. Testando validação de email...');
  
  try {
    const response = await axios.get(`${API_BASE}/empresas/validar-email?email=teste@empresateste.com`);
    console.log('✅ Validação email funcionando:', response.data);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validação email funcionando (email já existe)');
    } else {
      console.log('❌ Erro na validação email:', error.message);
    }
  }
}

async function executarTestes() {
  console.log('🚀 Iniciando testes do sistema SaaS Fênix CRM\n');
  
  await testarRegistroEmpresa();
  await testarValidacaoCNPJ();
  await testarValidacaoEmail();
  
  console.log('\n✨ Testes concluídos!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Configure seu email SMTP no arquivo .env');
  console.log('2. Teste o fluxo completo no frontend: http://localhost:3900/registro');
  console.log('3. Verifique o banco de dados para confirmar os registros');
}

// Executar testes
executarTestes();
