import { BadRequestException } from '@nestjs/common';
import { ContratosService } from './contratos.service';
import { StatusContrato } from '../entities/contrato.entity';
import { StatusAssinatura, TipoAssinatura } from '../entities/assinatura-contrato.entity';

describe('ContratosService', () => {
  let service: ContratosService;

  const mockContratoRepository = {
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    query: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAssinaturaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPropostaRepository = {
    query: jest.fn(),
  };

  const mockPropostasService = {
    atualizarStatus: jest.fn(),
  };

  const mockPdfContratoService = {
    gerarPDFContrato: jest.fn(),
    calcularHashDocumento: jest.fn(),
  };

  const mockAssinaturaDigitalService = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockPropostaRepository.query.mockResolvedValue([]);

    service = new ContratosService(
      mockContratoRepository as any,
      mockAssinaturaRepository as any,
      mockPropostaRepository as any,
      mockPropostasService as any,
      mockPdfContratoService as any,
      mockAssinaturaDigitalService as any,
    );
  });

  it('reverte contrato quando sincronizacao obrigatoria da proposta falha em marcarComoAssinado', async () => {
    const contrato = {
      id: 10,
      numero: 'CT2026000010',
      propostaId: 'proposta-10',
      status: StatusContrato.AGUARDANDO_ASSINATURA,
      dataAssinatura: null,
      assinaturas: [{ isAssinado: () => true }],
    };

    jest.spyOn(service, 'buscarContratoPorId').mockResolvedValueOnce(contrato as any);
    mockContratoRepository.save.mockResolvedValueOnce({
      ...contrato,
      status: StatusContrato.ASSINADO,
      dataAssinatura: new Date(),
    });
    mockPropostasService.atualizarStatus.mockRejectedValueOnce(new Error('sync-error'));

    await expect(service.marcarComoAssinado(10, 'empresa-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(mockContratoRepository.update).toHaveBeenCalledWith(10, {
      status: StatusContrato.AGUARDANDO_ASSINATURA,
      dataAssinatura: null,
    });
  });

  it('faz rollback de assinatura externa e contrato quando sincronizacao obrigatoria falha', async () => {
    const contratoOriginal = {
      id: 20,
      numero: 'CT2026000020',
      propostaId: 'proposta-20',
      status: StatusContrato.AGUARDANDO_ASSINATURA,
      dataAssinatura: null,
      observacoes: null,
      usuarioResponsavelId: '11111111-1111-4111-8111-111111111111',
    };
    const contratoAtualizado = {
      ...contratoOriginal,
      status: StatusContrato.ASSINADO,
      dataAssinatura: new Date(),
    };
    const assinaturaCriada = {
      id: 99,
      contratoId: 20,
      usuarioId: '11111111-1111-4111-8111-111111111111',
      tipo: TipoAssinatura.PRESENCIAL,
      status: StatusAssinatura.ASSINADO,
    };

    jest
      .spyOn(service, 'buscarContratoPorId')
      .mockResolvedValueOnce(contratoOriginal as any)
      .mockResolvedValueOnce(contratoAtualizado as any);

    mockAssinaturaRepository.create.mockReturnValue(assinaturaCriada);
    mockAssinaturaRepository.save.mockResolvedValueOnce(assinaturaCriada);
    mockContratoRepository.update.mockResolvedValue({});
    mockPropostasService.atualizarStatus.mockRejectedValueOnce(new Error('sync-error'));

    await expect(
      service.confirmarAssinaturaExterna(
        20,
        'empresa-1',
        '11111111-1111-4111-8111-111111111111',
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockAssinaturaRepository.delete).toHaveBeenCalledWith(99);
    expect(mockContratoRepository.update).toHaveBeenNthCalledWith(
      2,
      20,
      expect.objectContaining({
        status: StatusContrato.AGUARDANDO_ASSINATURA,
        dataAssinatura: null,
      }),
    );
  });
});

