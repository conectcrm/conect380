import React from 'react';
import ModulesScreen from '../../components/navigation/ModulesScreen';
import { getNucleusModulesData } from '../../config/nucleusModulesConfig';

const PrincipalNucleusPage: React.FC = () => {
  const nucleusData = getNucleusModulesData('principal');

  return <ModulesScreen nucleusData={nucleusData} />;
};

export default PrincipalNucleusPage;
