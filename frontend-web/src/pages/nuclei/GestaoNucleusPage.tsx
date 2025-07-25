import React from 'react';
import { 
  Building2, 
  Users, 
  Settings, 
  Shield, 
  BarChart3, 
  Database,
  UserCheck,
  Calendar,
  FileText,
  Zap
} from 'lucide-react';
import ModulesScreen, { NucleusModulesData } from '../../components/navigation/ModulesScreen';

const GestaoNucleusPage: React.FC = () => {
  const gestaoNucleusData: NucleusModulesData = {
    id: 'gestao',
    title: 'Gestão',
    description: 'Administração empresarial e controle operacional',
    icon: Building2,
    color: 'blue',
    modules: [
      {
        id: 'gestao-empresas',
        name: 'Gestão de Empresas',
        description: 'Gerenciamento completo de empresas, contratos e planos no sistema.',
        href: '/gestao/empresas',
        icon: Building2,
        notifications: 3,
        badge: 'Novo',
        badgeColor: 'green',
        status: 'active'
      },
      {
        id: 'gestao-usuarios',
        name: 'Gestão de Usuários',
        description: 'Administração de usuários, permissões e perfis de acesso.',
        href: '/gestao/usuarios',
        icon: Users,
        notifications: 1,
        status: 'beta'
      },
      {
        id: 'controle-acesso',
        name: 'Controle de Acesso',
        description: 'Configuração de roles, permissões e políticas de segurança.',
        href: '/gestao/acesso',
        icon: Shield,
        notifications: 0,
        status: 'beta'
      },
      {
        id: 'auditoria',
        name: 'Auditoria e Logs',
        description: 'Monitoramento de atividades, logs de sistema e trilhas de auditoria.',
        href: '/gestao/auditoria',
        icon: FileText,
        notifications: 0,
        status: 'coming_soon'
      },
      {
        id: 'metricas-operacionais',
        name: 'Métricas Operacionais',
        description: 'Dashboard executivo com KPIs e indicadores de performance.',
        href: '/gestao/metricas',
        icon: BarChart3,
        notifications: 0,
        status: 'coming_soon'
      },
      {
        id: 'backup-restore',
        name: 'Backup e Restore',
        description: 'Gestão de backups automáticos e restauração de dados.',
        href: '/gestao/backup',
        icon: Database,
        notifications: 0,
        status: 'coming_soon'
      },
      {
        id: 'compliance',
        name: 'Compliance',
        description: 'Conformidade com LGPD, ISO e outras regulamentações.',
        href: '/gestao/compliance',
        icon: UserCheck,
        notifications: 2,
        badge: 'LGPD',
        badgeColor: 'purple',
        status: 'coming_soon'
      },
      {
        id: 'manutencao',
        name: 'Manutenção',
        description: 'Agendamento de manutenções, atualizações e downtime planejado.',
        href: '/gestao/manutencao',
        icon: Calendar,
        notifications: 0,
        status: 'coming_soon'
      },
      {
        id: 'automacao',
        name: 'Automação',
        description: 'Configuração de workflows automáticos e regras de negócio.',
        href: '/gestao/automacao',
        icon: Zap,
        notifications: 0,
        status: 'coming_soon'
      }
    ]
  };

  return <ModulesScreen nucleusData={gestaoNucleusData} />;
};

export default GestaoNucleusPage;
