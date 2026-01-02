import React from 'react';
import ModulesScreen from '../../components/navigation/ModulesScreen';
import { getNucleusModulesData } from '../../config/nucleusModulesConfig';

const GestaoNucleusPage: React.FC = () => {
  const nucleusData = getNucleusModulesData('gestao');

  return <ModulesScreen nucleusData={nucleusData} />;
};

export default GestaoNucleusPage;
