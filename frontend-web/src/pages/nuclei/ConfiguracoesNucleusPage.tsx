import React from 'react';
import {
  Settings,
  Mail,
  Database,
  Zap,
  Shield,
  Building2,
  UserCog,
  Target
} from 'lucide-react';
import ModulesScreen, { NucleusModulesData } from '../../components/navigation/ModulesScreen';

const ConfiguracoesNucleusPage: React.FC = () => {
  const configuracoesNucleusData: NucleusModulesData = {
    id: 'configuracoes',
    title: 'Configurações',
    description: 'Central de configurações do sistema, integrações e preferências',
    icon: Settings,
    color: 'purple',
    modules: [
      {
        id: 'sistema-preferencias',
        name: 'Sistema & Preferências',
        description: 'Configurações gerais do sistema, tema, idioma e preferências pessoais.',
        href: '/configuracoes/sistema',
        icon: Settings,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'configuracoes-empresa',
        name: 'Empresa',
        description: 'Dados cadastrais, CNPJ, endereço e informações fiscais.',
        href: '/nuclei/configuracoes/empresa',
        icon: Building2,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'configuracoes-usuarios',
        name: 'Usuários',
        description: 'Gestão de usuários, permissões e controle de acesso.',
        href: '/nuclei/configuracoes/usuarios',
        icon: UserCog,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'metas-comerciais',
        name: 'Metas Comerciais',
        description: 'Definição de metas de vendas por período, vendedor e região.',
        href: '/configuracoes/metas',
        icon: Target,
        notifications: 0,
        badge: 'Essencial',
        badgeColor: 'green',
        status: 'active'
      },
      {
        id: 'email-configuracao',
        name: 'E-mail',
        description: 'Configuração de SMTP, templates de e-mail e notificações.',
        href: '/configuracoes/email',
        icon: Mail,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'integracoes',
        name: 'Integrações',
        description: 'APIs externas, webhooks e conectores com outros sistemas.',
        href: '/nuclei/configuracoes/integracoes',
        icon: Zap,
        notifications: 0,
        badge: 'Novo',
        badgeColor: 'green',
        status: 'active'
      },
      {
        id: 'backup-sync',
        name: 'Backup & Sincronização',
        description: 'Gestão de backups automáticos e sincronização entre empresas.',
        href: '/sistema/backup',
        icon: Database,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'seguranca',
        name: 'Segurança',
        description: 'Configurações de segurança, 2FA e políticas de acesso.',
        href: '/configuracoes/seguranca',
        icon: Shield,
        notifications: 0,
        badge: 'Crítico',
        badgeColor: 'red',
        status: 'active'
      }
    ]
  };

  return <ModulesScreen nucleusData={configuracoesNucleusData} />;
};

export default ConfiguracoesNucleusPage;
