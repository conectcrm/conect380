import React from 'react';
import ModulesScreen from '../../components/navigation/ModulesScreen';
import { getNucleusModulesData } from '../../config/nucleusModulesConfig';

const VendasNucleusPage: React.FC = () => {
  const nucleusData = getNucleusModulesData('vendas');

  return <ModulesScreen nucleusData={nucleusData} />;
};

export default VendasNucleusPage;
