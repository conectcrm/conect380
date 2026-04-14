import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

type BackendIndisponivelProps = {
  moduloNome?: string;
};

const BackendIndisponivel: React.FC<BackendIndisponivelProps> = ({ moduloNome }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-amber-100 rounded-2xl shadow-lg p-8 max-w-2xl w-full">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-[#002333]">
              Servidor indisponivel
            </h2>
            <p className="mt-2 text-gray-700">
              Nao foi possivel conectar ao backend para validar seu plano e carregar dados
              {moduloNome ? ` do modulo ${moduloNome}` : ''}.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Se voce estiver em desenvolvimento, ligue o backend e tente novamente.
            </p>

            <div className="mt-4 rounded-lg border border-[#DEE8EC] bg-[#F8FBFC] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#607B89]">
                API atual
              </p>
              <p className="mt-1 text-sm font-mono text-[#244455] break-all">{API_BASE_URL}</p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center px-4 py-2 border border-[#C8DAE2] bg-white text-[#244455] rounded-lg hover:bg-[#F1F7FA] transition-colors text-sm font-medium"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BackendIndisponivel);

