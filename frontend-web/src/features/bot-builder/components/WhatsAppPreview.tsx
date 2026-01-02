import React, { useMemo } from 'react';
import { Smartphone, User, Clock } from 'lucide-react';

interface WhatsAppPreviewProps {
  selectedNode: any;
  nodes: any[];
  edges: any[];
}

/**
 * 📱 Preview de como a mensagem ficará no WhatsApp
 */
export const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({ selectedNode, nodes, edges }) => {
  const previewData = useMemo(() => {
    if (!selectedNode) {
      return null;
    }

    const { tipo, mensagem, opcoes, nome } = selectedNode.data;

    return {
      tipo,
      mensagem: mensagem || 'Mensagem não configurada',
      opcoes: opcoes || [],
      nome: nome || 'Bloco sem nome',
    };
  }, [selectedNode]);

  if (!previewData) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Smartphone className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">Selecione um bloco para ver o preview</p>
      </div>
    );
  }

  const renderOpcoes = () => {
    const { opcoes } = previewData;

    if (!opcoes || opcoes.length === 0) {
      return null;
    }

    // Reply Buttons (1-3 opções)
    if (opcoes.length <= 3) {
      return (
        <div className="mt-3 space-y-2">
          {opcoes.map((opcao: any, index: number) => (
            <button
              key={index}
              className="w-full py-2 px-3 bg-white border-2 border-teal-500 rounded-lg text-teal-600 font-medium text-sm hover:bg-teal-50 transition-colors"
            >
              {opcao.texto || `Opção ${index + 1}`}
            </button>
          ))}
        </div>
      );
    }

    // List Message (4-10 opções)
    if (opcoes.length <= 10) {
      return (
        <div className="mt-3">
          <button className="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-teal-600 font-medium text-sm flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span>📋 Ver opções</span>
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
              {opcoes.length}
            </span>
          </button>

          {/* Lista suspensa simulada */}
          <div className="mt-2 bg-white border border-gray-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-gray-100 px-3 py-2 font-semibold text-gray-700 border-b">
              Selecione uma opção:
            </div>
            {opcoes.slice(0, 3).map((opcao: any, index: number) => (
              <div key={index} className="px-3 py-2 border-b last:border-b-0 hover:bg-gray-50">
                <div className="font-medium text-gray-800">
                  {opcao.texto || `Opção ${index + 1}`}
                </div>
                {opcao.descricao && (
                  <div className="text-gray-500 mt-0.5 text-[10px]">{opcao.descricao}</div>
                )}
              </div>
            ))}
            {opcoes.length > 3 && (
              <div className="px-3 py-2 text-center text-gray-500 italic text-[10px]">
                + {opcoes.length - 3} opções
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fallback texto (11+ opções)
    return (
      <div className="mt-3 bg-gray-100 p-3 rounded-lg border border-gray-300">
        <div className="text-xs text-gray-600 mb-2 font-medium">
          📝 Formato texto (muitas opções):
        </div>
        {opcoes.slice(0, 5).map((opcao: any, index: number) => (
          <div key={index} className="text-sm text-gray-700 mb-1">
            {index + 1}️⃣ {opcao.texto || `Opção ${index + 1}`}
          </div>
        ))}
        {opcoes.length > 5 && (
          <div className="text-xs text-gray-500 italic mt-2">
            ... e mais {opcoes.length - 5} opções
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header do preview */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-800">Preview WhatsApp</span>
        </div>
        <p className="text-xs text-gray-500">Visualização aproximada da mensagem no WhatsApp</p>
      </div>

      {/* Corpo do preview - simulação do WhatsApp */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Wallpaper do WhatsApp */}
        <div
          className="min-h-full bg-[#e5ddd5] bg-opacity-50 rounded-lg p-4"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {/* Mensagem do bot */}
          <div className="flex items-start gap-2 mb-4">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              <User className="h-4 w-4" />
            </div>

            <div className="flex-1 max-w-[85%]">
              {/* Balão da mensagem */}
              <div className="bg-white rounded-lg rounded-tl-none shadow-sm">
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {previewData.mensagem}
                  </p>
                </div>

                {/* Botões ou opções */}
                {renderOpcoes()}

                {/* Timestamp */}
                <div className="px-4 pb-2 pt-1 flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400">
                    {new Date().toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Nome do bloco (desenvolvimento) */}
              <div className="mt-1 px-2">
                <span className="text-[10px] text-gray-500 italic">Etapa: {previewData.nome}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer com dicas */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-xs font-bold">ℹ️</span>
          </div>
          <div className="text-xs text-gray-600">
            <p className="mb-1">
              <strong>Tipos de botões:</strong>
            </p>
            <ul className="space-y-1 ml-3">
              <li>• 1-3 opções: Reply Buttons</li>
              <li>• 4-10 opções: List Message</li>
              <li>• 11+ opções: Texto numerado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
