type LeadStatus = 'novo' | 'contatado' | 'qualificado' | 'desqualificado' | 'convertido';

type ResponsavelMock = {
  id: string;
  nome: string;
  username: string;
  email: string;
  ativo: boolean;
  empresaId: string;
};

type LeadMock = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa_nome: string;
  status: LeadStatus;
  origem: string;
  score: number;
  observacoes: string;
  responsavel_id: string | null;
  data_primeiro_contato: string | null;
  data_ultima_interacao: string | null;
  convertido_oportunidade_id: string | null;
  oportunidade_id: string | null;
  convertido_em: string | null;
  empresa_id: string;
  created_at: string;
  updated_at: string;
};

export const LEADS_SAVED_VIEWS_STORAGE_KEY = 'conectcrm_leads_saved_views_v1';
export const LEAD_UNASSIGNED_OPTION_VALUE = '__sem_responsavel__';

const RESPONSAVEIS_FIXTURE: ResponsavelMock[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    nome: 'Ana Pereira',
    username: 'ana.pereira',
    email: 'ana.pereira@conect360.com.br',
    ativo: true,
    empresaId: 'empresa-e2e-billing-1',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    nome: 'Bruno Costa',
    username: 'bruno.costa',
    email: 'bruno.costa@conect360.com.br',
    ativo: true,
    empresaId: 'empresa-e2e-billing-1',
  },
];

const LEADS_FIXTURE: LeadMock[] = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    nome: 'Lead Teste Atribuicao',
    email: 'lead.atribuicao@conect360.com.br',
    telefone: '11999990001',
    empresa_nome: 'Empresa Alfa',
    status: 'novo',
    origem: 'manual',
    score: 62,
    observacoes: '',
    responsavel_id: null,
    data_primeiro_contato: null,
    data_ultima_interacao: null,
    convertido_oportunidade_id: null,
    oportunidade_id: null,
    convertido_em: null,
    empresa_id: 'empresa-e2e-billing-1',
    created_at: '2026-03-10T10:00:00.000Z',
    updated_at: '2026-03-10T10:00:00.000Z',
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    nome: 'Lead Base',
    email: 'lead.base@conect360.com.br',
    telefone: '11999990002',
    empresa_nome: 'Empresa Beta',
    status: 'qualificado',
    origem: 'importacao',
    score: 80,
    observacoes: 'Lead com alto potencial',
    responsavel_id: '11111111-1111-4111-8111-111111111111',
    data_primeiro_contato: '2026-03-09T09:00:00.000Z',
    data_ultima_interacao: '2026-03-11T09:30:00.000Z',
    convertido_oportunidade_id: null,
    oportunidade_id: null,
    convertido_em: null,
    empresa_id: 'empresa-e2e-billing-1',
    created_at: '2026-03-09T08:00:00.000Z',
    updated_at: '2026-03-11T09:30:00.000Z',
  },
];

const toLeadResponse = (lead: LeadMock) => {
  const responsavel = RESPONSAVEIS_FIXTURE.find((item) => item.id === lead.responsavel_id);
  return {
    ...lead,
    responsavel: responsavel
      ? {
          id: responsavel.id,
          nome: responsavel.nome,
          username: responsavel.username,
          email: responsavel.email,
        }
      : null,
  };
};

const getOperacionais = (status: LeadStatus): boolean => {
  return status === 'novo' || status === 'contatado' || status === 'qualificado';
};

const getEstatisticas = (leads: LeadMock[]) => {
  const total = leads.length;
  const novos = leads.filter((lead) => lead.status === 'novo').length;
  const contatados = leads.filter((lead) => lead.status === 'contatado').length;
  const qualificados = leads.filter((lead) => lead.status === 'qualificado').length;
  const desqualificados = leads.filter((lead) => lead.status === 'desqualificado').length;
  const convertidos = leads.filter((lead) => lead.status === 'convertido').length;
  const taxaConversao = total > 0 ? (convertidos / total) * 100 : 0;
  const scoreMedio = total > 0 ? leads.reduce((acc, lead) => acc + lead.score, 0) / total : 0;

  return {
    total,
    novos,
    contatados,
    qualificados,
    desqualificados,
    convertidos,
    taxaConversao,
    scoreMedio,
    porOrigem: [],
    porResponsavel: [],
  };
};

const isApiRequest = (url: URL): boolean => {
  return url.port === '3001' || url.origin.includes('3001');
};

export async function installLeadsMocks(page: any) {
  const leadsStore: LeadMock[] = LEADS_FIXTURE.map((lead) => ({ ...lead }));
  const patchHistory: Array<{ id: string; payload: Record<string, unknown> }> = [];

  await page.route('**/users/profile', async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'user-e2e-billing-1',
          nome: 'Billing E2E User',
          email: 'admin@conect360.com.br',
          role: 'superadmin',
          roles: ['superadmin'],
          permissoes: [
            'dashboard.read',
            'crm.leads.read',
            'crm.leads.create',
            'crm.leads.update',
            'crm.leads.delete',
          ],
          permissions: [
            'dashboard.read',
            'crm.leads.read',
            'crm.leads.create',
            'crm.leads.update',
            'crm.leads.delete',
          ],
          empresa: {
            id: 'empresa-e2e-billing-1',
            nome: 'Empresa Billing E2E',
          },
        },
      }),
    });
  });

  await page.route(/\/users(\?.*)?$/, async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    if (request.method() !== 'GET') {
      await route.fallback();
      return;
    }

    const onlyActive = url.searchParams.get('ativo');
    const items =
      onlyActive === 'true'
        ? RESPONSAVEIS_FIXTURE.filter((responsavel) => responsavel.ativo)
        : RESPONSAVEIS_FIXTURE;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          items,
          total: items.length,
          pagina: 1,
          limite: items.length,
        },
      }),
    });
  });

  await page.route(/\/leads\/estatisticas(\?.*)?$/, async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(getEstatisticas(leadsStore)),
    });
  });

  await page.route(/\/leads\/[^/]+(\?.*)?$/, async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    const id = url.pathname.split('/').filter(Boolean).pop() || '';
    if (id === 'estatisticas') {
      await route.fallback();
      return;
    }

    const index = leadsStore.findIndex((lead) => lead.id === id);
    if (index < 0) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Lead nao encontrado' }),
      });
      return;
    }

    if (request.method() === 'PATCH') {
      const payload = (request.postDataJSON() || {}) as Record<string, unknown>;
      patchHistory.push({ id, payload });

      const lead = leadsStore[index];
      const now = '2026-03-12T15:30:00.000Z';

      if ('responsavel_id' in payload) {
        const value = payload.responsavel_id;
        lead.responsavel_id = value === null ? null : String(value || '').trim() || null;
      }

      if ('status' in payload && typeof payload.status === 'string') {
        lead.status = payload.status as LeadStatus;
      }

      if ('observacoes' in payload && typeof payload.observacoes === 'string') {
        lead.observacoes = payload.observacoes;
      }

      if (lead.status === 'contatado') {
        lead.data_ultima_interacao = now;
        lead.data_primeiro_contato = lead.data_primeiro_contato || now;
      }

      lead.updated_at = now;
      leadsStore[index] = lead;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(toLeadResponse(lead)),
      });
      return;
    }

    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(toLeadResponse(leadsStore[index])),
      });
      return;
    }

    await route.fallback();
  });

  await page.route(/\/leads(\?.*)?$/, async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    if (request.method() !== 'GET') {
      await route.fallback();
      return;
    }

    const status = (url.searchParams.get('status') || '').trim();
    const origem = (url.searchParams.get('origem') || '').trim();
    const dataInicio = (url.searchParams.get('dataInicio') || '').trim();
    const dataFim = (url.searchParams.get('dataFim') || '').trim();
    const pageNumber = Math.max(Number(url.searchParams.get('page') || '1') || 1, 1);
    const limit = Math.max(Number(url.searchParams.get('limit') || '12') || 12, 1);

    const filtered = leadsStore.filter((lead) => {
      const matchesStatus =
        !status ||
        (status === 'operacionais' ? getOperacionais(lead.status) : lead.status === status);
      const matchesOrigem = !origem || origem === 'todas' || lead.origem === origem;

      const leadDate = Date.parse(lead.created_at);
      const matchesDataInicio = !dataInicio || leadDate >= Date.parse(dataInicio);
      const matchesDataFim = !dataFim || leadDate <= Date.parse(dataFim);

      return matchesStatus && matchesOrigem && matchesDataInicio && matchesDataFim;
    });

    const start = (pageNumber - 1) * limit;
    const data = filtered.slice(start, start + limit).map((lead) => toLeadResponse(lead));
    const total = filtered.length;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data,
        total,
        page: pageNumber,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      }),
    });
  });

  return {
    getPatchHistory: () => patchHistory,
  };
}
