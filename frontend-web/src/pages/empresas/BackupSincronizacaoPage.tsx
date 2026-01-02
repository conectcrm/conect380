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
  Progress,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Input,
  Switch,
  Textarea,
} from '../../components/ui';
import { useEmpresas } from '../../contexts/EmpresaContextAPIReal';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Cloud,
  HardDrive,
  FileText,
  Calendar,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Archive,
  Shield,
  Zap,
  Server,
  Copy,
  CloudOff,
} from 'lucide-react';

interface BackupItem {
  id: string;
  nome: string;
  empresaId: string;
  empresaNome: string;
  tipo: 'automatico' | 'manual';
  status: 'concluido' | 'em_progresso' | 'falhado' | 'agendado';
  dataBackup: Date;
  tamanho: number; // em MB
  localizacao: 'local' | 'nuvem' | 'ambos';
  conteudo: {
    clientes: boolean;
    propostas: boolean;
    configuracoes: boolean;
    usuarios: boolean;
    anexos: boolean;
    logs: boolean;
  };
  duracao?: number; // em segundos
  erro?: string;
}

interface SincronizacaoItem {
  id: string;
  empresaOrigem: string;
  empresaDestino: string;
  tipo: 'clientes' | 'propostas' | 'configuracoes' | 'completo';
  status: 'pendente' | 'em_progresso' | 'concluido' | 'falhado';
  dataInicio: Date;
  dataFim?: Date;
  progresso: number;
  itensTotal: number;
  itensSincronizados: number;
  erros: string[];
}

interface BackupSincronizacaoPageProps {
  empresaId?: string;
}

export const BackupSincronizacaoPage: React.FC<BackupSincronizacaoPageProps> = ({ empresaId }) => {
  const { empresas, empresaAtiva } = useEmpresas();
  const [activeTab, setActiveTab] = useState('backups');
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [sincronizacoes, setSincronizacoes] = useState<SincronizacaoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalNovoBackup, setModalNovoBackup] = useState(false);
  const [modalNovaSincronizacao, setModalNovaSincronizacao] = useState(false);
  const [backupEmAndamento, setBackupEmAndamento] = useState(false);

  // Empresa para backup/sincronização
  const empresa = empresas.find((e) => e.id === empresaId) || empresaAtiva;

  // Estados para novo backup
  const [novoBackup, setNovoBackup] = useState({
    nome: '',
    conteudo: {
      clientes: true,
      propostas: true,
      configuracoes: true,
      usuarios: false,
      anexos: true,
      logs: false,
    },
    localizacao: 'ambos' as 'local' | 'nuvem' | 'ambos',
  });

  // Estados para nova sincronização
  const [novaSincronizacao, setNovaSincronizacao] = useState({
    empresaDestino: '',
    tipo: 'clientes' as 'clientes' | 'propostas' | 'configuracoes' | 'completo',
    sobrescrever: false,
  });

  // Dados mockados para demonstração
  const backupsMock: BackupItem[] = [
    {
      id: '1',
      nome: 'Backup Automático - Diário',
      empresaId: empresa?.id || '',
      empresaNome: empresa?.nome || '',
      tipo: 'automatico',
      status: 'concluido',
      dataBackup: new Date('2024-01-15T03:00:00'),
      tamanho: 45.7,
      localizacao: 'ambos',
      conteudo: {
        clientes: true,
        propostas: true,
        configuracoes: true,
        usuarios: true,
        anexos: true,
        logs: false,
      },
      duracao: 127,
    },
    {
      id: '2',
      nome: 'Backup Manual - Antes da Atualização',
      empresaId: empresa?.id || '',
      empresaNome: empresa?.nome || '',
      tipo: 'manual',
      status: 'concluido',
      dataBackup: new Date('2024-01-14T16:30:00'),
      tamanho: 52.3,
      localizacao: 'local',
      conteudo: {
        clientes: true,
        propostas: true,
        configuracoes: true,
        usuarios: true,
        anexos: true,
        logs: true,
      },
      duracao: 183,
    },
    {
      id: '3',
      nome: 'Backup Automático - Diário',
      empresaId: empresa?.id || '',
      empresaNome: empresa?.nome || '',
      tipo: 'automatico',
      status: 'falhado',
      dataBackup: new Date('2024-01-13T03:00:00'),
      tamanho: 0,
      localizacao: 'nuvem',
      conteudo: {
        clientes: true,
        propostas: true,
        configuracoes: true,
        usuarios: true,
        anexos: true,
        logs: false,
      },
      erro: 'Falha na conexão com o serviço de nuvem',
    },
  ];

  const sincronizacoesMock: SincronizacaoItem[] = [
    {
      id: '1',
      empresaOrigem: empresa?.id || '',
      empresaDestino: '2',
      tipo: 'clientes',
      status: 'concluido',
      dataInicio: new Date('2024-01-15T10:00:00'),
      dataFim: new Date('2024-01-15T10:15:00'),
      progresso: 100,
      itensTotal: 150,
      itensSincronizados: 150,
      erros: [],
    },
    {
      id: '2',
      empresaOrigem: empresa?.id || '',
      empresaDestino: '3',
      tipo: 'propostas',
      status: 'em_progresso',
      dataInicio: new Date('2024-01-15T14:30:00'),
      progresso: 67,
      itensTotal: 89,
      itensSincronizados: 60,
      erros: [],
    },
  ];

  useEffect(() => {
    if (empresa) {
      setBackups(backupsMock);
      setSincronizacoes(sincronizacoesMock);
    }
  }, [empresa]);

  // Funções utilitárias
  const getStatusBadge = (status: BackupItem['status'] | SincronizacaoItem['status']) => {
    const variants = {
      concluido: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      em_progresso: { variant: 'secondary' as const, icon: RefreshCw, color: 'text-blue-600' },
      falhado: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      agendado: { variant: 'outline' as const, icon: Clock, color: 'text-orange-600' },
      pendente: { variant: 'outline' as const, icon: Clock, color: 'text-orange-600' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const formatTamanho = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const formatDuracao = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleExecutarBackup = async () => {
    setBackupEmAndamento(true);

    const novoBackupItem: BackupItem = {
      id: Date.now().toString(),
      nome: novoBackup.nome || `Backup Manual - ${new Date().toLocaleDateString()}`,
      empresaId: empresa?.id || '',
      empresaNome: empresa?.nome || '',
      tipo: 'manual',
      status: 'em_progresso',
      dataBackup: new Date(),
      tamanho: 0,
      localizacao: novoBackup.localizacao,
      conteudo: novoBackup.conteudo,
    };

    setBackups((prev) => [novoBackupItem, ...prev]);
    setModalNovoBackup(false);

    // Simular progresso do backup
    setTimeout(() => {
      setBackups((prev) =>
        prev.map((backup) =>
          backup.id === novoBackupItem.id
            ? {
                ...backup,
                status: 'concluido' as const,
                tamanho: Math.random() * 50 + 20,
                duracao: Math.floor(Math.random() * 200 + 60),
              }
            : backup,
        ),
      );
      setBackupEmAndamento(false);
    }, 5000);
  };

  const handleIniciarSincronizacao = () => {
    const novaSincronizacaoItem: SincronizacaoItem = {
      id: Date.now().toString(),
      empresaOrigem: empresa?.id || '',
      empresaDestino: novaSincronizacao.empresaDestino,
      tipo: novaSincronizacao.tipo,
      status: 'em_progresso',
      dataInicio: new Date(),
      progresso: 0,
      itensTotal: Math.floor(Math.random() * 200 + 50),
      itensSincronizados: 0,
      erros: [],
    };

    setSincronizacoes((prev) => [novaSincronizacaoItem, ...prev]);
    setModalNovaSincronizacao(false);

    // Simular progresso da sincronização
    const interval = setInterval(() => {
      setSincronizacoes((prev) =>
        prev.map((sync) => {
          if (sync.id === novaSincronizacaoItem.id && sync.progresso < 100) {
            const novoProgresso = Math.min(sync.progresso + Math.random() * 20, 100);
            const itensSincronizados = Math.floor((novoProgresso / 100) * sync.itensTotal);

            if (novoProgresso >= 100) {
              clearInterval(interval);
              return {
                ...sync,
                status: 'concluido' as const,
                progresso: 100,
                itensSincronizados: sync.itensTotal,
                dataFim: new Date(),
              };
            }

            return {
              ...sync,
              progresso: novoProgresso,
              itensSincronizados,
            };
          }
          return sync;
        }),
      );
    }, 1000);
  };

  if (!empresa) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma empresa selecionada para backup e sincronização.
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
            Backup e Sincronização - {empresa.nome}
          </h1>
          <p className="text-gray-600 mt-1">Gerencie backups e sincronize dados entre empresas</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={modalNovoBackup} onOpenChange={setModalNovoBackup}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" disabled={backupEmAndamento}>
                <Database className="w-4 h-4" />
                {backupEmAndamento ? 'Backup em Andamento...' : 'Novo Backup'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Backup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="nome-backup">Nome do Backup</Label>
                  <Input
                    id="nome-backup"
                    value={novoBackup.nome}
                    onChange={(e) => setNovoBackup((prev) => ({ ...prev, nome: e.target.value }))}
                    placeholder="Digite um nome para identificar este backup"
                  />
                </div>

                <div>
                  <Label>Conteúdo do Backup</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {Object.entries(novoBackup.conteudo).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) =>
                            setNovoBackup((prev) => ({
                              ...prev,
                              conteudo: { ...prev.conteudo, [key]: checked },
                            }))
                          }
                        />
                        <Label htmlFor={key} className="capitalize">
                          {key === 'usuarios'
                            ? 'Usuários'
                            : key === 'configuracoes'
                              ? 'Configurações'
                              : key}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="localizacao">Localização</Label>
                  <Select
                    value={novoBackup.localizacao}
                    onValueChange={(value: any) =>
                      setNovoBackup((prev) => ({ ...prev, localizacao: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Apenas Local</SelectItem>
                      <SelectItem value="nuvem">Apenas Nuvem</SelectItem>
                      <SelectItem value="ambos">Local e Nuvem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setModalNovoBackup(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleExecutarBackup}>Executar Backup</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={modalNovaSincronizacao} onOpenChange={setModalNovaSincronizacao}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Sincronizar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Sincronização</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="empresa-destino">Empresa Destino</Label>
                  <Select
                    value={novaSincronizacao.empresaDestino}
                    onValueChange={(value) =>
                      setNovaSincronizacao((prev) => ({ ...prev, empresaDestino: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas
                        .filter((e) => e.id !== empresa.id)
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipo-sync">Tipo de Sincronização</Label>
                  <Select
                    value={novaSincronizacao.tipo}
                    onValueChange={(value: any) =>
                      setNovaSincronizacao((prev) => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clientes">Apenas Clientes</SelectItem>
                      <SelectItem value="propostas">Apenas Propostas</SelectItem>
                      <SelectItem value="configuracoes">Apenas Configurações</SelectItem>
                      <SelectItem value="completo">Sincronização Completa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="sobrescrever"
                    checked={novaSincronizacao.sobrescrever}
                    onCheckedChange={(checked) =>
                      setNovaSincronizacao((prev) => ({ ...prev, sobrescrever: checked }))
                    }
                  />
                  <Label htmlFor="sobrescrever">
                    Sobrescrever dados existentes na empresa destino
                  </Label>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Esta ação irá sincronizar os dados selecionados da empresa atual para a empresa
                    destino.{' '}
                    {novaSincronizacao.sobrescrever && 'Os dados existentes serão sobrescritos.'}
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setModalNovaSincronizacao(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleIniciarSincronizacao}
                    disabled={!novaSincronizacao.empresaDestino}
                  >
                    Iniciar Sincronização
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{backups.length}</p>
                <p className="text-sm text-gray-600">Total de Backups</p>
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
                  {backups.filter((b) => b.status === 'concluido').length}
                </p>
                <p className="text-sm text-gray-600">Backups Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sincronizacoes.filter((s) => s.status === 'em_progresso').length}
                </p>
                <p className="text-sm text-gray-600">Sincronizações Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Cloud className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatTamanho(backups.reduce((acc, b) => acc + b.tamanho, 0))}
                </p>
                <p className="text-sm text-gray-600">Espaço Utilizado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="backups" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Backups
          </TabsTrigger>
          <TabsTrigger value="sincronizacao" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Sincronização
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab: Backups */}
        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Histórico de Backups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{backup.nome}</p>
                          {backup.duracao && (
                            <p className="text-sm text-gray-600">
                              Duração: {formatDuracao(backup.duracao)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={backup.tipo === 'automatico' ? 'default' : 'outline'}>
                          {backup.tipo === 'automatico' ? 'Automático' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(backup.status)}
                        {backup.erro && <p className="text-xs text-red-600 mt-1">{backup.erro}</p>}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {backup.dataBackup.toLocaleDateString('pt-BR')} às{' '}
                          {backup.dataBackup.toLocaleTimeString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {backup.tamanho > 0 ? formatTamanho(backup.tamanho) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {backup.localizacao === 'local' && (
                            <HardDrive className="w-4 h-4 text-gray-600" />
                          )}
                          {backup.localizacao === 'nuvem' && (
                            <Cloud className="w-4 h-4 text-blue-600" />
                          )}
                          {backup.localizacao === 'ambos' && (
                            <>
                              <HardDrive className="w-4 h-4 text-gray-600" />
                              <Cloud className="w-4 h-4 text-blue-600" />
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {backup.status === 'concluido' && (
                            <>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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

        {/* Tab: Sincronização */}
        <TabsContent value="sincronizacao">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Histórico de Sincronizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sincronizacoes.map((sync) => (
                  <Card key={sync.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">
                              Sincronização de{' '}
                              {sync.tipo.charAt(0).toUpperCase() + sync.tipo.slice(1)}
                            </h4>
                            {getStatusBadge(sync.status)}
                          </div>

                          <p className="text-sm text-gray-600 mb-3">
                            De <strong>{empresa.nome}</strong> para{' '}
                            <strong>
                              {empresas.find((e) => e.id === sync.empresaDestino)?.nome ||
                                'Empresa Destino'}
                            </strong>
                          </p>

                          {sync.status === 'em_progresso' && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>
                                  Progresso: {sync.itensSincronizados} de {sync.itensTotal} itens
                                </span>
                                <span>{sync.progresso.toFixed(0)}%</span>
                              </div>
                              <Progress value={sync.progresso} className="h-2" />
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                            <span>Início: {sync.dataInicio.toLocaleString('pt-BR')}</span>
                            {sync.dataFim && (
                              <span>Fim: {sync.dataFim.toLocaleString('pt-BR')}</span>
                            )}
                          </div>

                          {sync.erros.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-red-600">Erros encontrados:</p>
                              <ul className="text-sm text-red-600 list-disc list-inside">
                                {sync.erros.map((erro, index) => (
                                  <li key={index}>{erro}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {sync.status === 'em_progresso' && (
                            <Button variant="ghost" size="sm">
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {sincronizacoes.length === 0 && (
                  <div className="text-center py-8">
                    <CloudOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Nenhuma sincronização encontrada
                    </h3>
                    <p className="text-gray-600">
                      Inicie uma nova sincronização para ver o histórico aqui.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="configuracoes">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações de Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Backup Automático</Label>
                    <p className="text-sm text-gray-600">
                      Executar backups automaticamente de acordo com a programação
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequencia">Frequência</Label>
                    <Select defaultValue="diario">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diario">Diário</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="horario">Horário</Label>
                    <Input type="time" defaultValue="03:00" />
                  </div>

                  <div>
                    <Label htmlFor="retencao">Retenção (dias)</Label>
                    <Input type="number" defaultValue="30" min="7" max="365" />
                  </div>

                  <div>
                    <Label htmlFor="max-backups">Máximo de Backups</Label>
                    <Input type="number" defaultValue="10" min="5" max="50" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Incluir Anexos</Label>
                    <p className="text-sm text-gray-600">
                      Incluir arquivos anexos nos backups (pode aumentar significativamente o
                      tamanho)
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Compressão</Label>
                    <p className="text-sm text-gray-600">
                      Comprimir backups para economizar espaço de armazenamento
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Configurações de Nuvem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Backup na Nuvem</Label>
                    <p className="text-sm text-gray-600">
                      Enviar backups automaticamente para armazenamento na nuvem
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div>
                  <Label htmlFor="provedor">Provedor</Label>
                  <Select defaultValue="aws">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws">Amazon S3</SelectItem>
                      <SelectItem value="google">Google Cloud Storage</SelectItem>
                      <SelectItem value="azure">Azure Storage</SelectItem>
                      <SelectItem value="dropbox">Dropbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bucket">Bucket/Container</Label>
                    <Input placeholder="nome-do-bucket" />
                  </div>

                  <div>
                    <Label htmlFor="regiao">Região</Label>
                    <Select defaultValue="us-east-1">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                        <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                        <SelectItem value="sa-east-1">South America (São Paulo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Criptografia</Label>
                    <p className="text-sm text-gray-600">
                      Criptografar backups antes do envio para a nuvem
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Configurações de Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Sincronização Automática</Label>
                    <p className="text-sm text-gray-600">
                      Permitir sincronização automática entre empresas autorizadas
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Notificar Sincronizações</Label>
                    <p className="text-sm text-gray-600">
                      Receber notificações sobre o status das sincronizações
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div>
                  <Label htmlFor="empresas-autorizadas">
                    Empresas Autorizadas para Sincronização
                  </Label>
                  <div className="mt-2 space-y-2">
                    {empresas
                      .filter((e) => e.id !== empresa.id)
                      .map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{emp.nome}</p>
                            <p className="text-sm text-gray-600">{emp.email}</p>
                          </div>
                          <Switch />
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
