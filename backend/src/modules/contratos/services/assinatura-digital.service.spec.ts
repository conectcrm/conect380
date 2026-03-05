import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssinaturaDigitalService } from './assinatura-digital.service';
import { StatusAssinatura } from '../entities/assinatura-contrato.entity';
import { StatusContrato } from '../entities/contrato.entity';

describe('AssinaturaDigitalService', () => {
  let service: AssinaturaDigitalService;

  const mockAssinaturaRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
  };

  const mockContratoRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    query: jest.fn(),
  };

  const mockPropostasService = {
    atualizarStatus: jest.fn(),
  };

  const mockEmailService = {
    enviarEmailGenerico: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContratoRepository.query.mockResolvedValue([]);
    service = new AssinaturaDigitalService(
      mockAssinaturaRepository as any,
      mockContratoRepository as any,
      mockPropostasService as any,
      mockEmailService as any,
    );
  });

  it('lanca NotFoundException quando token nao existe', async () => {
    mockAssinaturaRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.buscarAssinaturaPorToken('token-invalido')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(mockAssinaturaRepository.save).not.toHaveBeenCalled();
  });

  it('marca assinatura como expirada e lanca BadRequestException ao consultar token expirado', async () => {
    const assinaturaExpirada = {
      id: 1,
      status: StatusAssinatura.PENDENTE,
      tokenValidacao: 'token-expirado',
      dataExpiracao: new Date(Date.now() - 60_000),
      isExpirado: jest.fn(() => true),
    };

    mockAssinaturaRepository.findOne.mockResolvedValueOnce(assinaturaExpirada);
    mockAssinaturaRepository.save.mockResolvedValueOnce({
      ...assinaturaExpirada,
      status: StatusAssinatura.EXPIRADO,
    });

    await expect(service.buscarAssinaturaPorToken('token-expirado')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(assinaturaExpirada.status).toBe(StatusAssinatura.EXPIRADO);
    expect(mockAssinaturaRepository.save).toHaveBeenCalledWith(assinaturaExpirada);
  });

  it('faz rollback da assinatura para pendente quando a etapa final falha', async () => {
    const assinaturaPendente = {
      id: 12,
      contratoId: 33,
      status: StatusAssinatura.PENDENTE,
      tokenValidacao: 'token-ok',
      isExpirado: jest.fn(() => false),
      contrato: { numero: 'CT2026000001' },
      usuario: { id: 'u1' },
    };

    mockAssinaturaRepository.findOne.mockResolvedValueOnce(assinaturaPendente);
    mockAssinaturaRepository.save.mockResolvedValueOnce({
      ...assinaturaPendente,
      status: StatusAssinatura.ASSINADO,
      dataAssinatura: new Date(),
    });
    jest
      .spyOn(service as any, 'verificarAssinaturasCompletas')
      .mockRejectedValueOnce(new BadRequestException('falha-sync'));

    await expect(
      service.processarAssinatura({
        tokenValidacao: 'token-ok',
        hashAssinatura: 'hash',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockAssinaturaRepository.update).toHaveBeenCalledWith(12, {
      status: StatusAssinatura.PENDENTE,
      dataAssinatura: null,
      hashAssinatura: null,
      ipAssinatura: null,
      userAgent: null,
    });
  });

  it('reverte contrato quando sincronizacao da proposta falha apos assinatura digital completa', async () => {
    const contrato = {
      id: 7,
      numero: 'CT2026000007',
      propostaId: 'prop-7',
      empresa_id: 'empresa-1',
      status: StatusContrato.AGUARDANDO_ASSINATURA,
      dataAssinatura: null,
      assinaturas: [{ status: StatusAssinatura.ASSINADO }],
    };

    mockContratoRepository.findOne.mockResolvedValueOnce(contrato);
    mockContratoRepository.save.mockResolvedValueOnce({
      ...contrato,
      status: StatusContrato.ASSINADO,
      dataAssinatura: new Date(),
    });
    mockPropostasService.atualizarStatus.mockRejectedValueOnce(new Error('sync-error'));

    await expect((service as any).verificarAssinaturasCompletas(7)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(mockContratoRepository.update).toHaveBeenCalledWith(7, {
      status: StatusContrato.AGUARDANDO_ASSINATURA,
      dataAssinatura: null,
    });
  });
});

