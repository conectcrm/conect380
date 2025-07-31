import React from 'react';
import {
  Building2,
  Users,
  Shield,
  BarChart3,
  UserCheck,
  FileText,
  AlertTriangle,
  Database,
  ClipboardList
} from 'lucide-react';
import ModulesScreen, { NucleusModulesData } from '../../components/navigation/ModulesScreen';

const AdministracaoNucleusPage: React.FC = () => {
  const administracaoNucleusData: NucleusModulesData = {
    id: 'administracao',
    title: 'Administração',
    description: 'Gestão empresarial e controle administrativo avançado',
    icon: Building2,
    color: 'blue',
    modules: [
      {
        id: 'gestao-empresas',
        name: 'Gestão de Empresas',
        description: 'Administração de empresas, contratos e planos do sistema.',
        href: '/admin/empresas',
        icon: Building2,
        notifications: 3,
        badge: 'Crítico',
        badgeColor: 'red',
        status: 'active'
      },
      {
        id: 'usuarios-permissoes',
        name: 'Usuários & Permissões',
        description: 'Controle de acesso, perfis de usuário e permissões granulares.',
        href: '/admin/usuarios',
        icon: UserCheck,
        notifications: 1,
        status: 'active'
      },
      {
        id: 'relatorios-avancados',
        name: 'Relatórios Avançados',
        description: 'Analytics empresarial, dashboards executivos e KPIs estratégicos.',
        href: '/admin/relatorios',
        icon: BarChart3,
        notifications: 0,
        badge: 'Premium',
        badgeColor: 'purple',
        status: 'active'
      },
      {
        id: 'auditoria-logs',
        name: 'Auditoria & Logs',
        description: 'Rastreamento de ações, logs de sistema e conformidade.',
        href: '/admin/auditoria',
        icon: FileText,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'monitoramento-sistema',
        name: 'Monitoramento',
        description: 'Status do sistema, performance e alertas de infraestrutura.',
        href: '/admin/monitoramento',
        icon: AlertTriangle,
        notifications: 2,
        badge: 'Ativo',
        badgeColor: 'orange',
        status: 'active'
      },
      {
        id: 'dados-analytics',
        name: 'Dados & Analytics',
        description: 'Análise de dados, métricas de uso e inteligência de negócios.',
        href: '/admin/analytics',
        icon: Database,
        notifications: 0,
        badge: 'Beta',
        badgeColor: 'yellow',
        status: 'beta'
      },
      {
        id: 'politicas-conformidade',
        name: 'Políticas & Conformidade',
        description: 'Gestão de políticas internas, LGPD e compliance regulatório.',
        href: '/admin/conformidade',
        icon: ClipboardList,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'controle-acesso',
        name: 'Controle de Acesso',
        description: 'Configuração de roles, permissões e políticas de segurança avançadas.',
        href: '/admin/acesso',
        icon: Shield,
        notifications: 0,
        badge: 'Seguro',
        badgeColor: 'green',
        status: 'active'
      }
    ]
  };

  return <ModulesScreen nucleusData={administracaoNucleusData} />;
};

export default AdministracaoNucleusPage;
