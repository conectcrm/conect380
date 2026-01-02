import React, { useState } from 'react';
import { StandardPageTemplate, StandardDataTable } from '../../components/templates';
import type { DashboardCard, TableColumn, TableAction } from '../../components/templates';
import { FileText, DollarSign, Eye, Edit, Download } from 'lucide-react';

// Interface para os dados de teste
interface FaturaTest {
  id: string;
  numero: string;
  clienteNome: string;
  valor: number;
  status: string;
  dataEmissao: string;
}

// Teste isolado do StandardDataTable
export const FaturamentoPageTesteDataTable: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Total Faturado',
      value: 'R$ 125.340,00',
      subtitle: '+12% vs mês anterior',
      icon: DollarSign,
      color: 'green',
    },
    {
      title: 'Faturas Emitidas',
      value: '84',
      subtitle: 'Este mês',
      icon: FileText,
      color: 'blue',
    },
  ];

  // Dados de teste
  const faturas: FaturaTest[] = [
    {
      id: '1',
      numero: 'FAT-001',
      clienteNome: 'Cliente Teste 1',
      valor: 1500.0,
      status: 'paga',
      dataEmissao: '2024-01-15',
    },
    {
      id: '2',
      numero: 'FAT-002',
      clienteNome: 'Cliente Teste 2',
      valor: 2500.0,
      status: 'pendente',
      dataEmissao: '2024-01-20',
    },
  ];

  // Configuração das colunas
  const columns: TableColumn<FaturaTest>[] = [
    {
      key: 'numero',
      label: 'Número',
      sortable: true,
    },
    {
      key: 'clienteNome',
      label: 'Cliente',
      sortable: true,
    },
    {
      key: 'valor',
      label: 'Valor',
      sortable: true,
      render: (fatura) => `R$ ${fatura.valor.toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (fatura) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            fatura.status === 'paga'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {fatura.status}
        </span>
      ),
    },
    {
      key: 'dataEmissao',
      label: 'Data Emissão',
      sortable: true,
    },
  ];

  // Ações da tabela
  const actions: TableAction<FaturaTest>[] = [
    {
      label: 'Visualizar',
      icon: Eye,
      onClick: (fatura) => console.log('Visualizar:', fatura),
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: (fatura) => console.log('Editar:', fatura),
    },
    {
      label: 'Download',
      icon: Download,
      onClick: (fatura) => console.log('Download:', fatura),
    },
  ];

  return (
    <StandardPageTemplate
      title="Faturamento - Teste DataTable"
      subtitle="Testando o StandardDataTable isoladamente"
      dashboardCards={dashboardCards}
      searchConfig={{
        placeholder: 'Buscar faturas...',
        value: searchValue,
        onChange: setSearchValue,
        onSearch: () => console.log('Busca:', searchValue),
      }}
    >
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">✅ StandardPageTemplate funcionando!</p>
          <p className="text-blue-700">Testando agora o StandardDataTable...</p>
        </div>

        <StandardDataTable
          data={faturas}
          columns={columns}
          actions={actions}
          onSelectionChange={(selected) => console.log('Selecionados:', selected)}
        />

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            ✅ Se você está vendo isso, o StandardDataTable funcionou!
          </p>
        </div>
      </div>
    </StandardPageTemplate>
  );
};

export default FaturamentoPageTesteDataTable;
