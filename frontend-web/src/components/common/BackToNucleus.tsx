import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackToNucleusProps {
  nucleusName: string;
  nucleusHref: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const BackToNucleus: React.FC<BackToNucleusProps> = ({ 
  nucleusName, 
  nucleusHref, 
  color = 'blue' 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(nucleusHref);
  };

  const getColorClasses = (color: string) => {
    // Usando a paleta Crevasse para todas as cores
    const colors = {
      blue: 'from-[#159A9C] to-[#0F7B7D]',      // Teal gradient
      green: 'from-[#159A9C] to-[#0F7B7D]',     // Teal gradient
      orange: 'from-[#159A9C] to-[#0F7B7D]',    // Teal gradient
      purple: 'from-[#159A9C] to-[#0F7B7D]',    // Teal gradient
      red: 'from-[#159A9C] to-[#0F7B7D]'        // Teal gradient
    };
    
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const gradientClasses = getColorClasses(color);

  return (
    <div className={`bg-gradient-to-r ${gradientClasses} shadow-sm mb-6`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14">
          <button
            onClick={handleBack}
            className="flex items-center text-white hover:text-gray-200 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Voltar para {nucleusName}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackToNucleus;
