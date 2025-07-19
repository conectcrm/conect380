import React, { useState } from 'react';

interface Proposal {
  id: string;
  cliente: string;
  valor: number;
  status: 'pending' | 'approved' | 'rejected' | 'in-review';
  data: string;
  vendedor: string;
}

const mockProposals: Proposal[] = [
  {
    id: 'PROP-001',
    cliente: 'Empresa ABC Ltda',
    valor: 125000,
    status: 'pending',
    data: '2025-07-15',
    vendedor: 'João Silva'
  },
  {
    id: 'PROP-002',
    cliente: 'Tech Solutions Inc',
    valor: 85000,
    status: 'approved',
    data: '2025-07-14',
    vendedor: 'Maria Santos'
  },
  {
    id: 'PROP-003',
    cliente: 'StartUp XYZ',
    valor: 45000,
    status: 'in-review',
    data: '2025-07-13',
    vendedor: 'Carlos Oliveira'
  },
  {
    id: 'PROP-004',
    cliente: 'Global Corp',
    valor: 200000,
    status: 'rejected',
    data: '2025-07-12',
    vendedor: 'Ana Costa'
  },
  {
    id: 'PROP-005',
    cliente: 'Local Business',
    valor: 35000,
    status: 'pending',
    data: '2025-07-11',
    vendedor: 'Pedro Lima'
  }
];

export const ProposalsTableWidget: React.FC = () => {
  const [sortField, setSortField] = useState<keyof Proposal>('data');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Proposal) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedProposals = [...mockProposals].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Tratar valores numéricos
    if (sortField === 'valor') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: Proposal['status']) => {
    const statusConfig = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Aprovada', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-800' },
      'in-review': { label: 'Em Análise', color: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getSortIcon = (field: keyof Proposal) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Propostas Recentes</h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Ver todas
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th 
                className="text-left py-2 px-1 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('id')}
              >
                ID {getSortIcon('id')}
              </th>
              <th 
                className="text-left py-2 px-1 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('cliente')}
              >
                Cliente {getSortIcon('cliente')}
              </th>
              <th 
                className="text-left py-2 px-1 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('valor')}
              >
                Valor {getSortIcon('valor')}
              </th>
              <th 
                className="text-left py-2 px-1 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                Status {getSortIcon('status')}
              </th>
              <th 
                className="text-left py-2 px-1 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('data')}
              >
                Data {getSortIcon('data')}
              </th>
              <th 
                className="text-left py-2 px-1 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('vendedor')}
              >
                Vendedor {getSortIcon('vendedor')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProposals.map((proposal) => (
              <tr 
                key={proposal.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <td className="py-2 px-1 font-mono text-xs">
                  {proposal.id}
                </td>
                <td className="py-2 px-1 font-medium">
                  {proposal.cliente}
                </td>
                <td className="py-2 px-1 font-medium text-green-600">
                  {formatCurrency(proposal.valor)}
                </td>
                <td className="py-2 px-1">
                  {getStatusBadge(proposal.status)}
                </td>
                <td className="py-2 px-1 text-gray-600">
                  {formatDate(proposal.data)}
                </td>
                <td className="py-2 px-1">
                  {proposal.vendedor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedProposals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma proposta encontrada</p>
        </div>
      )}

      {/* Estatísticas rápidas */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total de Propostas:</span>
            <span className="ml-2 font-medium">{mockProposals.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Valor Total:</span>
            <span className="ml-2 font-medium text-green-600">
              {formatCurrency(mockProposals.reduce((sum, p) => sum + p.valor, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
