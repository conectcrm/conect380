import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Label,
  Input,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Alert,
  AlertDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Checkbox,
} from '../../components/ui';
import { useEmpresas } from '../../contexts/EmpresaContextAPIReal';
import {
  Shield,
  Users,
  UserPlus,
  Edit,
  Trash2,
  Key,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Mail,
  Eye,
  EyeOff,
  Crown,
  UserCheck,
  Clock,
} from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: 'administrador' | 'supervisor' | 'vendedor' | 'suporte';
  status: 'ativo' | 'inativo' | 'pendente' | 'bloqueado';
  permissoes: string[];
  ultimoAcesso: Date;
  dataCriacao: Date;
  empresaId: string;
  criadoPor: string;
}

interface Permissao {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  nivel: 'leitura' | 'escrita' | 'admin';
}

interface SistemaPermissoesPageProps {
  empresaId?: string;
}

export const SistemaPermissoesPage: React.FC<SistemaPermissoesPageProps> = ({ empresaId }) => {
  const { empresas, empresaAtiva } = useEmpresas();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);
  const [modalEditarPermissoes, setModalEditarPermissoes] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);

  // Empresa para gerenciar permissões
  const empresa = empresas.find((e) => e.id === empresaId) || empresaAtiva;

  // Permissões disponíveis no sistema
  const permissoesDisponiveis: Permissao[] = [
    // Clientes
    {
      id: 'clientes.ver',
      nome: 'Visualizar Clientes',
      descricao: 'Ver lista e detalhes dos clientes',
      categoria: 'Clientes',
      nivel: 'leitura',
    },
    {
      id: 'clientes.criar',
      nome: 'Criar Clientes',
      descricao: 'Cadastrar novos clientes',
      categoria: 'Clientes',
      nivel: 'escrita',
    },
    {
      id: 'clientes.editar',
      nome: 'Editar Clientes',
      descricao: 'Modificar dados dos clientes',
      categoria: 'Clientes',
      nivel: 'escrita',
    },
    {
      id: 'clientes.excluir',
      nome: 'Excluir Clientes',
      descricao: 'Remover clientes do sistema',
      categoria: 'Clientes',
      nivel: 'admin',
    },

    // Propostas
    {
      id: 'propostas.ver',
      nome: 'Visualizar Propostas',
      descricao: 'Ver lista e detalhes das propostas',
      categoria: 'Propostas',
      nivel: 'leitura',
    },
    {
      id: 'propostas.criar',
      nome: 'Criar Propostas',
      descricao: 'Gerar novas propostas',
      categoria: 'Propostas',
      nivel: 'escrita',
    },
    {
      id: 'propostas.editar',
      nome: 'Editar Propostas',
      descricao: 'Modificar propostas existentes',
      categoria: 'Propostas',
      nivel: 'escrita',
    },
    {
      id: 'propostas.aprovar',
      nome: 'Aprovar Propostas',
      descricao: 'Aprovar ou rejeitar propostas',
      categoria: 'Propostas',
      nivel: 'admin',
    },

    // Relatórios
    {
      id: 'relatorios.ver',
      nome: 'Visualizar Relatórios',
      descricao: 'Acessar relatórios básicos',
      categoria: 'Relatórios',
      nivel: 'leitura',
    },
    {
      id: 'relatorios.avancados',
      nome: 'Relatórios Avançados',
      descricao: 'Acessar relatórios detalhados',
      categoria: 'Relatórios',
      nivel: 'escrita',
    },
    {
      id: 'relatorios.exportar',
      nome: 'Exportar Relatórios',
      descricao: 'Fazer download de relatórios',
      categoria: 'Relatórios',
      nivel: 'escrita',
    },

    // Configurações
    {
      id: 'config.ver',
      nome: 'Ver Configurações',
      descricao: 'Visualizar configurações da empresa',
      categoria: 'Configurações',
      nivel: 'leitura',
    },
    {
      id: 'config.editar',
      nome: 'Editar Configurações',
      descricao: 'Modificar configurações gerais',
      categoria: 'Configurações',
      nivel: 'admin',
    },
    {
      id: 'config.usuarios',
      nome: 'Gerenciar Usuários',
      descricao: 'Adicionar, editar e remover usuários',
      categoria: 'Configurações',
      nivel: 'admin',
    },
    {
      id: 'config.permissoes',
      nome: 'Gerenciar Permissões',
      descricao: 'Definir permissões de usuários',
      categoria: 'Configurações',
      nivel: 'admin',
    },

    // Sistema
    {
      id: 'sistema.backup',
      nome: 'Gerenciar Backups',
      descricao: 'Executar e restaurar backups',
      categoria: 'Sistema',
      nivel: 'admin',
    },
    {
      id: 'sistema.logs',
      nome: 'Visualizar Logs',
      descricao: 'Acessar logs do sistema',
      categoria: 'Sistema',
      nivel: 'admin',
    },
    {
      id: 'sistema.integracoes',
      nome: 'Gerenciar Integrações',
      descricao: 'Configurar integrações externas',
      categoria: 'Sistema',
      nivel: 'admin',
    },
  ];

  // Usuários mockados para demonstração
  const usuariosMock: Usuario[] = [
    {
      id: '1',
      nome: 'João Silva',
      email: 'joao@empresa.com',
      cargo: 'administrador',
      status: 'ativo',
      permissoes: ['*'], // Todas as permissões
      ultimoAcesso: new Date('2024-01-15T10:30:00'),
      dataCriacao: new Date('2024-01-01'),
      empresaId: empresa?.id || '',
      criadoPor: 'Sistema',
    },
    {
      id: '2',
      nome: 'Maria Santos',
      email: 'maria@empresa.com',
      cargo: 'supervisor',
      status: 'ativo',
      permissoes: [
        'clientes.ver',
        'clientes.editar',
        'propostas.ver',
        'propostas.criar',
        'relatorios.ver',
      ],
      ultimoAcesso: new Date('2024-01-15T09:15:00'),
      dataCriacao: new Date('2024-01-02'),
      empresaId: empresa?.id || '',
      criadoPor: 'João Silva',
    },
    {
      id: '3',
      nome: 'Pedro Costa',
      email: 'pedro@empresa.com',
      cargo: 'vendedor',
      status: 'ativo',
      permissoes: ['clientes.ver', 'clientes.criar', 'propostas.ver', 'propostas.criar'],
      ultimoAcesso: new Date('2024-01-14T16:45:00'),
      dataCriacao: new Date('2024-01-03'),
      empresaId: empresa?.id || '',
      criadoPor: 'João Silva',
    },
    {
      id: '4',
      nome: 'Ana Lima',
      email: 'ana@empresa.com',
      cargo: 'vendedor',
      status: 'pendente',
      permissoes: ['clientes.ver', 'propostas.ver'],
      ultimoAcesso: new Date('2024-01-10T14:20:00'),
      dataCriacao: new Date('2024-01-10'),
      empresaId: empresa?.id || '',
      criadoPor: 'João Silva',
    },
  ];

  // Estados para novo usuário
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    cargo: 'vendedor' as any,
    permissoes: [] as string[],
  });

  useEffect(() => {
    if (empresa) {
      setUsuarios(usuariosMock);
      setPermissoes(permissoesDisponiveis);
    }
  }, [empresa]);

  // Funções utilitárias
  const getStatusBadge = (status: Usuario['status']) => {
    const variants = {
      ativo: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      inativo: { variant: 'secondary' as const, icon: XCircle, color: 'text-gray-600' },
      pendente: { variant: 'outline' as const, icon: Clock, color: 'text-orange-600' },
      bloqueado: { variant: 'destructive' as const, icon: Lock, color: 'text-red-600' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCargoBadge = (cargo: Usuario['cargo']) => {
    const variants = {
      administrador: { variant: 'default' as const, icon: Crown, color: 'text-purple-600' },
      supervisor: { variant: 'secondary' as const, icon: UserCheck, color: 'text-blue-600' },
      vendedor: { variant: 'outline' as const, icon: Users, color: 'text-green-600' },
      suporte: { variant: 'outline' as const, icon: Settings, color: 'text-orange-600' },
    };

    const config = variants[cargo];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {cargo.charAt(0).toUpperCase() + cargo.slice(1)}
      </Badge>
    );
  };

  const getPermissoesPorCategoria = () => {
    const categorias: { [key: string]: Permissao[] } = {};
    permissoesDisponiveis.forEach((permissao) => {
      if (!categorias[permissao.categoria]) {
        categorias[permissao.categoria] = [];
      }
      categorias[permissao.categoria].push(permissao);
    });
    return categorias;
  };

  const handleCriarUsuario = () => {
    const novoUsuarioObj: Usuario = {
      id: Date.now().toString(),
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      cargo: novoUsuario.cargo,
      status: 'pendente',
      permissoes: novoUsuario.permissoes,
      ultimoAcesso: new Date(),
      dataCriacao: new Date(),
      empresaId: empresa?.id || '',
      criadoPor: 'Usuário Atual',
    };

    setUsuarios((prev) => [...prev, novoUsuarioObj]);
    setModalNovoUsuario(false);
    setNovoUsuario({ nome: '', email: '', cargo: 'vendedor', permissoes: [] });
  };

  const handleEditarPermissoes = (permissoes: string[]) => {
    if (!usuarioSelecionado) return;

    setUsuarios((prev) =>
      prev.map((usuario) =>
        usuario.id === usuarioSelecionado.id ? { ...usuario, permissoes } : usuario,
      ),
    );
    setModalEditarPermissoes(false);
    setUsuarioSelecionado(null);
  };

  const togglePermissao = (
    permissaoId: string,
    lista: string[],
    setLista: (permissoes: string[]) => void,
  ) => {
    if (lista.includes(permissaoId)) {
      setLista(lista.filter((p) => p !== permissaoId));
    } else {
      setLista([...lista, permissaoId]);
    }
  };

  if (!empresa) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma empresa selecionada para gerenciar permissões.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sistema de Permissões - {empresa.nome}
          </h1>
          <p className="text-gray-600 mt-1">Gerencie usuários e suas permissões de acesso</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={modalNovoUsuario} onOpenChange={setModalNovoUsuario}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={novoUsuario.nome}
                      onChange={(e) =>
                        setNovoUsuario((prev) => ({ ...prev, nome: e.target.value }))
                      }
                      placeholder="Digite o nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={novoUsuario.email}
                      onChange={(e) =>
                        setNovoUsuario((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Select
                      value={novoUsuario.cargo}
                      onValueChange={(value: any) =>
                        setNovoUsuario((prev) => ({ ...prev, cargo: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="administrador">Administrador</SelectItem>
                        <SelectItem value="suporte">Suporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Permissões Iniciais</Label>
                  {Object.entries(getPermissoesPorCategoria()).map(([categoria, permissoes]) => (
                    <div key={categoria} className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">{categoria}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissoes.map((permissao) => (
                          <div key={permissao.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permissao.id}
                              checked={novoUsuario.permissoes.includes(permissao.id)}
                              onCheckedChange={() =>
                                togglePermissao(
                                  permissao.id,
                                  novoUsuario.permissoes,
                                  (permissoes) =>
                                    setNovoUsuario((prev) => ({ ...prev, permissoes })),
                                )
                              }
                            />
                            <Label htmlFor={permissao.id} className="text-sm">
                              {permissao.nome}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setModalNovoUsuario(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCriarUsuario}
                    disabled={!novoUsuario.nome || !novoUsuario.email}
                  >
                    Criar Usuário
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{usuarios.length}</p>
                <p className="text-sm text-gray-600">Usuários Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {usuarios.filter((u) => u.status === 'ativo').length}
                </p>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {usuarios.filter((u) => u.status === 'pendente').length}
                </p>
                <p className="text-sm text-gray-600">Aguardando Aprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {usuarios.filter((u) => u.cargo === 'administrador').length}
                </p>
                <p className="text-sm text-gray-600">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Gerenciamento */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="grupos" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Grupos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Usuários */}
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Lista de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{usuario.nome}</p>
                          <p className="text-sm text-gray-600">{usuario.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getCargoBadge(usuario.cargo)}</TableCell>
                      <TableCell>{getStatusBadge(usuario.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {usuario.permissoes.includes('*')
                              ? 'Todas'
                              : `${usuario.permissoes.length} permissões`}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUsuarioSelecionado(usuario);
                              setModalEditarPermissoes(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {usuario.ultimoAcesso.toLocaleDateString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Permissões */}
        <TabsContent value="permissoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Matriz de Permissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(getPermissoesPorCategoria()).map(([categoria, permissoes]) => (
                  <div key={categoria} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">{categoria}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {permissoes.map((permissao) => (
                        <Card key={permissao.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{permissao.nome}</h4>
                              <p className="text-xs text-gray-600 mt-1">{permissao.descricao}</p>
                              <Badge
                                variant={
                                  permissao.nivel === 'admin'
                                    ? 'destructive'
                                    : permissao.nivel === 'escrita'
                                      ? 'default'
                                      : 'secondary'
                                }
                                className="mt-2"
                              >
                                {permissao.nivel}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Grupos */}
        <TabsContent value="grupos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Grupos de Permissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Crown className="w-6 h-6 text-purple-600" />
                    <h3 className="font-semibold">Administradores</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Acesso total ao sistema, incluindo configurações e gerenciamento de usuários.
                  </p>
                  <div className="space-y-2">
                    <Badge variant="default">Todas as permissões</Badge>
                    <p className="text-xs text-gray-500">
                      {usuarios.filter((u) => u.cargo === 'administrador').length} usuários
                    </p>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold">Supervisores</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Gerenciamento de clientes, propostas e relatórios. Sem acesso a configurações.
                  </p>
                  <div className="space-y-2">
                    <Badge variant="secondary">Gestão comercial</Badge>
                    <p className="text-xs text-gray-500">
                      {usuarios.filter((u) => u.cargo === 'supervisor').length} usuários
                    </p>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold">Vendedores</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Acesso a clientes e criação de propostas. Visualização de relatórios básicos.
                  </p>
                  <div className="space-y-2">
                    <Badge variant="outline">Operacional</Badge>
                    <p className="text-xs text-gray-500">
                      {usuarios.filter((u) => u.cargo === 'vendedor').length} usuários
                    </p>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Editar Permissões */}
      <Dialog open={modalEditarPermissoes} onOpenChange={setModalEditarPermissoes}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Permissões - {usuarioSelecionado?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {usuarioSelecionado && (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{usuarioSelecionado.nome}</p>
                      <p className="text-sm text-gray-600">{usuarioSelecionado.email}</p>
                    </div>
                    {getCargoBadge(usuarioSelecionado.cargo)}
                    {getStatusBadge(usuarioSelecionado.status)}
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(getPermissoesPorCategoria()).map(([categoria, permissoes]) => (
                    <div key={categoria} className="space-y-3">
                      <h4 className="font-medium text-gray-900">{categoria}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissoes.map((permissao) => (
                          <div
                            key={permissao.id}
                            className="flex items-start space-x-3 p-3 border rounded-lg"
                          >
                            <Checkbox
                              id={`edit-${permissao.id}`}
                              checked={
                                usuarioSelecionado.permissoes.includes(permissao.id) ||
                                usuarioSelecionado.permissoes.includes('*')
                              }
                              disabled={usuarioSelecionado.permissoes.includes('*')}
                              onCheckedChange={() => {
                                const novasPermissoes = usuarioSelecionado.permissoes.includes(
                                  permissao.id,
                                )
                                  ? usuarioSelecionado.permissoes.filter((p) => p !== permissao.id)
                                  : [...usuarioSelecionado.permissoes, permissao.id];

                                handleEditarPermissoes(novasPermissoes);
                              }}
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`edit-${permissao.id}`}
                                className="text-sm font-medium"
                              >
                                {permissao.nome}
                              </Label>
                              <p className="text-xs text-gray-600 mt-1">{permissao.descricao}</p>
                              <Badge
                                variant={
                                  permissao.nivel === 'admin'
                                    ? 'destructive'
                                    : permissao.nivel === 'escrita'
                                      ? 'default'
                                      : 'secondary'
                                }
                                className="mt-1"
                              >
                                {permissao.nivel}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setModalEditarPermissoes(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => handleEditarPermissoes(usuarioSelecionado.permissoes)}>
                    Salvar Permissões
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
