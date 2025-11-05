import React, { useState } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';

export const GeralTab: React.FC = () => {
  const [configuracoes, setConfiguracoes] = useState({
    tempoMaximoSessao: 3600,
    mensagemBoasVindas: 'Olá! Como posso ajudar você hoje?',
    mensagemAusencia: 'No momento estamos ausentes. Em breve retornaremos seu contato.',
    habilitarNotificacoes: true,
    habilitarSom: true,
    habilitarTransferencia: true,
    limiteTransferencias: 3,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);

    // Simulação de salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Card de Mensagens Automáticas */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
        <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-[#159A9C]" />
          Mensagens Automáticas
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Mensagem de Boas-Vindas
            </label>
            <textarea
              value={configuracoes.mensagemBoasVindas}
              onChange={(e) => setConfiguracoes({ ...configuracoes, mensagemBoasVindas: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              placeholder="Digite a mensagem de boas-vindas..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Mensagem de Ausência
            </label>
            <textarea
              value={configuracoes.mensagemAusencia}
              onChange={(e) => setConfiguracoes({ ...configuracoes, mensagemAusencia: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              placeholder="Digite a mensagem de ausência..."
            />
          </div>
        </div>
      </div>

      {/* Card de Configurações de Sessão */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
        <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-[#159A9C]" />
          Configurações de Sessão
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Tempo Máximo de Sessão (segundos)
            </label>
            <input
              type="number"
              value={configuracoes.tempoMaximoSessao}
              onChange={(e) => setConfiguracoes({ ...configuracoes, tempoMaximoSessao: parseInt(e.target.value) })}
              min="60"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Tempo em segundos antes da sessão expirar por inatividade
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Limite de Transferências
            </label>
            <input
              type="number"
              value={configuracoes.limiteTransferencias}
              onChange={(e) => setConfiguracoes({ ...configuracoes, limiteTransferencias: parseInt(e.target.value) })}
              min="1"
              max="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Número máximo de vezes que um atendimento pode ser transferido
            </p>
          </div>
        </div>
      </div>

      {/* Card de Funcionalidades */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
        <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-[#159A9C]" />
          Funcionalidades
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-[#002333]">Notificações</p>
              <p className="text-sm text-[#64748B]">Ativar notificações do sistema</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.habilitarNotificacoes}
                onChange={(e) => setConfiguracoes({ ...configuracoes, habilitarNotificacoes: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#159A9C]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#159A9C]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-[#002333]">Sons</p>
              <p className="text-sm text-[#64748B]">Reproduzir sons de notificação</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.habilitarSom}
                onChange={(e) => setConfiguracoes({ ...configuracoes, habilitarSom: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#159A9C]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#159A9C]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-[#002333]">Transferências</p>
              <p className="text-sm text-[#64748B]">Permitir transferência de atendimentos</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.habilitarTransferencia}
                onChange={(e) => setConfiguracoes({ ...configuracoes, habilitarTransferencia: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#159A9C]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#159A9C]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Resetar
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {/* Mensagem de Sucesso */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              Configurações salvas com sucesso!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
