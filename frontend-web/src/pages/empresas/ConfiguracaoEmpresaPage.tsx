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
  Textarea,
  Badge,
  Alert,
  AlertDescription
} from '../../components/ui';
import { useEmpresas } from '../../contexts/EmpresaContextAPIReal';
import type { EmpresaInfo } from '../../contexts/EmpresaContextAPIReal';
import {
  Settings,
  Save,
  Shield,
  Mail,
  Database,
  FileText,
  Bell,
  CreditCard,
  Users,
  Lock,
  Key,
  Palette,
  Globe,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface ConfiguracaoEmpresaPageProps {
  empresaId?: string;
}

interface ConfiguracoesGerais {
  nome: string;
  descricao: string;
  site: string;
  telefone: string;
  email: string;
  endereco: string;
  timezone: string;
  logo: string;
  cores: {
    primaria: string;
    secundaria: string;
    accent: string;
  };
}

interface ConfiguracoesSeguranca {
  autenticacao2FA: boolean;
  sessaoExpiracaoMinutos: number;
  tentativasLoginMax: number;
  senhaComplexidade: 'baixa' | 'media' | 'alta';
  auditoriaNivel: 'basico' | 'medio' | 'completo';
  ipsBloqueados: string[];
  restricaoHorario: {
    habilitado: boolean;
    inicio: string;
    fim: string;
    diasSemana: number[];
  };
}

interface ConfiguracoesUsuarios {
  limitesUsuarios: {
    total: number;
    administradores: number;
    vendedores: number;
    supervisores: number;
  };
  permissoesDefault: {
    vendedor: string[];
    supervisor: string[];
    administrador: string[];
  };
  aprovacaoNovoUsuario: boolean;
  dominiosPermitidos: string[];
}

interface ConfiguracoesNotificacoes {
  emailsHabilitados: boolean;
  servidorEmail: {
    tipo: string;
    servidor: string;
    porta: number;
    ssl: boolean;
    usuario: string;
    senha: string;
  };
  templateEmail: {
    cabecalho: string;
    rodape: string;
    assinatura: string;
  };
  tiposNotificacao: Record<string, boolean>;
}

interface ConfiguracoesIntegracoes {
  api: {
    habilitada: boolean;
    chaveApi: string;
    webhooks: string[];
    limitesRequisicao: {
      por_minuto: number;
      por_dia: number;
    };
  };
  servicos: Record<
    string,
    {
      habilitado: boolean;
      token?: string;
      numero?: string;
      client_id?: string;
      client_secret?: string;
    }
  >;
}

interface ConfiguracoesBackup {
  automatico: boolean;
  frequencia: 'diario' | 'semanal' | 'mensal';
  retencaoDias: number;
  incluirAnexos: boolean;
  sincronizacaoNuvem: {
    habilitada: boolean;
    provedor: string;
    configuracao: Record<string, unknown>;
  };
}

interface ConfiguracoesState {
  geral: ConfiguracoesGerais;
  seguranca: ConfiguracoesSeguranca;
  usuarios: ConfiguracoesUsuarios;
  notificacoes: ConfiguracoesNotificacoes;
  integracoes: ConfiguracoesIntegracoes;
  backup: ConfiguracoesBackup;
}

const formatarEndereco = (endereco?: EmpresaInfo['endereco']): string => {
  if (!endereco) {
    return '';
  }

  if (typeof endereco === 'string') {
    return endereco;
  }

  const { rua, numero, complemento, bairro, cidade, estado, cep } = endereco;
  const complementoTexto = complemento ? ` ${complemento}` : '';
  return `${rua}, ${numero}${complementoTexto} - ${bairro}, ${cidade} - ${estado}, ${cep}`;
};

const criarConfiguracoesIniciais = (empresa?: EmpresaInfo | null): ConfiguracoesState => {
  const config = empresa?.configuracoes ?? {};
  const geralConfig = config.geral ?? {};
  const coresConfig = geralConfig.cores ?? config.cores ?? {};
  const seguranca = config.seguranca ?? {};
  const usuarios = config.usuarios ?? {};
  const notificacoes = config.notificacoes ?? {};
  const integracoes = config.integracoes ?? {};
  const backup = config.backup ?? {};

  const limitesUsuariosPlano = empresa?.plano?.limites?.usuarios ?? empresa?.plano?.limitesUsuarios ?? 10;

  const limitesRequisicao = integracoes.api?.limitesRequisicao ?? { por_minuto: 100, por_dia: 10000 };

  const servicosPadrao: ConfiguracoesIntegracoes['servicos'] = {
    receita_federal: { habilitado: false, token: '' },
    correios: { habilitado: false, token: '' },
    whatsapp: { habilitado: false, token: '', numero: '' },
    google_calendar: { habilitado: false, client_id: '', client_secret: '' }
  };

  const servicosMesclados = {
    ...servicosPadrao,
    ...(integracoes.servicos ?? {})
  };

  return {
    geral: {
      nome: geralConfig.nome ?? empresa?.nome ?? '',
      descricao: geralConfig.descricao ?? empresa?.descricao ?? '',
      site: geralConfig.site ?? config.site ?? '',
      telefone: geralConfig.telefone ?? empresa?.telefone ?? '',
      email: geralConfig.email ?? empresa?.email ?? '',
      endereco: geralConfig.endereco ?? formatarEndereco(empresa?.endereco),
      timezone: geralConfig.timezone ?? config.timezone ?? 'America/Sao_Paulo',
      logo: geralConfig.logo ?? config.logo ?? '',
      cores: {
        primaria: coresConfig.primaria ?? '#2563eb',
        secundaria: coresConfig.secundaria ?? '#64748b',
        accent: coresConfig.accent ?? '#10b981'
      }
    },
    seguranca: {
      autenticacao2FA: seguranca.autenticacao2FA ?? false,
      sessaoExpiracaoMinutos: seguranca.sessaoExpiracaoMinutos ?? 480,
      tentativasLoginMax: seguranca.tentativasLoginMax ?? 5,
      senhaComplexidade: seguranca.senhaComplexidade ?? 'media',
      auditoriaNivel: seguranca.auditoriaNivel ?? 'completo',
      ipsBloqueados: seguranca.ipsBloqueados ?? [],
      restricaoHorario:
        seguranca.restricaoHorario ?? {
          habilitado: false,
          inicio: '08:00',
          fim: '18:00',
          diasSemana: [1, 2, 3, 4, 5]
        }
    },
    usuarios: {
      limitesUsuarios:
        usuarios.limitesUsuarios ?? {
          total: limitesUsuariosPlano,
          administradores: 3,
          vendedores: 50,
          supervisores: 5
        },
      permissoesDefault:
        usuarios.permissoesDefault ?? {
          vendedor: ['clientes.ver', 'propostas.criar', 'propostas.editar'],
          supervisor: ['clientes.ver', 'propostas.ver', 'relatorios.ver'],
          administrador: ['*']
        },
      aprovacaoNovoUsuario: usuarios.aprovacaoNovoUsuario ?? true,
      dominiosPermitidos: usuarios.dominiosPermitidos ?? []
    },
    notificacoes: {
      emailsHabilitados: notificacoes.emailsHabilitados ?? true,
      servidorEmail:
        notificacoes.servidorEmail ?? {
          tipo: 'smtp',
          servidor: '',
          porta: 587,
          ssl: true,
          usuario: '',
          senha: ''
        },
      templateEmail:
        notificacoes.templateEmail ?? {
          cabecalho: '',
          rodape: '',
          assinatura: ''
        },
      tiposNotificacao:
        notificacoes.tiposNotificacao ?? {
          novoCliente: true,
          novaProposta: true,
          propostaAprovada: true,
          tarefaVencendo: true,
          pagamentoVencido: true
        }
    },
    integracoes: {
      api: {
        habilitada: integracoes.api?.habilitada ?? false,
        chaveApi: integracoes.api?.chaveApi ?? '',
        webhooks: integracoes.api?.webhooks ?? [],
        limitesRequisicao: {
          por_minuto: limitesRequisicao.por_minuto ?? 100,
          por_dia: limitesRequisicao.por_dia ?? 10000
        }
      },
      servicos: servicosMesclados
    },
    backup: {
      automatico: backup.automatico ?? true,
      frequencia: backup.frequencia ?? 'diario',
      retencaoDias: backup.retencaoDias ?? 30,
      incluirAnexos: backup.incluirAnexos ?? true,
      sincronizacaoNuvem:
        backup.sincronizacaoNuvem ?? {
          habilitada: false,
          provedor: 'aws',
          configuracao: {}
        }
    }
  };
};

export const ConfiguracaoEmpresaPage: React.FC<ConfiguracaoEmpresaPageProps> = ({ empresaId }) => {
  const { empresas, empresaAtiva, updateConfiguracoes } = useEmpresas();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [hasChanges, setHasChanges] = useState(false);

  // Empresa a ser configurada (passada por parâmetro ou empresa ativa)
  const empresa = empresas.find(e => e.id === empresaId) || empresaAtiva;

  // Estados das configurações
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesState>(() => criarConfiguracoesIniciais(empresa));

  // Atualizar configurações quando empresa mudar
  useEffect(() => {
    setConfiguracoes(criarConfiguracoesIniciais(empresa));
    setHasChanges(false);
  }, [empresa]);

  // Função para salvar configurações
  const handleSave = async () => {
    if (!empresa) return;

    try {
      setLoading(true);
      await updateConfiguracoes(empresa.id, configuracoes as Partial<EmpresaInfo['configuracoes']>);
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar configuração específica
  const updateConfig = <Section extends keyof ConfiguracoesState, Key extends keyof ConfiguracoesState[Section]>(
    section: Section,
    key: Key,
    value: ConfiguracoesState[Section][Key]
  ) => {
    setConfiguracoes(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  // Função para atualizar configuração aninhada
  const updateNestedConfig = <
    Section extends keyof ConfiguracoesState,
    ParentKey extends keyof ConfiguracoesState[Section]
  >(
    section: Section,
    parentKey: ParentKey,
    key: string,
    value: unknown
  ) => {
    setConfiguracoes(prev => {
      const sectionData = prev[section];
      const parentValue = sectionData[parentKey] as Record<string, unknown> | undefined;

      return {
        ...prev,
        [section]: {
          ...sectionData,
          [parentKey]: {
            ...(parentValue ?? {}),
            [key]: value
          }
        }
      };
    });
    setHasChanges(true);
  };

  if (!empresa) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma empresa selecionada para configuração.
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
            Configurações - {empresa.nome}
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie as configurações específicas desta empresa
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <Clock className="w-3 h-3 mr-1" />
              Alterações pendentes
            </Badge>
          )}

          <Button
            onClick={handleSave}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Tabs de Configuração */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-fit">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* Tab: Configurações Gerais */}
        <TabsContent value="geral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome da Empresa</Label>
                  <Input
                    id="nome"
                    value={configuracoes.geral.nome}
                    onChange={(e) => updateConfig('geral', 'nome', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="site">Site</Label>
                  <Input
                    id="site"
                    type="url"
                    value={configuracoes.geral.site}
                    onChange={(e) => updateConfig('geral', 'site', e.target.value)}
                    placeholder="https://www.exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={configuracoes.geral.telefone}
                    onChange={(e) => updateConfig('geral', 'telefone', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Principal</Label>
                  <Input
                    id="email"
                    type="email"
                    value={configuracoes.geral.email}
                    onChange={(e) => updateConfig('geral', 'email', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={configuracoes.geral.descricao}
                    onChange={(e) => updateConfig('geral', 'descricao', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Textarea
                    id="endereco"
                    value={configuracoes.geral.endereco}
                    onChange={(e) => updateConfig('geral', 'endereco', e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    value={configuracoes.geral.timezone}
                    onValueChange={(value) => updateConfig('geral', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Personalização Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cor-primaria">Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cor-primaria"
                      type="color"
                      value={configuracoes.geral.cores.primaria}
                      onChange={(e) => updateNestedConfig('geral', 'cores', 'primaria', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={configuracoes.geral.cores.primaria}
                      onChange={(e) => updateNestedConfig('geral', 'cores', 'primaria', e.target.value)}
                      placeholder="#2563eb"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cor-secundaria">Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cor-secundaria"
                      type="color"
                      value={configuracoes.geral.cores.secundaria}
                      onChange={(e) => updateNestedConfig('geral', 'cores', 'secundaria', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={configuracoes.geral.cores.secundaria}
                      onChange={(e) => updateNestedConfig('geral', 'cores', 'secundaria', e.target.value)}
                      placeholder="#64748b"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cor-accent">Cor de Destaque</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cor-accent"
                      type="color"
                      value={configuracoes.geral.cores.accent}
                      onChange={(e) => updateNestedConfig('geral', 'cores', 'accent', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={configuracoes.geral.cores.accent}
                      onChange={(e) => updateNestedConfig('geral', 'cores', 'accent', e.target.value)}
                      placeholder="#10b981"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Segurança */}
        <TabsContent value="seguranca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configurações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Autenticação 2FA</Label>
                  <p className="text-sm text-gray-600">
                    Exigir autenticação de dois fatores para todos os usuários
                  </p>
                </div>
                <Switch
                  checked={configuracoes.seguranca.autenticacao2FA}
                  onCheckedChange={(checked) => updateConfig('seguranca', 'autenticacao2FA', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessao-expiracao">Expiração da Sessão (minutos)</Label>
                  <Input
                    id="sessao-expiracao"
                    type="number"
                    value={configuracoes.seguranca.sessaoExpiracaoMinutos}
                    onChange={(e) => updateConfig('seguranca', 'sessaoExpiracaoMinutos', parseInt(e.target.value))}
                    min="30"
                    max="1440"
                  />
                </div>

                <div>
                  <Label htmlFor="tentativas-login">Máximo de Tentativas de Login</Label>
                  <Input
                    id="tentativas-login"
                    type="number"
                    value={configuracoes.seguranca.tentativasLoginMax}
                    onChange={(e) => updateConfig('seguranca', 'tentativasLoginMax', parseInt(e.target.value))}
                    min="3"
                    max="10"
                  />
                </div>

                <div>
                  <Label htmlFor="senha-complexidade">Complexidade da Senha</Label>
                  <Select
                    value={configuracoes.seguranca.senhaComplexidade}
                    onValueChange={(value: ConfiguracoesSeguranca['senhaComplexidade']) =>
                      updateConfig('seguranca', 'senhaComplexidade', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa (6+ caracteres)</SelectItem>
                      <SelectItem value="media">Média (8+ caracteres, letras e números)</SelectItem>
                      <SelectItem value="alta">Alta (10+ caracteres, letras, números e símbolos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="auditoria-nivel">Nível de Auditoria</Label>
                  <Select
                    value={configuracoes.seguranca.auditoriaNivel}
                    onValueChange={(value: ConfiguracoesSeguranca['auditoriaNivel']) =>
                      updateConfig('seguranca', 'auditoriaNivel', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico (Login/Logout)</SelectItem>
                      <SelectItem value="medio">Médio (+ Operações críticas)</SelectItem>
                      <SelectItem value="completo">Completo (Todas as ações)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários e Permissões */}
        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestão de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="limite-total">Limite Total de Usuários</Label>
                  <Input
                    id="limite-total"
                    type="number"
                    value={configuracoes.usuarios.limitesUsuarios.total}
                    onChange={(e) => updateNestedConfig('usuarios', 'limitesUsuarios', 'total', parseInt(e.target.value))}
                    min="1"
                    max={empresa.plano?.limites?.usuarios || 100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo permitido: {empresa.plano?.limites?.usuarios || 100}
                  </p>
                </div>

                <div>
                  <Label htmlFor="limite-admins">Limite de Administradores</Label>
                  <Input
                    id="limite-admins"
                    type="number"
                    value={configuracoes.usuarios.limitesUsuarios.administradores}
                    onChange={(e) => updateNestedConfig('usuarios', 'limitesUsuarios', 'administradores', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <Label htmlFor="limite-vendedores">Limite de Vendedores</Label>
                  <Input
                    id="limite-vendedores"
                    type="number"
                    value={configuracoes.usuarios.limitesUsuarios.vendedores}
                    onChange={(e) => updateNestedConfig('usuarios', 'limitesUsuarios', 'vendedores', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Aprovação para Novos Usuários</Label>
                  <p className="text-sm text-gray-600">
                    Requer aprovação do administrador para novos usuários
                  </p>
                </div>
                <Switch
                  checked={configuracoes.usuarios.aprovacaoNovoUsuario}
                  onCheckedChange={(checked) => updateConfig('usuarios', 'aprovacaoNovoUsuario', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notificações */}
        <TabsContent value="notificacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Configurações de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Emails Habilitados</Label>
                  <p className="text-sm text-gray-600">
                    Permitir o envio de emails automáticos
                  </p>
                </div>
                <Switch
                  checked={configuracoes.notificacoes.emailsHabilitados}
                  onCheckedChange={(checked) => updateConfig('notificacoes', 'emailsHabilitados', checked)}
                />
              </div>

              {configuracoes.notificacoes.emailsHabilitados && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Configuração do Servidor SMTP</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp-servidor">Servidor SMTP</Label>
                      <Input
                        id="smtp-servidor"
                        value={configuracoes.notificacoes.servidorEmail.servidor}
                        onChange={(e) => updateNestedConfig('notificacoes', 'servidorEmail', 'servidor', e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtp-porta">Porta</Label>
                      <Input
                        id="smtp-porta"
                        type="number"
                        value={configuracoes.notificacoes.servidorEmail.porta}
                        onChange={(e) => updateNestedConfig('notificacoes', 'servidorEmail', 'porta', parseInt(e.target.value))}
                        placeholder="587"
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtp-usuario">Usuário</Label>
                      <Input
                        id="smtp-usuario"
                        type="email"
                        value={configuracoes.notificacoes.servidorEmail.usuario}
                        onChange={(e) => updateNestedConfig('notificacoes', 'servidorEmail', 'usuario', e.target.value)}
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtp-senha">Senha</Label>
                      <Input
                        id="smtp-senha"
                        type="password"
                        value={configuracoes.notificacoes.servidorEmail.senha}
                        onChange={(e) => updateNestedConfig('notificacoes', 'servidorEmail', 'senha', e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Usar SSL/TLS</Label>
                      <p className="text-sm text-gray-600">
                        Conexão segura com o servidor
                      </p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoes.servidorEmail.ssl}
                      onCheckedChange={(checked) => updateNestedConfig('notificacoes', 'servidorEmail', 'ssl', checked)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Tipos de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(configuracoes.notificacoes.tiposNotificacao).map(([tipo, habilitado]) => (
                <div key={tipo} className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium capitalize">
                      {tipo.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Label>
                  </div>
                  <Switch
                    checked={habilitado}
                    onCheckedChange={(checked) => updateNestedConfig('notificacoes', 'tiposNotificacao', tipo, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Integrações */}
        <TabsContent value="integracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API e Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">API Habilitada</Label>
                  <p className="text-sm text-gray-600">
                    Permitir acesso via API REST
                  </p>
                </div>
                <Switch
                  checked={configuracoes.integracoes.api.habilitada}
                  onCheckedChange={(checked) => updateNestedConfig('integracoes', 'api', 'habilitada', checked)}
                />
              </div>

              {configuracoes.integracoes.api.habilitada && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="api-key">Chave da API</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="api-key"
                        value={configuracoes.integracoes.api.chaveApi}
                        onChange={(e) => updateNestedConfig('integracoes', 'api', 'chaveApi', e.target.value)}
                        placeholder="API Key"
                        type="password"
                      />
                      <Button variant="outline" size="sm">
                        Gerar Nova
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="api-limite-minuto">Limite por Minuto</Label>
                      <Input
                        id="api-limite-minuto"
                        type="number"
                        value={configuracoes.integracoes.api.limitesRequisicao.por_minuto}
                        onChange={(e) => updateNestedConfig('integracoes', 'api', 'limitesRequisicao', {
                          ...configuracoes.integracoes.api.limitesRequisicao,
                          por_minuto: parseInt(e.target.value)
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="api-limite-dia">Limite por Dia</Label>
                      <Input
                        id="api-limite-dia"
                        type="number"
                        value={configuracoes.integracoes.api.limitesRequisicao.por_dia}
                        onChange={(e) => updateNestedConfig('integracoes', 'api', 'limitesRequisicao', {
                          ...configuracoes.integracoes.api.limitesRequisicao,
                          por_dia: parseInt(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Serviços Externos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(configuracoes.integracoes.servicos).map(([servico, config]) => (
                <div key={servico} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium capitalize">
                        {servico.replace(/_/g, ' ')}
                      </Label>
                      <p className="text-xs text-gray-600">
                        {servico === 'receita_federal' && 'Consulta de CNPJ automática'}
                        {servico === 'correios' && 'Consulta de CEP e rastreamento'}
                        {servico === 'whatsapp' && 'Envio de mensagens automáticas'}
                        {servico === 'google_calendar' && 'Sincronização de agenda'}
                      </p>
                    </div>
                    <Switch
                      checked={config.habilitado}
                      onCheckedChange={(checked) => updateNestedConfig('integracoes', 'servicos', servico, {
                        ...config,
                        habilitado: checked
                      })}
                    />
                  </div>

                  {config.habilitado && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Token/Chave de acesso"
                        value={config.token}
                        onChange={(e) => updateNestedConfig('integracoes', 'servicos', servico, {
                          ...config,
                          token: e.target.value
                        })}
                        type="password"
                      />
                      {servico === 'whatsapp' && (
                        <Input
                          placeholder="Número do WhatsApp"
                          value={config.numero || ''}
                          onChange={(e) => updateNestedConfig('integracoes', 'servicos', servico, {
                            ...config,
                            numero: e.target.value
                          })}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Backup */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Configurações de Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Backup Automático</Label>
                  <p className="text-sm text-gray-600">
                    Realizar backups automáticos dos dados
                  </p>
                </div>
                <Switch
                  checked={configuracoes.backup.automatico}
                  onCheckedChange={(checked) => updateConfig('backup', 'automatico', checked)}
                />
              </div>

              {configuracoes.backup.automatico && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="backup-frequencia">Frequência</Label>
                      <Select
                        value={configuracoes.backup.frequencia}
                        onValueChange={(value: ConfiguracoesBackup['frequencia']) =>
                          updateConfig('backup', 'frequencia', value)
                        }
                      >
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
                      <Label htmlFor="backup-retencao">Retenção (dias)</Label>
                      <Input
                        id="backup-retencao"
                        type="number"
                        value={configuracoes.backup.retencaoDias}
                        onChange={(e) => updateConfig('backup', 'retencaoDias', parseInt(e.target.value))}
                        min="7"
                        max="365"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Incluir Anexos</Label>
                      <p className="text-sm text-gray-600">
                        Incluir arquivos anexos no backup
                      </p>
                    </div>
                    <Switch
                      checked={configuracoes.backup.incluirAnexos}
                      onCheckedChange={(checked) => updateConfig('backup', 'incluirAnexos', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Sincronização na Nuvem</Label>
                      <p className="text-sm text-gray-600">
                        Enviar backups para armazenamento na nuvem
                      </p>
                    </div>
                    <Switch
                      checked={configuracoes.backup.sincronizacaoNuvem.habilitada}
                      onCheckedChange={(checked) => updateNestedConfig('backup', 'sincronizacaoNuvem', 'habilitada', checked)}
                    />
                  </div>

                  {configuracoes.backup.sincronizacaoNuvem.habilitada && (
                    <div>
                      <Label htmlFor="backup-provedor">Provedor de Nuvem</Label>
                      <Select
                        value={configuracoes.backup.sincronizacaoNuvem.provedor}
                        onValueChange={(value) => updateNestedConfig('backup', 'sincronizacaoNuvem', 'provedor', value)}
                      >
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
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Status dos Backups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Último Backup</p>
                    <p className="text-sm text-green-600">Hoje às 03:00 - Sucesso</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-800">Próximo Backup</p>
                    <p className="text-sm text-blue-600">Amanhã às 03:00</p>
                  </div>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>

                <Button variant="outline" className="w-full">
                  Executar Backup Manual
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
