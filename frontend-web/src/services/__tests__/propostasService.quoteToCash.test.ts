jest.mock('../api', () => ({
  __esModule: true,
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { api } from '../api';
import { propostasService } from '../propostasService';

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

describe('propostasService - quote to cash endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve solicitar dispensa de contrato no endpoint correto', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        proposta: {
          id: 'prop-1',
          status: 'dispensa_contrato_solicitada',
        },
      },
    });

    const resultado = await propostasService.solicitarDispensaContrato('prop-1', {
      motivo: 'Venda simplificada',
      observacoes: 'Sem clausulas especiais',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/propostas/prop-1/contrato/dispensa/solicitar', {
      motivo: 'Venda simplificada',
      observacoes: 'Sem clausulas especiais',
    });
    expect(resultado.status).toBe('dispensa_contrato_solicitada');
  });

  it('deve aprovar dispensa de contrato no endpoint correto', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        proposta: {
          id: 'prop-1',
          status: 'dispensa_contrato_aprovada',
        },
      },
    });

    const resultado = await propostasService.aprovarDispensaContrato('prop-1', {
      motivo: 'Aprovado pela gerencia',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/propostas/prop-1/contrato/dispensa/aprovar', {
      motivo: 'Aprovado pela gerencia',
    });
    expect(resultado.status).toBe('dispensa_contrato_aprovada');
  });

  it('deve liberar faturamento da proposta com payload padrao quando nao informado', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        proposta: {
          id: 'prop-1',
          status: 'faturamento_liberado',
        },
      },
    });

    const resultado = await propostasService.liberarFaturamentoProposta('prop-1');

    expect(apiMock.post).toHaveBeenCalledWith('/propostas/prop-1/faturamento/liberar', {});
    expect(resultado.status).toBe('faturamento_liberado');
  });
});
