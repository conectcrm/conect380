import React from 'react';
import {
  Settings,
  MessageCircle,
  Mail,
  Database,
  Zap,
  Shield,
  Palette,
  Globe,
  Target
} from 'lucide-react';
import ModulesScreen, { NucleusModulesData } from '../../components/navigation/ModulesScreen';

const ConfiguracoesNucleusPage: React.FC = () => {
  const configuracoesNucleusData: NucleusModulesData = {
    id: 'configuracoes',
    title: 'Configurações',
    description: 'Configurações do sistema, integrações e preferências',
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
        id: 'chatwoot-whatsapp',
        name: 'Chatwoot (WhatsApp)',
        description: 'Configuração completa do Chatwoot para atendimento via WhatsApp.',
        href: '/configuracoes/chatwoot',
        icon: MessageCircle,
        notifications: 0,
        badge: 'Ativo',
        badgeColor: 'green',
        status: 'active'
      },
      {
        id: 'email-configuracao',
        name: 'E-mail',
        description: 'Configuração de SMTP, templates de e-mail e notificações.',
        href: '/configuracoes/email',
        icon: Mail,
        notifications: 1,
        status: 'active'
      },
      {
        id: 'integracoes',
        name: 'Integrações',
        description: 'APIs externas, webhooks e conectores com outros sistemas.',
        href: '/configuracoes/integracoes',
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
        href: '/configuracoes/backup',
        icon: Database,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'tema-interface',
        name: 'Tema & Interface',
        description: 'Personalização visual, cores, layout e modo escuro/claro.',
        href: '/configuracoes/tema',
        icon: Palette,
        notifications: 0,
        badge: 'Novo',
        badgeColor: 'blue',
        status: 'active'
      },
      {
        id: 'idioma-localizacao',
        name: 'Idioma & Localização',
        description: 'Configurações de idioma, timezone e formatação regional.',
        href: '/configuracoes/idioma',
        icon: Globe,
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
