import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import PropostaActions from '../components/PropostaActions';
import ModalVisualizarProposta from '../components/ModalVisualizarProposta';
import { PropostaCompleta } from '../services/propostasService';
import {
  FileText,
  Eye,
  Mail,
  MessageSquare,
  Download,
  Share2
} from 'lucide-react';

const TestePropostaActions: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  // Proposta de exemplo para teste
  const propostaExemplo: PropostaCompleta = {
    id: 'prop_001',
    numero: 'PROP-2025-001',
    titulo: 'Desenvolvimento de Sistema CRM',
    subtotal: 15000,
    total: 15000,
    dataValidade: new Date('2025-08-30'),
    status: 'enviada',
    criadaEm: new Date('2025-01-27'),
    descontoGlobal: 0,
    impostos: 0,
    formaPagamento: 'Parcelado em 3x',
    validadeDias: 30,
    incluirImpostosPDF: false,
    cliente: {
      id: 'cliente_001',
      nome: 'Empresa ABC Ltda',
      documento: '12.345.678/0001-90',
      email: 'contato@empresaabc.com.br',
      telefone: '(62) 99999-8888',
      endereco: 'Rua das Empresas, 123',
      cidade: 'Goiânia',
      estado: 'GO',
      cep: '74000-000',
      tipoPessoa: 'juridica' as const
    },
    vendedor: {
      id: 'vendedor_001',
      nome: 'João Silva',
      email: 'joao@conectcrm.com',
      telefone: '(62) 99668-9991',
      tipo: 'vendedor' as const,
      ativo: true
    },
    produtos: [
      {
        produto: {
          id: 'prod_001',
          nome: 'Sistema CRM Personalizado',
          preco: 12000,
          categoria: 'Software',
          descricao: 'Desenvolvimento de sistema CRM com módulos de vendas, clientes e relatórios',
          unidade: 'un'
        },
        quantidade: 1,
        desconto: 0,
        subtotal: 12000
      },
      {
        produto: {
          id: 'prod_002',
          nome: 'Treinamento e Implantação',
          preco: 3000,
          categoria: 'Serviços',
          descricao: 'Treinamento da equipe e acompanhamento na implantação do sistema',
          unidade: 'un'
        },
        quantidade: 1,
        desconto: 0,
        subtotal: 3000
      }
    ],
    observacoes: 'Esta proposta inclui desenvolvimento completo do sistema, testes, treinamento da equipe e suporte técnico por 3 meses. Prazo de entrega: 45 dias úteis.'
  };

  const handleViewProposta = (proposta: PropostaCompleta) => {
    setShowModal(true);
    toast.success('Abrindo visualização da proposta');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-[#159A9C] mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              Teste - Sistema de Compartilhamento de Propostas
            </h1>
          </div>
          <p className="text-gray-600">
            Teste todas as funcionalidades: visualização, envio por email, WhatsApp, download PDF e compartilhamento.
          </p>
        </div>

        {/* Demonstração da Proposta */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Proposta de Exemplo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Informações da Proposta</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Número:</span> {propostaExemplo.numero}</div>
                <div><span className="font-medium">Título:</span> {propostaExemplo.titulo}</div>
                <div><span className="font-medium">Status:</span> {propostaExemplo.status}</div>
                <div><span className="font-medium">Valor:</span> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(propostaExemplo.total)}</div>
                <div><span className="font-medium">Válida até:</span> {propostaExemplo.dataValidade.toLocaleDateString('pt-BR')}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Cliente</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Nome:</span> {propostaExemplo.cliente?.nome}</div>
                <div><span className="font-medium">Email:</span> {propostaExemplo.cliente?.email}</div>
                <div><span className="font-medium">Telefone:</span> {propostaExemplo.cliente?.telefone}</div>
                <div><span className="font-medium">Cidade:</span> {propostaExemplo.cliente?.cidade}/{propostaExemplo.cliente?.estado}</div>
              </div>
            </div>
          </div>

          {/* Ações de Teste */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Ações Disponíveis (Teste as funcionalidades)
            </h3>

            {/* Versão com Labels */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-gray-600 mb-2">Versão com rótulos:</h4>
              <PropostaActions
                proposta={propostaExemplo}
                onViewProposta={handleViewProposta}
                showLabels={true}
                className="flex-wrap gap-2"
              />
            </div>

            {/* Versão apenas ícones */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Versão apenas ícones:</h4>
              <PropostaActions
                proposta={propostaExemplo}
                onViewProposta={handleViewProposta}
                showLabels={false}
                className="justify-start"
              />
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            📋 Como Testar
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start">
              <Eye className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Visualizar:</strong> Abre modal com detalhes completos da proposta
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Email:</strong> Envia proposta por email usando sistema real de email configurado
              </div>
            </div>
            <div className="flex items-start">
              <MessageSquare className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <strong>WhatsApp:</strong> Abre WhatsApp Web com mensagem formatada e link de acesso
              </div>
            </div>
            <div className="flex items-start">
              <Download className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <strong>PDF:</strong> Gera e baixa PDF da proposta (demonstração)
              </div>
            </div>
            <div className="flex items-start">
              <Share2 className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Compartilhar:</strong> Copia link de acesso ou usa Web Share API
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Visualização */}
      <ModalVisualizarProposta
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        proposta={showModal ? propostaExemplo : null}
      />
    </div>
  );
};

export default TestePropostaActions;
