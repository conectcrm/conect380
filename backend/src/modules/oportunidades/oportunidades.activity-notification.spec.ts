import { TipoAtividade, StatusAtividade } from './atividade.entity';
import { EstagioOportunidade } from './oportunidade.entity';
import { OportunidadesService } from './oportunidades.service';

describe('OportunidadesService - notificacoes de atividades', () => {
  const createService = () => {
    const oportunidadeRepository = { query: jest.fn() };
    const atividadeRepository = { query: jest.fn() };
    const stageEventRepository = {};
    const itemPreliminarRepository = {};
    const featureFlagRepository = {};
    const leadRepository = {};
    const userRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    const clientesService = {};
    const notificationService = {
      create: jest.fn(),
    };
    const dashboardV2JobsService = {};
    const atendimentoGateway = {
      notificarUsuario: jest.fn(),
    };

    const service = new OportunidadesService(
      oportunidadeRepository as any,
      atividadeRepository as any,
      stageEventRepository as any,
      itemPreliminarRepository as any,
      featureFlagRepository as any,
      leadRepository as any,
      userRepository as any,
      clientesService as any,
      notificationService as any,
      dashboardV2JobsService as any,
      atendimentoGateway as any,
    );

    return {
      service,
      oportunidadeRepository,
      atividadeRepository,
      userRepository,
      notificationService,
      atendimentoGateway,
    };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('notifica o responsavel mesmo quando o autor e o mesmo usuario', async () => {
    const { service, userRepository, notificationService, atendimentoGateway } = createService();

    notificationService.create.mockResolvedValue({ id: 'notif-1' });

    userRepository.findOne
      .mockResolvedValueOnce({ id: 'user-1' })
      .mockResolvedValueOnce({ nome: 'Dhon' });

    await (service as any).notifyAssignedUserOnActivityCreated({
      empresaId: 'empresa-1',
      oportunidade: {
        id: 'oportunidade-1',
        titulo: 'Renovacao anual',
      },
      atividade: {
        id: 'atividade-1',
        tipo: TipoAtividade.TAREFA,
        descricao: 'Follow-up comercial',
        dataAtividade: new Date('2026-04-05T14:00:00.000Z'),
        responsavel_id: 'user-1',
      },
      actorUserId: 'user-1',
    });

    expect(notificationService.create).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 'empresa-1',
        userId: 'user-1',
      }),
    );
    expect(atendimentoGateway.notificarUsuario).toHaveBeenCalledWith(
      'user-1',
      'atividade_atribuida',
      expect.objectContaining({
        id: 'notif-1',
      }),
    );
  });

  it('mantem o responsavel enviado no payload para disparar notificacao quando schema nao possui coluna responsavel_id', async () => {
    const { service, atividadeRepository, userRepository } = createService();

    jest.spyOn(service as any, 'resolveAtividadesSchema').mockResolvedValue({
      columns: new Set<string>(),
      userColumn: 'usuario_id',
      responsavelColumn: null,
      dateColumn: 'data',
      createdAtColumn: 'criado_em',
      titleColumn: null,
      statusColumn: 'status',
      legacyCompletedColumn: null,
      completionResultColumn: null,
      completedByColumn: null,
      completedAtColumn: null,
    });

    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'oportunidade-1',
      titulo: 'Negociacao ACME',
      estagio: EstagioOportunidade.NEGOCIACAO,
      lifecycle_status: 'open',
    } as any);

    const notifySpy = jest
      .spyOn(service as any, 'notifyAssignedUserOnActivityCreated')
      .mockResolvedValue(undefined);

    userRepository.findOne.mockResolvedValue({ id: 'user-2' });

    atividadeRepository.query.mockResolvedValue([
      {
        id: 'atividade-10',
        empresa_id: 'empresa-1',
        tipo: TipoAtividade.TAREFA,
        descricao: 'Ligar para o cliente',
        status: StatusAtividade.PENDENTE,
        resultado_conclusao: null,
        oportunidade_id: 'oportunidade-1',
        criado_por_id: 'actor-1',
        responsavel_id: null,
        concluido_por: null,
        concluido_em: null,
        dataAtividade: new Date('2026-04-05T10:00:00.000Z'),
        createdAt: new Date('2026-04-05T10:00:00.000Z'),
      },
    ]);

    await service.createAtividade(
      {
        oportunidade_id: 'oportunidade-1',
        tipo: TipoAtividade.TAREFA,
        descricao: 'Ligar para o cliente',
        responsavel_id: 'user-2',
      } as any,
      {
        empresaId: 'empresa-1',
        userId: 'actor-1',
      },
    );

    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        atividade: expect.objectContaining({
          responsavel_id: 'user-2',
        }),
      }),
    );
  });
});
