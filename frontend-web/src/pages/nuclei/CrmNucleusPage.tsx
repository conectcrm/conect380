import React from 'react';
import ModulesScreen from '../../components/navigation/ModulesScreen';
import { getNucleusModulesData } from '../../config/nucleusModulesConfig';

const CrmNucleusPage: React.FC = () => {
  const nucleusData = getNucleusModulesData('crm');

  return <ModulesScreen nucleusData={nucleusData} />;
};

export default CrmNucleusPage;
