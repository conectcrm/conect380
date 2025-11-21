import React, { useState, useEffect } from 'react';
import {
  Clock,
  Bell,
  MessageSquare,
  Target,
  Power,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building2,
  Users,
  Edit2,
  Trash2,
  Globe
} from 'lucide-react';
import {
  buscarConfiguracao,
  salvarConfiguracao,
  verificarAgora,
  listarDepartamentos,
  listarConfiguracoes,
  ConfiguracaoInatividade,
  ConfiguracaoInactivityDto,
  Departamento
} from '../../../../services/configuracaoInactividadeService';

const STATUS_OPTIONS = [
  { value: 'AGUARDANDO', label: 'Aguardando' },
  { value: 'EM_ATENDIMENTO', label: 'Em Atendimento' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'RESOLVIDO', label: 'Resolvido' }
];

// 🎯 Funções auxiliares para conversão de tempo com máscara HH:MM:SS
/**
 * Converte minutos para formato HH:MM:SS
 * Ex: 90 → "01:30:00", 45 → "00:45:00"
 */
const minutosParaHMS = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
};

/**
 * Converte formato HH:MM:SS para minutos
 * Ex: "01:30:00" → 90, "00:45:00" → 45
 */
const hmsParaMinutos = (hms: string): number => {
  const partes = hms.split(':');
  const horas = parseInt(partes[0] || '0');
  const minutos = parseInt(partes[1] || '0');
  // Ignoramos segundos (índice 2) pois trabalhamos com minutos
  return (horas * 60) + minutos;
};

/**
 * Aplica máscara HH:MM:SS enquanto usuário digita
 * Remove caracteres não numéricos e formata automaticamente
 */
const aplicarMascaraHMS = (valor: string): string => {
  // Remove tudo que não é número
  const numeros = valor.replace(/\D/g, '');

  // Limita a 6 dígitos (HHMMSS)
  const limitado = numeros.slice(0, 6);

  // Aplica máscara conforme o tamanho
  if (limitado.length === 0) return '';
  if (limitado.length <= 2) return limitado;
  if (limitado.length <= 4) return `${limitado.slice(0, 2)}:${limitado.slice(2)}`;
  return `${limitado.slice(0, 2)}:${limitado.slice(2, 4)}:${limitado.slice(4)}`;
};

/**
 * Valida formato HH:MM:SS e valores numéricos
 */
const validarFormatoHMS = (hms: string): boolean => {
  const regex = /^\d{2}:\d{2}:\d{2}$/;
  if (!regex.test(hms)) return false;

  const partes = hms.split(':');
  const horas = parseInt(partes[0]);
  const minutos = parseInt(partes[1]);
  const segundos = parseInt(partes[2]);

  // Validar limites (HH pode ser > 23 para timeouts longos)
  return minutos >= 0 && minutos <= 59 && segundos >= 0 && segundos <= 59;
};

export const FechamentoAutomaticoTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // 🎯 Departamentos
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState<string | null>(null);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoInatividade[]>([]);
  const [modoEdicao, setModoEdicao] = useState(false);

  // Configuração atual
  const [config, setConfig] = useState<ConfiguracaoInatividade | null>(null);
  const [timeoutMinutos, setTimeoutMinutos] = useState(1440);
  const [timeoutTexto, setTimeoutTexto] = useState('24h'); // Campo visual
  const [enviarAviso, setEnviarAviso] = useState(true);
  const [avisoMinutosAntes, setAvisoMinutosAntes] = useState(60);
  const [avisoTexto, setAvisoTexto] = useState('1h'); // Campo visual
  const [mensagemAviso, setMensagemAviso] = useState('');
  const [mensagemFechamento, setMensagemFechamento] = useState('');
  const [ativo, setAtivo] = useState(false);
  const [statusSelecionados, setStatusSelecionados] = useState<string[]>(['AGUARDANDO', 'EM_ATENDIMENTO']);

  const empresaId = localStorage.getItem('empresaAtiva') || 'empresa-teste-id';

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (departamentoSelecionado !== null) {
      carregarConfiguracao();
    }
  }, [departamentoSelecionado]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar departamentos
      const deptResponse = await listarDepartamentos(empresaId);
      if (deptResponse.sucesso) {
        setDepartamentos(deptResponse.dados);
      }

      // Carregar todas as configurações
      const configsResponse = await listarConfiguracoes(empresaId);
      if (configsResponse.sucesso) {
        setConfiguracoes(configsResponse.dados);
      }

      // Carregar configuração global por padrão
      await carregarConfiguracao();
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const carregarConfiguracao = async () => {
    try {
      setError(null);

      const response = await buscarConfiguracao(empresaId, departamentoSelecionado);

      if (response.sucesso && response.dados) {
        const dados = response.dados;
        setConfig(dados);
        setTimeoutMinutos(dados.timeoutMinutos);
        setTimeoutTexto(minutosParaHMS(dados.timeoutMinutos));
        setEnviarAviso(dados.enviarAviso);
        setAvisoMinutosAntes(dados.avisoMinutosAntes);
        setAvisoTexto(minutosParaHMS(dados.avisoMinutosAntes));
        setMensagemAviso(dados.mensagemAviso || '');
        setMensagemFechamento(dados.mensagemFechamento || '');
        setAtivo(dados.ativo);
        setStatusSelecionados(dados.statusAplicaveis || ['AGUARDANDO', 'EM_ATENDIMENTO']);
        setModoEdicao(true);
      } else {
        // Não existe configuração - modo criação
        setConfig(null);
        setModoEdicao(false);
        limparFormulario();
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar configuração:', err);
      // Não mostrar erro se não existir - é esperado para novo departamento
      setConfig(null);
      setModoEdicao(false);
      limparFormulario();
    }
  };

  const limparFormulario = () => {
    setTimeoutMinutos(1440);
    setTimeoutTexto('24:00:00');
    setEnviarAviso(true);
    setAvisoMinutosAntes(60);
    setAvisoTexto('01:00:00');
    setMensagemAviso('');
    setMensagemFechamento('');
    setAtivo(true);
    setStatusSelecionados(['AGUARDANDO', 'EM_ATENDIMENTO']);
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      setError(null);
      setSucesso(null);

      // Validações de formato
      if (timeoutTexto.length !== 8 || !validarFormatoHMS(timeoutTexto)) {
        setError('Formato inválido para tempo de inatividade. Use: HH:MM:SS (ex: 01:30:00)');
        return;
      }

      if (enviarAviso && (avisoTexto.length !== 8 || !validarFormatoHMS(avisoTexto))) {
        setError('Formato inválido para tempo de aviso. Use: HH:MM:SS (ex: 00:15:00)');
        return;
      }

      // Converter valores finais antes de validar
      const timeoutFinal = hmsParaMinutos(timeoutTexto);
      const avisoFinal = enviarAviso ? hmsParaMinutos(avisoTexto) : 0;

      // Validações de valores
      if (timeoutFinal < 5) {
        setError('Timeout mínimo é 5 minutos (00:05:00)');
        return;
      }

      if (timeoutFinal > 43200) {
        setError('Timeout máximo é 720 horas (30 dias = 43200 minutos)');
        return;
      }

      if (enviarAviso && avisoFinal >= timeoutFinal) {
        setError(`Aviso (${avisoTexto}) deve ser menor que o timeout (${timeoutTexto})`);
        return;
      }

      const dto: ConfiguracaoInactivityDto = {
        departamentoId: departamentoSelecionado,
        timeoutMinutos: timeoutFinal,
        enviarAviso,
        avisoMinutosAntes: avisoFinal,
        mensagemAviso: mensagemAviso || null,
        mensagemFechamento: mensagemFechamento || null,
        ativo,
        statusAplicaveis: statusSelecionados.length > 0 ? statusSelecionados : null
      };

      const response = await salvarConfiguracao(empresaId, dto);

      if (response.sucesso) {
        setSucesso('✅ Configuração salva com sucesso!');
        setConfig(response.dados!);
        setModoEdicao(true);

        // Atualizar estados com valores salvos
        setTimeoutMinutos(timeoutFinal);
        setAvisoMinutosAntes(avisoFinal);

        // Recarregar lista de configurações
        const configsResponse = await listarConfiguracoes(empresaId);
        if (configsResponse.sucesso) {
          setConfiguracoes(configsResponse.dados);
        }
      } else {
        const erroMsg = response.erro || response.mensagem || 'Erro ao salvar configuração';
        setError(erroMsg);
      }
    } catch (err: unknown) {
      console.error('Erro ao salvar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar configuração';
      setError(errorMessage);
    } finally {
      setSalvando(false);
    }
  };

  const handleVerificarAgora = async () => {
    try {
      setVerificando(true);
      setError(null);
      setSucesso(null);

      const response = await verificarAgora(empresaId, departamentoSelecionado);

      if (response.sucesso) {
        const { processados, fechados, avisados } = response.resultado;
        setSucesso(
          `✅ Verificação concluída!\n` +
          `📊 Processados: ${processados}\n` +
          `🔒 Fechados: ${fechados}\n` +
          `⚠️ Avisados: ${avisados}`
        );
      }
    } catch (err: unknown) {
      console.error('Erro ao verificar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao executar verificação';
      setError(errorMessage);
    } finally {
      setVerificando(false);
    }
  };

  const handleToggleStatus = (status: string) => {
    if (statusSelecionados.includes(status)) {
      setStatusSelecionados(statusSelecionados.filter(s => s !== status));
    } else {
      setStatusSelecionados([...statusSelecionados, status]);
    }
  };

  const handleTimeoutChange = (valor: string) => {
    // Aplica máscara automaticamente
    const mascarado = aplicarMascaraHMS(valor);
    setTimeoutTexto(mascarado);

    // Só converte se formato completo e válido
    if (mascarado.length === 8 && validarFormatoHMS(mascarado)) {
      const minutos = hmsParaMinutos(mascarado);
      setTimeoutMinutos(minutos);
    }
  };

  const handleAvisoChange = (valor: string) => {
    // Aplica máscara automaticamente
    const mascarado = aplicarMascaraHMS(valor);
    setAvisoTexto(mascarado);

    // Só converte se formato completo e válido
    if (mascarado.length === 8 && validarFormatoHMS(mascarado)) {
      const minutos = hmsParaMinutos(mascarado);
      setAvisoMinutosAntes(minutos);
    }
  };

  const editarConfiguracao = (configId: string) => {
    const configParaEditar = configuracoes.find(c => c.id === configId);
    if (configParaEditar) {
      setDepartamentoSelecionado(configParaEditar.departamentoId || null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#159A9C]" />
        <span className="ml-3 text-[#002333]">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🎯 Seletor de Escopo: Global ou Departamento */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-[#159A9C]" />
          Configurar Para
        </h3>

        <div className="space-y-4">
          {/* Botão Global */}
          <button
            onClick={() => setDepartamentoSelecionado(null)}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-between ${departamentoSelecionado === null
                ? 'border-[#159A9C] bg-[#159A9C]/5 text-[#002333]'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center">
              <Globe className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Configuração Global</div>
                <div className="text-xs text-gray-500">Aplica-se a todos os departamentos sem configuração específica</div>
              </div>
            </div>
            {departamentoSelecionado === null && (
              <CheckCircle className="h-5 w-5 text-[#159A9C]" />
            )}
          </button>

          {/* Seletor de Departamento */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Ou selecione um departamento específico:
            </label>
            <select
              value={departamentoSelecionado || ''}
              onChange={(e) => setDepartamentoSelecionado(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            >
              <option value="">Selecione um departamento...</option>
              {departamentos.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 📋 Lista de Configurações Existentes */}
      {configuracoes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-[#002333] mb-4">
            Configurações Ativas
          </h3>

          <div className="space-y-3">
            {configuracoes.map(configItem => (
              <div
                key={configItem.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {configItem.departamento ? (
                      <>
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {configItem.departamento.nome}
                        </span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 text-green-600" />
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          Global
                        </span>
                      </>
                    )}
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-[#002333] font-medium font-mono">
                      ⏱️ {minutosParaHMS(configItem.timeoutMinutos)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    {configItem.enviarAviso && (
                      <span className="font-mono">
                        📢 Aviso {minutosParaHMS(configItem.avisoMinutosAntes)} antes
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${configItem.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {configItem.ativo ? '✓ Ativo' : '○ Inativo'}
                  </span>

                  <button
                    onClick={() => editarConfiguracao(configItem.id!)}
                    className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📝 Formulário de Configuração */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-[#002333] mb-4">
          {modoEdicao ? 'Editar Configuração' : 'Nova Configuração'}
        </h3>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800 whitespace-pre-line">{error}</span>
          </div>
        )}

        {sucesso && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-green-800 whitespace-pre-line">{sucesso}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Timeout */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              <Clock className="inline h-4 w-4 mr-2" />
              Tempo de Inatividade
            </label>
            <input
              type="text"
              value={timeoutTexto}
              onChange={(e) => handleTimeoutChange(e.target.value)}
              placeholder="00:00:00"
              maxLength={8}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent font-mono text-lg ${timeoutTexto.length === 8 && !validarFormatoHMS(timeoutTexto)
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
                }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              ⏰ Digite os números e os ":" aparecem automaticamente. Formato: HH:MM:SS
              <br />
              Exemplos: 01:30:00 (1h30min), 00:45:00 (45min), 24:00:00 (24h)
            </p>
            {timeoutTexto.length === 8 && !validarFormatoHMS(timeoutTexto) && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Formato inválido. Minutos e segundos devem ser entre 00 e 59
              </p>
            )}
          </div>

          {/* Enviar Aviso */}
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enviarAviso}
                onChange={(e) => setEnviarAviso(e.target.checked)}
                className="h-4 w-4 text-[#159A9C] rounded focus:ring-2 focus:ring-[#159A9C]"
              />
              <Bell className="h-4 w-4 ml-3 mr-2 text-[#159A9C]" />
              <span className="text-sm font-medium text-[#002333]">
                Enviar aviso antes de fechar
              </span>
            </label>
          </div>

          {/* Tempo de Aviso */}
          {enviarAviso && (
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Avisar quanto tempo antes?
              </label>
              <input
                type="text"
                value={avisoTexto}
                onChange={(e) => handleAvisoChange(e.target.value)}
                placeholder="00:00:00"
                maxLength={8}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent font-mono text-lg ${avisoTexto.length === 8 && !validarFormatoHMS(avisoTexto)
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                  }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                ⏰ Formato: HH:MM:SS - Deve ser menor que {minutosParaHMS(timeoutMinutos)}
                <br />
                Exemplos: 01:00:00 (1h antes), 00:15:00 (15min antes)
              </p>
              {avisoTexto.length === 8 && !validarFormatoHMS(avisoTexto) && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Formato inválido. Minutos e segundos devem ser entre 00 e 59
                </p>
              )}
            </div>
          )}

          {/* Mensagens */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              <MessageSquare className="inline h-4 w-4 mr-2" />
              Mensagem de Aviso (opcional)
            </label>
            <textarea
              value={mensagemAviso}
              onChange={(e) => setMensagemAviso(e.target.value)}
              rows={3}
              placeholder="Deixe em branco para usar mensagem padrão"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Mensagem de Fechamento (opcional)
            </label>
            <textarea
              value={mensagemFechamento}
              onChange={(e) => setMensagemFechamento(e.target.value)}
              rows={3}
              placeholder="Deixe em branco para usar mensagem padrão"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>

          {/* Status Aplicáveis */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-3">
              <Target className="inline h-4 w-4 mr-2" />
              Aplicar para quais status?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {STATUS_OPTIONS.map(status => (
                <label
                  key={status.value}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={statusSelecionados.includes(status.value)}
                    onChange={() => handleToggleStatus(status.value)}
                    className="h-4 w-4 text-[#159A9C] rounded focus:ring-2 focus:ring-[#159A9C]"
                  />
                  <span className="ml-3 text-sm text-[#002333]">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ativo */}
          <div className="pt-4 border-t">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="h-4 w-4 text-[#159A9C] rounded focus:ring-2 focus:ring-[#159A9C]"
              />
              <Power className="h-4 w-4 ml-3 mr-2 text-[#159A9C]" />
              <span className="text-sm font-medium text-[#002333]">
                Ativar fechamento automático
              </span>
            </label>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4 mt-6 pt-6 border-t">
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
          >
            {salvando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Configuração
              </>
            )}
          </button>

          <button
            onClick={handleVerificarAgora}
            disabled={verificando || !config}
            className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            {verificando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Verificar Agora
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
