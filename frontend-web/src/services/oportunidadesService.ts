import { api } from './api';
import {
  Oportunidade,
  NovaOportunidade,
  AtualizarOportunidade,
  Atividade,
  NovaAtividade,
  FiltrosOportunidade,
  EstatisticasOportunidades,
  DadosKanban,
  EstagioOportunidade,
  LifecycleFeatureFlagDecision,
  LifecycleStatusOportunidade,
  LifecycleViewOportunidade,
  OportunidadeHistoricoEstagioItem,
  OportunidadeAtividadeResumo,
  StaleDealsResult,
  StalePolicyDecision,
} from '../types/oportunidades/index';

class OportunidadesService {
  private readonly basePath = '/oportunidades';

  private getUrl(path: string = ''): string {
    return `${this.basePath}${path}`;
  }

  private sanitizeString(value?: string | null): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private normalizeListParams(
    filtros?: Partial<FiltrosOportunidade> & {
      lifecycle_status?: LifecycleStatusOportunidade | '';
      lifecycle_view?: LifecycleViewOportunidade | '';
      include_deleted?: boolean;
    },
  ): Record<string, unknown> | undefined {
    if (!filtros) return undefined;

    const params: Record<string, unknown> = { ...filtros };

    if (filtros.dataInicio instanceof Date) {
      params.dataInicio = filtros.dataInicio.toISOString();
    }

    if (filtros.dataFim instanceof Date) {
      params.dataFim = filtros.dataFim.toISOString();
    }

    if (typeof filtros.include_deleted === 'boolean') {
      params.include_deleted = filtros.include_deleted;
    }

    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    return params;
  }

  private preparePayload(
    data: Partial<Omit<NovaOportunidade, 'dataFechamentoEsperado'>> & {
      dataFechamentoEsperado?: string | null;
    },
  ) {
    const cleanedResponsavel = this.sanitizeString(data.responsavel_id);

    if (!cleanedResponsavel) {
      throw new Error(
        'Não foi possível identificar o responsável pela oportunidade. Recarregue a página e tente novamente.',
      );
    }

    return {
      titulo: data.titulo,
      descricao: this.sanitizeString(data.descricao) ?? undefined,
      valor: data.valor,
      probabilidade: data.probabilidade,
      estagio: data.estagio,
      prioridade: data.prioridade,
      origem: data.origem,
      tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
      dataFechamentoEsperado: data.dataFechamentoEsperado || undefined,
      responsavel_id: cleanedResponsavel,
      cliente_id: this.sanitizeString(data.cliente_id),
      nomeContato: this.sanitizeString(data.nomeContato),
      emailContato: this.sanitizeString(data.emailContato),
      telefoneContato: this.sanitizeString(data.telefoneContato),
      empresaContato: this.sanitizeString(data.empresaContato),
      observacoes: this.sanitizeString(data.observacoes),
    };
  }

  // CRUD Oportunidades
  async listarOportunidades(filtros?: Partial<FiltrosOportunidade>): Promise<Oportunidade[]> {
    const response = await api.get(this.getUrl(), {
      params: this.normalizeListParams(filtros),
    });
    return response.data.map((oportunidade: any) => this.formatarOportunidade(oportunidade));
  }

  async obterOportunidade(id: number): Promise<Oportunidade> {
    const response = await api.get(this.getUrl(`/${id}`));
    return this.formatarOportunidade(response.data);
  }

  async criarOportunidade(oportunidade: NovaOportunidade): Promise<Oportunidade> {
    const cliente_id = oportunidade.cliente_id ?? null;
    const dataFechamento = this.serializeDate(oportunidade.dataFechamentoEsperado);

    // ✅ Interface já usa snake_case - enviar direto (com limpeza de tags vazias)
    const dadosBackend = this.preparePayload({
      ...oportunidade,
      cliente_id,
      dataFechamentoEsperado: dataFechamento,
    });

    const response = await api.post(this.getUrl(), dadosBackend);
    return this.formatarOportunidade(response.data);
  }

  async atualizarOportunidade(oportunidade: AtualizarOportunidade): Promise<Oportunidade> {
    const { id, ...dados } = oportunidade;
    const dataFechamento = this.serializeDate(dados.dataFechamentoEsperado);

    // ✅ Interface já usa snake_case - enviar direto (com limpeza de tags vazias)
    const dadosBackend = this.preparePayload({
      ...dados,
      dataFechamentoEsperado: dataFechamento,
      responsavel_id: dados.responsavel_id || (oportunidade as any).responsavel?.id || '',
    });

    const response = await api.patch(this.getUrl(`/${id}`), dadosBackend);
    return this.formatarOportunidade(response.data);
  }

  async excluirOportunidade(id: number): Promise<void> {
    await api.delete(this.getUrl(`/${id}`));
  }

  async excluirOportunidadePermanente(id: number): Promise<void> {
    await api.delete(this.getUrl(`/${id}/permanente`));
  }

  async arquivarOportunidade(
    id: number,
    payload?: { motivo?: string; comentario?: string },
  ): Promise<Oportunidade> {
    const response = await api.post(this.getUrl(`/${id}/arquivar`), payload || {});
    return this.formatarOportunidade(response.data);
  }

  async restaurarOportunidade(
    id: number,
    payload?: { motivo?: string; comentario?: string },
  ): Promise<Oportunidade> {
    const response = await api.post(this.getUrl(`/${id}/restaurar`), payload || {});
    return this.formatarOportunidade(response.data);
  }

  async reabrirOportunidade(
    id: number,
    payload?: { motivo?: string; comentario?: string },
  ): Promise<Oportunidade> {
    const response = await api.post(this.getUrl(`/${id}/reabrir`), payload || {});
    return this.formatarOportunidade(response.data);
  }

  async obterLifecycleFeatureFlag(): Promise<LifecycleFeatureFlagDecision> {
    const response = await api.get(this.getUrl('/lifecycle/feature-flag'));
    return response.data;
  }

  async obterStalePolicy(): Promise<StalePolicyDecision> {
    const response = await api.get(this.getUrl('/lifecycle/stale-policy'));
    return response.data;
  }

  async atualizarStalePolicy(payload: {
    enabled?: boolean;
    thresholdDays?: number;
    autoArchiveEnabled?: boolean;
    autoArchiveAfterDays?: number;
  }): Promise<StalePolicyDecision> {
    const response = await api.patch(this.getUrl('/lifecycle/stale-policy'), payload);
    return response.data;
  }

  async listarOportunidadesParadas(params?: {
    thresholdDays?: number;
    limit?: number;
  }): Promise<StaleDealsResult> {
    const response = await api.get(this.getUrl('/stale'), {
      params: {
        threshold_days: params?.thresholdDays,
        limit: params?.limit,
      },
    });

    return {
      ...response.data,
      stale: (response.data?.stale || []).map((oportunidade: any) =>
        this.formatarOportunidade(oportunidade),
      ),
    };
  }

  async executarAutoArquivamentoStale(params?: {
    dryRun?: boolean;
  }): Promise<{
    enabled: boolean;
    autoArchiveEnabled: boolean;
    thresholdDays: number;
    totalCandidates: number;
    archivedCount: number;
    dryRun: boolean;
    trigger: 'manual' | 'scheduler';
    archivedIds: string[];
    failed: Array<{ id: string; reason: string }>;
    generatedAt: string;
  }> {
    const response = await api.post(this.getUrl('/stale/auto-archive/run'), null, {
      params: {
        dry_run: params?.dryRun ? 'true' : undefined,
      },
    });
    return response.data;
  }

  async moverOportunidade(id: number, novoEstagio: EstagioOportunidade): Promise<Oportunidade> {
    const response = await api.patch(this.getUrl(`/${id}/estagio`), { estagio: novoEstagio });
    return this.formatarOportunidade(response.data);
  }

  // ✅ Atualizar estágio com motivo de perda (quando PERDIDO)
  async atualizarEstagio(
    id: number,
    dados: {
      estagio: EstagioOportunidade;
      motivoPerda?: string;
      motivoPerdaDetalhes?: string;
      concorrenteNome?: string;
      dataRevisao?: string;
    },
  ): Promise<Oportunidade> {
    const response = await api.patch(this.getUrl(`/${id}/estagio`), dados);
    return this.formatarOportunidade(response.data);
  }

  async gerarProposta(
    oportunidadeId: number,
  ): Promise<{ success: boolean; message: string; proposta: any }> {
    const response = await api.post(this.getUrl(`/${oportunidadeId}/gerar-proposta`));
    return response.data;
  }

  // Atividades
  async listarAtividades(oportunidadeId: number): Promise<Atividade[]> {
    const response = await api.get(this.getUrl(`/${oportunidadeId}/atividades`));
    return response.data;
  }

  async listarHistoricoEstagios(
    oportunidadeId: number,
    limit = 50,
  ): Promise<OportunidadeHistoricoEstagioItem[]> {
    const response = await api.get(this.getUrl(`/${oportunidadeId}/historico-estagios`), {
      params: { limit },
    });
    return response.data;
  }

  async obterResumoAtividadesComerciais(params?: {
    periodStart?: string;
    periodEnd?: string;
    vendedorId?: string;
    limit?: number;
  }): Promise<OportunidadeAtividadeResumo> {
    const response = await api.get(this.getUrl('/atividades/resumo-gerencial'), {
      params,
    });
    return response.data;
  }

  async criarAtividade(atividade: NovaAtividade): Promise<Atividade> {
    const response = await api.post(
      this.getUrl(`/${atividade.oportunidadeId}/atividades`),
      atividade,
    );
    return response.data;
  }

  async excluirAtividade(oportunidadeId: number, atividadeId: number): Promise<void> {
    await api.delete(this.getUrl(`/${oportunidadeId}/atividades/${atividadeId}`));
  }

  // Estatísticas e relatórios
  async obterEstatisticas(
    filtros?: Partial<FiltrosOportunidade>,
  ): Promise<EstatisticasOportunidades> {
    const response = await api.get(this.getUrl('/metricas'), {
      params: this.normalizeListParams(filtros),
    });
    return response.data;
  }

  async obterDadosKanban(filtros?: Partial<FiltrosOportunidade>): Promise<DadosKanban> {
    const response = await api.get(this.getUrl('/pipeline'), {
      params: this.normalizeListParams(filtros),
    });

    // Converter formato do backend para o formato esperado pelo frontend
    const stages = response.data.stages || {};
    const estagios = Object.values(stages).map((stage: any) => ({
      estagio: stage.id,
      nome: stage.title,
      cor: stage.color,
      quantidade: stage.opportunities?.length || 0,
      valor:
        stage.opportunities?.reduce(
          (total: number, opp: any) => total + parseFloat(opp.valor || 0),
          0,
        ) || 0,
      oportunidades: stage.opportunities?.map((opp: any) => this.formatarOportunidade(opp)) || [],
    }));

    return {
      estagios,
      totalValor: response.data.totalValue || 0,
      totalOportunidades: response.data.totalOpportunities || 0,
    };
  }

  async obterResponsaveis(): Promise<Array<{ id: string; nome: string; email: string }>> {
    try {
      const response = await api.get('/usuarios', { params: { limite: 200, ativo: true } });
      const data = Array.isArray(response.data) ? response.data : response.data?.usuarios || [];

      return data.map((item: any) => ({
        id: String(item.id ?? ''),
        nome: item.nome ?? item.name ?? 'Usuario',
        email: item.email ?? '',
      }));
    } catch (error) {
      console.warn('Nao foi possivel carregar responsaveis para filtros de oportunidades.', error);
      return [];
    }
  }

  async obterSugestoesTags(): Promise<string[]> {
    try {
      const response = await api.get(this.getUrl('/tags/sugestoes'));
      const data = response.data?.tags ?? response.data ?? [];
      return Array.isArray(data) ? data.filter((tag) => typeof tag === 'string') : [];
    } catch (error) {
      console.warn('Nao foi possivel carregar sugestoes de tags para filtros de oportunidades.', error);
      return [];
    }
  }
  // Utilitarios
  private formatarOportunidade(oportunidade: any): Oportunidade {
    const createdAt = oportunidade.createdAt ? new Date(oportunidade.createdAt) : new Date();
    const updatedAt = oportunidade.updatedAt ? new Date(oportunidade.updatedAt) : createdAt;
    const lifecycleStatus: LifecycleStatusOportunidade =
      oportunidade.lifecycle_status ||
      (oportunidade.estagio === EstagioOportunidade.GANHO
        ? LifecycleStatusOportunidade.WON
        : oportunidade.estagio === EstagioOportunidade.PERDIDO
          ? LifecycleStatusOportunidade.LOST
          : LifecycleStatusOportunidade.OPEN);

    return {
      id: oportunidade.id,
      titulo: oportunidade.titulo,
      descricao: oportunidade.descricao,
      valor: parseFloat(oportunidade.valor), // Converter string para number
      probabilidade: oportunidade.probabilidade,
      estagio: oportunidade.estagio,
      prioridade: oportunidade.prioridade,
      origem: oportunidade.origem,
      tags: oportunidade.tags || [],
      dataFechamentoEsperado: oportunidade.dataFechamentoEsperado
        ? new Date(oportunidade.dataFechamentoEsperado)
        : undefined,
      dataFechamentoReal: oportunidade.dataFechamentoReal
        ? new Date(oportunidade.dataFechamentoReal)
        : undefined,

      // Responsável (obrigatório)
      responsavel: oportunidade.responsavel
        ? {
            id: oportunidade.responsavel.id,
            nome: oportunidade.responsavel.nome,
            email: oportunidade.responsavel.email,
            avatar: oportunidade.responsavel.avatar_url,
          }
        : {
            id: oportunidade.responsavel_id || '',
            nome: 'Não informado',
            email: '',
            avatar: undefined,
          },

      // Cliente (opcional)
      cliente: oportunidade.cliente
        ? {
            id: oportunidade.cliente.id,
            nome: oportunidade.cliente.nome,
            email: oportunidade.cliente.email,
            telefone: oportunidade.cliente.telefone,
            empresa: oportunidade.cliente.empresa,
          }
        : undefined,

      // Informações de contato direto
      nomeContato: oportunidade.nomeContato,
      emailContato: oportunidade.emailContato,
      telefoneContato: oportunidade.telefoneContato,
      empresaContato: oportunidade.empresaContato,
      observacoes: oportunidade.observacoes,
      criadoEm: oportunidade.criadoEm ?? createdAt,
      atualizadoEm: oportunidade.atualizadoEm ?? updatedAt,

      // Atividades
      atividades: oportunidade.atividades || [],

      // Metadados
      createdAt,
      updatedAt,

      // Campos calculados
      valorFormatado: this.formatarMoeda(oportunidade.valor ? parseFloat(oportunidade.valor) : 0),
      diasNoEstagio: this.calcularDiasNoEstagio(oportunidade.updatedAt),
      ultimaAtividade: oportunidade.ultimaAtividade
        ? new Date(oportunidade.ultimaAtividade)
        : undefined,
      tempoNoEstagio: this.formatarTempoNoEstagio(oportunidade.updatedAt),
      probabilidadeVisual: this.classificarProbabilidade(oportunidade.probabilidade),
      lifecycle_status: lifecycleStatus,
      archived_at: oportunidade.archived_at ? new Date(oportunidade.archived_at) : null,
      archived_by: oportunidade.archived_by ?? null,
      deleted_at: oportunidade.deleted_at ? new Date(oportunidade.deleted_at) : null,
      deleted_by: oportunidade.deleted_by ?? null,
      reopened_at: oportunidade.reopened_at ? new Date(oportunidade.reopened_at) : null,
      reopened_by: oportunidade.reopened_by ?? null,
      is_stale: Boolean(oportunidade.is_stale),
      stale_days:
        Number.isFinite(Number(oportunidade.stale_days)) && Number(oportunidade.stale_days) >= 0
          ? Number(oportunidade.stale_days)
          : undefined,
      last_interaction_at: oportunidade.last_interaction_at
        ? new Date(oportunidade.last_interaction_at)
        : null,
      stale_since: oportunidade.stale_since ? new Date(oportunidade.stale_since) : null,
      proposta_principal_id: oportunidade.proposta_principal_id ?? null,
      propostaPrincipal: oportunidade.propostaPrincipal
        ? {
            id: String(oportunidade.propostaPrincipal.id || ''),
            numero: oportunidade.propostaPrincipal.numero || '',
            titulo: oportunidade.propostaPrincipal.titulo || '',
            status: oportunidade.propostaPrincipal.status || 'rascunho',
            sugerePerda: Boolean(oportunidade.propostaPrincipal.sugerePerda),
          }
        : undefined,
    };
  }

  private serializeDate(value?: Date | string | null): string | null {
    if (!value) {
      return null;
    }

    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  private formatarMoeda(valor: number): string {
    // Verificar se o valor é válido
    if (isNaN(valor) || valor === null || valor === undefined) {
      valor = 0;
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  private calcularDiasNoEstagio(dataAtualizacao: string): number {
    const agora = new Date();
    const dataAtualizacaoDate = new Date(dataAtualizacao);
    const diffTime = Math.abs(agora.getTime() - dataAtualizacaoDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private formatarTempoNoEstagio(dataAtualizacao: string): string {
    const dias = this.calcularDiasNoEstagio(dataAtualizacao);

    if (dias === 0) return 'Hoje';
    if (dias === 1) return '1 dia';
    if (dias < 7) return `${dias} dias`;
    if (dias < 30) return `${Math.floor(dias / 7)} semana${Math.floor(dias / 7) > 1 ? 's' : ''}`;
    if (dias < 365) return `${Math.floor(dias / 30)} mês${Math.floor(dias / 30) > 1 ? 'es' : ''}`;

    return `${Math.floor(dias / 365)} ano${Math.floor(dias / 365) > 1 ? 's' : ''}`;
  }

  private classificarProbabilidade(probabilidade: number): 'baixa' | 'media' | 'alta' {
    if (probabilidade < 30) return 'baixa';
    if (probabilidade < 70) return 'media';
    return 'alta';
  }
}

export const oportunidadesService = new OportunidadesService();
