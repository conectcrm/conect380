import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { TicketFormModal } from '../components/tickets/TicketFormModal';
import type { Ticket } from '../services/ticketsService';
import {
  TICKET_CREATE_DRAFT_QUERY_PARAM,
  buildTicketCreateDraftStorageKey,
  generateTicketCreateDraftId,
} from '../constants/tickets';

const TicketCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const draftId = searchParams.get(TICKET_CREATE_DRAFT_QUERY_PARAM)?.trim() || '';

  React.useEffect(() => {
    if (draftId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(TICKET_CREATE_DRAFT_QUERY_PARAM, generateTicketCreateDraftId());
    setSearchParams(nextParams, { replace: true });
  }, [draftId, searchParams, setSearchParams]);

  const draftStorageKey = draftId ? buildTicketCreateDraftStorageKey(draftId) : undefined;

  const handleClose = () => {
    navigate('/atendimento/tickets');
  };

  const handleSuccess = (savedTicket?: Ticket) => {
    if (savedTicket?.id) {
      navigate(`/atendimento/tickets/${savedTicket.id}`, {
        state: {
          returnTo: '/atendimento/tickets',
        },
      });
      return;
    }
    navigate('/atendimento/tickets');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <BackToNucleus nucleusName="Tickets" nucleusPath="/atendimento/tickets" />
          <button
            onClick={handleClose}
            className="px-3 py-2 bg-white border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            title="Voltar para a tela principal de tickets"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para tickets
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <TicketFormModal
            isOpen
            onClose={handleClose}
            onSuccess={handleSuccess}
            ticket={null}
            mode="create"
            layout="page"
            draftStorageKey={draftStorageKey}
          />
        </div>
      </div>
    </div>
  );
};

export default TicketCreatePage;
