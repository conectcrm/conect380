import { Injectable, Logger, HttpException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { RedmineConfig } from '../entities/redmine-config.entity';
import { RedmineIntegration, StatusSincronizacao } from '../entities/redmine-integration.entity';
import { Demanda } from '../entities/demanda.entity';

type TipoDemanda = Demanda['tipo'];
type StatusDemanda = Demanda['status'];
type PrioridadeDemanda = Demanda['prioridade'];

interface RedmineIssue {
  id: number;
  project_id: number;
  tracker_id: number;
  status_id: number;
  priority_id: number;
  subject: string;
  description: string;
  assigned_to_id?: number;
  due_date?: string;
  done_ratio?: number;
  custom_fields?: Array<{ id: number; value: string }>;
  created_on: string;
  updated_on: string;
  closed_on?: string;
}

@Injectable()
export class RedmineService {
  private readonly logger = new Logger(RedmineService.name);
  private redmineClients: Map<string, AxiosInstance> = new Map();

  constructor(
    @InjectRepository(RedmineConfig)
    private readonly configRepository: Repository<RedmineConfig>,
    @InjectRepository(RedmineIntegration)
    private readonly integrationRepository: Repository<RedmineIntegration>,
    @InjectRepository(Demanda)
    private readonly demandaRepository: Repository<Demanda>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  /**
   * Obter configuração Redmine da empresa
   */
  async getConfig(empresaId: string): Promise<RedmineConfig | null> {
    return await this.configRepository.findOne({
      where: { empresaId, ativo: true },
    });
  }

  /**
   * Obter cliente HTTP Redmine para empresa
   */
  private async getRedmineClient(empresaId: string): Promise<AxiosInstance> {
    if (this.redmineClients.has(empresaId)) {
      return this.redmineClients.get(empresaId);
    }

    const config = await this.getConfig(empresaId);
    if (!config) {
      throw new HttpException('Redmine não configurado para esta empresa', 400);
    }

    const client = axios.create({
      baseURL: config.redmineUrl,
      headers: {
        'X-Redmine-API-Key': config.redmineApiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.redmineClients.set(empresaId, client);
    return client;
  }

  /**
   * Limpar cache do cliente (usar após atualizar config)
   */
  clearClientCache(empresaId: string) {
    this.redmineClients.delete(empresaId);
  }

  /**
   * Mapear tipo de demanda para tracker ID
   */
  private mapTipoToTracker(tipo: TipoDemanda, config: RedmineConfig): number {
    const customMapping = config.mapeamentoTrackers?.[tipo];
    if (customMapping) return customMapping;

    // Mapeamento padrão
    const defaultMapping: Partial<Record<TipoDemanda, number>> = {
      tecnica: 1, // Bug
      suporte: 3, // Support
      comercial: 2, // Feature
      financeira: 4, // Task
      reclamacao: 3, // Support
      solicitacao: 2, // Feature
      outros: 4, // Task
    };

    return defaultMapping[tipo] ?? 4;
  }

  /**
   * Mapear status de demanda para status ID Redmine
   */
  private mapStatusToRedmine(status: StatusDemanda, config: RedmineConfig): number {
    const customMapping = config.mapeamentoStatus?.[status];
    if (customMapping) return customMapping;

    const defaultMapping: Partial<Record<StatusDemanda, number>> = {
      aberta: 1, // New
      em_andamento: 2, // In Progress
      aguardando: 4, // Feedback
      concluida: 5, // Closed
      cancelada: 6, // Rejected
    };

    return defaultMapping[status] ?? 1;
  }

  /**
   * Mapear prioridade de demanda para priority ID Redmine
   */
  private mapPrioridadeToRedmine(prioridade: PrioridadeDemanda, config: RedmineConfig): number {
    const customMapping = config.mapeamentoPrioridade?.[prioridade];
    if (customMapping) return customMapping;

    const defaultMapping: Partial<Record<PrioridadeDemanda, number>> = {
      baixa: 1, // Low
      media: 2, // Normal
      alta: 3, // High
      urgente: 4, // Urgent
    };

    return defaultMapping[prioridade] ?? 2;
  }

  /**
   * Mapear status Redmine para status demanda
   */
  private mapRedmineStatusToStatus(statusId: number): StatusDemanda {
    const mapping: Partial<Record<number, StatusDemanda>> = {
      1: 'aberta', // New
      2: 'em_andamento', // In Progress
      3: 'em_andamento', // Resolved (ainda não fechado)
      4: 'aguardando', // Feedback
      5: 'concluida', // Closed
      6: 'cancelada', // Rejected
    };

    return mapping[statusId] ?? 'aberta';
  }

  /**
   * CRIAR issue no Redmine a partir de demanda
   */
  async criarIssueParaDemanda(demandaId: string, empresaId?: string): Promise<RedmineIntegration> {
    const demanda = await this.demandaRepository.findOne({
      where: { id: demandaId, ...(empresaId ? { empresaId } : {}) },
      relations: ['responsavel', 'autor'],
    });

    if (!demanda) {
      throw new NotFoundException('Demanda não encontrada');
    }

    // Verificar se já existe integração
    const existente = await this.integrationRepository.findOne({
      where: { demandaId, ...(empresaId ? { empresaId } : {}) },
    });

    if (existente && existente.redmineIssueId > 0) {
      throw new HttpException('Demanda já possui issue no Redmine', 400);
    }

    const config = await this.getConfig(demanda.empresaId);
    if (!config || !config.ativo) {
      throw new HttpException('Integração Redmine não ativa', 400);
    }

    const client = await this.getRedmineClient(demanda.empresaId);

    try {
      // Montar payload Redmine
      const issuePayload = {
        issue: {
          project_id: config.redmineProjectId,
          tracker_id: this.mapTipoToTracker(demanda.tipo, config),
          status_id: this.mapStatusToRedmine(demanda.status, config),
          priority_id: this.mapPrioridadeToRedmine(demanda.prioridade, config),
          subject: demanda.titulo,
          description: this.montarDescricao(demanda),
          due_date: demanda.dataVencimento
            ? demanda.dataVencimento.toISOString().split('T')[0]
            : undefined,
          custom_fields: [
            {
              id: config.redmineCustomFieldId,
              value: demanda.id,
            },
          ],
        },
      };

      // Criar issue no Redmine
      const response = await client.post('/issues.json', issuePayload);
      const createdIssue: RedmineIssue = response.data.issue;

      this.logger.log(`Issue ${createdIssue.id} criada no Redmine para demanda ${demanda.id}`);

      // Salvar integração
      const integration =
        existente ||
        this.integrationRepository.create({
          demandaId: demanda.id,
          empresaId: demanda.empresaId,
          redmineUrl: config.redmineUrl,
          redmineProjectId: config.redmineProjectId,
        });

      integration.redmineIssueId = createdIssue.id;
      integration.statusSincronizacao = StatusSincronizacao.SINCRONIZADO;
      integration.ultimaSincronizacao = new Date();
      integration.erroSincronizacao = null;
      integration.metadados = {
        tracker_id: createdIssue.tracker_id,
        status_id: createdIssue.status_id,
        priority_id: createdIssue.priority_id,
        done_ratio: createdIssue.done_ratio,
        updated_on: createdIssue.updated_on,
      };

      return await this.integrationRepository.save(integration);
    } catch (error) {
      this.logger.error(`Erro ao criar issue no Redmine: ${error.message}`, error.stack);

      // Salvar erro na integração
      const integration =
        existente ||
        this.integrationRepository.create({
          demandaId: demanda.id,
          empresaId: demanda.empresaId,
          redmineUrl: config.redmineUrl,
          redmineIssueId: 0,
          redmineProjectId: config.redmineProjectId,
        });

      integration.statusSincronizacao = StatusSincronizacao.ERRO;
      integration.erroSincronizacao = error.message;

      await this.integrationRepository.save(integration);

      throw new HttpException(`Erro ao criar issue no Redmine: ${error.message}`, 500);
    }
  }

  /**
   * ATUALIZAR issue no Redmine quando demanda mudar
   */
  async atualizarIssueRedmine(demandaId: string, empresaId?: string): Promise<void> {
    const integration = await this.integrationRepository.findOne({
      where: { demandaId, ...(empresaId ? { empresaId } : {}) },
      relations: ['demanda'],
    });

    if (!integration || !integration.redmineIssueId) {
      this.logger.warn(`Tentativa de atualizar issue inexistente para demanda ${demandaId}`);
      return;
    }

    const demanda = integration.demanda;
    const config = await this.getConfig(demanda.empresaId);
    const client = await this.getRedmineClient(demanda.empresaId);

    try {
      const issuePayload = {
        issue: {
          status_id: this.mapStatusToRedmine(demanda.status, config),
          priority_id: this.mapPrioridadeToRedmine(demanda.prioridade, config),
          subject: demanda.titulo,
          description: this.montarDescricao(demanda),
          due_date: demanda.dataVencimento
            ? demanda.dataVencimento.toISOString().split('T')[0]
            : undefined,
        },
      };

      await client.put(`/issues/${integration.redmineIssueId}.json`, issuePayload);

      integration.statusSincronizacao = StatusSincronizacao.SINCRONIZADO;
      integration.ultimaSincronizacao = new Date();
      integration.erroSincronizacao = null;

      await this.integrationRepository.save(integration);

      this.logger.log(`Issue ${integration.redmineIssueId} atualizada no Redmine`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar issue Redmine: ${error.message}`, error.stack);

      integration.statusSincronizacao = StatusSincronizacao.ERRO;
      integration.erroSincronizacao = error.message;
      await this.integrationRepository.save(integration);

      throw new HttpException(`Erro ao atualizar issue Redmine: ${error.message}`, 500);
    }
  }

  /**
   * SINCRONIZAR status do Redmine para demanda (bidirecional)
   * Obs: agendamento automático removido (build) — chamar via endpoint/job externo.
   */
  async sincronizarDeRedmineCron() {
    this.logger.log('Iniciando sincronização bidirecional com Redmine');

    const empresas = await this.empresaRepository.find({
      where: { ativo: true },
      select: { id: true } as any,
    });

    for (const empresa of empresas) {
      try {
        await runWithTenant(empresa.id, async () => {
          await this.sincronizarDeRedmine(empresa.id);
        });
      } catch (error) {
        this.logger.error(`Erro ao sincronizar empresa ${empresa.id}: ${error.message}`);
      }
    }
  }

  /**
   * SINCRONIZAR empresa específica
   */
  async sincronizarDeRedmine(empresaId: string): Promise<void> {
    const config = await this.getConfig(empresaId);
    if (!config || !config.sincronizacaoBidirecional) {
      return;
    }

    const integrations = await this.integrationRepository.find({
      where: { empresaId },
      relations: ['demanda'],
    });

    const client = await this.getRedmineClient(empresaId);

    for (const integration of integrations) {
      try {
        // Buscar issue no Redmine
        const response = await client.get(`/issues/${integration.redmineIssueId}.json`);
        const issue: RedmineIssue = response.data.issue;

        // Verificar se mudou (comparar updated_on)
        if (
          integration.metadados?.updated_on &&
          integration.metadados.updated_on === issue.updated_on
        ) {
          continue; // Sem mudanças
        }

        // Verificar se status mudou
        const statusMudou = integration.metadados?.status_id !== issue.status_id;
        const prioridadeMudou = integration.metadados?.priority_id !== issue.priority_id;

        if (!statusMudou && !prioridadeMudou) {
          // Atualizar metadados sem tocar na demanda
          integration.metadados = {
            ...integration.metadados,
            updated_on: issue.updated_on,
          };
          await this.integrationRepository.save(integration);
          continue;
        }

        // Atualizar demanda
        const demanda = integration.demanda;
        const novoStatus = this.mapRedmineStatusToStatus(issue.status_id);

        if (demanda.status !== novoStatus) {
          demanda.status = novoStatus;

          if (
            issue.closed_on &&
            !demanda.dataConclusao &&
            novoStatus === 'concluida'
          ) {
            demanda.dataConclusao = new Date(issue.closed_on);
          }

          await this.demandaRepository.save(demanda);

          this.logger.log(
            `Demanda ${demanda.id} sincronizada: ${demanda.status} (issue ${issue.id})`,
          );
        }

        // Atualizar metadados da integração
        integration.metadados = {
          tracker_id: issue.tracker_id,
          status_id: issue.status_id,
          priority_id: issue.priority_id,
          done_ratio: issue.done_ratio,
          updated_on: issue.updated_on,
        };
        integration.ultimaSincronizacao = new Date();
        integration.statusSincronizacao = StatusSincronizacao.SINCRONIZADO;

        await this.integrationRepository.save(integration);
      } catch (error) {
        this.logger.error(
          `Erro ao sincronizar issue ${integration.redmineIssueId}: ${error.message}`,
        );

        integration.statusSincronizacao = StatusSincronizacao.ERRO;
        integration.erroSincronizacao = error.message;
        await this.integrationRepository.save(integration);
      }
    }
  }

  /**
   * Montar descrição da issue com contexto ConectCRM
   */
  private montarDescricao(demanda: Demanda): string {
    let descricao = demanda.descricao || '';

    descricao += '\n\n---\n';
    descricao += `**ConectCRM**\n`;
    descricao += `- ID: ${demanda.id}\n`;
    descricao += `- Tipo: ${demanda.tipo}\n`;
    descricao += `- Contato: ${demanda.contatoTelefone || 'N/A'}\n`;
    descricao += `- Ticket Origem: ${demanda.ticketId || 'N/A'}\n`;
    descricao += `- Criado em: ${demanda.createdAt.toISOString()}\n`;

    return descricao;
  }

  /**
   * Buscar link da issue no Redmine
   */
  async getLinkIssue(demandaId: string, empresaId?: string): Promise<string | null> {
    const integration = await this.integrationRepository.findOne({
      where: { demandaId, ...(empresaId ? { empresaId } : {}) },
    });

    if (!integration || !integration.redmineIssueId) {
      return null;
    }

    return `${integration.redmineUrl}/issues/${integration.redmineIssueId}`;
  }

  /**
   * Buscar integração da demanda
   */
  async getIntegration(demandaId: string, empresaId?: string): Promise<RedmineIntegration | null> {
    return await this.integrationRepository.findOne({
      where: { demandaId, ...(empresaId ? { empresaId } : {}) },
    });
  }

  /**
   * Testar conexão com Redmine
   */
  async testarConexao(empresaId: string): Promise<boolean> {
    try {
      const client = await this.getRedmineClient(empresaId);
      await client.get('/projects.json?limit=1');
      return true;
    } catch (error) {
      this.logger.error(`Erro ao testar conexão Redmine: ${error.message}`, error.stack);
      return false;
    }
  }
}
