import { NotFoundException } from '@nestjs/common';
import { ClientesController } from './clientes.controller';

describe('ClientesController Functional', () => {
  const clientesServiceMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    getTicketsResumo: jest.fn(),
    listForExport: jest.fn(),
    exportToCsv: jest.fn(),
    getByStatus: jest.fn(),
    getClientesProximoContato: jest.fn(),
    getEstatisticas: jest.fn(),
    getPropostasResumo: jest.fn(),
    getContratosResumo: jest.fn(),
    getFaturasResumo: jest.fn(),
    updateStatus: jest.fn(),
  };

  const cacheServiceMock = {
    invalidate: jest.fn(),
  };

  let controller: ClientesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ClientesController(clientesServiceMock as any, cacheServiceMock as any);
  });

  it('deve retornar listagem paginada de clientes (fluxo de listagem)', async () => {
    clientesServiceMock.findAll.mockResolvedValue({
      data: [
        {
          id: 'cliente-1',
          nome: 'Cliente Listagem',
          email: 'listagem@empresa.com',
          tipo: 'pessoa_fisica',
          status: 'lead',
          empresaId: 'empresa-1',
          ativo: true,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });

    const response = await controller.findAll('empresa-1', { page: 1, limit: 10 } as any);

    expect(clientesServiceMock.findAll).toHaveBeenCalledWith('empresa-1', { page: 1, limit: 10 });
    expect(response.success).toBe(true);
    expect(response.total).toBe(1);
    expect(response.data[0]).toMatchObject({
      id: 'cliente-1',
      nome: 'Cliente Listagem',
      empresa_id: 'empresa-1',
    });
  });

  it('deve cadastrar cliente (fluxo de cadastro)', async () => {
    clientesServiceMock.create.mockResolvedValue({
      id: 'cliente-2',
      nome: 'Cliente Cadastro',
      email: 'cadastro@empresa.com',
      tipo: 'pessoa_fisica',
      status: 'lead',
      empresaId: 'empresa-1',
      ativo: true,
    });

    const payload = {
      nome: 'Cliente Cadastro',
      email: 'cadastro@empresa.com',
      tipo: 'pessoa_fisica',
    };

    const response = await controller.create('empresa-1', payload as any);

    expect(clientesServiceMock.create).toHaveBeenCalledWith({
      ...payload,
      empresaId: 'empresa-1',
    });
    expect(response.success).toBe(true);
    expect(response.message).toBe('Cliente criado com sucesso');
    expect(cacheServiceMock.invalidate).toHaveBeenCalled();
  });

  it('deve editar cliente (fluxo de edicao)', async () => {
    clientesServiceMock.update.mockResolvedValue({
      id: 'cliente-3',
      nome: 'Cliente Editado',
      email: 'edicao@empresa.com',
      tipo: 'pessoa_juridica',
      status: 'prospect',
      empresaId: 'empresa-1',
      ativo: true,
      origem: 'Indicacao',
    });

    const response = await controller.update('empresa-1', 'cliente-3', {
      nome: 'Cliente Editado',
      origem: 'Indicacao',
    } as any);

    expect(clientesServiceMock.update).toHaveBeenCalledWith('cliente-3', 'empresa-1', {
      nome: 'Cliente Editado',
      origem: 'Indicacao',
    });
    expect(response.success).toBe(true);
    expect(response.message).toBe('Cliente atualizado com sucesso');
    expect(response.data.nome).toBe('Cliente Editado');
    expect(cacheServiceMock.invalidate).toHaveBeenCalled();
  });

  it('deve abrir perfil de cliente existente (abertura de perfil)', async () => {
    clientesServiceMock.findById.mockResolvedValue({
      id: 'cliente-4',
      nome: 'Cliente Perfil',
      email: 'perfil@empresa.com',
      tipo: 'pessoa_fisica',
      status: 'cliente',
      empresaId: 'empresa-1',
      ativo: true,
    });

    const response = await controller.findById('empresa-1', 'cliente-4');

    expect(clientesServiceMock.findById).toHaveBeenCalledWith('cliente-4', 'empresa-1');
    expect(response.success).toBe(true);
    expect(response.data).toMatchObject({
      id: 'cliente-4',
      nome: 'Cliente Perfil',
      empresa_id: 'empresa-1',
    });
  });

  it('deve retornar erro ao abrir perfil inexistente', async () => {
    clientesServiceMock.findById.mockResolvedValue(undefined);

    await expect(controller.findById('empresa-1', 'cliente-inexistente')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve retornar resumo de tickets do perfil (integracao principal)', async () => {
    clientesServiceMock.findById.mockResolvedValue({
      id: 'cliente-5',
      nome: 'Cliente Integracao',
      email: 'integracao@empresa.com',
      tipo: 'pessoa_fisica',
      status: 'cliente',
      empresaId: 'empresa-1',
      ativo: true,
    });

    clientesServiceMock.getTicketsResumo.mockResolvedValue({
      total: 3,
      abertos: 1,
      resolvidos: 2,
      ultimoAtendimentoEm: '2026-03-10T10:00:00.000Z',
      tickets: [],
    });

    const response = await controller.getTicketsResumo('empresa-1', 'cliente-5', '5');

    expect(clientesServiceMock.findById).toHaveBeenCalledWith('cliente-5', 'empresa-1');
    expect(clientesServiceMock.getTicketsResumo).toHaveBeenCalledWith('cliente-5', 'empresa-1', 5);
    expect(response.success).toBe(true);
    expect(response.data).toMatchObject({
      total: 3,
      abertos: 1,
      resolvidos: 2,
    });
  });
});
