// Script simples para testar a geração de PDF localmente
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Dados de exemplo
const dadosExemplo = {
  "numeroProposta": "2025001",
  "titulo": "Sistema de Gestão Empresarial - Teste",
  "descricao": "Desenvolvimento de sistema completo de gestão empresarial com módulos de vendas, estoque, financeiro e relatórios personalizados.",
  "status": "sent",
  "statusText": "Enviada",
  "dataEmissao": "22/01/2025",
  "dataValidade": "21/02/2025",
  "dataGeracao": "22/01/2025",
  "empresa": {
    "nome": "Conect CRM Solutions",
    "endereco": "Rua das Tecnologias, 123 - Sala 456",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "telefone": "(11) 3333-4444",
    "email": "contato@conectcrm.com",
    "cnpj": "12.345.678/0001-90"
  },
  "cliente": {
    "nome": "João Silva",
    "empresa": "Silva & Associados Ltda",
    "email": "joao@silvaassociados.com",
    "telefone": "(11) 99999-8888",
    "documento": "12.345.678/0001-99",
    "tipoDocumento": "CNPJ",
    "endereco": "Av. Paulista, 1000 - Conj. 12"
  },
  "vendedor": {
    "nome": "Maria Santos",
    "email": "maria@conectcrm.com",
    "telefone": "(11) 98765-4321",
    "cargo": "Consultora de Vendas"
  },
  "itens": [
    {
      "nome": "Módulo de Vendas",
      "descricao": "Sistema completo de gestão de vendas com controle de pipeline, propostas e relatórios",
      "quantidade": 1,
      "valorUnitario": "R$ 5.000,00",
      "desconto": 0,
      "valorTotal": "R$ 5.000,00"
    },
    {
      "nome": "Módulo de Estoque",
      "descricao": "Controle completo de estoque com entrada, saída e relatórios de movimentação",
      "quantidade": 1,
      "valorUnitario": "R$ 3.000,00",
      "desconto": 10,
      "valorTotal": "R$ 2.700,00"
    },
    {
      "nome": "Módulo Financeiro",
      "descricao": "Gestão de contas a pagar, receber, fluxo de caixa e conciliação bancária",
      "quantidade": 1,
      "valorUnitario": "R$ 4.000,00",
      "desconto": 0,
      "valorTotal": "R$ 4.000,00"
    },
    {
      "nome": "Treinamento da Equipe",
      "descricao": "Treinamento completo para 5 usuários do sistema",
      "quantidade": 5,
      "valorUnitario": "R$ 200,00",
      "desconto": 0,
      "valorTotal": "R$ 1.000,00"
    }
  ],
  "subtotal": "R$ 12.700,00",
  "descontoGeral": 0,
  "percentualDesconto": 0,
  "impostos": 0,
  "valorTotal": "R$ 12.700,00",
  "formaPagamento": "50% na assinatura do contrato e 50% na entrega",
  "prazoEntrega": "60 dias úteis após aprovação do projeto",
  "garantia": "12 meses de garantia e suporte técnico",
  "validadeProposta": "30 dias",
  "condicoesGerais": [
    "Os preços apresentados têm validade de 30 dias a partir da data desta proposta",
    "O prazo de entrega será contado a partir da confirmação do pedido e aprovação do projeto",
    "Eventuais alterações no escopo do projeto poderão gerar custos adicionais mediante aprovação",
    "O pagamento deverá ser realizado conforme as condições estabelecidas nesta proposta",
    "Esta proposta não gera vínculo contratual até sua formal aceitação por ambas as partes",
    "Suporte técnico incluso por 12 meses após a entrega do projeto",
    "Treinamento será realizado nas instalações do cliente ou remotamente conforme disponibilidade"
  ],
  "observacoes": "Esta proposta foi elaborada com base nas necessidades apresentadas pelo cliente. Estamos à disposição para esclarecimentos adicionais e ajustes que se façam necessários."
};

function testarTemplate() {
  try {
    // Ler o template
    const templatePath = path.join(__dirname, 'proposta-comercial.html');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    
    // Compilar o template
    const template = handlebars.compile(templateSource);
    
    // Gerar HTML
    const html = template(dadosExemplo);
    
    // Salvar HTML gerado
    const outputPath = path.join(__dirname, 'proposta-teste.html');
    fs.writeFileSync(outputPath, html);
    
    console.log('✅ Template testado com sucesso!');
    console.log(`📄 Arquivo gerado: ${outputPath}`);
    console.log('🔍 Abra o arquivo no navegador para visualizar o resultado.');
    
  } catch (error) {
    console.error('❌ Erro ao testar template:', error.message);
  }
}

// Executar teste
testarTemplate();
