import { BadRequestException } from '@nestjs/common';
import { EstagioOportunidade, LifecycleStatusOportunidade } from './oportunidade.entity';
import { OportunidadesService } from './oportunidades.service';

describe('OportunidadesService - vendedores envolvidos', () => {
  const createService = () => {
    const oportunidadeRepository = { query: jest.fn() };
    const atividadeRepository = { query: jest.fn() };
    const stageEventRepository = {};
    const itemPreliminarRepository = {};
    const featureFlagRepository = {};
    const leadRepository = {};
    const userRepository = {
      findOne: jest.fn(),
    };
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
      userRepository,
    };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('bloqueia inclusao de vendedor em oportunidade arquivada', async () => {
    const { service } = createService();

    jest.spyOn(service as any, 'assertVendedoresEnvolvidosTableAvailable').mockResolvedValue(undefined);
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'opp-1',
      estagio: EstagioOportunidade.QUALIFICACAO,
      lifecycle_status: LifecycleStatusOportunidade.ARCHIVED,
      responsavel_id: 'owner-1',
    } as any);

    await expect(
      service.adicionarVendedorEnvolvido(
        'opp-1',
        { vendedor_id: 'seller-1', papel: 'apoio' } as any,
        'empresa-1',
        'actor-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('bloqueia remocao de vendedor em oportunidade arquivada', async () => {
    const { service } = createService();

    jest.spyOn(service as any, 'assertVendedoresEnvolvidosTableAvailable').mockResolvedValue(undefined);
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'opp-1',
      estagio: EstagioOportunidade.QUALIFICACAO,
      lifecycle_status: LifecycleStatusOportunidade.ARCHIVED,
      responsavel_id: 'owner-1',
    } as any);

    await expect(
      service.removerVendedorEnvolvido('opp-1', 'seller-1', 'empresa-1', 'actor-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registra nota de historico ao incluir vendedor de apoio', async () => {
    const { service, oportunidadeRepository, userRepository } = createService();

    jest.spyOn(service as any, 'assertVendedoresEnvolvidosTableAvailable').mockResolvedValue(undefined);
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'opp-1',
      titulo: 'Negocio ACME',
      estagio: EstagioOportunidade.QUALIFICACAO,
      lifecycle_status: LifecycleStatusOportunidade.OPEN,
      responsavel_id: 'owner-1',
    } as any);
    jest.spyOn(service as any, 'notifyUserOnSellerLinked').mockResolvedValue(undefined);
    const createAtividadeSpy = jest
      .spyOn(service, 'createAtividade')
      .mockResolvedValue({ id: 'atv-1' } as any);

    userRepository.findOne.mockResolvedValue({ id: 'seller-1' });
    oportunidadeRepository.query
      .mockResolvedValueOnce([
        {
          id: 'link-1',
          vendedor_id: 'seller-1',
          papel: 'apoio',
          created_at: '2026-04-06T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'link-1',
          vendedor_id: 'seller-1',
          papel: 'apoio',
          created_at: '2026-04-06T00:00:00.000Z',
          vendedor_nome: 'Seller 1',
          vendedor_email: 'seller@teste.com',
          vendedor_avatar_url: null,
        },
      ]);
    jest.spyOn(service as any, 'getTableColumns').mockResolvedValue(new Set(['avatar_url']));

    await service.adicionarVendedorEnvolvido(
      'opp-1',
      { vendedor_id: 'seller-1', papel: 'apoio' } as any,
      'empresa-1',
      'actor-1',
    );

    expect(createAtividadeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        oportunidade_id: 'opp-1',
        tipo: 'note',
      }),
      expect.objectContaining({
        empresaId: 'empresa-1',
      }),
    );
  });
});
