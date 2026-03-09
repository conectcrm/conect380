import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import {
  X,
  Save,
  DollarSign,
  Package,
  Users,
  Database,
  Zap,
  Crown,
  HeadphonesIcon,
  Eye,
  Info,
  Sparkles,
  Settings,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../../services/api';
import { ModuloSistema, Plano } from '../../../hooks/useSubscription';

interface PlanoFormModalProps {
  plano?: Plano | null;
  onSave: (dados: any) => Promise<void>;
  onClose: () => void;
}

interface FormData {
  nome: string;
  codigo: string;
  descricao: string;
  preco: number;
  limiteUsuarios: number;
  limiteClientes: number;
  limiteStorage: number;
  limiteApiCalls: number;
  whiteLabel: boolean;
  suportePrioritario: boolean;
  ativo: boolean;
  ordem: number;
  modulosInclusos: string[];
}

const ONE_GB = 1024 * 1024 * 1024;

const bytesToGb = (value: number) => {
  if (value < 0) {
    return -1;
  }

  return Number((value / ONE_GB).toFixed(2));
};

const gbToBytes = (value: number) => {
  if (value < 0) {
    return -1;
  }

  return Math.round(value * ONE_GB);
};

export const PlanoFormModal: React.FC<PlanoFormModalProps> = ({ plano, onSave, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    codigo: '',
    descricao: '',
    preco: 0,
    limiteUsuarios: 1,
    limiteClientes: 1,
    limiteStorage: 5 * ONE_GB, // 5GB em bytes
    limiteApiCalls: 1000,
    whiteLabel: false,
    suportePrioritario: false,
    ativo: true,
    ordem: 0,
    modulosInclusos: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadingModulos, setLoadingModulos] = useState(false);
  const [modulosDisponiveis, setModulosDisponiveis] = useState<ModuloSistema[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const carregarModulosDisponiveis = async () => {
      try {
        setLoadingModulos(true);
        const response = await api.get('/planos/modulos');
        const data = Array.isArray(response.data) ? response.data : [];
        setModulosDisponiveis(data);

        if (!plano) {
          const modulosEssenciais = data
            .filter((modulo: ModuloSistema) => Boolean(modulo?.essencial))
            .map((modulo: ModuloSistema) => String(modulo.id));

          if (modulosEssenciais.length > 0) {
            setFormData((prev) =>
              prev.modulosInclusos.length > 0
                ? prev
                : { ...prev, modulosInclusos: modulosEssenciais },
            );
          }
        }
      } catch (error) {
        console.error('Erro ao carregar modulos para vinculo de plano:', error);
      } finally {
        setLoadingModulos(false);
      }
    };

    void carregarModulosDisponiveis();
  }, [plano]);

  useEffect(() => {
    if (plano) {
      setFormData({
        nome: plano.nome || '',
        codigo: plano.codigo || '',
        descricao: plano.descricao || '',
        preco: Number(plano.preco) || 0,
        limiteUsuarios: plano.limiteUsuarios || 1,
        limiteClientes: plano.limiteClientes || 1,
        limiteStorage: Number(plano.limiteStorage) || 5 * ONE_GB,
        limiteApiCalls: plano.limiteApiCalls || 1000,
        whiteLabel: Boolean((plano as any).whiteLabel),
        suportePrioritario: Boolean((plano as any).suportePrioritario),
        ativo: plano.ativo !== false,
        ordem: (plano as any).ordem || 0,
        modulosInclusos: Array.isArray(plano.modulosInclusos)
          ? plano.modulosInclusos.map((modulo) => String(modulo.id))
          : [],
      });
    }
  }, [plano]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleToggleModulo = (moduloId: string, checked: boolean) => {
    setFormData((prev) => {
      const modulosAtuais = new Set(prev.modulosInclusos);
      if (checked) {
        modulosAtuais.add(moduloId);
      } else {
        modulosAtuais.delete(moduloId);
      }

      return {
        ...prev,
        modulosInclusos: Array.from(modulosAtuais),
      };
    });

    if (errors.modulosInclusos) {
      setErrors((prev) => ({ ...prev, modulosInclusos: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'Código é obrigatório';
    } else if (!/^[a-z0-9_-]+$/.test(formData.codigo)) {
      newErrors.codigo = 'Código deve conter apenas letras minúsculas, números, _ e -';
    }

    if (formData.preco < 0) {
      newErrors.preco = 'Preço deve ser maior ou igual a 0';
    }

    if (formData.limiteUsuarios < 1 && formData.limiteUsuarios !== -1) {
      newErrors.limiteUsuarios = 'Limite de usuários deve ser maior que 0 ou -1 (ilimitado)';
    }

    if (formData.limiteClientes < 1 && formData.limiteClientes !== -1) {
      newErrors.limiteClientes = 'Limite de clientes deve ser maior que 0 ou -1 (ilimitado)';
    }

    if (formData.limiteStorage < 1 && formData.limiteStorage !== -1) {
      newErrors.limiteStorage = 'Limite de storage deve ser maior que 0 ou -1 (ilimitado)';
    }

    if (formData.limiteApiCalls < 1 && formData.limiteApiCalls !== -1) {
      newErrors.limiteApiCalls = 'Limite de API calls deve ser maior que 0 ou -1 (ilimitado)';
    }

    if (!Array.isArray(formData.modulosInclusos) || formData.modulosInclusos.length === 0) {
      newErrors.modulosInclusos = 'Selecione pelo menos 1 modulo para o plano';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevenir múltiplas submissões
    if (loading) {
      console.log('⚠️ Submissão já em andamento, ignorando...');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Garantir que todos os campos numéricos são números
      const sanitizedData = {
        ...formData,
        preco: Number(formData.preco),
        limiteUsuarios: Number(formData.limiteUsuarios),
        limiteClientes: Number(formData.limiteClientes),
        limiteStorage: Number(formData.limiteStorage),
        limiteApiCalls: Number(formData.limiteApiCalls),
        ordem: Number(formData.ordem),
        modulosInclusos: Array.from(new Set(formData.modulosInclusos)),
      };

      console.log('FormData antes de enviar:', sanitizedData);
      console.log('Tipos dos dados:', {
        nome: typeof sanitizedData.nome,
        codigo: typeof sanitizedData.codigo,
        preco: typeof sanitizedData.preco,
        limiteUsuarios: typeof sanitizedData.limiteUsuarios,
        limiteClientes: typeof sanitizedData.limiteClientes,
        limiteStorage: typeof sanitizedData.limiteStorage,
        limiteApiCalls: typeof sanitizedData.limiteApiCalls,
      });
      await onSave(sanitizedData);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setErrors({ submit: error.message || 'Erro ao salvar plano' });
    } finally {
      setLoading(false);
    }
  };

  const formatStorageDisplay = (bytes: number) => {
    if (bytes === -1) return 'Ilimitado';
    return `${bytesToGb(bytes).toFixed(2)} GB`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-0">
        <Card className="border-0 shadow-none">
          {/* Header Premium */}
          <CardHeader className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white rounded-t-2xl p-6">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/90 to-purple-700/90 rounded-t-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {plano ? 'Editar Plano' : 'Novo Plano'}
                  </CardTitle>
                  <p className="text-blue-100 text-sm">
                    {plano
                      ? 'Modifique as configurações do plano'
                      : 'Configure um novo plano de assinatura'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-8 bg-gray-50/50">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informações Básicas */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="nome"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      Nome do Plano <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleChange('nome', e.target.value)}
                        placeholder="Ex: Professional"
                        className={`pl-4 pr-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.nome
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      />
                      {errors.nome && (
                        <div className="flex items-center gap-1 mt-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-sm">{errors.nome}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="codigo"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      Código <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) => handleChange('codigo', e.target.value.toLowerCase())}
                        placeholder="Ex: professional"
                        className={`pl-4 pr-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.codigo
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      />
                      {errors.codigo && (
                        <div className="flex items-center gap-1 mt-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-sm">{errors.codigo}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="descricao" className="text-sm font-medium text-gray-700">
                      Descrição
                    </Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => handleChange('descricao', e.target.value)}
                      placeholder="Descreva as características do plano..."
                      rows={3}
                      className="border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="preco"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      Preço Mensal (R$) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="preco"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.preco}
                        onChange={(e) => handleChange('preco', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className={`pl-10 pr-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.preco
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      />
                      {errors.preco && (
                        <div className="flex items-center gap-1 mt-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-sm">{errors.preco}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Limites de Uso */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Database className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Limites de Uso</h3>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-800">Use -1 para limites ilimitados</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="limiteUsuarios"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Users className="h-4 w-4 text-gray-500" />
                      Limite de Usuários <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="limiteUsuarios"
                      type="number"
                      value={formData.limiteUsuarios}
                      onChange={(e) =>
                        handleChange('limiteUsuarios', parseInt(e.target.value) || 1)
                      }
                      className={`pl-4 pr-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.limiteUsuarios
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                    {errors.limiteUsuarios && (
                      <div className="flex items-center gap-1 mt-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">{errors.limiteUsuarios}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="limiteClientes"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Users className="h-4 w-4 text-gray-500" />
                      Limite de Clientes <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="limiteClientes"
                      type="number"
                      value={formData.limiteClientes}
                      onChange={(e) =>
                        handleChange('limiteClientes', parseInt(e.target.value) || 1)
                      }
                      className={`pl-4 pr-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.limiteClientes
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                    {errors.limiteClientes && (
                      <div className="flex items-center gap-1 mt-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">{errors.limiteClientes}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="limiteStorage"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Database className="h-4 w-4 text-gray-500" />
                      Storage (GB) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="limiteStorage"
                      type="number"
                      step="0.1"
                      value={formData.limiteStorage === -1 ? -1 : bytesToGb(formData.limiteStorage)}
                      onChange={(e) =>
                        handleChange(
                          'limiteStorage',
                          Number(e.target.value) < 0
                            ? -1
                            : gbToBytes(Number(e.target.value) || 5),
                        )
                      }
                      className={`pl-4 pr-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.limiteStorage
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <p className="text-xs text-gray-500">
                        Atual: {formatStorageDisplay(formData.limiteStorage)}
                      </p>
                    </div>
                    {errors.limiteStorage && (
                      <div className="flex items-center gap-1 mt-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">{errors.limiteStorage}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="limiteApiCalls"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4 text-gray-500" />
                      API Calls/dia <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="limiteApiCalls"
                      type="number"
                      value={formData.limiteApiCalls}
                      onChange={(e) =>
                        handleChange('limiteApiCalls', parseInt(e.target.value) || 1000)
                      }
                      className={`pl-4 pr-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.limiteApiCalls
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                    {errors.limiteApiCalls && (
                      <div className="flex items-center gap-1 mt-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">{errors.limiteApiCalls}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modulos do Plano */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Package className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Modulos do Plano</h3>
                </div>

                {loadingModulos ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    Carregando modulos...
                  </div>
                ) : modulosDisponiveis.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                    Nenhum modulo ativo disponivel no catalogo.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {modulosDisponiveis.map((modulo) => {
                        const checked = formData.modulosInclusos.includes(String(modulo.id));
                        return (
                          <label
                            key={modulo.id}
                            className={`flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                              checked
                                ? 'border-indigo-300 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => handleToggleModulo(String(modulo.id), e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {modulo.nome}
                                </span>
                                {modulo.essencial && (
                                  <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                    essencial
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{modulo.codigo}</p>
                              {modulo.descricao && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {modulo.descricao}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <p className="mt-4 text-xs text-gray-600">
                      {formData.modulosInclusos.length} modulo(s) selecionado(s).
                    </p>
                    {errors.modulosInclusos && (
                      <div className="flex items-center gap-1 mt-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">{errors.modulosInclusos}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Recursos Premium */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Recursos Premium</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Crown className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-900">White Label</Label>
                        <p className="text-sm text-gray-600">
                          Permite personalização completa de marca
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.whiteLabel}
                      onCheckedChange={(checked) => handleChange('whiteLabel', checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <HeadphonesIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-900">
                          Suporte Prioritário
                        </Label>
                        <p className="text-sm text-gray-600">Atendimento com prioridade máxima</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.suportePrioritario}
                      onCheckedChange={(checked) => handleChange('suportePrioritario', checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Eye className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-900">Plano Ativo</Label>
                        <p className="text-sm text-gray-600">
                          Disponível para contratação no sistema
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.ativo}
                      onCheckedChange={(checked) => handleChange('ativo', checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Configurações Avançadas */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Configurações Avançadas</h3>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="ordem"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                    Ordem de Exibição
                  </Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formData.ordem}
                    onChange={(e) => handleChange('ordem', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="pl-4 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all"
                  />
                  <div className="flex items-center gap-1 mt-1">
                    <Info className="h-3 w-3 text-blue-500" />
                    <p className="text-xs text-gray-500">Ordem crescente (0 = primeiro na lista)</p>
                  </div>
                </div>
              </div>

              {/* Erro de submit */}
              {errors.submit && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm font-medium text-red-800">{errors.submit}</p>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 py-3 px-6 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-lg font-medium transition-all"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {plano ? 'Atualizando...' : 'Criando...'}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Save className="h-4 w-4" />
                        {plano ? 'Atualizar' : 'Criar'} Plano
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
