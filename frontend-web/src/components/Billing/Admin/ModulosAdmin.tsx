import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Code,
  Palette,
  Star,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { api } from '../../../services/api';
import { ModuloSistema } from '../../../hooks/useSubscription';

interface ModulosAdminProps {
  onEdit?: (modulo: ModuloSistema) => void;
}

export const ModulosAdmin: React.FC<ModulosAdminProps> = ({ onEdit }) => {
  const [modulos, setModulos] = useState<ModuloSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModulo, setEditingModulo] = useState<ModuloSistema | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    descricao: '',
    icone: '',
    cor: '#3B82F6',
    ativo: true,
    essencial: false,
    ordem: 0,
  });

  useEffect(() => {
    carregarModulos();
  }, []);

  const carregarModulos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/planos/modulos');
      // Ordenar por ordem
      const modulosOrdenados = response.data.sort(
        (a: ModuloSistema, b: ModuloSistema) => a.ordem - b.ordem,
      );
      setModulos(modulosOrdenados);
      setError(null);
    } catch (err: any) {
      setError('Erro ao carregar módulos');
      console.error('Erro ao carregar módulos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNovoModulo = () => {
    setEditingModulo(null);
    setFormData({
      nome: '',
      codigo: '',
      descricao: '',
      icone: '',
      cor: '#3B82F6',
      ativo: true,
      essencial: false,
      ordem: modulos.length,
    });
    setShowForm(true);
  };

  const handleEditarModulo = (modulo: ModuloSistema) => {
    setEditingModulo(modulo);
    setFormData({
      nome: modulo.nome || '',
      codigo: modulo.codigo || '',
      descricao: modulo.descricao || '',
      icone: modulo.icone || '',
      cor: modulo.cor || '#3B82F6',
      ativo: modulo.ativo !== false,
      essencial: modulo.essencial || false,
      ordem: modulo.ordem || 0,
    });
    setShowForm(true);
    onEdit?.(modulo);
  };

  const handleSalvarModulo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingModulo) {
        // Atualizar módulo existente
        await api.put(`/planos/modulos/${editingModulo.id}`, formData);
      } else {
        // Criar novo módulo
        await api.post('/planos/modulos', formData);
      }

      await carregarModulos();
      setShowForm(false);
      setEditingModulo(null);
    } catch (err: any) {
      console.error('Erro ao salvar módulo:', err);
      setError('Erro ao salvar módulo');
    }
  };

  const handleToggleStatus = async (modulo: ModuloSistema) => {
    try {
      await api.put(`/planos/modulos/${modulo.id}`, {
        ...modulo,
        ativo: !modulo.ativo,
      });
      await carregarModulos();
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      setError('Erro ao alterar status do módulo');
    }
  };

  const handleRemoverModulo = async (modulo: ModuloSistema) => {
    if (modulo.essencial) {
      alert('Módulos essenciais não podem ser removidos');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja remover o módulo "${modulo.nome}"?`)) {
      return;
    }

    try {
      await api.delete(`/planos/modulos/${modulo.id}`);
      await carregarModulos();
    } catch (err: any) {
      console.error('Erro ao remover módulo:', err);
      setError('Erro ao remover módulo');
    }
  };

  const handleMoverModulo = async (modulo: ModuloSistema, direcao: 'up' | 'down') => {
    const indiceAtual = modulos.findIndex((m) => m.id === modulo.id);

    if (
      (direcao === 'up' && indiceAtual === 0) ||
      (direcao === 'down' && indiceAtual === modulos.length - 1)
    ) {
      return;
    }

    const novoIndice = direcao === 'up' ? indiceAtual - 1 : indiceAtual + 1;
    const moduloTroca = modulos[novoIndice];

    try {
      // Atualizar as ordens
      await api.put(`/planos/modulos/${modulo.id}`, {
        ...modulo,
        ordem: moduloTroca.ordem,
      });

      await api.put(`/planos/modulos/${moduloTroca.id}`, {
        ...moduloTroca,
        ordem: modulo.ordem,
      });

      await carregarModulos();
    } catch (err: any) {
      console.error('Erro ao mover módulo:', err);
      setError('Erro ao reordenar módulos');
    }
  };

  const icones = [
    'BarChart3',
    'Users',
    'FileText',
    'Target',
    'Package',
    'BarChart',
    'Zap',
    'Code',
    'Settings',
    'CreditCard',
    'Calendar',
    'Mail',
    'Phone',
    'Globe',
    'Shield',
    'Lock',
    'Key',
    'Database',
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando módulos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Módulos</h2>
          <p className="text-gray-600">Configure os módulos disponíveis no sistema</p>
        </div>
        <Button onClick={handleNovoModulo} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Módulo
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Lista de Módulos */}
      <div className="grid gap-4">
        {modulos.map((modulo, index) => (
          <Card key={modulo.id} className={`${!modulo.ativo ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Ícone e cor */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: modulo.cor }}
                  >
                    <Package className="h-6 w-6" />
                  </div>

                  {/* Informações */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{modulo.nome}</h3>
                      <Badge variant={modulo.ativo ? 'default' : 'secondary'}>
                        {modulo.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {modulo.essencial && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          <Star className="h-3 w-3 mr-1" />
                          Essencial
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      <Code className="h-3 w-3 inline mr-1" />
                      {modulo.codigo}
                    </p>
                    {modulo.descricao && (
                      <p className="text-sm text-gray-500 mt-1">{modulo.descricao}</p>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                  {/* Mover para cima */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoverModulo(modulo, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>

                  {/* Mover para baixo */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoverModulo(modulo, 'down')}
                    disabled={index === modulos.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>

                  {/* Editar */}
                  <Button variant="outline" size="sm" onClick={() => handleEditarModulo(modulo)}>
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Toggle Status */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(modulo)}
                    className={modulo.ativo ? 'text-red-600' : 'text-green-600'}
                  >
                    {modulo.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>

                  {/* Remover */}
                  {!modulo.essencial && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoverModulo(modulo)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>{editingModulo ? 'Editar Módulo' : 'Novo Módulo'}</CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSalvarModulo} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, codigo: e.target.value.toLowerCase() }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                      }
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="icone">Ícone</Label>
                    <select
                      id="icone"
                      value={formData.icone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, icone: e.target.value }))}
                      className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                    >
                      <option value="">Selecione um ícone</option>
                      {icones.map((icone) => (
                        <option key={icone} value={icone}>
                          {icone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="cor">Cor</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cor"
                        type="color"
                        value={formData.cor}
                        onChange={(e) => setFormData((prev) => ({ ...prev, cor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.cor}
                        onChange={(e) => setFormData((prev) => ({ ...prev, cor: e.target.value }))}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Módulo Ativo</Label>
                    <Switch
                      checked={formData.ativo}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, ativo: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Essencial</Label>
                      <p className="text-xs text-gray-500">Não pode ser desabilitado</p>
                    </div>
                    <Switch
                      checked={formData.essencial}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, essencial: checked }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="ordem">Ordem</Label>
                    <Input
                      id="ordem"
                      type="number"
                      value={formData.ordem}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingModulo ? 'Atualizar' : 'Criar'} Módulo
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
