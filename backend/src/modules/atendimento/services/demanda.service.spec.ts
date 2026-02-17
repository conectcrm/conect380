import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemandaService } from './demanda.service';
import { Demanda } from '../entities/demanda.entity';
import { Ticket } from '../entities/ticket.entity';
import { Mensagem } from '../entities/mensagem.entity';
import { CreateDemandaDto } from '../dto/create-demanda.dto';

describe('DemandaService - Conversão de Ticket', () => {
  let service: DemandaService;
  let demandaRepository: Repository<Demanda>;
  let ticketRepository: Repository<Ticket>;
  let mensagemRepository: Repository<Mensagem>;

  const mockTicket = {
    id: 'ticket-123',
    numero: 12345,
    assunto: 'Preciso de ajuda',
    status: 'FILA',
    atendenteId: 'atendente-123',
    empresaId: 'empresa-123',
    contatoTelefone: '5511999999999',
    contatoNome: 'Cliente Teste',
    createdAt: new Date('2025-12-20T10:00:00Z'),
    slaExpiresAt: new Date('2025-12-25T10:00:00Z'),
    fila: {
      id: 'fila-123',
      nome: 'Suporte Técnico',
    },
  };

  const mockDemanda = {
    id: 'demanda-123',
    titulo: 'Demanda do ticket #12345',
    descricao: 'Descrição completa...',
    tipo: 'tecnica',
    prioridade: 'media',
    status: 'aberta',
    ticketId: 'ticket-123',
    clienteId: 'cliente-123',
    responsavelId: 'atendente-123',
    autorId: 'user-123',
    empresaId: 'empresa-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemandaService,
        {
          provide: getRepositoryToken(Demanda),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Mensagem),
          useValue: {
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DemandaService>(DemandaService);
    demandaRepository = module.get<Repository<Demanda>>(getRepositoryToken(Demanda));
    ticketRepository = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
    mensagemRepository = module.get<Repository<Mensagem>>(getRepositoryToken(Mensagem));

    // Defaults para evitar quebra em montarDescricaoDoTicket
    jest.spyOn(mensagemRepository, 'count').mockResolvedValue(2 as any);
    jest.spyOn(mensagemRepository, 'findOne').mockResolvedValue({
      conteudo: 'O sistema está com erro ao tentar fazer login',
      createdAt: new Date('2025-12-20T10:05:00Z'),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('converterTicketEmDemanda', () => {
    it('deve converter ticket em demanda com inferência automática', async () => {
      // Arrange
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as any);
      jest.spyOn(demandaRepository, 'findOne').mockResolvedValue(null); // Não existe demanda prévia
      jest.spyOn(demandaRepository, 'create').mockReturnValue(mockDemanda as any);
      jest.spyOn(demandaRepository, 'save').mockResolvedValue(mockDemanda as any);
      jest.spyOn(service, 'buscarPorId').mockResolvedValue(mockDemanda as any);

      // Act
      const result = await service.converterTicketEmDemanda('ticket-123', {}, 'user-123');

      // Assert
      expect(ticketRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-123' },
        relations: ['fila'],
      });
      expect(demandaRepository.findOne).toHaveBeenCalledWith({
        where: { ticketId: 'ticket-123' },
      });
      expect(demandaRepository.create).toHaveBeenCalled();
      expect(demandaRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockDemanda);
    });

    it('deve inferir tipo "tecnica" baseado em keywords', async () => {
      // Arrange
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as any);
      jest.spyOn(demandaRepository, 'findOne').mockResolvedValue(null);

      jest.spyOn(mensagemRepository, 'findOne').mockResolvedValue({
        conteudo: 'O sistema deu erro ao processar',
        createdAt: new Date(),
      } as any);

      const createSpy = jest
        .spyOn(demandaRepository, 'create')
        .mockImplementation((entity: any) => {
          expect(entity.tipo).toBe('tecnica'); // ✅ Verifica inferência
          return mockDemanda as any;
        });

      jest.spyOn(demandaRepository, 'save').mockResolvedValue(mockDemanda as any);
      jest.spyOn(service, 'buscarPorId').mockResolvedValue(mockDemanda as any);

      // Act
      await service.converterTicketEmDemanda('ticket-123', {}, 'user-123');

      // Assert
      expect(createSpy).toHaveBeenCalled();
      // Tipo foi inferido como "tecnica" porque mensagem contém "erro" e "sistema"
    });

    it('deve inferir prioridade "alta" se ticket está há mais de 3 dias aberto', async () => {
      // Arrange
      const agora = new Date();
      const ticketAntigo = {
        ...mockTicket,
        createdAt: new Date(agora.getTime() - 4 * 24 * 60 * 60 * 1000),
        // Garantir que SLA não esteja expirado neste cenário
        slaExpiresAt: new Date(agora.getTime() + 24 * 60 * 60 * 1000),
      };

      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(ticketAntigo as any);
      jest.spyOn(demandaRepository, 'findOne').mockResolvedValue(null);

      const createSpy = jest
        .spyOn(demandaRepository, 'create')
        .mockImplementation((entity: any) => {
          expect(entity.prioridade).toBe('alta'); // ✅ Verifica inferência
          return mockDemanda as any;
        });

      jest.spyOn(demandaRepository, 'save').mockResolvedValue(mockDemanda as any);
      jest.spyOn(service, 'buscarPorId').mockResolvedValue(mockDemanda as any);

      // Act
      await service.converterTicketEmDemanda('ticket-123', {}, 'user-123');

      // Assert
      expect(createSpy).toHaveBeenCalled();
    });

    it('deve inferir prioridade "urgente" se SLA vencido', async () => {
      // Arrange
      const agora = new Date();
      const ticketSlaVencido = {
        ...mockTicket,
        slaExpiresAt: new Date(agora.getTime() - 24 * 60 * 60 * 1000),
      };

      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(ticketSlaVencido as any);
      jest.spyOn(demandaRepository, 'findOne').mockResolvedValue(null);

      const createSpy = jest
        .spyOn(demandaRepository, 'create')
        .mockImplementation((entity: any) => {
          expect(entity.prioridade).toBe('urgente'); // ✅ Verifica inferência
          return mockDemanda as any;
        });

      jest.spyOn(demandaRepository, 'save').mockResolvedValue(mockDemanda as any);
      jest.spyOn(service, 'buscarPorId').mockResolvedValue(mockDemanda as any);

      // Act
      await service.converterTicketEmDemanda('ticket-123', {}, 'user-123');

      // Assert
      expect(createSpy).toHaveBeenCalled();
    });

    it('deve usar tipo e prioridade fornecidos no DTO (override da inferência)', async () => {
      // Arrange
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as any);
      jest.spyOn(demandaRepository, 'findOne').mockResolvedValue(null);

      const createSpy = jest
        .spyOn(demandaRepository, 'create')
        .mockImplementation((entity: any) => {
          expect(entity.tipo).toBe('comercial'); // ✅ DTO override
          expect(entity.prioridade).toBe('baixa'); // ✅ DTO override
          return mockDemanda as any;
        });

      jest.spyOn(demandaRepository, 'save').mockResolvedValue(mockDemanda as any);
      jest.spyOn(service, 'buscarPorId').mockResolvedValue(mockDemanda as any);

      // Act
      await service.converterTicketEmDemanda(
        'ticket-123',
        { tipo: 'comercial', prioridade: 'baixa' },
        'user-123',
      );

      // Assert
      expect(createSpy).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se ticket não existir', async () => {
      // Arrange
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.converterTicketEmDemanda('ticket-invalido', {}, 'user-123'),
      ).rejects.toThrow(NotFoundException);

      expect(ticketRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-invalido' },
        relations: ['fila'],
      });
    });

    it('deve lançar ConflictException se ticket já foi convertido', async () => {
      // Arrange
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as any);
      jest.spyOn(demandaRepository, 'findOne').mockResolvedValue(mockDemanda as any); // Já existe

      // Act
      await expect(
        service.converterTicketEmDemanda('ticket-123', {}, 'user-123'),
      ).rejects.toThrow(ConflictException);

      // Assert
      expect(demandaRepository.create).not.toHaveBeenCalled(); // NÃO cria nova
      expect(demandaRepository.save).not.toHaveBeenCalled(); // NÃO salva
    });

    it('deve incluir contexto completo do ticket na descrição', async () => {
      // Arrange
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as any);
      jest.spyOn(demandaRepository, 'findOne').mockResolvedValue(null);

      const createSpy = jest
        .spyOn(demandaRepository, 'create')
        .mockImplementation((entity: any) => {
          // Verifica que descrição contém elementos-chave
          expect(entity.descricao).toContain('Última mensagem do cliente');
          expect(entity.descricao).toContain('O sistema está com erro ao tentar fazer login');
          expect(entity.descricao).toContain('Contexto do Ticket');
          expect(entity.descricao).toContain('Número: #12345');
          expect(entity.descricao).toContain('Fila: Suporte Técnico');
          expect(entity.descricao).toContain('Contato: Cliente Teste');
          return mockDemanda as any;
        });

      jest.spyOn(demandaRepository, 'save').mockResolvedValue(mockDemanda as any);
      jest.spyOn(service, 'buscarPorId').mockResolvedValue(mockDemanda as any);

      // Act
      await service.converterTicketEmDemanda('ticket-123', {}, 'user-123');

      // Assert
      expect(createSpy).toHaveBeenCalled();
    });

    it('deve vincular corretamente ticket, cliente e responsável', async () => {
      // Arrange
      jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as any);
      jest.spyOn(demandaRepository, 'findOne').mockResolvedValue(null);

      const createSpy = jest
        .spyOn(demandaRepository, 'create')
        .mockImplementation((entity: any) => {
          expect(entity.ticketId).toBe('ticket-123');
          expect(entity.clienteId).toBe('cliente-123');
          expect(entity.responsavelId).toBe('atendente-123');
          expect(entity.empresaId).toBe('empresa-123');
          expect(entity.autorId).toBe('user-123');
          expect(entity.contatoTelefone).toBe('5511999999999');
          return mockDemanda as any;
        });

      jest.spyOn(demandaRepository, 'save').mockResolvedValue(mockDemanda as any);
      jest.spyOn(service, 'buscarPorId').mockResolvedValue(mockDemanda as any);

      // Act
      await service.converterTicketEmDemanda('ticket-123', { clienteId: 'cliente-123' }, 'user-123');

      // Assert
      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('inferirTipoDemanda (método privado - teste indireto)', () => {
    const casos = [
      { mensagem: 'O sistema deu erro ao processar', tipoEsperado: 'tecnica' },
      { mensagem: 'Preciso de ajuda para configurar', tipoEsperado: 'suporte' },
      { mensagem: 'Não recebi o boleto do pagamento', tipoEsperado: 'financeira' },
      { mensagem: 'Quero uma proposta de upgrade', tipoEsperado: 'comercial' },
      { mensagem: 'Estou insatisfeito com o atendimento', tipoEsperado: 'reclamacao' },
      { mensagem: 'Solicito liberação de acesso', tipoEsperado: 'solicitacao' },
      { mensagem: 'Alguma mensagem aleatória', tipoEsperado: 'suporte' }, // default
    ];

    casos.forEach(({ mensagem, tipoEsperado }) => {
      it(`deve inferir tipo "${tipoEsperado}" para mensagem: "${mensagem}"`, async () => {
        jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as any);
        jest.spyOn(demandaRepository, 'findOne').mockResolvedValue(null);

        jest.spyOn(mensagemRepository, 'findOne').mockResolvedValue({
          conteudo: mensagem,
          createdAt: new Date(),
        } as any);

        const createSpy = jest
          .spyOn(demandaRepository, 'create')
          .mockImplementation((entity: any) => {
            expect(entity.tipo).toBe(tipoEsperado);
            return mockDemanda as any;
          });

        jest.spyOn(demandaRepository, 'save').mockResolvedValue(mockDemanda as any);
        jest.spyOn(service, 'buscarPorId').mockResolvedValue(mockDemanda as any);

        await service.converterTicketEmDemanda('ticket-123', {}, 'user-123');

        expect(createSpy).toHaveBeenCalled();
      });
    });
  });
});
