import React, { useState } from 'react';
import { StandardPageTemplate } from '../../components/templates';
import type { DashboardCard } from '../../components/templates';
import { FileText, DollarSign } from 'lucide-react';

// Teste isolado do StandardPageTemplate
export const FaturamentoPageTesteTemplate: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Total Faturado',
      value: 'R$ 125.340,00',
      subtitle: '+12% vs mês anterior',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Faturas Emitidas',
      value: '84',
      subtitle: 'Este mês',
      icon: FileText,
      color: 'blue'
    }
  ];

  return (
    <StandardPageTemplate
      title="Faturamento - Teste Template"
      subtitle="Testando o StandardPageTemplate isoladamente"
      dashboardCards={dashboardCards}
      searchConfig={{
        placeholder: 'Buscar faturas...',
        value: searchValue,
        onChange: setSearchValue,
        onSearch: () => console.log('Busca:', searchValue)
      }}
    >
      <div className="p-4 bg-white rounded-lg shadow">
        <p>✅ StandardPageTemplate funcionando!</p>
        <p>Busca atual: {searchValue}</p>
      </div>
    </StandardPageTemplate>
  );
};

export default FaturamentoPageTesteTemplate;
