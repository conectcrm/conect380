import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DistribuicaoService } from './distribuicao.service';
import { Fila, EstrategiaDistribuicao } from '../entities/fila.entity';
import { FilaAtendente } from '../entities/fila-atendente.entity';
import { Ticket, StatusTicket } from '../entities/ticket.entity';
import { User } from '../../users/user.entity';

describe('DistribuicaoService', () => {
  let service: DistribuicaoService;
  let filaRepository: Repository<Fila>;
  let filaAtendenteRepository: Repository<FilaAtendente>;
  let ticketRepository: Repository<Ticket>;
  let userRepository: Repository<User>;
  const EMPRESA_ID = 'empresa-1';

  // Mock data
  const mockFila: Partial<Fila> = {
    id: 'fila-1',
    nome: 'Fila Teste',
    estrategiaDistribuicao: EstrategiaDistribuicao.MENOR_CARGA,
    distribuicaoAutomatica: true,
    capacidadeMaxima: 10,
  };

  const mockFilaSemAutoDistribuicao: Partial<Fila> = {
    id: 'fila-2',
    nome: 'Fila Manual',
    estrategiaDistribuicao: EstrategiaDistribuicao.ROUND_ROBIN,
    distribuicaoAutomatica: false,
    capacidadeMaxima: 10,
  };

  const mockAtendente1: Partial<User> = {
    id: 'atendente-1',
    nome: 'Atendente 1',
    email: 'atendente1@test.com',
  };

  const mockAtendente2: Partial<User> = {
    id: 'atendente-2',
    nome: 'Atendente 2',
    email: 'atendente2@test.com',
  };

  const mockFilaAtendente1: Partial<FilaAtendente> = {
    id: 'fa-1',
    filaId: 'fila-1',
    atendenteId: 'atendente-1',
    capacidade: 5,
    prioridade: 5,
    ativo: true,
    atendente: mockAtendente1 as User,
  };

  const mockFilaAtendente2: Partial<FilaAtendente> = {
    id: 'fa-2',
    filaId: 'fila-1',
    atendenteId: 'atendente-2',
    capacidade: 5,
    prioridade: 3,
    ativo: true,
    atendente: mockAtendente2 as User,
  };

  const mockTicket: Partial<Ticket> = {
    id: 'ticket-1',
    filaId: 'fila-1',
    atendenteId: null,
    status: StatusTicket.FILA,
  };

  const mockTicketComAtendente: Partial<Ticket> = {
    id: 'ticket-2',
    filaId: 'fila-1',
    atendenteId: 'atendente-1',
    status: StatusTicket.EM_ATENDIMENTO,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistribuicaoService,
        {
          provide: getRepositoryToken(Fila),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FilaAtendente),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DistribuicaoService>(DistribuicaoService);
    filaRepository = module.get<Repository<Fila>>(getRepositoryToken(Fila));
    filaAtendenteRepository = module.get<Repository<FilaAtendente>>(
      getRepositoryToken(FilaAtendente),
    );
    ticketRepository = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('distribuirTicket', () => {
    it('deve distribuir ticket com sucesso para atendente disponível', async () => {
      // Arrange - SEMPRE criar cópia nova para evitar mutação
      const ticketFresh = { ...mockTicket, id: 'ticket-dist' };
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(ticketFresh as Ticket);
      jest.spyOn(filaRepository, 'findOne').mockResolvedValue({ ...mockFila } as Fila);
      jest
        .spyOn(filaAtendenteRepository, 'find')
        .mockResolvedValue([
          { ...mockFilaAtendente1 } as FilaAtendente,
          { ...mockFilaAtendente2 } as FilaAtendente,
        ]);
      // count é chamado 4x: 2x em buscarAtendentesDisponiveis, 2x em algoritmoMenorCarga
      jest
        .spyOn(ticketRepository, 'count')
        .mockResolvedValueOnce(2) // atendente-1 capacidade
        .mockResolvedValueOnce(4) // atendente-2 capacidade
        .mockResolvedValueOnce(2) // atendente-1 carga
        .mockResolvedValueOnce(4); // atendente-2 carga
      // save retorna o ticket modificado (primeiro argumento)
      jest.spyOn(ticketRepository, 'save').mockImplementation(async (ticket) => ticket as Ticket);

      // Act
      const result = await service.distribuirTicket('ticket-dist', EMPRESA_ID);

      // Assert
      expect(result.atendenteId).toBe('atendente-1');
      expect(result.status).toBe(StatusTicket.EM_ATENDIMENTO);
      expect(ticketRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          atendenteId: 'atendente-1',
          status: StatusTicket.EM_ATENDIMENTO,
        }),
      );
    });

    it('deve lançar NotFoundException se ticket não existir', async () => {
      // Arrange
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.distribuirTicket('ticket-inexistente', EMPRESA_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve retornar ticket sem redistribuir se já tiver atendente', async () => {
      // Arrange
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicketComAtendente as Ticket);

      // Act
      const result = await service.distribuirTicket('ticket-2', EMPRESA_ID);

      // Assert
      expect(result.atendenteId).toBe('atendente-1');
      expect(ticketRepository.save).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se ticket não tiver filaId', async () => {
      // Arrange - criar CÓPIA para evitar mutação
      const ticketSemFila = { ...mockTicket, filaId: null, id: 'ticket-sem-fila' };
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue({ ...ticketSemFila } as Ticket);

      // Act & Assert
      await expect(service.distribuirTicket('ticket-sem-fila', EMPRESA_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('não deve distribuir se fila não tem distribuição automática', async () => {
      // Arrange - criar CÓPIA para evitar mutação
      const ticketFresh = { ...mockTicket, id: 'ticket-auto-dist' };
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue({ ...ticketFresh } as Ticket);
      jest
        .spyOn(filaRepository, 'findOne')
        .mockResolvedValue({ ...mockFilaSemAutoDistribuicao } as Fila);

      // Act
      const result = await service.distribuirTicket('ticket-auto-dist', EMPRESA_ID);

      // Assert - ticket retorna inalterado
      expect(result.atendenteId).toBeNull();
      expect(result.status).toBe(StatusTicket.FILA);
      expect(ticketRepository.save).not.toHaveBeenCalled();
    });

    it('não deve distribuir se não houver atendentes disponíveis', async () => {
      // Arrange - criar CÓPIA para evitar mutação
      const ticketFresh = { ...mockTicket, id: 'ticket-sem-atendente' };
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue({ ...ticketFresh } as Ticket);
      jest.spyOn(filaRepository, 'findOne').mockResolvedValue({ ...mockFila } as Fila);
      jest.spyOn(filaAtendenteRepository, 'find').mockResolvedValue([]);

      // Act
      const result = await service.distribuirTicket('ticket-sem-atendente', EMPRESA_ID);

      // Assert - ticket retorna inalterado
      expect(result.atendenteId).toBeNull();
      expect(result.status).toBe(StatusTicket.FILA);
      expect(ticketRepository.save).not.toHaveBeenCalled();
    });

    it('não deve distribuir se todos atendentes atingiram capacidade máxima', async () => {
      // Arrange - criar CÓPIA para evitar mutação
      const ticketFresh = { ...mockTicket, id: 'ticket-capacidade' };
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue({ ...ticketFresh } as Ticket);
      jest.spyOn(filaRepository, 'findOne').mockResolvedValue({ ...mockFila } as Fila);
      jest
        .spyOn(filaAtendenteRepository, 'find')
        .mockResolvedValue([{ ...mockFilaAtendente1 } as FilaAtendente]);
      // Atendente com 5 tickets (capacidade máxima)
      jest.spyOn(ticketRepository, 'count').mockResolvedValue(5);

      // Act
      const result = await service.distribuirTicket('ticket-capacidade', EMPRESA_ID);

      // Assert - ticket retorna inalterado
      expect(result.atendenteId).toBeNull();
      expect(result.status).toBe(StatusTicket.FILA);
      expect(ticketRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('redistribuirFila', () => {
    it('deve redistribuir múltiplos tickets pendentes', async () => {
      // Arrange
      const ticketsPendentes = [
        { id: 'ticket-1', filaId: 'fila-1', atendenteId: null, status: StatusTicket.FILA },
        { id: 'ticket-2', filaId: 'fila-1', atendenteId: null, status: StatusTicket.FILA },
        { id: 'ticket-3', filaId: 'fila-1', atendenteId: null, status: StatusTicket.FILA },
      ];

      jest.spyOn(ticketRepository, 'find').mockResolvedValue(ticketsPendentes as Ticket[]);

      // Mock para cada chamada de distribuirTicket
      jest.spyOn(service, 'distribuirTicket').mockImplementation(async (ticketId, _empresaId) => {
        return {
          id: ticketId,
          atendenteId: 'atendente-1',
          status: StatusTicket.EM_ATENDIMENTO,
        } as Ticket;
      });

      // Act
      const result = await service.redistribuirFila('fila-1', EMPRESA_ID);

      // Assert
      expect(result.distribuidos).toBe(3);
      expect(service.distribuirTicket).toHaveBeenCalledTimes(3);
    });

    it('deve retornar 0 se não houver tickets pendentes', async () => {
      // Arrange
      jest.spyOn(ticketRepository, 'find').mockResolvedValue([]);

      // Act
      const result = await service.redistribuirFila('fila-1', EMPRESA_ID);

      // Assert
      expect(result.distribuidos).toBe(0);
    });

    it('deve continuar redistribuindo mesmo se alguns tickets falharem', async () => {
      // Arrange
      const ticketsPendentes = [
        { id: 'ticket-1', filaId: 'fila-1', atendenteId: null, status: StatusTicket.FILA },
        { id: 'ticket-2', filaId: 'fila-1', atendenteId: null, status: StatusTicket.FILA },
      ];

      jest.spyOn(ticketRepository, 'find').mockResolvedValue(ticketsPendentes as Ticket[]);

      // Primeiro ticket falha, segundo sucede
      jest
        .spyOn(service, 'distribuirTicket')
        .mockRejectedValueOnce(new Error('Erro ao distribuir'))
        .mockResolvedValueOnce({
          id: 'ticket-2',
          atendenteId: 'atendente-1',
          status: StatusTicket.EM_ATENDIMENTO,
        } as Ticket);

      // Act
      const result = await service.redistribuirFila('fila-1', EMPRESA_ID);

      // Assert
      expect(result.distribuidos).toBe(1);
    });
  });

  describe('algoritmoMenorCarga', () => {
    it('deve escolher atendente com menos tickets ativos', async () => {
      // Arrange
      const atendentes = [mockFilaAtendente1 as FilaAtendente, mockFilaAtendente2 as FilaAtendente];

      // Atendente 1 tem 3 tickets, Atendente 2 tem 1 ticket
      jest.spyOn(ticketRepository, 'count').mockResolvedValueOnce(3).mockResolvedValueOnce(1);

      // Act
      const result = await service['algoritmoMenorCarga'](atendentes, EMPRESA_ID);

      // Assert
      expect(result.atendenteId).toBe('atendente-2');
    });

    it('deve usar prioridade como critério de desempate quando carga é igual', async () => {
      // Arrange
      const atendentes = [
        { ...mockFilaAtendente1, prioridade: 5 } as FilaAtendente,
        { ...mockFilaAtendente2, prioridade: 3 } as FilaAtendente,
      ];

      // Ambos com mesma carga (2 tickets)
      jest.spyOn(ticketRepository, 'count').mockResolvedValue(2);

      // Act
      const result = await service['algoritmoMenorCarga'](atendentes, EMPRESA_ID);

      // Assert
      expect(result.atendenteId).toBe('atendente-2'); // Prioridade 3 (maior prioridade)
    });
  });

  describe('algoritmoPrioridade', () => {
    it('deve escolher atendente com maior prioridade (menor número)', async () => {
      // Arrange
      const atendentes = [
        { ...mockFilaAtendente1, prioridade: 5 } as FilaAtendente,
        { ...mockFilaAtendente2, prioridade: 2 } as FilaAtendente,
      ];

      jest.spyOn(ticketRepository, 'count').mockResolvedValue(1);

      // Act
      const result = await service['algoritmoPrioridade'](atendentes, EMPRESA_ID);

      // Assert
      expect(result.atendenteId).toBe('atendente-2'); // Prioridade 2 (mais alta)
    });

    it('deve usar menor carga como desempate quando prioridade é igual', async () => {
      // Arrange
      const atendentes = [
        { ...mockFilaAtendente1, prioridade: 5 } as FilaAtendente,
        { ...mockFilaAtendente2, prioridade: 5 } as FilaAtendente,
      ];

      // Atendente 1 tem 3 tickets, Atendente 2 tem 1 ticket
      jest.spyOn(ticketRepository, 'count').mockResolvedValueOnce(3).mockResolvedValueOnce(1);

      // Act
      const result = await service['algoritmoPrioridade'](atendentes, EMPRESA_ID);

      // Assert
      expect(result.atendenteId).toBe('atendente-2'); // Menor carga
    });
  });

  describe('algoritmoRoundRobin', () => {
    it('deve escolher próximo atendente na lista (revezamento)', async () => {
      // Arrange
      const atendentes = [mockFilaAtendente1 as FilaAtendente, mockFilaAtendente2 as FilaAtendente];

      // Último ticket foi para atendente-1
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue({
        id: 'ticket-ultimo',
        atendenteId: 'atendente-1',
      } as Ticket);

      // Act
      const result = await service['algoritmoRoundRobin'](atendentes, 'fila-1', EMPRESA_ID);

      // Assert
      expect(result.atendenteId).toBe('atendente-2'); // Próximo na lista
    });

    it('deve voltar para o início quando chegar no fim da lista', async () => {
      // Arrange
      const atendentes = [mockFilaAtendente1 as FilaAtendente, mockFilaAtendente2 as FilaAtendente];

      // Último ticket foi para atendente-2 (último da lista)
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue({
        id: 'ticket-ultimo',
        atendenteId: 'atendente-2',
      } as Ticket);

      // Act
      const result = await service['algoritmoRoundRobin'](atendentes, 'fila-1', EMPRESA_ID);

      // Assert
      expect(result.atendenteId).toBe('atendente-1'); // Volta pro começo
    });

    it('deve escolher primeiro atendente se não houver histórico', async () => {
      // Arrange
      const atendentes = [mockFilaAtendente1 as FilaAtendente, mockFilaAtendente2 as FilaAtendente];

      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(null);

      // Act
      const result = await service['algoritmoRoundRobin'](atendentes, 'fila-1', EMPRESA_ID);

      // Assert
      expect(result.atendenteId).toBe('atendente-1'); // Primeiro da lista
    });
  });

  describe('buscarAtendentesDisponiveis', () => {
    it('deve retornar apenas atendentes ativos com capacidade disponível', async () => {
      // Arrange
      jest
        .spyOn(filaAtendenteRepository, 'find')
        .mockResolvedValue([
          mockFilaAtendente1 as FilaAtendente,
          mockFilaAtendente2 as FilaAtendente,
        ]);

      // Atendente 1 tem 2 tickets (capacidade 5 - OK)
      // Atendente 2 tem 5 tickets (capacidade 5 - CHEIO)
      jest.spyOn(ticketRepository, 'count').mockResolvedValueOnce(2).mockResolvedValueOnce(5);

      // Act
      const result = await service['buscarAtendentesDisponiveis']('fila-1', EMPRESA_ID);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].atendenteId).toBe('atendente-1');
    });

    it('deve retornar array vazio se nenhum atendente disponível', async () => {
      // Arrange
      jest.spyOn(filaAtendenteRepository, 'find').mockResolvedValue([]);

      // Act
      const result = await service['buscarAtendentesDisponiveis']('fila-1', EMPRESA_ID);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
