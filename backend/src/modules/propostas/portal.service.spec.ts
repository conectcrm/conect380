import { createHash } from 'crypto';
import { PortalService } from './portal.service';

describe('PortalService', () => {
  let service: PortalService;

  const mockPropostasService = {
    atualizarStatusComValidacao: jest.fn(),
    atualizarStatus: jest.fn(),
    obterProposta: jest.fn(),
    marcarComoVisualizada: jest.fn(),
  };

  const mockEmailService = {
    notificarPropostaAceita: jest.fn(),
    notificarPropostaRejeitada: jest.fn(),
  };

  const mockPortalTokenQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockPortalTokenRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => mockPortalTokenQueryBuilder),
  };

  const mockPropostaRepository = {
    findOne: jest.fn(),
  };

  const empresaId = '11111111-1111-1111-1111-111111111111';
  const propostaId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    jest.clearAllMocks();

    mockPortalTokenQueryBuilder.update.mockReturnThis();
    mockPortalTokenQueryBuilder.set.mockReturnThis();
    mockPortalTokenQueryBuilder.where.mockReturnThis();
    mockPortalTokenQueryBuilder.andWhere.mockReturnThis();
    mockPortalTokenQueryBuilder.execute.mockResolvedValue({ affected: 1 });

    mockPortalTokenRepository.create.mockImplementation(() => ({}));
    mockPortalTokenRepository.save.mockImplementation(async (entity: any) => ({
      id: entity.id || 'token-row-1',
      criadoEm: entity.criadoEm || new Date('2026-02-24T12:00:00.000Z'),
      atualizadoEm: new Date('2026-02-24T12:00:00.000Z'),
      ...entity,
    }));
    mockPortalTokenRepository.update.mockResolvedValue({ affected: 1 });
    mockPortalTokenRepository.findOne.mockResolvedValue(null);

    mockPropostaRepository.findOne.mockResolvedValue({
      id: propostaId,
      numero: 'PROP-2026-001',
      empresaId,
    });

    service = new PortalService(
      mockPropostasService as any,
      mockEmailService as any,
      mockPortalTokenRepository as any,
      mockPropostaRepository as any,
    );
  });

  it('gera token persistido com hash e revoga tokens ativos anteriores da proposta', async () => {
    const result = await service.gerarTokenParaProposta(propostaId, empresaId, 7);

    expect(result.token).toMatch(/^[0-9a-f]{48}$/);
    expect(result.propostaId).toBe(propostaId);
    expect(new Date(result.expiresAt).toString()).not.toBe('Invalid Date');

    expect(mockPropostaRepository.findOne).toHaveBeenCalledWith({
      where: { id: propostaId, empresaId },
    });
    expect(mockPortalTokenRepository.createQueryBuilder).toHaveBeenCalled();
    expect(mockPortalTokenQueryBuilder.where).toHaveBeenCalledWith('proposta_id = :propostaId', {
      propostaId,
    });
    expect(mockPortalTokenRepository.save).toHaveBeenCalled();

    const savedEntity = mockPortalTokenRepository.save.mock.calls[0][0];
    expect(savedEntity.empresaId).toBe(empresaId);
    expect(savedEntity.propostaId).toBe(propostaId);
    expect(savedEntity.isActive).toBe(true);
    expect(savedEntity.tokenHash).toHaveLength(64);
    expect(savedEntity.tokenHash).toBe(createHash('sha256').update(result.token).digest('hex'));
  });

  it('invalida token expirado ao validar e retorna null', async () => {
    const rawToken = 'abc123token';
    mockPortalTokenRepository.findOne.mockResolvedValueOnce({
      id: 'token-row-expired',
      empresaId,
      propostaId,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      isActive: true,
      revogadoEm: null,
      expiraEm: new Date(Date.now() - 60_000),
      criadoEm: new Date(),
    });

    const tokenData = await (service as any).validarToken(rawToken);

    expect(tokenData).toBeNull();
    expect(mockPortalTokenRepository.update).toHaveBeenCalledWith(
      'token-row-expired',
      expect.objectContaining({
        isActive: false,
      }),
    );
  });

  it('obtem proposta por token usando empresaId persistido e marca visualizacao', async () => {
    const rawToken = 'ff00aa11';
    mockPortalTokenRepository.findOne.mockResolvedValueOnce({
      id: 'token-row-active',
      empresaId,
      propostaId,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      tokenHint: 'ff00...aa11',
      isActive: true,
      revogadoEm: null,
      expiraEm: new Date(Date.now() + 60_000),
      criadoEm: new Date('2026-02-24T12:00:00.000Z'),
    });

    mockPropostasService.obterProposta.mockResolvedValueOnce({
      id: propostaId,
      numero: 'PROP-2026-001',
      status: 'enviada',
      cliente: { nome: 'Cliente Teste' },
      valor: 1000,
      updatedAt: '2026-02-24T12:00:00.000Z',
    });
    mockPropostasService.marcarComoVisualizada.mockResolvedValueOnce({
      id: propostaId,
      status: 'visualizada',
    });

    const proposta = await service.obterPropostaPorToken(rawToken);

    expect(mockPropostasService.obterProposta).toHaveBeenCalledWith(propostaId, empresaId);
    expect(mockPropostasService.marcarComoVisualizada).toHaveBeenCalledWith(
      propostaId,
      undefined,
      'Portal-Client',
      empresaId,
    );
    expect(proposta.status).toBe('visualizada');
    expect(proposta.portalAccess.token).toBe('ff***');

    // touchToken atualiza ultimo acesso do token válido
    expect(mockPortalTokenRepository.update).toHaveBeenCalledWith(
      'token-row-active',
      expect.objectContaining({
        ultimoAcessoEm: expect.any(Date),
      }),
    );
  });
});
