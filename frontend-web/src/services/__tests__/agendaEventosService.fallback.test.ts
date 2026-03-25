import { api } from '../api';
import { agendaEventosService } from '../agendaEventosService';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    isAxiosError: (error: any) => !!error?.isAxiosError,
  },
}));

jest.mock('../api', () => ({
  __esModule: true,
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

const buildAxiosError = (status: number) => {
  const error: any = new Error(`Request failed with status code ${status}`);
  error.isAxiosError = true;
  error.response = { status };
  return error;
};

describe('agendaEventosService fallback policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (agendaEventosService as any).endpointVariant = 'agenda';
  });

  it('faz fallback para /eventos quando a listagem /agenda-eventos retorna 500', async () => {
    apiMock.get.mockRejectedValueOnce(buildAxiosError(500));
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: 'evento-legado-500',
          titulo: 'Evento legado por fallback',
          dataInicio: '2026-03-25T15:00:00.000Z',
          dataFim: '2026-03-25T16:00:00.000Z',
          diaInteiro: false,
          tipo: 'reuniao',
          local: 'Sala fallback',
          cor: '#159A9C',
        },
      ],
    });

    const events = await agendaEventosService.listarEventos();

    expect(apiMock.get).toHaveBeenCalledTimes(2);
    expect(apiMock.get.mock.calls[0][0]).toMatch(/^\/agenda-eventos\?/);
    expect(apiMock.get.mock.calls[1][0]).toBe('/eventos');
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('evento-legado-500');
  });

  it('reusa /eventos como endpoint principal apos fallback para evitar 500 repetitivo', async () => {
    apiMock.get
      .mockRejectedValueOnce(buildAxiosError(500))
      .mockResolvedValueOnce({
        data: [
          {
            id: 'evento-legado-inicial',
            titulo: 'Evento legado inicial',
            dataInicio: '2026-03-25T09:00:00.000Z',
            dataFim: '2026-03-25T10:00:00.000Z',
            diaInteiro: false,
            tipo: 'reuniao',
            local: 'Sala 2',
            cor: '#159A9C',
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'evento-legado-seguinte',
            titulo: 'Evento legado seguinte',
            dataInicio: '2026-03-26T09:00:00.000Z',
            dataFim: '2026-03-26T10:00:00.000Z',
            diaInteiro: false,
            tipo: 'reuniao',
            local: 'Sala 3',
            cor: '#159A9C',
          },
        ],
      });

    const first = await agendaEventosService.listarEventos();
    const second = await agendaEventosService.listarEventos();

    expect(first[0].id).toBe('evento-legado-inicial');
    expect(second[0].id).toBe('evento-legado-seguinte');

    // Chamada 1: /agenda-eventos -> /eventos
    expect(apiMock.get.mock.calls[0][0]).toMatch(/^\/agenda-eventos\?/);
    expect(apiMock.get.mock.calls[1][0]).toBe('/eventos');

    // Chamada 2: vai direto em /eventos (sem repetir /agenda-eventos)
    expect(apiMock.get.mock.calls[2][0]).toBe('/eventos');
  });

  it('faz fallback para /eventos quando /agenda-eventos retorna 404', async () => {
    apiMock.get.mockRejectedValueOnce(buildAxiosError(404));
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: 'evento-legado-1',
          titulo: 'Evento legado',
          dataInicio: '2026-03-25T15:00:00.000Z',
          dataFim: '2026-03-25T16:00:00.000Z',
          diaInteiro: false,
          tipo: 'reuniao',
          local: 'Sala 1',
          cor: '#159A9C',
        },
      ],
    });

    const events = await agendaEventosService.listarEventos();

    expect(apiMock.get).toHaveBeenCalledTimes(2);
    expect(apiMock.get.mock.calls[0][0]).toMatch(/^\/agenda-eventos\?/);
    expect(apiMock.get.mock.calls[1][0]).toBe('/eventos');
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('evento-legado-1');
    expect(events[0].title).toBe('Evento legado');
  });

  it('nao faz fallback para /eventos no detalhe quando /agenda-eventos/:id retorna 500', async () => {
    apiMock.get.mockRejectedValueOnce(buildAxiosError(500));

    await expect(agendaEventosService.obterEvento('evt-1')).rejects.toBeTruthy();

    expect(apiMock.get).toHaveBeenCalledTimes(1);
    expect(apiMock.get.mock.calls[0][0]).toBe('/agenda-eventos/evt-1');
  });
});
