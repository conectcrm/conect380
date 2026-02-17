/**
 * Componente de Acesso Rápido ao Portal
 * Permite gerar links do portal diretamente das propostas
 */

import React, { useState } from 'react';
import { ExternalLink, Globe, Copy, Mail, Loader2 } from 'lucide-react';
import { portalClienteService } from '../../services/portalClienteService';
import toast from 'react-hot-toast';

interface AcessoPortalProps {
  propostaId: string;
  titulo?: string;
  clienteEmail?: string;
  compact?: boolean;
}

const AcessoPortal: React.FC<AcessoPortalProps> = ({
  propostaId,
  titulo = 'Acessar Portal',
  clienteEmail,
  compact = false,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [urlPortal, setUrlPortal] = useState<string | null>(null);

  // Gerar link do portal
  const gerarLinkPortal = async () => {
    try {
      setIsGenerating(true);

      // Simular geração de token (substituir por API real)
      const token = `prop_${propostaId}_${Date.now()}`;
      const url = portalClienteService.gerarURLPublica(token);

      setUrlPortal(url);
      toast.success('Link do portal gerado!');
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast.error('Erro ao gerar link do portal');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar link
  const copiarLink = async () => {
    if (!urlPortal) return;

    try {
      await navigator.clipboard.writeText(urlPortal);
      toast.success('Link copiado!');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  // Abrir portal
  const abrirPortal = () => {
    if (urlPortal) {
      window.open(urlPortal, '_blank');
    }
  };

  // Enviar por email
  const enviarPorEmail = async () => {
    if (!clienteEmail) {
      toast.error('Email do cliente não informado');
      return;
    }

    try {
      setIsSending(true);

      // Simular envio (substituir por API real)
      await portalClienteService.enviarPropostaPorEmail(propostaId, {
        emailDestino: clienteEmail,
        incluirAnexo: true,
      });

      toast.success('Email enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro ao enviar email');
    } finally {
      setIsSending(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {!urlPortal ? (
          <button
            onClick={gerarLinkPortal}
            disabled={isGenerating}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-[#159A9C] text-white rounded hover:bg-[#0F7B7D] transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Globe className="h-3 w-3" />
            )}
            Portal
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={abrirPortal}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir
            </button>
            <button
              onClick={copiarLink}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 border rounded hover:bg-gray-50 transition-colors"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-5 w-5 text-[#159A9C]" />
        <h3 className="font-medium text-gray-900">{titulo}</h3>
      </div>

      {!urlPortal ? (
        <button
          onClick={gerarLinkPortal}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          {isGenerating ? 'Gerando...' : 'Gerar Link do Portal'}
        </button>
      ) : (
        <div className="space-y-3">
          {/* URL Gerada */}
          <div className="p-3 bg-white border rounded">
            <div className="text-xs text-gray-500 mb-1">Link do Portal:</div>
            <div className="font-mono text-sm text-gray-700 break-all">{urlPortal}</div>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <button
              onClick={abrirPortal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Portal
            </button>

            <button
              onClick={copiarLink}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Copy className="h-4 w-4" />
              Copiar Link
            </button>

            {clienteEmail && (
              <button
                onClick={enviarPorEmail}
                disabled={isSending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {isSending ? 'Enviando...' : 'Enviar Email'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcessoPortal;
