import React from 'react';
import { Home } from 'lucide-react';
import ModulesScreen, { NucleusModulesData } from '../../components/navigation/ModulesScreen';

const PrincipalNucleusPage: React.FC = () => {
  const principalNucleusData: NucleusModulesData = {
    id: 'principal',
    title: 'Principal',
    description: 'Dashboard e visão geral do sistema',
    icon: Home,
    color: 'blue',
    modules: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        description: 'Visão geral com KPIs, gráficos e métricas principais do negócio.',
        href: '/dashboard',
        icon: Home,
        notifications: 1,
        status: 'active'
      }
    ]
  };

  return <ModulesScreen nucleusData={principalNucleusData} />;
};

export default PrincipalNucleusPage;
