import React from 'react';
import ModulesScreen from '../../components/navigation/ModulesScreen';
import { getNucleusModulesData } from '../../config/nucleusModulesConfig';

const AdministracaoNucleusPage: React.FC = () => {
  const nucleusData = getNucleusModulesData('administracao');

  return <ModulesScreen nucleusData={nucleusData} />;
};

export default AdministracaoNucleusPage;
