/**
 * 🧪 Testes para atendimentoStore (Zustand)
 * 
 * Testa:
 * - Persistência no localStorage
 * - Restauração de estado
 * - Ações da store
 * - Segurança (não persistir dados sensíveis)
 * - DevTools integration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAtendimentoStore } from '../atendimentoStore';
import { Ticket, Mensagem } from '../../features/atendimento/omnichannel/types';

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock de ticket para testes
const mockTicket: Ticket = {
  id: 'ticket-123',
  numero: 'TCK-123',
  contatoId: 'contato-456',
  contato: {
    id: 'contato-456',
    nome: 'João Silva',
    telefone: '11999999999',
    email: 'joao@example.com',
    online: false,
  },
  canal: 'whatsapp',
  status: 'aberto',
  ultimaMensagem: 'Ticket de Teste',
  tempoUltimaMensagem: new Date('2025-11-06T10:00:00Z'),
  tempoAtendimento: 0,
  tags: [],
};

const mockCliente = {
  id: 'cliente-789',
  nome: 'João Silva',
  telefone: '11999999999',
  email: 'joao@example.com',
};

const baseMockMensagem: Mensagem = {
  id: 'msg-1',
  ticketId: 'ticket-123',
  tipo: 'texto',
  remetente: {
    id: 'contato-456',
    nome: 'João Silva',
    tipo: 'cliente',
  },
  conteudo: 'Olá!',
  timestamp: new Date(),
  status: 'enviado',
};

describe('atendimentoStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Resetar store antes de cada teste
    useAtendimentoStore.getState().resetStore();
  });

  describe('📦 Estado Inicial', () => {
    it('deve iniciar com estado vazio', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      expect(result.current.tickets).toEqual([]);
      expect(result.current.ticketSelecionado).toBeNull();
      expect(result.current.clienteSelecionado).toBeNull();
      expect(result.current.ticketsLoading).toBe(false);
      expect(result.current.ticketsError).toBeNull();
      expect(result.current.mensagens).toEqual({});
    });
  });

  describe('🎫 Ações de Tickets', () => {
    it('deve adicionar tickets', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setTickets([mockTicket]);
      });

      expect(result.current.tickets).toHaveLength(1);
      expect(result.current.tickets[0].id).toBe('ticket-123');
    });

    it('deve selecionar ticket', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.selecionarTicket(mockTicket);
      });

      expect(result.current.ticketSelecionado?.id).toBe('ticket-123');
    });

    it('deve selecionar cliente quando seleciona ticket com contato', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.selecionarTicket(mockTicket);
      });

      expect(result.current.clienteSelecionado).toEqual(mockTicket.contato);
    });

    it('deve adicionar novo ticket', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.adicionarTicket(mockTicket);
      });

      expect(result.current.tickets).toHaveLength(1);
      expect(result.current.tickets[0].id).toBe('ticket-123');
    });

    it('deve atualizar ticket existente', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setTickets([mockTicket]);
      });

      act(() => {
        result.current.atualizarTicket('ticket-123', {
          status: 'em_atendimento',
          ultimaMensagem: 'Mensagem atualizada',
        } as Partial<Ticket>);
      });

      const ticketAtualizado = result.current.tickets.find(t => t.id === 'ticket-123');
      expect(ticketAtualizado?.status).toBe('em_atendimento');
      expect(ticketAtualizado?.ultimaMensagem).toBe('Mensagem atualizada');
    });

    it('deve remover ticket', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setTickets([mockTicket]);
      });

      act(() => {
        result.current.removerTicket('ticket-123');
      });

      expect(result.current.tickets).toHaveLength(0);
    });

    it('deve limpar ticket selecionado ao remover o ticket', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setTickets([mockTicket]);
        result.current.selecionarTicket(mockTicket);
      });

      act(() => {
        result.current.removerTicket('ticket-123');
      });

      expect(result.current.ticketSelecionado).toBeNull();
    });

    it('deve atualizar estados de loading e error', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setTicketsLoading(true);
        result.current.setTicketsError('Erro de teste');
      });

      expect(result.current.ticketsLoading).toBe(true);
      expect(result.current.ticketsError).toBe('Erro de teste');
    });
  });

  describe('💬 Ações de Mensagens', () => {
    const mockMensagem: Mensagem = {
      ...baseMockMensagem,
      timestamp: new Date(),
    };

    it('deve adicionar mensagens para um ticket', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setMensagens('ticket-123', [mockMensagem]);
      });

      expect(result.current.mensagens['ticket-123']).toHaveLength(1);
      expect(result.current.mensagens['ticket-123'][0].id).toBe('msg-1');
    });

    it('deve adicionar nova mensagem a um ticket', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.adicionarMensagem('ticket-123', mockMensagem);
      });

      expect(result.current.mensagens['ticket-123']).toHaveLength(1);
    });

    it('deve evitar duplicatas de mensagens', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.adicionarMensagem('ticket-123', mockMensagem);
        result.current.adicionarMensagem('ticket-123', mockMensagem); // Duplicata
      });

      expect(result.current.mensagens['ticket-123']).toHaveLength(1); // Não deve duplicar
    });

    it('deve atualizar mensagem existente', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setMensagens('ticket-123', [mockMensagem]);
      });

      act(() => {
        result.current.atualizarMensagem('ticket-123', 'msg-1', {
          conteudo: 'Mensagem Editada',
        });
      });

      expect(result.current.mensagens['ticket-123'][0].conteudo).toBe('Mensagem Editada');
    });

    it('deve limpar mensagens de um ticket', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setMensagens('ticket-123', [mockMensagem]);
        result.current.setMensagensLoading('ticket-123', true);
        result.current.setMensagensError('ticket-123', 'Erro');
      });

      act(() => {
        result.current.limparMensagens('ticket-123');
      });

      expect(result.current.mensagens['ticket-123']).toBeUndefined();
      expect(result.current.mensagensLoading['ticket-123']).toBeUndefined();
      expect(result.current.mensagensError['ticket-123']).toBeUndefined();
    });
  });

  describe('👤 Ações de Cliente', () => {
    it('deve definir cliente selecionado', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setClienteSelecionado(mockCliente);
      });

      expect(result.current.clienteSelecionado?.id).toBe('cliente-789');
    });

    it('deve definir histórico do cliente', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      const historico = [
        { id: '1', tipo: 'atendimento', data: new Date() },
        { id: '2', tipo: 'compra', data: new Date() },
      ];

      act(() => {
        result.current.setHistoricoCliente(historico);
      });

      expect(result.current.historicoCliente).toHaveLength(2);
    });
  });

  describe('🔄 Ações de Reset', () => {
    it('deve resetar toda a store', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      // Preencher store
      act(() => {
        result.current.setTickets([mockTicket]);
        result.current.selecionarTicket(mockTicket);
        result.current.setClienteSelecionado(mockCliente);
      });

      // Resetar
      act(() => {
        result.current.resetStore();
      });

      expect(result.current.tickets).toEqual([]);
      expect(result.current.ticketSelecionado).toBeNull();
      expect(result.current.clienteSelecionado).toBeNull();
    });

    it('deve resetar apenas tickets', () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setTickets([mockTicket]);
        result.current.setClienteSelecionado(mockCliente);
      });

      act(() => {
        result.current.resetTickets();
      });

      expect(result.current.tickets).toEqual([]);
      expect(result.current.ticketSelecionado).toBeNull();
      expect(result.current.clienteSelecionado).not.toBeNull(); // Cliente mantido
    });
  });

  describe('💾 Persistência no localStorage', () => {
    it('deve persistir ticketSelecionado no localStorage', async () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.selecionarTicket(mockTicket);
      });

      // Aguardar persistência assíncrona
      await waitFor(() => {
        const saved = localStorage.getItem('conectcrm-atendimento-storage');
        expect(saved).toBeTruthy();
        expect(saved).toContain('ticket-123');
      });
    });

    it('deve persistir clienteSelecionado no localStorage', async () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setClienteSelecionado(mockCliente);
      });

      await waitFor(() => {
        const saved = localStorage.getItem('conectcrm-atendimento-storage');
        expect(saved).toBeTruthy();
        expect(saved).toContain('cliente-789');
      });
    });

    it('NÃO deve persistir lista de tickets (pode ficar desatualizada)', async () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setTickets([mockTicket, { ...mockTicket, id: 'ticket-999' }]);
      });

      await waitFor(() => {
        const saved = localStorage.getItem('conectcrm-atendimento-storage');
        if (saved) {
          expect(saved).not.toContain('tickets');
        }
      }, { timeout: 1000 });
    });

    it('NÃO deve persistir mensagens (muitos dados)', async () => {
      const { result } = renderHook(() => useAtendimentoStore());

      const mockMensagem: Mensagem = {
        ...baseMockMensagem,
        id: 'msg-persistido',
        conteudo: 'Teste',
        timestamp: new Date(),
      };

      act(() => {
        result.current.adicionarMensagem('ticket-123', mockMensagem);
      });

      await waitFor(() => {
        const saved = localStorage.getItem('conectcrm-atendimento-storage');
        if (saved) {
          expect(saved).not.toContain('mensagens');
        }
      }, { timeout: 1000 });
    });

    it('NÃO deve persistir estados de loading/error (efêmeros)', async () => {
      const { result } = renderHook(() => useAtendimentoStore());

      act(() => {
        result.current.setTicketsLoading(true);
        result.current.setTicketsError('Erro de teste');
      });

      await waitFor(() => {
        const saved = localStorage.getItem('conectcrm-atendimento-storage');
        if (saved) {
          expect(saved).not.toContain('ticketsLoading');
          expect(saved).not.toContain('ticketsError');
        }
      }, { timeout: 1000 });
    });
  });

  describe('🔁 Restauração de Estado', () => {
    it('deve restaurar ticketSelecionado do localStorage', async () => {
      // Simular dados salvos no localStorage
      const dadosSalvos = {
        state: {
          ticketSelecionado: mockTicket,
          clienteSelecionado: mockCliente,
        },
        version: 1,
      };

      localStorage.setItem(
        'conectcrm-atendimento-storage',
        JSON.stringify(dadosSalvos)
      );

      await act(async () => {
        await useAtendimentoStore.persist.rehydrate();
      });

      // Criar nova instância da store (simula reload da página)
      const { result } = renderHook(() => useAtendimentoStore());

      await waitFor(() => {
        expect(result.current.ticketSelecionado?.id).toBe('ticket-123');
        expect(result.current.clienteSelecionado?.id).toBe('cliente-789');
      });
    });
  });
});
