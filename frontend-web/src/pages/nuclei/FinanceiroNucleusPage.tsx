import React from 'react';
import ModulesScreen from '../../components/navigation/ModulesScreen';
import { getNucleusModulesData } from '../../config/nucleusModulesConfig';

const FinanceiroNucleusPage: React.FC = () => {
  const nucleusData = getNucleusModulesData('financeiro');

  return <ModulesScreen nucleusData={nucleusData} />;
};

export default FinanceiroNucleusPage;
