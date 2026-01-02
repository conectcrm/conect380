import React from 'react';
import ModulesScreen from '../../components/navigation/ModulesScreen';
import { getNucleusModulesData } from '../../config/nucleusModulesConfig';

const SistemaNucleusPage: React.FC = () => {
  const nucleusData = getNucleusModulesData('sistema');

  return <ModulesScreen nucleusData={nucleusData} />;
};

export default SistemaNucleusPage;
