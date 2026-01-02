import React from 'react';
import ModulesScreen from '../../components/navigation/ModulesScreen';
import { getNucleusModulesData } from '../../config/nucleusModulesConfig';

const ConfiguracoesNucleusPage: React.FC = () => {
  const nucleusData = getNucleusModulesData('configuracoes');

  return <ModulesScreen nucleusData={nucleusData} />;
};

export default ConfiguracoesNucleusPage;
