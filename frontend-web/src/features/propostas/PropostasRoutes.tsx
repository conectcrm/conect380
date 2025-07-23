import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TemplatesPropostasPage from './TemplatesPropostasPage';

const PropostasRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/templates" element={<TemplatesPropostasPage />} />
    </Routes>
  );
};

export default PropostasRoutes;
