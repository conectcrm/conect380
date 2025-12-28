/**
 * 🧪 Testes do TicketService - Status Transitions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketService } from '../services/ticket.service';
import { Ticket, StatusTicket, PrioridadeTicket, TipoTicket } from '../entities/ticket.entity';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';
import { WhatsAppSenderService } from '../services/whatsapp-sender.service';
import { AtribuicaoService } from '../../triagem/services/atribuicao.service';
import { MensagemService } from '../services/mensagem.service';
import { Mensagem } from '../entities/mensagem.entity';
import { SessaoTriagem } from '../../triagem/entities/sessao-triagem.entity';
import { Evento } from '../../eventos/evento.entity';
import { Contato } from '../../clientes/contato.entity';
import { User } from '../../users/user.entity';
import { NotificationChannelsService } from '../../../notifications/notification-channels.service';

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
  const mockNotificationChannels: any = {
    sendWhatsapp: jest.fn(async () => undefined),
    sendSms: jest.fn(async () => undefined),
    sendPush: jest.fn(async () => undefined),
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
  const originalAdminPhone = process.env.NOTIFICATIONS_ADMIN_PHONE;

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
        {
          provide: NotificationChannelsService,
          useValue: mockNotificationChannels,
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

    process.env.NOTIFICATIONS_ADMIN_PHONE = originalAdminPhone || '5511999999999';
  });

  afterAll(() => {
    process.env.NOTIFICATIONS_ADMIN_PHONE = originalAdminPhone;
  });

  describe('atualizarStatus', () => {
    it('deve atualizar status de ABERTO para EM_ATENDIMENTO', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.FILA,
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
        status: StatusTicket.ENCERRADO,
        data_resolucao: new Date(),
      });

      // Act
      const resultado = await service.atualizarStatus(
        ticketId,
        StatusTicket.ENCERRADO,
      );

      // Assert
      expect(resultado.status).toBe(StatusTicket.ENCERRADO);
      expect(mockTicketRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StatusTicket.ENCERRADO,
          data_resolucao: expect.any(Date),
        }),
      );
    });

    it('deve atualizar status de RESOLVIDO para FECHADO e definir data_fechamento', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.ENCERRADO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
        data_resolucao: new Date(),
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue({
        ...mockTicket,
        status: StatusTicket.ENCERRADO,
        data_fechamento: new Date(),
      });

      // Act
      const resultado = await service.atualizarStatus(
        ticketId,
        StatusTicket.ENCERRADO,
      );

      // Assert
      expect(resultado.status).toBe(StatusTicket.ENCERRADO);
      expect(mockTicketRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StatusTicket.ENCERRADO,
          data_fechamento: expect.any(Date),
        }),
      );
    });

    it('deve limpar datas ao reabrir de FECHADO para ABERTO', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.ENCERRADO,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
        data_resolucao: new Date('2025-01-01'),
        data_fechamento: new Date('2025-01-02'),
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue({
        ...mockTicket,
        status: StatusTicket.FILA,
        data_resolucao: null,
        data_fechamento: null,
      });

      // Act
      const resultado = await service.atualizarStatus(
        ticketId,
        StatusTicket.FILA,
      );

      // Assert
      expect(resultado.status).toBe(StatusTicket.FILA);
      expect(mockTicketRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StatusTicket.FILA,
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
        status: StatusTicket.FILA,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);

      // Act & Assert
      await expect(
        service.atualizarStatus(ticketId, StatusTicket.ENCERRADO),
      ).rejects.toThrow(BadRequestException);

      expect(mockTicketRepository.save).not.toHaveBeenCalled();
      expect(mockAtendimentoGateway.notificarStatusTicket).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException para transição inválida FECHADO → EM_ATENDIMENTO', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: StatusTicket.ENCERRADO,
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
        status: StatusTicket.FILA,
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
        status: StatusTicket.FILA,
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

  describe('notificações de prioridade alta', () => {
    it('deve acionar policy ticket-priority-high ao criar ticket ALTA quando admin phone configurado', async () => {
      const dto = {
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        clienteNumero: '5511999999999',
        clienteNome: 'Cliente Teste',
        assunto: 'Teste alta',
        prioridade: PrioridadeTicket.ALTA,
      } as any;

      const criado = {
        ...dto,
        id: 'ticket-1',
        numero: 123,
        status: StatusTicket.FILA,
      };

      mockTicketRepository.create.mockReturnValue(dto);
      mockTicketRepository.save.mockResolvedValue(criado);

      await service.criar(dto);

      expect(mockNotificationChannels.sendWhatsapp).toHaveBeenCalledWith(
        expect.objectContaining({ to: process.env.NOTIFICATIONS_ADMIN_PHONE }),
      );
      expect(mockNotificationChannels.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ to: process.env.NOTIFICATIONS_ADMIN_PHONE }),
      );
    });

    it('deve acionar policy ao atualizar prioridade para URGENTE', async () => {
      const ticketId = 'ticket-urgente-1';
      const ticket = {
        id: ticketId,
        numero: 456,
        prioridade: PrioridadeTicket.MEDIA,
        status: StatusTicket.FILA,
        empresaId: 'empresa-1',
        canalId: 'canal-1',
        contatoTelefone: '5511999999999',
      } as any;

      jest.spyOn(service as any, 'buscarPorId').mockResolvedValue(ticket);
      mockTicketRepository.save.mockResolvedValue({ ...ticket, prioridade: PrioridadeTicket.URGENTE });

      await service.atualizarPrioridade(ticketId, PrioridadeTicket.URGENTE);

      expect(mockNotificationChannels.sendWhatsapp).toHaveBeenCalledWith(
        expect.objectContaining({ to: process.env.NOTIFICATIONS_ADMIN_PHONE }),
      );
      expect(mockNotificationChannels.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ to: process.env.NOTIFICATIONS_ADMIN_PHONE }),
      );
    });
  });
});

/**
 * 🧪 Testes dos Novos Campos da Unificação Tickets + Demandas
 * Sprint 1 - Testes para os 7 novos campos opcionais
 */
describe('TicketService - Unificação Tickets + Demandas (Sprint 1)', () => {
  let service: TicketService;
  let ticketRepository: Repository<Ticket>;

  const mockTicketRepository: any = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
  };

  const mockAtendimentoGateway: any = {
    notificarStatusTicket: jest.fn(),
    notificarNovoTicket: jest.fn(),
  };

  const mockMensagemRepository: any = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockContatoRepository: any = {
    findOne: jest.fn(),
  };

  const mockUserRepository: any = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: getRepositoryToken(Ticket), useValue: mockTicketRepository },
        { provide: getRepositoryToken(Mensagem), useValue: mockMensagemRepository },
        { provide: getRepositoryToken(SessaoTriagem), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Evento), useValue: { save: jest.fn(), create: jest.fn() } },
        { provide: getRepositoryToken(Contato), useValue: mockContatoRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: AtendimentoGateway, useValue: mockAtendimentoGateway },
        { provide: WhatsAppSenderService, useValue: { enviarMensagem: jest.fn() } },
        { provide: AtribuicaoService, useValue: { selecionarAtendenteParaRoteamento: jest.fn() } },
        { provide: MensagemService, useValue: { enviar: jest.fn() } },
        { provide: NotificationChannelsService, useValue: { sendWhatsapp: jest.fn(), sendSms: jest.fn() } },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    ticketRepository = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));

    // Reset mocks
    jest.clearAllMocks();
  });

  /**
   * Teste 1: Criar ticket com novos campos opcionais
   */
  describe('criar() - Novos campos da unificação', () => {
    it('deve criar ticket com tipo "demanda" e todos os campos opcionais', async () => {
      const mockDto = {
        empresaId: 'empresa-123',
        canalId: 'canal-whatsapp',
        clienteNumero: '5511999999999',
        clienteNome: 'João Silva',
        assunto: 'Minha demanda',
        // 🆕 Novos campos da unificação
        cliente_id: 'cliente-uuid-123',
        titulo: 'Problema no sistema',
        descricao: 'Descrição detalhada da demanda',
        tipo: 'demanda',
        data_vencimento: '2025-12-31T23:59:59Z',
        responsavel_id: 'user-responsavel-uuid',
        autor_id: 'user-autor-uuid',
      };

      const mockTicketCriado = {
        id: 'ticket-novo-123',
        numero: 100,
        ...mockDto,
        status: StatusTicket.FILA,
        prioridade: PrioridadeTicket.MEDIA,
        data_abertura: new Date(),
        ultima_mensagem_em: new Date(),
        data_vencimento: new Date(mockDto.data_vencimento),
      };

      mockTicketRepository.create.mockReturnValue(mockTicketCriado);
      mockTicketRepository.save.mockResolvedValue(mockTicketCriado);

      const resultado = await service.criar(mockDto as any);

      expect(mockTicketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'empresa-123',
          cliente_id: 'cliente-uuid-123',
          titulo: 'Problema no sistema',
          descricao: 'Descrição detalhada da demanda',
          tipo: 'demanda',
          data_vencimento: expect.any(Date),
          responsavel_id: 'user-responsavel-uuid',
          autor_id: 'user-autor-uuid',
        }),
      );

      expect(resultado.tipo).toBe('demanda');
      expect(resultado.titulo).toBe('Problema no sistema');
      expect(resultado.clienteId).toBe('cliente-uuid-123');
    });

    it('deve criar ticket sem campos opcionais (compatibilidade retroativa)', async () => {
      const mockDto = {
        empresaId: 'empresa-123',
        canalId: 'canal-whatsapp',
        clienteNumero: '5511888888888',
        clienteNome: 'Maria Silva',
        assunto: 'Atendimento normal',
        // ❌ SEM novos campos - deve funcionar normalmente
      };

      const mockTicketCriado = {
        id: 'ticket-simples-456',
        numero: 101,
        ...mockDto,
        status: StatusTicket.FILA,
        prioridade: PrioridadeTicket.MEDIA,
        // 🆕 Campos opcionais como null
        clienteId: null,
        titulo: null,
        descricao: null,
        tipo: null,
        dataVencimento: null,
        responsavelId: null,
        autorId: null,
      };

      mockTicketRepository.create.mockReturnValue(mockTicketCriado);
      mockTicketRepository.save.mockResolvedValue(mockTicketCriado);

      const resultado = await service.criar(mockDto as any);

      expect(resultado.clienteId).toBeNull();
      expect(resultado.tipo).toBeNull();
      expect(resultado.titulo).toBeNull();
    });
  });

  /**
   * Teste 2: Atualizar ticket com novos campos
   */
  describe('atualizar() - Novos campos da unificação', () => {
    it('deve atualizar ticket com novos campos incluindo conversão de data_vencimento', async () => {
      const ticketExistente = {
        id: 'ticket-123',
        empresaId: 'empresa-123',
        numero: 50,
        status: StatusTicket.FILA,
        tipo: null,
        titulo: null,
      } as any;

      const dadosAtualizacao = {
        tipo: 'solicitacao' as TipoTicket,
        titulo: 'Título atualizado',
        descricao: 'Nova descrição',
        data_vencimento: '2025-12-31T23:59:59Z',
        responsavel_id: 'novo-responsavel-uuid',
      };

      mockTicketRepository.findOne.mockResolvedValue(ticketExistente);
      mockTicketRepository.save.mockResolvedValue({
        ...ticketExistente,
        ...dadosAtualizacao,
        dataVencimento: new Date(dadosAtualizacao.data_vencimento),
      });

      const resultado = await service.atualizar('ticket-123', 'empresa-123', dadosAtualizacao);

      expect(resultado.tipo).toBe('solicitacao');
      expect(resultado.titulo).toBe('Título atualizado');
      expect(resultado.dataVencimento).toBeInstanceOf(Date);
    });

    it('deve permitir atualização parcial (apenas alguns campos)', async () => {
      const ticketExistente = {
        id: 'ticket-456',
        empresaId: 'empresa-123',
        tipo: 'demanda',
        titulo: 'Título antigo',
        descricao: 'Descrição antiga',
      } as any;

      mockTicketRepository.findOne.mockResolvedValue(ticketExistente);
      mockTicketRepository.save.mockResolvedValue({
        ...ticketExistente,
        titulo: 'Título novo',
      });

      const resultado = await service.atualizar('ticket-456', 'empresa-123', {
        titulo: 'Título novo',
        // 📝 Apenas titulo atualizado, outros campos mantidos
      });

      expect(resultado.titulo).toBe('Título novo');
      expect(resultado.tipo).toBe('demanda'); // Mantido
      expect(resultado.descricao).toBe('Descrição antiga'); // Mantido
    });
  });

  /**
   * Teste 3: Filtrar tickets por tipo (TipoTicket)
   */
  describe('listar() - Filtro por tipo', () => {
    it('deve filtrar tickets por tipo "demanda"', async () => {
      const mockQueryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            { id: 'ticket-1', tipo: 'demanda', titulo: 'Demanda 1' },
            { id: 'ticket-2', tipo: 'demanda', titulo: 'Demanda 2' },
          ],
          2,
        ]),
      };

      mockTicketRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockMensagemRepository.count.mockResolvedValue(0);
      mockMensagemRepository.findOne.mockResolvedValue(null);
      mockContatoRepository.findOne.mockResolvedValue(null);

      const resultado = await service.listar({
        empresaId: 'empresa-123',
        tipo: 'demanda' as TipoTicket,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('ticket.tipo = :tipo', { tipo: 'demanda' });
      expect(resultado.tickets).toHaveLength(2);
      expect(resultado.total).toBe(2);
    });

    it('deve listar todos os tipos quando tipo não for especificado', async () => {
      const mockQueryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            { id: 'ticket-1', tipo: 'demanda' },
            { id: 'ticket-2', tipo: null },
            { id: 'ticket-3', tipo: 'solicitacao' },
          ],
          3,
        ]),
      };

      mockTicketRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockMensagemRepository.count.mockResolvedValue(0);
      mockMensagemRepository.findOne.mockResolvedValue(null);
      mockContatoRepository.findOne.mockResolvedValue(null);

      const resultado = await service.listar({
        empresaId: 'empresa-123',
        // ❌ Sem filtro tipo - deve retornar todos
      });

      expect(resultado.tickets).toHaveLength(3);
      expect(resultado.total).toBe(3);
    });
  });

  /**
   * Teste 4: Buscar ticket com relações User (autor, responsavel)
   */
  describe('buscarPorId() - Relações User', () => {
    it('deve popular relações autor e responsavel (User)', async () => {
      const mockAutor = {
        id: 'user-autor-123',
        nome: 'João Autor',
        email: 'autor@empresa.com',
      };

      const mockResponsavel = {
        id: 'user-resp-456',
        nome: 'Maria Responsável',
        email: 'responsavel@empresa.com',
      };

      const mockTicket = {
        id: 'ticket-789',
        numero: 200,
        tipo: 'demanda' as TipoTicket,
        titulo: 'Minha demanda',
        autorId: mockAutor.id,
        autor: mockAutor,
        responsavelId: mockResponsavel.id,
        responsavel: mockResponsavel,
        contatoTelefone: '5511999999999',
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockMensagemRepository.count.mockResolvedValue(5);
      mockMensagemRepository.findOne.mockResolvedValue({ conteudo: 'Última mensagem' });
      mockContatoRepository.findOne.mockResolvedValue(null);

      const resultado = await service.buscarPorId('ticket-789');

      expect(mockTicketRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-789' },
        relations: ['autor', 'responsavel'],
      });

      expect(resultado.autor).toBeDefined();
      expect(resultado.autor.nome).toBe('João Autor');
      expect(resultado.responsavel).toBeDefined();
      expect(resultado.responsavel.nome).toBe('Maria Responsável');
    });

    it('deve funcionar quando autor/responsavel são null', async () => {
      const mockTicket = {
        id: 'ticket-sem-usuario',
        numero: 201,
        tipo: null,
        titulo: null,
        autorId: null,
        autor: null,
        responsavelId: null,
        responsavel: null,
        contatoTelefone: '5511888888888',
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockMensagemRepository.count.mockResolvedValue(0);
      mockMensagemRepository.findOne.mockResolvedValue(null);
      mockContatoRepository.findOne.mockResolvedValue(null);

      const resultado = await service.buscarPorId('ticket-sem-usuario');

      expect(resultado.autor).toBeNull();
      expect(resultado.responsavel).toBeNull();
    });
  });

  /**
   * Teste 5: Novos status (AGUARDANDO_CLIENTE, CONCLUIDO, CANCELADO)
   */
  describe('Novos status da unificação', () => {
    it('deve permitir transição para AGUARDANDO_CLIENTE', async () => {
      const mockTicket = {
        id: 'ticket-status',
        status: StatusTicket.EM_ATENDIMENTO,
      } as any;

      jest.spyOn(service as any, 'buscarPorId').mockResolvedValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue({
        ...mockTicket,
        status: StatusTicket.AGUARDANDO_CLIENTE,
      });

      const resultado = await service.atualizarStatus('ticket-status', StatusTicket.AGUARDANDO_CLIENTE);

      expect(resultado.status).toBe(StatusTicket.AGUARDANDO_CLIENTE);
    });

    it('deve registrar data de conclusão ao mudar para CONCLUIDO', async () => {
      const mockTicket = {
        id: 'ticket-concluir',
        status: StatusTicket.EM_ATENDIMENTO,
        data_resolucao: null,
        data_fechamento: null,
      } as any;

      jest.spyOn(service as any, 'buscarPorId').mockResolvedValue(mockTicket);
      
      const ticketConcluido = {
        ...mockTicket,
        status: StatusTicket.ENCERRADO,
        data_resolucao: new Date(),
        data_fechamento: new Date(),
      };

      mockTicketRepository.save.mockResolvedValue(ticketConcluido);

      const resultado = await service.atualizarStatus('ticket-concluir', StatusTicket.ENCERRADO);

      expect(resultado.status).toBe(StatusTicket.ENCERRADO);
      expect(resultado.data_resolucao).toBeDefined();
      expect(resultado.data_fechamento).toBeDefined();
    });
  });
});
