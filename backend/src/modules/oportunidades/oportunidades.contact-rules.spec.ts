import { BadRequestException } from '@nestjs/common';
import {
  EstagioOportunidade,
  OrigemOportunidade,
  PrioridadeOportunidade,
} from './oportunidade.entity';
import { OportunidadesService } from './oportunidades.service';

describe('OportunidadesService - contact linkage rules', () => {
  const createService = () => {
    const oportunidadeRepository = { query: jest.fn() };
    const atividadeRepository = { query: jest.fn() };
    const stageEventRepository = {};
    const itemPreliminarRepository = {};
    const featureFlagRepository = {};
    const leadRepository = {};
    const userRepository = { findOne: jest.fn() };
    const clientesService = {};

    const service = new OportunidadesService(
      oportunidadeRepository as any,
      atividadeRepository as any,
      stageEventRepository as any,
      itemPreliminarRepository as any,
      featureFlagRepository as any,
      leadRepository as any,
      userRepository as any,
      clientesService as any,
    );

    return {
      service,
      oportunidadeRepository,
    };
  };

  const schemaMock = {
    columns: new Set<string>([
      'prioridade',
      'origem',
      'tags',
      'estagio',
      'data_fechamento_prevista',
      'nome_contato',
      'email_contato',
      'telefone_contato',
      'empresa_contato',
    ]),
    responsavelColumn: 'responsavel_id',
    responsavelMirrorColumn: null,
    dataFechamentoEsperadoColumn: 'data_fechamento_prevista',
    dataFechamentoRealColumn: null,
    createdAtColumn: 'created_at',
    updatedAtColumn: 'updated_at',
    lifecycleStatusColumn: null,
    archivedAtColumn: null,
    archivedByColumn: null,
    deletedAtColumn: null,
    deletedByColumn: null,
    reopenedAtColumn: null,
    reopenedByColumn: null,
    nomeContatoColumn: 'nome_contato',
    emailContatoColumn: 'email_contato',
    telefoneContatoColumn: 'telefone_contato',
    empresaContatoColumn: 'empresa_contato',
    estagioMode: 'modern',
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('bloqueia create quando cliente_id e nomeContato estao ausentes', async () => {
    const { service, oportunidadeRepository } = createService();

    jest.spyOn(service as any, 'resolveOportunidadesSchema').mockResolvedValue(schemaMock as any);
    jest.spyOn(service as any, 'isLifecycleEnabledForTenant').mockResolvedValue(false);

    await expect(
      service.create(
        {
          titulo: 'Negocio sem contato',
          descricao: 'Teste',
          valor: 1000,
          probabilidade: 30,
          estagio: EstagioOportunidade.LEADS,
          prioridade: PrioridadeOportunidade.MEDIA,
          origem: OrigemOportunidade.WEBSITE,
          responsavel_id: '550e8400-e29b-41d4-a716-446655440000',
        } as any,
        'empresa-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(oportunidadeRepository.query).not.toHaveBeenCalled();
  });

  it('bloqueia update quando payload remove cliente_id e nomeContato ao mesmo tempo', async () => {
    const { service, oportunidadeRepository } = createService();

    jest.spyOn(service as any, 'resolveOportunidadesSchema').mockResolvedValue(schemaMock as any);
    jest.spyOn(service as any, 'isLifecycleEnabledForTenant').mockResolvedValue(false);
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'opp-1',
      estagio: EstagioOportunidade.QUALIFICACAO,
      responsavel_id: '550e8400-e29b-41d4-a716-446655440000',
      cliente_id: '660e8400-e29b-41d4-a716-446655440000',
      nomeContato: 'Contato legado',
    } as any);

    await expect(
      service.update(
        'opp-1',
        {
          cliente_id: '' as any,
          nomeContato: '   ',
        } as any,
        'empresa-1',
        '550e8400-e29b-41d4-a716-446655440000',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(oportunidadeRepository.query).not.toHaveBeenCalled();
  });

  it('permite update sem tocar campos de contato quando regra nao foi alterada', async () => {
    const { service, oportunidadeRepository } = createService();

    jest.spyOn(service as any, 'resolveOportunidadesSchema').mockResolvedValue(schemaMock as any);
    jest.spyOn(service as any, 'isLifecycleEnabledForTenant').mockResolvedValue(false);
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce({
        id: 'opp-1',
        estagio: EstagioOportunidade.QUALIFICACAO,
        responsavel_id: '550e8400-e29b-41d4-a716-446655440000',
        cliente_id: null,
        nomeContato: 'Maria Teste',
      } as any)
      .mockResolvedValueOnce({
        id: 'opp-1',
        estagio: EstagioOportunidade.QUALIFICACAO,
        responsavel_id: '550e8400-e29b-41d4-a716-446655440000',
        cliente_id: null,
        nomeContato: 'Maria Teste',
        titulo: 'Novo titulo',
      } as any);
    jest.spyOn(service as any, 'syncLeadMirrorFromOpportunity').mockResolvedValue(undefined);
    oportunidadeRepository.query.mockResolvedValue([]);

    const updated = await service.update(
      'opp-1',
      {
        titulo: 'Novo titulo',
      } as any,
      'empresa-1',
      '550e8400-e29b-41d4-a716-446655440000',
    );

    expect(updated.titulo).toBe('Novo titulo');
    expect(oportunidadeRepository.query).toHaveBeenCalledTimes(1);
  });
});
