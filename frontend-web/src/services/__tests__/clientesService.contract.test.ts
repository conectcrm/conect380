import { readFileSync } from 'fs';
import { join } from 'path';
import { clientesService } from '../clientesService';
import { api } from '../api';

type ClientesContract = {
  create: {
    required: string[];
    optional: string[];
  };
  update: {
    partialOfCreate: boolean;
  };
  read: {
    required: string[];
    optional: string[];
  };
};

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

const contractPath = join(
  __dirname,
  '../../../../docs/features/contracts/clientes.contract.json',
);
const contract = JSON.parse(readFileSync(contractPath, 'utf-8')) as ClientesContract;

describe('clientesService Contract (Frontend)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve enviar payload de create aderente ao contrato', async () => {
    const payload = {
      nome: 'Cliente Front',
      email: 'cliente.front@empresa.com',
      tipo: 'pessoa_fisica' as const,
      telefone: '+5511999999999',
      origem: 'Site',
      responsavel_id: '2fb6f594-1d7a-4f8f-972a-9e0d2170c2c4',
      tags: ['vip'],
    };

    apiMock.post.mockResolvedValue({ data: { data: { id: '1', ...payload, status: 'lead' } } });

    await clientesService.createCliente(payload);

    expect(apiMock.post).toHaveBeenCalledWith('/clientes', payload);

    for (const field of contract.create.required) {
      expect(field in payload).toBe(true);
    }
  });

  it('deve enviar payload de update parcial conforme contrato', async () => {
    expect(contract.update.partialOfCreate).toBe(true);

    const payload = {
      observacoes: 'Atualizacao parcial',
      origem: 'Indicacao',
      responsavelId: '8f0f5e4f-6fc0-4b5e-a4f2-f3678eef3b8e',
    };

    apiMock.put.mockResolvedValue({
      data: {
        data: {
          id: 'cliente-1',
          nome: 'Cliente Front',
          email: 'cliente.front@empresa.com',
          tipo: 'pessoa_fisica',
          status: 'lead',
          ...payload,
        },
      },
    });

    await clientesService.updateCliente('cliente-1', payload);

    expect(apiMock.put).toHaveBeenCalledWith('/clientes/cliente-1', payload);
  });

  it('deve normalizar resposta de read conforme contrato', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: {
          id: 'cliente-2',
          nome: 'Cliente Read',
          email: 'read@empresa.com',
          tipo: 'pessoa_juridica',
          status: 'prospect',
          ativo: true,
          empresa_id: 'empresa-1',
          origem: 'WhatsApp',
          responsavel_id: '98a25d23-1737-4a8f-a186-04f9cd2e21ba',
        },
      },
    });

    const cliente = await clientesService.getClienteById('cliente-2');

    for (const requiredField of ['id', 'nome', 'email', 'tipo', 'status']) {
      expect(cliente).toHaveProperty(requiredField);
    }

    expect(cliente.origem).toBe('WhatsApp');
    expect(cliente.responsavel_id).toBe('98a25d23-1737-4a8f-a186-04f9cd2e21ba');
    expect(cliente.responsavelId).toBe('98a25d23-1737-4a8f-a186-04f9cd2e21ba');
  });
});
