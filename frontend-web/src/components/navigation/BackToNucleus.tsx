import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackToNucleusProps {
  title?: string;
  nucleusName: string;
  nucleusPath: string;
  currentModuleName?: string;
}

export const BackToNucleus: React.FC<BackToNucleusProps> = ({
  title,
  nucleusName,
  nucleusPath,
  currentModuleName
}) => {
  const displayTitle = currentModuleName || title;

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link
          to={nucleusPath}
          className="flex items-center space-x-1 hover:text-[#159A9C] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar para {nucleusName}</span>
        </Link>
      </div>
      {displayTitle && (
        <h1 className="text-2xl font-bold text-[#002333]">{displayTitle}</h1>
      )}
    </div>
  );
};
