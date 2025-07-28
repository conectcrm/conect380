/**
 * Página de Teste para Portal do Cliente
 * Permite testar o acesso ao portal sem depender de emails
 */

import React, { useState } from 'react';
import { ExternalLink, Copy, TestTube, Globe, User, Mail } from 'lucide-react';
import { portalClienteService } from '../services/portalClienteService';
import { gerarTokenNumerico, formatarTokenParaExibicao } from '../utils/tokenUtils';
import toast from 'react-hot-toast';

const TestePortalPage: React.FC = () => {
  const [tokenTeste, setTokenTeste] = useState('');
  const [urlGerada, setUrlGerada] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gerar token de teste
  const gerarTokenTeste = () => {
    const tokenNumerico = gerarTokenNumerico(); // Gera token de 6 dígitos
    setTokenTeste(tokenNumerico);

    const url = portalClienteService.gerarURLPublica(tokenNumerico);
    setUrlGerada(url);

    toast.success(`Token gerado: ${formatarTokenParaExibicao(tokenNumerico)}`);
  };

  // Copiar URL para área de transferência
  const copiarURL = async () => {
    try {
      await navigator.clipboard.writeText(urlGerada);
      toast.success('URL copiada para área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar URL');
    }
  };

  // Abrir portal em nova aba
  const abrirPortal = () => {
    if (urlGerada) {
      window.open(urlGerada, '_blank');
    }
  };

  // Simular envio de proposta por email
  const simularEnvioEmail = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
      toast.success('Email simulado enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao simular envio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] rounded-xl text-white text-2xl font-bold mb-4">
            <TestTube className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Teste do Portal do Cliente
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Use esta página para testar o acesso ao portal do cliente sem precisar enviar emails.
            Gere um token de teste e acesse o portal diretamente.
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-[#159A9C]" />
            <h2 className="text-xl font-semibold text-gray-900">
              Gerador de Acesso ao Portal
            </h2>
          </div>

          <div className="space-y-6">
            {/* Seção de Geração de Token */}
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">
                1. Gerar Token de Teste
              </h3>

              <button
                onClick={gerarTokenTeste}
                className="flex items-center gap-2 px-6 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
              >
                <TestTube className="h-4 w-4" />
                Gerar Token de Teste
              </button>

              {tokenTeste && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700 mb-1">Token Gerado:</div>
                  <div className="font-mono text-lg text-blue-900 bg-blue-100 p-3 rounded text-center tracking-wider">
                    {formatarTokenParaExibicao(tokenTeste)}
                  </div>
                  <div className="text-xs text-blue-600 mt-2 text-center">
                    Código de 6 dígitos para acesso do cliente
                  </div>
                </div>
              )}
            </div>

            {/* Seção de URL Gerada */}
            {urlGerada && (
              <div className="p-6 bg-green-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">
                  2. URL do Portal Gerada
                </h3>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 font-mono text-sm text-green-800 bg-green-100 p-3 rounded border">
                    {urlGerada}
                  </div>
                  <button
                    onClick={copiarURL}
                    className="flex items-center gap-2 px-4 py-3 text-green-700 border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
                    title="Copiar URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={abrirPortal}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir Portal do Cliente
                  </button>

                  <button
                    onClick={simularEnvioEmail}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    {isLoading ? 'Enviando...' : 'Simular Envio por Email'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-6 w-6 text-[#159A9C]" />
            <h2 className="text-xl font-semibold text-gray-900">
              Como Funciona o Portal
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fluxo Normal */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">🔄 Fluxo Normal</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Vendedor cria proposta no sistema</li>
                <li>2. Sistema gera token único automaticamente</li>
                <li>3. Email é enviado para o cliente</li>
                <li>4. Cliente clica no link e acessa portal</li>
                <li>5. Cliente pode aceitar/rejeitar proposta</li>
              </ol>
            </div>

            {/* Fluxo de Teste */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">🧪 Fluxo de Teste</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Gere um token de teste aqui</li>
                <li>2. Copie a URL gerada</li>
                <li>3. Abra em nova aba para testar</li>
                <li>4. Experimente as funcionalidades</li>
                <li>5. Verifique responsividade</li>
              </ol>
            </div>
          </div>

          {/* URLs Importantes */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">📍 URLs Importantes</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Portal Base:</span>
                <code className="text-blue-900 bg-blue-100 px-2 py-1 rounded">
                  /portal/proposta/[TOKEN]
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Esta página:</span>
                <code className="text-blue-900 bg-blue-100 px-2 py-1 rounded">
                  /teste-portal
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Sistema principal:</span>
                <code className="text-blue-900 bg-blue-100 px-2 py-1 rounded">
                  /dashboard
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestePortalPage;
