import React, { useState } from 'react';
import { Mail, Check, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

/**
 * 🚀 Componente temporário para criar canal de e-mail
 * Usar uma vez para adicionar o canal no banco de dados
 */
export const CriarCanalEmailButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [canalCriado, setCanalCriado] = useState<any>(null);

  const handleCriar = async () => {
    setLoading(true);
    setErro(null);
    setSucesso(false);

    try {
      const response = await api.post('/api/atendimento/canais/criar-canal-email');

      if (response.data?.success) {
        setSucesso(true);
        setCanalCriado(response.data.data);
        console.log('✅ Canal criado:', response.data);
      } else {
        throw new Error(response.data?.message || 'Erro ao criar canal');
      }
    } catch (error: any) {
      console.error('❌ Erro:', error);
      setErro(error.response?.data?.message || error.message || 'Erro ao criar canal');
    } finally {
      setLoading(false);
    }
  };

  if (sucesso && canalCriado) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-900">Canal de E-mail Criado!</h3>
            <p className="text-sm text-green-700 mt-1">
              O canal "{canalCriado.nome}" foi adicionado ao sistema.
            </p>
            <div className="mt-2 text-xs text-green-600">
              <strong>ID:</strong> {canalCriado.id}
            </div>
            <p className="text-sm text-green-700 mt-2">
              ✅ Agora você pode selecionar este canal no modal "Novo Atendimento"
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900">Canal de E-mail não encontrado</h3>
          <p className="text-sm text-blue-700 mt-1">
            Clique no botão abaixo para criar o canal de e-mail no banco de dados.
          </p>

          {erro && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          )}

          <button
            onClick={handleCriar}
            disabled={loading}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Criar Canal de E-mail
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CriarCanalEmailButton;
