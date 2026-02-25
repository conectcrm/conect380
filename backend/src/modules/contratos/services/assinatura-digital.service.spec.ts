import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssinaturaDigitalService } from './assinatura-digital.service';
import { StatusAssinatura } from '../entities/assinatura-contrato.entity';

describe('AssinaturaDigitalService', () => {
  let service: AssinaturaDigitalService;

  const mockAssinaturaRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
  };

  const mockContratoRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockEmailService = {
    enviarEmailGenerico: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AssinaturaDigitalService(
      mockAssinaturaRepository as any,
      mockContratoRepository as any,
      mockEmailService as any,
    );
  });

  it('lança NotFoundException quando token não existe', async () => {
    mockAssinaturaRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.buscarAssinaturaPorToken('token-invalido')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(mockAssinaturaRepository.save).not.toHaveBeenCalled();
  });

  it('marca assinatura como expirada e lança BadRequestException ao consultar token expirado', async () => {
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
});
