import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';
import { PageHeader, SectionCard, shellTokens } from '../components/layout-v2';
import ChatOmnichannel from '../features/atendimento/omnichannel/ChatOmnichannel';

const actionButtonClass =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition-colors hover:bg-[#F6FAFB]';

const InboxAtendimentoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-[calc(100vh-132px)] min-h-[520px] flex-col gap-3">
      <SectionCard className="p-4 sm:p-5">
        <PageHeader
          title="Inbox Omnichannel"
          description="Atendimento em tempo real com visualização de lista, conversa e contexto do cliente."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/nuclei/atendimento')}
                className={actionButtonClass}
                title="Voltar ao módulo Atendimento"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Atendimento</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={actionButtonClass}
                title="Ir para Dashboard"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          }
        />
      </SectionCard>

      <section className={clsx(shellTokens.card, 'min-h-0 flex-1 overflow-hidden p-0')}>
        <ChatOmnichannel />
      </section>
    </div>
  );
};

export default InboxAtendimentoPage;
