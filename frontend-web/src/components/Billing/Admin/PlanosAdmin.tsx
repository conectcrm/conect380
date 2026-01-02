import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Crown,
  DollarSign,
  Users,
  Database,
  Zap,
  Palette,
  Shield,
  CheckCircle,
  Star,
} from 'lucide-react';
import { api } from '../../../services/api';
import { Plano } from '../../../hooks/useSubscription';
import { PlanoFormModal } from './PlanoFormModal';
import toast from 'react-hot-toast';

interface PlanosAdminProps {
  onEdit?: (plano: Plano) => void;
}

export const PlanosAdmin: React.FC<PlanosAdminProps> = ({ onEdit }) => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Token temporário para testes - REMOVER EM PRODUÇÃO
    if (!localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', 'mock-token-for-testing');
    }

    carregarPlanos();
  }, []);

  const carregarPlanos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/planos');
      setPlanos(response.data);
      setError(null);
    } catch (err: any) {
      setError('Erro ao carregar planos');
      console.error('Erro ao carregar planos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNovoPlano = () => {
    setEditingPlano(null);
    setShowModal(true);
  };

  const handleEditarPlano = (plano: Plano) => {
    setEditingPlano(plano);
    setShowModal(true);
    onEdit?.(plano);
  };

  const handleSalvarPlano = async (dadosPlano: Partial<Plano>) => {
    try {
      console.log('Dados sendo enviados:', dadosPlano);
      console.log('Token no localStorage:', localStorage.getItem('auth_token'));

      if (editingPlano) {
        // Atualizar plano existente
        await api.put(`/planos/${editingPlano.id}`, dadosPlano);
        toast.success(`✅ Plano "${dadosPlano.nome}" atualizado com sucesso!`);
      } else {
        // Criar novo plano
        await api.post('/planos', dadosPlano);
        toast.success(`🎉 Novo plano "${dadosPlano.nome}" criado com sucesso!`);
      }

      await carregarPlanos();
      setShowModal(false);
      setEditingPlano(null);
    } catch (err: any) {
      console.error('Erro ao salvar plano:', err);
      console.error('Resposta do erro:', err.response?.data);

      // Mensagem de erro mais específica
      const errorMessage = err.response?.data?.message || 'Erro ao salvar plano';
      toast.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
  };

  const handleToggleStatus = async (plano: Plano) => {
    try {
      await api.put(`/planos/${plano.id}/toggle-status`);
      await carregarPlanos();

      // Mensagem baseada no status atual (será invertido após o toggle)
      const novoStatus = plano.ativo ? 'desativado' : 'ativado';
      const icon = plano.ativo ? '⏸️' : '✅';
      toast.success(`${icon} Plano "${plano.nome}" ${novoStatus} com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      const errorMessage = err.response?.data?.message || 'Erro ao alterar status do plano';
      toast.error(`❌ ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const handleRemoverPlano = async (plano: Plano) => {
    if (!window.confirm(`Tem certeza que deseja remover o plano "${plano.nome}"?`)) {
      return;
    }

    try {
      await api.delete(`/planos/${plano.id}`);
      await carregarPlanos();
      toast.success(`🗑️ Plano "${plano.nome}" removido com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao remover plano:', err);
      const errorMessage = err.response?.data?.message || 'Erro ao remover plano';
      toast.error(`❌ ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  };

  const getStatusBadge = (ativo: boolean) => {
    return <Badge variant={ativo ? 'success' : 'secondary'}>{ativo ? 'Ativo' : 'Inativo'}</Badge>;
  };

  const getSuporteBadge = (suporte: string) => {
    const variants = {
      basico: 'secondary',
      prioritario: 'warning',
      vip: 'default',
    } as const;

    // Verificação de segurança para suporte undefined/null
    const suporteSafe = suporte || 'basico';

    return (
      <Badge variant={variants[suporteSafe as keyof typeof variants] || 'secondary'}>
        {suporteSafe.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando planos...</span>
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
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Planos</h2>
          <p className="text-gray-600">Configure os planos de assinatura disponíveis</p>
        </div>
        <Button onClick={handleNovoPlano} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Grid de Planos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {planos.map((plano) => (
          <Card key={plano.id} className={`relative ${!plano.ativo ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    {plano.nome}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{plano.codigo}</p>
                </div>
                {getStatusBadge(plano.ativo)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Preço */}
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-gray-900">{formatarPreco(plano.preco)}</p>
                <p className="text-sm text-gray-600">por mês</p>
              </div>

              {/* Limites */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Usuários
                  </span>
                  <span className="font-medium">{plano.limiteUsuarios}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    Clientes
                  </span>
                  <span className="font-medium">{plano.limiteClientes}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-500" />
                    Storage
                  </span>
                  <span className="font-medium">{plano.limiteStorage} GB</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    API Calls
                  </span>
                  <span className="font-medium">{plano.limiteApiCalls}/dia</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {plano.permiteWhitelabel && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      <Palette className="h-3 w-3 mr-1" />
                      White Label
                    </Badge>
                  )}

                  {plano.permiteApi && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      <Zap className="h-3 w-3 mr-1" />
                      API
                    </Badge>
                  )}

                  {plano.permiteIntegracao && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Integrações
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Suporte:</span>
                  {getSuporteBadge(plano.suportePrioridade || 'basico')}
                </div>
              </div>

              {/* Descrição */}
              {plano.descricao && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">{plano.descricao}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditarPlano(plano)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(plano)}
                  className={plano.ativo ? 'text-red-600' : 'text-green-600'}
                >
                  {plano.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoverPlano(plano)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Formulário */}
      {showModal && (
        <PlanoFormModal
          plano={editingPlano}
          onSave={handleSalvarPlano}
          onClose={() => {
            setShowModal(false);
            setEditingPlano(null);
          }}
        />
      )}
    </div>
  );
};
