// Exportações principais do módulo de chat omnichannel
export { ChatOmnichannel as default, ChatOmnichannel } from './ChatOmnichannel';
export { AtendimentosSidebar } from './components/AtendimentosSidebar';
export { ChatArea } from './components/ChatArea';
export { ClientePanel } from './components/ClientePanel';
export * from './types';
export * from './utils';

// Services
export { atendimentoService } from './services/atendimentoService';
export type {
  ListarTicketsParams,
  ListarTicketsResponse,
  ListarMensagensParams,
  ListarMensagensResponse,
  EnviarMensagemParams,
  TransferirTicketResponse,
  EncerrarTicketResponse,
  BuscarContatosParams,
  BuscarClientesParams,
  Cliente
} from './services/atendimentoService';

// Hooks
export { useAtendimentos } from './hooks/useAtendimentos';
export { useMensagens } from './hooks/useMensagens';

// Contexts
export { SocketProvider, useSocket } from './contexts/SocketContext';

// Modals
export { NovoAtendimentoModal } from './modals/NovoAtendimentoModal';
export { TransferirAtendimentoModal } from './modals/TransferirAtendimentoModal';
export { EncerrarAtendimentoModal } from './modals/EncerrarAtendimentoModal';
export { EditarContatoModal } from './modals/EditarContatoModal';
export { VincularClienteModal } from './modals/VincularClienteModal';
export { AbrirDemandaModal } from './modals/AbrirDemandaModal';

export type { NovoAtendimentoData } from './modals/NovoAtendimentoModal';
export type { TransferenciaData } from './modals/TransferirAtendimentoModal';
export type { EncerramentoData } from './modals/EncerrarAtendimentoModal';
export type { ContatoEditado } from './modals/EditarContatoModal';
export type { NovaDemanda } from './modals/AbrirDemandaModal';
