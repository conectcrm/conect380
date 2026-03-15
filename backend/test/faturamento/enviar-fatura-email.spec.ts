import { BadRequestException } from '@nestjs/common';
import { FaturamentoService } from '../../src/modules/faturamento/services/faturamento.service';
import { StatusFatura } from '../../src/modules/faturamento/entities/fatura.entity';

describe('FaturamentoService - enviarFaturaPorEmail', () => {
  let service: FaturamentoService;

  const mockFaturaRepository = {
    save: jest.fn(),
  };
  const mockItemFaturaRepository = {};
  const mockContratoRepository = {};
  const mockClienteRepository = {
    findOne: jest.fn(),
  };
  const mockEmailService = {
    enviarEmailGenerico: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FaturamentoService(
      mockFaturaRepository as any,
      mockItemFaturaRepository as any,
      mockContratoRepository as any,
      mockClienteRepository as any,
      mockEmailService as any,
    );
  });

  it('usa email real do cliente e marca fatura como enviada', async () => {
    const faturaMock: any = {
      id: 101,
      numero: 'FT2026000001',
      clienteId: '5fd7c30f-ff4f-4d8e-b843-2ec4872f3399',
      descricao: 'Mensalidade',
      valorTotal: 1500,
      dataVencimento: new Date('2026-03-15T00:00:00.000Z'),
      status: StatusFatura.PENDENTE,
    };

    jest.spyOn(service, 'buscarFaturaPorId').mockResolvedValue(faturaMock);
    mockClienteRepository.findOne.mockResolvedValueOnce({
      id: faturaMock.clienteId,
      empresaId: 'empresa-1',
      email: 'cliente.real@empresa.com',
    });
    mockEmailService.enviarEmailGenerico.mockResolvedValueOnce(true);
    mockFaturaRepository.save.mockResolvedValueOnce({
      ...faturaMock,
      status: StatusFatura.ENVIADA,
    });

    const enviado = await service.enviarFaturaPorEmail(101, 'empresa-1');

    expect(enviado).toBe(true);
    expect(mockClienteRepository.findOne).toHaveBeenCalledWith({
      where: { id: faturaMock.clienteId, empresaId: 'empresa-1' },
    });
    expect(mockEmailService.enviarEmailGenerico).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'cliente.real@empresa.com',
      }),
    );
    expect(faturaMock.status).toBe(StatusFatura.ENVIADA);
    expect(mockFaturaRepository.save).toHaveBeenCalledWith(faturaMock);
  });

  it('lanca erro de negocio quando cliente nao possui email cadastrado', async () => {
    const faturaMock: any = {
      id: 202,
      numero: 'FT2026000002',
      clienteId: '1ba1e4a1-0d0d-433c-8f15-475389251951',
      descricao: 'Servico sem email',
      valorTotal: 200,
      dataVencimento: new Date('2026-03-20T00:00:00.000Z'),
      status: StatusFatura.PENDENTE,
    };

    jest.spyOn(service, 'buscarFaturaPorId').mockResolvedValue(faturaMock);
    mockClienteRepository.findOne.mockResolvedValueOnce({
      id: faturaMock.clienteId,
      empresaId: 'empresa-1',
      email: '   ',
    });

    await expect(service.enviarFaturaPorEmail(202, 'empresa-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(mockEmailService.enviarEmailGenerico).not.toHaveBeenCalled();
    expect(mockFaturaRepository.save).not.toHaveBeenCalled();
  });

  it('permite enviar para email explicito mesmo sem email no cadastro do cliente', async () => {
    const faturaMock: any = {
      id: 303,
      numero: 'FT2026000003',
      clienteId: '7d5f59d8-aeca-4d17-8ca9-80b7137178bc',
      descricao: 'Servico com destinatario explicito',
      valorTotal: 320,
      dataVencimento: new Date('2026-03-25T00:00:00.000Z'),
      status: StatusFatura.PENDENTE,
    };

    jest.spyOn(service, 'buscarFaturaPorId').mockResolvedValue(faturaMock);
    mockClienteRepository.findOne.mockResolvedValueOnce({
      id: faturaMock.clienteId,
      empresaId: 'empresa-1',
      email: '   ',
    });
    mockEmailService.enviarEmailGenerico.mockResolvedValueOnce(true);
    mockFaturaRepository.save.mockResolvedValueOnce({
      ...faturaMock,
      status: StatusFatura.ENVIADA,
    });

    const enviado = await service.enviarFaturaPorEmail(
      303,
      'empresa-1',
      'financeiro.destino@cliente.com',
    );

    expect(enviado).toBe(true);
    expect(mockEmailService.enviarEmailGenerico).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'financeiro.destino@cliente.com',
      }),
    );
  });

  it('lanca erro quando email explicito e invalido', async () => {
    const faturaMock: any = {
      id: 404,
      numero: 'FT2026000004',
      clienteId: '6c17ef6e-178f-4e53-8f0e-8f67f27c97f9',
      descricao: 'Servico com email invalido',
      valorTotal: 520,
      dataVencimento: new Date('2026-03-30T00:00:00.000Z'),
      status: StatusFatura.PENDENTE,
    };

    jest.spyOn(service, 'buscarFaturaPorId').mockResolvedValue(faturaMock);
    mockClienteRepository.findOne.mockResolvedValueOnce({
      id: faturaMock.clienteId,
      empresaId: 'empresa-1',
      email: 'cliente.valido@empresa.com',
    });

    await expect(service.enviarFaturaPorEmail(404, 'empresa-1', 'email-invalido')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(mockEmailService.enviarEmailGenerico).not.toHaveBeenCalled();
    expect(mockFaturaRepository.save).not.toHaveBeenCalled();
  });
});
