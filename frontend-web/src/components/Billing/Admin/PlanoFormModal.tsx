import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { X, Save, DollarSign } from 'lucide-react';
import { Plano } from '../../../hooks/useSubscription';

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
}

export const PlanoFormModal: React.FC<PlanoFormModalProps> = ({
  plano,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    codigo: '',
    descricao: '',
    preco: 0,
    limiteUsuarios: 1,
    limiteClientes: 1,
    limiteStorage: 1024, // 1GB em MB
    limiteApiCalls: 1000,
    whiteLabel: false,
    suportePrioritario: false,
    ativo: true,
    ordem: 0
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plano) {
      setFormData({
        nome: plano.nome || '',
        codigo: plano.codigo || '',
        descricao: plano.descricao || '',
        preco: Number(plano.preco) || 0,
        limiteUsuarios: plano.limiteUsuarios || 1,
        limiteClientes: plano.limiteClientes || 1,
        limiteStorage: plano.limiteStorage || 1024,
        limiteApiCalls: plano.limiteApiCalls || 1000,
        whiteLabel: Boolean((plano as any).whiteLabel),
        suportePrioritario: Boolean((plano as any).suportePrioritario),
        ativo: plano.ativo !== false,
        ordem: (plano as any).ordem || 0
      });
    }
  }, [plano]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
      console.log('FormData antes de enviar:', formData);
      console.log('Tipos dos dados:', {
        nome: typeof formData.nome,
        codigo: typeof formData.codigo,
        preco: typeof formData.preco,
        limiteUsuarios: typeof formData.limiteUsuarios,
        limiteClientes: typeof formData.limiteClientes,
        limiteStorage: typeof formData.limiteStorage,
        limiteApiCalls: typeof formData.limiteApiCalls
      });
      await onSave(formData);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setErrors({ submit: error.message || 'Erro ao salvar plano' });
    } finally {
      setLoading(false);
    }
  };

  const formatStorageDisplay = (mb: number) => {
    if (mb === -1) return 'Ilimitado';
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl">
              {plano ? 'Editar Plano' : 'Novo Plano'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Básicas</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome do Plano *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      placeholder="Ex: Professional"
                      className={errors.nome ? 'border-red-500' : ''}
                    />
                    {errors.nome && <p className="text-sm text-red-600 mt-1">{errors.nome}</p>}
                  </div>

                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => handleChange('codigo', e.target.value.toLowerCase())}
                      placeholder="Ex: professional"
                      className={errors.codigo ? 'border-red-500' : ''}
                    />
                    {errors.codigo && <p className="text-sm text-red-600 mt-1">{errors.codigo}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    placeholder="Descreva as características do plano..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="preco">Preço Mensal (R$) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.preco}
                      onChange={(e) => handleChange('preco', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={`pl-10 ${errors.preco ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.preco && <p className="text-sm text-red-600 mt-1">{errors.preco}</p>}
                </div>
              </div>

              {/* Limites */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Limites de Uso</h3>
                <p className="text-sm text-gray-600">Use -1 para limites ilimitados</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="limiteUsuarios">Limite de Usuários *</Label>
                    <Input
                      id="limiteUsuarios"
                      type="number"
                      value={formData.limiteUsuarios}
                      onChange={(e) => handleChange('limiteUsuarios', parseInt(e.target.value) || 1)}
                      className={errors.limiteUsuarios ? 'border-red-500' : ''}
                    />
                    {errors.limiteUsuarios && <p className="text-sm text-red-600 mt-1">{errors.limiteUsuarios}</p>}
                  </div>

                  <div>
                    <Label htmlFor="limiteClientes">Limite de Clientes *</Label>
                    <Input
                      id="limiteClientes"
                      type="number"
                      value={formData.limiteClientes}
                      onChange={(e) => handleChange('limiteClientes', parseInt(e.target.value) || 1)}
                      className={errors.limiteClientes ? 'border-red-500' : ''}
                    />
                    {errors.limiteClientes && <p className="text-sm text-red-600 mt-1">{errors.limiteClientes}</p>}
                  </div>

                  <div>
                    <Label htmlFor="limiteStorage">Storage (MB) *</Label>
                    <Input
                      id="limiteStorage"
                      type="number"
                      value={formData.limiteStorage}
                      onChange={(e) => handleChange('limiteStorage', parseInt(e.target.value) || 1024)}
                      className={errors.limiteStorage ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Atual: {formatStorageDisplay(formData.limiteStorage)}
                    </p>
                    {errors.limiteStorage && <p className="text-sm text-red-600 mt-1">{errors.limiteStorage}</p>}
                  </div>

                  <div>
                    <Label htmlFor="limiteApiCalls">API Calls/dia *</Label>
                    <Input
                      id="limiteApiCalls"
                      type="number"
                      value={formData.limiteApiCalls}
                      onChange={(e) => handleChange('limiteApiCalls', parseInt(e.target.value) || 1000)}
                      className={errors.limiteApiCalls ? 'border-red-500' : ''}
                    />
                    {errors.limiteApiCalls && <p className="text-sm text-red-600 mt-1">{errors.limiteApiCalls}</p>}
                  </div>
                </div>
              </div>

              {/* Recursos */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Recursos</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>White Label</Label>
                      <p className="text-sm text-gray-600">Permite personalização de marca</p>
                    </div>
                    <Switch
                      checked={formData.whiteLabel}
                      onCheckedChange={(checked) => handleChange('whiteLabel', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Suporte Prioritário</Label>
                      <p className="text-sm text-gray-600">Atendimento com prioridade</p>
                    </div>
                    <Switch
                      checked={formData.suportePrioritario}
                      onCheckedChange={(checked) => handleChange('suportePrioritario', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Plano Ativo</Label>
                      <p className="text-sm text-gray-600">Disponível para contratação</p>
                    </div>
                    <Switch
                      checked={formData.ativo}
                      onCheckedChange={(checked) => handleChange('ativo', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configurações</h3>

                <div>
                  <Label htmlFor="ordem">Ordem de Exibição</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formData.ordem}
                    onChange={(e) => handleChange('ordem', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ordem crescente (0 = primeiro)
                  </p>
                </div>
              </div>

              {/* Erro de submit */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {plano ? 'Atualizar' : 'Criar'} Plano
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
