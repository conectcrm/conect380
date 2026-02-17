import { Test, TestingModule } from '@nestjs/testing';
import { DistribuicaoController } from './distribuicao.controller';
import { DistribuicaoService } from '../services/distribuicao.service';
import { Ticket, StatusTicket } from '../entities/ticket.entity';

describe('DistribuicaoController', () => {
  let controller: DistribuicaoController;
  let service: DistribuicaoService;
  const EMPRESA_ID = 'empresa-1';

  const mockTicket: Partial<Ticket> = {
    id: 'ticket-1',
    filaId: 'fila-1',
    atendenteId: 'atendente-1',
    status: StatusTicket.EM_ATENDIMENTO,
  };

  const mockTicketSemAtendente: Partial<Ticket> = {
    id: 'ticket-2',
    filaId: 'fila-1',
    atendenteId: null,
    status: StatusTicket.FILA,
  };

  const mockDistribuicaoService = {
    distribuirTicket: jest.fn(),
    redistribuirFila: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DistribuicaoController],
      providers: [
        {
          provide: DistribuicaoService,
          useValue: mockDistribuicaoService,
        },
      ],
    }).compile();

    controller = module.get<DistribuicaoController>(DistribuicaoController);
    service = module.get<DistribuicaoService>(DistribuicaoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('distribuirTicket', () => {
    it('deve retornar resposta de sucesso quando ticket é distribuído', async () => {
      // Arrange
      mockDistribuicaoService.distribuirTicket.mockResolvedValue(mockTicket as Ticket);

      // Act
      const result = await controller.distribuirTicket('ticket-1', EMPRESA_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Ticket distribuido com sucesso');
      expect(result.data).toEqual(mockTicket);
      expect(service.distribuirTicket).toHaveBeenCalledWith('ticket-1', EMPRESA_ID);
    });

    it('deve retornar mensagem apropriada quando nenhum atendente disponível', async () => {
      // Arrange
      mockDistribuicaoService.distribuirTicket.mockResolvedValue(mockTicketSemAtendente as Ticket);

      // Act
      const result = await controller.distribuirTicket('ticket-2', EMPRESA_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Nenhum atendente disponivel no momento');
      expect(result.data.atendenteId).toBeNull();
    });

    it('deve propagar exceções do service', async () => {
      // Arrange
      const error = new Error('Erro ao distribuir');
      mockDistribuicaoService.distribuirTicket.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.distribuirTicket('ticket-1', EMPRESA_ID)).rejects.toThrow(error);
    });
  });

  describe('redistribuirFila', () => {
    it('deve retornar resposta de sucesso com contagem de tickets distribuídos', async () => {
      // Arrange
      const mockResultado = { distribuidos: 5 };
      mockDistribuicaoService.redistribuirFila.mockResolvedValue(mockResultado);

      // Act
      const result = await controller.redistribuirFila('fila-1', EMPRESA_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('5 ticket(s) redistribuido(s)');
      expect(result.data).toEqual(mockResultado);
      expect(service.redistribuirFila).toHaveBeenCalledWith('fila-1', EMPRESA_ID);
    });

    it('deve retornar 0 tickets quando nenhum foi distribuído', async () => {
      // Arrange
      const mockResultado = { distribuidos: 0 };
      mockDistribuicaoService.redistribuirFila.mockResolvedValue(mockResultado);

      // Act
      const result = await controller.redistribuirFila('fila-1', EMPRESA_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('0 ticket(s) redistribuido(s)');
      expect(result.data.distribuidos).toBe(0);
    });

    it('deve propagar exceções do service', async () => {
      // Arrange
      const error = new Error('Erro ao redistribuir');
      mockDistribuicaoService.redistribuirFila.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.redistribuirFila('fila-1', EMPRESA_ID)).rejects.toThrow(error);
    });
  });
});
