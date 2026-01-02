import React from 'react';
import { Lock, Zap, ArrowLeft, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModuloBloqueadoProps {
  moduloNome: string;
  moduloDescricao: string;
  preco: string;
  recursos?: string[];
}

/**
 * Componente exibido quando usuário tenta acessar módulo não licenciado
 *
 * @example
 * <ModuloBloqueado
 *   moduloNome="CRM"
 *   moduloDescricao="Gestão completa de clientes, contatos e relacionamento"
 *   preco="R$ 299"
 *   recursos={['Base de clientes ilimitada', 'Histórico completo', 'Pipeline de vendas']}
 * />
 */
export const ModuloBloqueado: React.FC<ModuloBloqueadoProps> = ({
  moduloNome,
  moduloDescricao,
  preco,
  recursos = [],
}) => {
  const navigate = useNavigate();

  const handleVoltar = () => {
    navigate('/dashboard');
  };

  const handleContatar = () => {
    // TODO: Integrar com sistema de vendas/suporte
    window.open(
      'https://wa.me/5511999999999?text=Olá! Gostaria de contratar o módulo ' + moduloNome,
      '_blank',
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Lock className="h-12 w-12 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">Módulo {moduloNome}</h1>

            <p className="text-blue-100 text-lg">
              Este recurso não está disponível no seu plano atual
            </p>
          </div>

          {/* Conteúdo */}
          <div className="px-8 py-10">
            {/* Descrição */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                O que você ganha com este módulo:
              </h2>
              <p className="text-gray-600 leading-relaxed">{moduloDescricao}</p>
            </div>

            {/* Recursos (se fornecidos) */}
            {recursos.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Principais recursos:</h3>
                <ul className="space-y-3">
                  {recursos.map((recurso, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-[#159A9C] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{recurso}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preço */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 mb-8 text-center">
              <p className="text-sm text-gray-600 mb-2">Adicione ao seu plano por apenas</p>
              <p className="text-5xl font-bold text-[#159A9C] mb-1">{preco}</p>
              <p className="text-sm text-gray-600">por mês</p>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <button
                onClick={handleContatar}
                className="w-full bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <Zap className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Contratar Agora
              </button>

              <button
                onClick={handleContatar}
                className="w-full bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-[#159A9C] hover:text-[#159A9C] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Falar com Vendas
              </button>

              <button
                onClick={handleVoltar}
                className="w-full text-gray-600 hover:text-gray-900 transition py-3 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <a
                href="mailto:vendas@conectcrm.com.br"
                className="flex items-center gap-2 hover:text-[#159A9C] transition"
              >
                <Mail className="h-4 w-4" />
                vendas@conectcrm.com.br
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="tel:+5511999999999"
                className="flex items-center gap-2 hover:text-[#159A9C] transition"
              >
                <Phone className="h-4 w-4" />
                (11) 99999-9999
              </a>
            </div>
          </div>
        </div>

        {/* Mensagem extra */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          Dúvidas sobre planos? Nossa equipe está pronta para te ajudar! 💙
        </p>
      </div>
    </div>
  );
};

export default ModuloBloqueado;
