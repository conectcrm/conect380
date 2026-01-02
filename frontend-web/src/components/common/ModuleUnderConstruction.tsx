import React from 'react';
import { Construction, Clock, CheckCircle2 } from 'lucide-react';

interface ModuleUnderConstructionProps {
  moduleName: string;
  description?: string;
  estimatedCompletion?: string;
  features?: string[];
}

const ModuleUnderConstruction: React.FC<ModuleUnderConstructionProps> = ({
  moduleName,
  description,
  estimatedCompletion,
  features,
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Ícone Principal */}
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Construction className="w-12 h-12 text-white" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{moduleName}</h1>

        {/* Descrição */}
        {description && <p className="text-xl text-gray-600 mb-8 leading-relaxed">{description}</p>}

        {/* Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-semibold text-blue-900">Em Desenvolvimento</span>
          </div>
          {estimatedCompletion && (
            <p className="text-blue-700">
              Previsão de conclusão: <strong>{estimatedCompletion}</strong>
            </p>
          )}
        </div>

        {/* Features Planejadas */}
        {features && features.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Funcionalidades Planejadas
            </h3>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Este módulo está sendo desenvolvido seguindo as melhores práticas de UX/UI.
            <br />
            <strong>Fique atento às próximas atualizações!</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModuleUnderConstruction;
