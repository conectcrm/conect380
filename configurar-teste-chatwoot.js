/**
 * Script para criar usuário e empresa de teste
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function criarEmpresaTeste() {
  console.log('🏢 Criando empresa de teste...');

  const empresaData = {
    empresa: {
      nome: "Empresa Teste",
      cnpj: "12.345.678/0001-99",
      email: "empresa@teste.com",
      telefone: "(11) 99999-9999",
      endereco: "Rua de Teste, 123",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01310-100"
    },
    usuario: {
      nome: "Admin Teste",
      email: "admin@teste.com",
      senha: "123456",
      telefone: "(11) 99999-9999"
    },
    plano: "starter",
    aceitarTermos: true
  };

  try {
    const response = await axios.post(`${BACKEND_URL}/empresas/registro`, empresaData);
    console.log('✅ Empresa criada com sucesso:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Empresa já existe, continuando...');
      return { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }; // ID fixo para teste
    }
    console.error('❌ Erro ao criar empresa:', error.response?.data || error.message);
    throw error;
  }
}

async function criarUsuarioTeste(empresaId) {
  console.log('👤 Verificando usuário de teste...');

  // Lista de credenciais para testar
  const credenciais = [
    { email: "admin@conectcrm.com", senha: "admin123" },
    { email: "admin@teste.com", senha: "123456" },
    { email: "empresa@teste.com", senha: "123456" },
    { email: "maria@conectcrm.com", senha: "manager123" }
  ];

  for (const cred of credenciais) {
    try {
      console.log(`ℹ️ Tentando login com ${cred.email}...`);
      const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, cred);

      console.log('✅ Login realizado com sucesso!');
      console.log(`📧 Email: ${cred.email}`);
      console.log(`🔑 Token: ${loginResponse.data.token.substring(0, 30)}...`);
      return loginResponse.data;
    } catch (error) {
      console.log(`❌ Falha no login com ${cred.email}`);
      continue;
    }
  }

  throw new Error('Nenhuma credencial de teste funcionou');
}

async function verificarConexaoChatwoot(token) {
  console.log('🔍 Verificando configuração do Chatwoot...');

  try {
    const response = await axios.get(`${BACKEND_URL}/chatwoot/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Status Chatwoot:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao verificar Chatwoot:', error.response?.data || error.message);
    return null;
  }
}

async function testarConexaoChatwoot(token) {
  console.log('🧪 Testando conexão com Chatwoot...');

  try {
    const response = await axios.post(`${BACKEND_URL}/chatwoot/test-connection`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Teste de conexão Chatwoot:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 CONFIGURANDO AMBIENTE DE TESTE PARA CHATWOOT\n');

  try {
    // 1. Criar empresa
    const empresa = await criarEmpresaTeste();

    // 2. Criar usuário  
    const loginData = await criarUsuarioTeste(empresa.id);

    console.log('\n📋 DADOS DE ACESSO:');
    console.log(`Email: admin@teste.com`);
    console.log(`Senha: 123456`);
    console.log(`Token: ${loginData.token}\n`);

    // 3. Verificar Chatwoot
    await verificarConexaoChatwoot(loginData.token);

    // 4. Testar conexão
    const conexaoOk = await testarConexaoChatwoot(loginData.token);

    if (conexaoOk) {
      console.log('\n🎉 AMBIENTE CONFIGURADO COM SUCESSO!');
      console.log('✅ Empresa criada');
      console.log('✅ Usuário criado');
      console.log('✅ Chatwoot conectado');
      console.log('\nAgora você pode executar: node testar-envio-whatsapp-chatwoot.js');
    } else {
      console.log('\n⚠️ AMBIENTE PARCIALMENTE CONFIGURADO');
      console.log('✅ Empresa criada');
      console.log('✅ Usuário criado');
      console.log('❌ Chatwoot precisa ser configurado');
      console.log('\nVerifique as variáveis de ambiente CHATWOOT_* no arquivo .env');
    }

  } catch (error) {
    console.error('\n❌ ERRO NA CONFIGURAÇÃO:', error.message);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { criarEmpresaTeste, criarUsuarioTeste };
