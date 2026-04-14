import { OrigemLead, StatusLead } from '../leads/lead.entity';
import { EstagioOportunidade } from './oportunidade.entity';
import { OportunidadesService } from './oportunidades.service';

describe('OportunidadesService - sync lead enum compatibility', () => {
  const createService = () => {
    const oportunidadeRepository = { query: jest.fn() };
    const atividadeRepository = { query: jest.fn() };
    const stageEventRepository = {};
    const itemPreliminarRepository = {};
    const featureFlagRepository = {};
    const leadRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const userRepository = {};
    const clientesService = {};
    const notificationService = {};
    const dashboardV2JobsService = {};
    const atendimentoGateway = {};

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
      leadRepository,
    };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mapeia origem formulario para valor valido do enum quando formulario nao existe', async () => {
    const { service } = createService();

    jest.spyOn(service as any, 'getLeadColumnEnumValues').mockResolvedValue(
      new Set<string>(['site', 'manual', 'outros']),
    );

    const mapped = await (service as any).mapLeadOriginToDatabaseValue(OrigemLead.FORMULARIO);
    expect(mapped).toBe('site');
  });

  it('mapeia status desqualificado para perdido quando enum usa nomenclatura legada', async () => {
    const { service } = createService();

    jest.spyOn(service as any, 'getLeadColumnEnumValues').mockResolvedValue(
      new Set<string>(['novo', 'qualificado', 'convertido', 'perdido']),
    );

    const mapped = await (service as any).mapLeadStatusToDatabaseValue(StatusLead.DESQUALIFICADO);
    expect(mapped).toBe('perdido');
  });

  it('sincroniza lead com origem/status mapeados para enum do tenant', async () => {
    const { service, leadRepository } = createService();

    jest.spyOn(service as any, 'getTableColumns').mockResolvedValue(new Set<string>(['id']));
    jest.spyOn(service as any, 'buildLeadSnapshotFromOpportunity').mockReturnValue({
      oportunidadeId: 'opp-1',
      nome: 'Oportunidade - Evelyn Boto',
      email: 'evelyn@teste.com',
      telefone: '11999999999',
      empresa_nome: 'Empresa Teste',
      observacoes: 'Descricao',
      responsavel_id: 'user-1',
      origem: OrigemLead.FORMULARIO,
      status: StatusLead.DESQUALIFICADO,
    });
    jest.spyOn(service as any, 'mapLeadOriginToDatabaseValue').mockResolvedValue('site');
    jest.spyOn(service as any, 'mapLeadStatusToDatabaseValue').mockResolvedValue('perdido');
    jest.spyOn(service as any, 'findLeadCandidateForOpportunity').mockResolvedValue(null);

    leadRepository.create.mockImplementation((payload: any) => payload);
    leadRepository.save.mockResolvedValue(undefined);

    await (service as any).syncLeadMirrorFromOpportunity(
      {
        id: 'opp-1',
        titulo: 'Oportunidade - Evelyn Boto',
        estagio: EstagioOportunidade.NEGOCIACAO,
        origem: 'website',
      },
      'empresa-1',
      'update',
    );

    expect(leadRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        origem: 'site',
        status: 'perdido',
      }),
    );
    expect(leadRepository.save).toHaveBeenCalledTimes(1);
  });
});

