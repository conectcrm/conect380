import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, Building2, Users, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { departamentoService } from '../../services/departamentoService';
import { useNucleos } from '../../hooks/useNucleos';
import {
  Departamento,
  CreateDepartamentoDto,
  UpdateDepartamentoDto,
  TIPOS_DISTRIBUICAO,
  CORES_DEPARTAMENTO,
  ICONES_DEPARTAMENTO,
} from '../../types/departamentoTypes';

interface ModalCadastroDepartamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departamentoEdicao?: Departamento | null;
}

const ModalCadastroDepartamento: React.FC<ModalCadastroDepartamentoProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departamentoEdicao,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'config'>('dados');

  // Form state
  const [nucleoId, setNucleoId] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cor, setCor] = useState('#6366F1');
  const [icone, setIcone] = useState('briefcase');
  const [ativo, setAtivo] = useState(true);
  const [visivelNoBot, setVisivelNoBot] = useState(true);
  const [ordem, setOrdem] = useState(0);
  const [tipoDistribuicao, setTipoDistribuicao] = useState<string>('round_robin');
  const [capacidadeMaximaTickets, setCapacidadeMaximaTickets] = useState(30);
  const [slaRespostaMinutos, setSlaRespostaMinutos] = useState<number | undefined>();
  const [slaResolucaoHoras, setSlaResolucaoHoras] = useState<number | undefined>();
  const [mensagemBoasVindas, setMensagemBoasVindas] = useState('');

  const isEditing = !!departamentoEdicao;

  // Hook para carregar núcleos da API (apenas ativos)
  const {
    nucleos,
    loading: loadingNucleos,
    error: erroNucleos,
    recarregar: recarregarNucleos,
  } = useNucleos({
    apenasAtivos: true,
    incluirTodos: false,
  });

  const nucleosOptions = useMemo(() => (Array.isArray(nucleos) ? nucleos : []), [nucleos]);

  useEffect(() => {
    if (departamentoEdicao) {
      setNucleoId(departamentoEdicao.nucleoId);
      setNome(departamentoEdicao.nome);
      setDescricao(departamentoEdicao.descricao || '');
      setCodigo(departamentoEdicao.codigo || '');
      setCor(departamentoEdicao.cor);
      setIcone(departamentoEdicao.icone);
      setAtivo(departamentoEdicao.ativo);
      setVisivelNoBot(departamentoEdicao.visivelNoBot ?? true);
      setOrdem(departamentoEdicao.ordem);
      setTipoDistribuicao(departamentoEdicao.tipoDistribuicao);
      setCapacidadeMaximaTickets(departamentoEdicao.capacidadeMaximaTickets);
      setSlaRespostaMinutos(departamentoEdicao.slaRespostaMinutos);
      setSlaResolucaoHoras(departamentoEdicao.slaResolucaoHoras);
      setMensagemBoasVindas(departamentoEdicao.mensagemBoasVindas || '');
    } else {
      resetForm();
    }
  }, [departamentoEdicao]);

  const resetForm = () => {
    setNucleoId('');
    setNome('');
    setDescricao('');
    setCodigo('');
    setCor('#6366F1');
    setIcone('briefcase');
    setAtivo(true);
    setVisivelNoBot(true);
    setOrdem(0);
    setTipoDistribuicao('round_robin');
    setCapacidadeMaximaTickets(30);
    setSlaRespostaMinutos(undefined);
    setSlaResolucaoHoras(undefined);
    setMensagemBoasVindas('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nucleoId || !nome) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      if (isEditing && departamentoEdicao) {
        const dados: UpdateDepartamentoDto = {
          nome,
          descricao: descricao || undefined,
          codigo: codigo || undefined,
          cor,
          icone,
          ativo,
          visivelNoBot,
          ordem,
          tipoDistribuicao: tipoDistribuicao as any,
          capacidadeMaximaTickets,
          slaRespostaMinutos,
          slaResolucaoHoras,
          mensagemBoasVindas: mensagemBoasVindas || undefined,
        };
        await departamentoService.atualizar(departamentoEdicao.id, dados);
        toast.success('Departamento atualizado com sucesso!');
      } else {
        const dados: CreateDepartamentoDto = {
          nucleoId,
          nome,
          descricao: descricao || undefined,
          codigo: codigo || undefined,
          cor,
          icone,
          ativo,
          visivelNoBot,
          ordem,
          tipoDistribuicao: tipoDistribuicao as any,
          capacidadeMaximaTickets,
          slaRespostaMinutos,
          slaResolucaoHoras,
          mensagemBoasVindas: mensagemBoasVindas || undefined,
        };
        await departamentoService.criar(dados);
        toast.success('Departamento criado com sucesso!');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar departamento:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar departamento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[calc(100%-2rem)] sm:w-[600px] md:w-[750px] lg:w-[850px] xl:w-[900px] max-w-[1000px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002333] to-[#159A9C] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6" />
            <h2 className="text-xl font-bold">
              {isEditing ? 'Editar Departamento' : 'Novo Departamento'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('dados')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'dados'
                  ? 'border-b-2 border-[#159A9C] text-[#159A9C] bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Dados Básicos
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'config'
                  ? 'border-b-2 border-[#159A9C] text-[#159A9C] bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configurações
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6">
            {activeTab === 'dados' && (
              <div className="space-y-6">
                {/* Núcleo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Núcleo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={nucleoId}
                    onChange={(e) => setNucleoId(e.target.value)}
                    disabled={isEditing || loadingNucleos}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingNucleos ? 'Carregando núcleos...' : 'Selecione um núcleo'}
                    </option>
                    {nucleosOptions.map((nucleo) => (
                      <option key={nucleo.id} value={nucleo.id}>
                        {nucleo.nome} {nucleo.ativo ? '' : '(Inativo)'}
                      </option>
                    ))}
                  </select>
                  {erroNucleos && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      Não foi possível carregar os núcleos.
                      <button
                        type="button"
                        onClick={recarregarNucleos}
                        className="underline decoration-[#159A9C] text-[#159A9C] hover:text-[#0d7a7c]"
                      >
                        Tentar novamente
                      </button>
                    </p>
                  )}
                  {isEditing && (
                    <p className="mt-1 text-xs text-gray-500">
                      O núcleo não pode ser alterado após a criação
                    </p>
                  )}
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Departamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Ex: Televendas, SAC, Cobrança..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva as responsabilidades e atividades deste departamento..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none"
                  />
                </div>

                {/* Código */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código / Sigla
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ex: TVEN, SAC, COB..."
                    maxLength={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>

                {/* Cor e Ícone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                    <div className="flex gap-2 flex-wrap">
                      {CORES_DEPARTAMENTO.map((corOpcao) => (
                        <button
                          key={corOpcao}
                          type="button"
                          onClick={() => setCor(corOpcao)}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            cor === corOpcao ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                          }`}
                          style={{ backgroundColor: corOpcao }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
                    <select
                      value={icone}
                      onChange={(e) => setIcone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    >
                      {ICONES_DEPARTAMENTO.map((iconeOpcao) => (
                        <option key={iconeOpcao} value={iconeOpcao}>
                          {iconeOpcao}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status e Ordem */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="ativo"
                        checked={ativo}
                        onChange={(e) => setAtivo(e.target.checked)}
                        className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                      />
                      <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
                        Departamento Ativo
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="visivelNoBot"
                        checked={visivelNoBot}
                        onChange={(e) => setVisivelNoBot(e.target.checked)}
                        className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                      />
                      <label htmlFor="visivelNoBot" className="ml-2 block text-sm text-gray-700">
                        Visível no Bot
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Permite que clientes selecionem este departamento no bot
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      value={ordem}
                      onChange={(e) => setOrdem(Number(e.target.value))}
                      min={0}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Mensagem de Boas-Vindas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Boas-Vindas
                  </label>
                  <textarea
                    value={mensagemBoasVindas}
                    onChange={(e) => setMensagemBoasVindas(e.target.value)}
                    placeholder="Mensagem automática enviada ao cliente quando direcionado a este departamento..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-6">
                {/* Tipo de Distribuição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Distribuição
                  </label>
                  <select
                    value={tipoDistribuicao}
                    onChange={(e) => setTipoDistribuicao(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  >
                    {TIPOS_DISTRIBUICAO.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label} - {tipo.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Capacidade Máxima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidade Máxima de Tickets
                  </label>
                  <input
                    type="number"
                    value={capacidadeMaximaTickets}
                    onChange={(e) => setCapacidadeMaximaTickets(Number(e.target.value))}
                    min={1}
                    max={1000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>

                {/* SLA Resposta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SLA de Resposta (minutos)
                  </label>
                  <input
                    type="number"
                    value={slaRespostaMinutos || ''}
                    onChange={(e) =>
                      setSlaRespostaMinutos(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="Deixe vazio para herdar do núcleo"
                    min={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>

                {/* SLA Resolução */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SLA de Resolução (horas)
                  </label>
                  <input
                    type="number"
                    value={slaResolucaoHoras || ''}
                    onChange={(e) =>
                      setSlaResolucaoHoras(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="Deixe vazio para herdar do núcleo"
                    min={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7c] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEditing ? 'Atualizar' : 'Criar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCadastroDepartamento;
