/**
 * 🧪 Testes do TicketService - Status Transitions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketService } from '../services/ticket.service';
import { Ticket, StatusTicket } from '../entities/ticket.entity';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';
import { WhatsAppSenderService } from '../services/whatsapp-sender.service';
import { AtribuicaoService } from '../../triagem/services/atribuicao.service';
import { MensagemService } from '../services/mensagem.service';
import { Mensagem } from '../entities/mensagem.entity';
import { SessaoTriagem } from '../../triagem/entities/sessao-triagem.entity';
import { Evento } from '../../eventos/evento.entity';
import { Contato } from '../../clientes/contato.entity';
import { User } from '../../users/user.entity';

describe('TicketService - Status Transitions', () => {
  let service: TicketService;
  let ticketRepository: Repository<Ticket>;
  let atendimentoGateway: AtendimentoGateway;

  const mockTicketRepository: any = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAtendimentoGateway: any = {
    notificarStatusTicket: jest.fn(),
    notificarNovaMensagem: jest.fn(),
  };

  const mockWhatsAppSenderService: any = {
    enviarMensagem: jest.fn(),
  };

  const mockAtribuicaoService: any = {
    atribuirTicket: jest.fn(),
  };

  const mockMensagemService: any = {
    criar: jest.fn(),
  };
  const mockContatoRepository: any = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockMensagemRepository: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };
  const mockSessaoTriagemRepository: any = {
    findOne: jest.fn(),
  };
  const mockEventoRepository: any = {
    save: jest.fn(),
    create: jest.fn(),
  };
  const mockContatoEntityRepository: any = {
    findOne: jest.fn(),
  };
  const mockUserRepository: any = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepository,
        },
        {
          provide: getRepositoryToken(Mensagem),
          useValue: mockMensagemRepository,
        },
        {
          provide: getRepositoryToken(SessaoTriagem),
          useValue: mockSessaoTriagemRepository,
        },
        {
          provide: getRepositoryToken(Evento),
          useValue: mockEventoRepository,
        },
        {
          provide: getRepositoryToken(Contato),
          useValue: mockContatoRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: AtendimentoGateway,
          useValue: mockAtendimentoGateway,
        },
        {
          provide: WhatsAppSenderService,
          useValue: mockWhatsAppSenderService,
        },
        {
          provide: AtribuicaoService,
          useValue: mockAtribuicaoService,
        },
        {
          provide: MensagemService,
          useValue: mockMensagemService,
        },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    ticketRepository = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
    atendimentoGateway = module.get<AtendimentoGateway>(AtendimentoGateway);

    // Reset mocks
    jest.clearAllMocks();

    mockMensagemRepository.findOne.mockResolvedValue(null);
    mockMensagemRepository.count.mockResolvedValue(0);

    const contatoQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => null),
    };
    mockContatoRepository.createQueryBuilder.mockReturnValue(contatoQueryBuilder);
  });

  describe('atualizarStatus', () => {
    it('deve atualizar status de ABERTO para EM_ATENDIMENTO', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.ABERTO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue({
        ...mockTicket,
        status: StatusTicket.EM_ATENDIMENTO,
      });

      // Act
      const resultado = await service.atualizarStatus(
        ticketId,
        StatusTicket.EM_ATENDIMENTO,
      );

      // Assert
      expect(resultado.status).toBe(StatusTicket.EM_ATENDIMENTO);
      expect(mockTicketRepository.save).toHaveBeenCalled();
      expect(mockAtendimentoGateway.notificarStatusTicket).toHaveBeenCalledWith(
        ticketId,
        StatusTicket.EM_ATENDIMENTO,
        expect.objectContaining({
          id: ticketId,
          status: StatusTicket.EM_ATENDIMENTO,
        }),
      );
    });

    it('deve atualizar status de EM_ATENDIMENTO para RESOLVIDO e definir data_resolucao', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.EM_ATENDIMENTO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue({
        ...mockTicket,
        status: StatusTicket.RESOLVIDO,
        data_resolucao: new Date(),
      });

      // Act
      const resultado = await service.atualizarStatus(
        ticketId,
        StatusTicket.RESOLVIDO,
      );

      // Assert
      expect(resultado.status).toBe(StatusTicket.RESOLVIDO);
      expect(mockTicketRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StatusTicket.RESOLVIDO,
          data_resolucao: expect.any(Date),
        }),
      );
    });

    it('deve atualizar status de RESOLVIDO para FECHADO e definir data_fechamento', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.RESOLVIDO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
        data_resolucao: new Date(),
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue({
        ...mockTicket,
        status: StatusTicket.FECHADO,
        data_fechamento: new Date(),
      });

      // Act
      const resultado = await service.atualizarStatus(
        ticketId,
        StatusTicket.FECHADO,
      );

      // Assert
      expect(resultado.status).toBe(StatusTicket.FECHADO);
      expect(mockTicketRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StatusTicket.FECHADO,
          data_fechamento: expect.any(Date),
        }),
      );
    });

    it('deve limpar datas ao reabrir de FECHADO para ABERTO', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.FECHADO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
        data_resolucao: new Date('2025-01-01'),
        data_fechamento: new Date('2025-01-02'),
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue({
        ...mockTicket,
        status: StatusTicket.ABERTO,
        data_resolucao: null,
        data_fechamento: null,
      });

      // Act
      const resultado = await service.atualizarStatus(
        ticketId,
        StatusTicket.ABERTO,
      );

      // Assert
      expect(resultado.status).toBe(StatusTicket.ABERTO);
      expect(mockTicketRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StatusTicket.ABERTO,
          data_resolucao: null,
          data_fechamento: null,
        }),
      );
    });

    it('deve lançar BadRequestException para transição inválida ABERTO → RESOLVIDO', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.ABERTO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);

      // Act & Assert
      await expect(
        service.atualizarStatus(ticketId, StatusTicket.RESOLVIDO),
      ).rejects.toThrow(BadRequestException);

      expect(mockTicketRepository.save).not.toHaveBeenCalled();
      expect(mockAtendimentoGateway.notificarStatusTicket).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException para transição inválida FECHADO → EM_ATENDIMENTO', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.FECHADO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);

      // Act & Assert
      await expect(
        service.atualizarStatus(ticketId, StatusTicket.EM_ATENDIMENTO),
      ).rejects.toThrow(BadRequestException);

      expect(mockTicketRepository.save).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando ticket não existe', async () => {
      // Arrange
      mockTicketRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.atualizarStatus('ticket-inexistente', StatusTicket.EM_ATENDIMENTO),
      ).rejects.toThrow(NotFoundException);

      expect(mockTicketRepository.save).not.toHaveBeenCalled();
    });

    it('deve notificar via WebSocket após atualização bem-sucedida', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.ABERTO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
      };

      const ticketAtualizado = {
        ...mockTicket,
        status: StatusTicket.EM_ATENDIMENTO,
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue(ticketAtualizado);

      // Act
      await service.atualizarStatus(
        ticketId,
        StatusTicket.EM_ATENDIMENTO,
      );

      // Assert
      expect(mockAtendimentoGateway.notificarStatusTicket).toHaveBeenCalledTimes(1);
      expect(mockAtendimentoGateway.notificarStatusTicket).toHaveBeenCalledWith(
        ticketId,
        StatusTicket.EM_ATENDIMENTO,
        ticketAtualizado,
      );
    });

    it('deve permitir status igual (não mudou)', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.EM_ATENDIMENTO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue(mockTicket);

      // Act
      const resultado = await service.atualizarStatus(
        ticketId,
        StatusTicket.EM_ATENDIMENTO,
      );

      // Assert
      expect(resultado.status).toBe(StatusTicket.EM_ATENDIMENTO);
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });

    it('deve continuar mesmo se notificação WebSocket falhar', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.ABERTO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
      };

      const ticketAtualizado = {
        ...mockTicket,
        status: StatusTicket.EM_ATENDIMENTO,
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue(ticketAtualizado);
      mockAtendimentoGateway.notificarStatusTicket.mockRejectedValue(
        new Error('WebSocket error'),
      );

      // Act & Assert
      await expect(
        service.atualizarStatus(ticketId, StatusTicket.EM_ATENDIMENTO),
      ).resolves.not.toThrow();

      expect(mockTicketRepository.save).toHaveBeenCalled();
    });
  });
});
