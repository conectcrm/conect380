import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Cliente, StatusCliente, TipoCliente } from './cliente.entity';
import { ClienteAnexo } from './cliente-anexo.entity';
import { Ticket, StatusTicket } from '../atendimento/entities/ticket.entity';
import { Proposta } from '../propostas/proposta.entity';
import { Contrato, StatusContrato } from '../contratos/entities/contrato.entity';
import { Fatura, StatusFatura } from '../faturamento/entities/fatura.entity';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces/common.interface';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';

type ClientesQueryParams = PaginationParams & {
  ids?: string[] | string;
};

type CreateClienteInput = CreateClienteDto & { empresaId: string };

type TicketResumoItem = {
  id: string;
  numero: number | null;
  status: StatusTicket;
  prioridade: string;
  assunto: string | null;
  atualizadoEm: string;
};

type ClienteTicketsResumo = {
  total: number;
  abertos: number;
  resolvidos: number;
  ultimoAtendimentoEm: string | null;
  tickets: TicketResumoItem[];
};

type PropostaResumoItem = {
  id: string;
  numero: string | null;
  titulo: string | null;
  status: string;
  valor: number;
  atualizadaEm: string;
};

type ClientePropostasResumo = {
  total: number;
  aprovadas: number;
  pendentes: number;
  rejeitadas: number;
  ultimoRegistroEm: string | null;
  propostas: PropostaResumoItem[];
};

type ContratoResumoItem = {
  id: number;
  numero: string;
  status: StatusContrato;
  tipo: string;
  valorTotal: number;
  dataInicio: string;
  dataFim: string;
  atualizadoEm: string;
};

type ClienteContratosResumo = {
  total: number;
  pendentes: number;
  assinados: number;
  encerrados: number;
  ultimoRegistroEm: string | null;
  contratos: ContratoResumoItem[];
};

type FaturaResumoItem = {
  id: number;
  numero: string;
  status: StatusFatura;
  valorTotal: number;
  valorPago: number;
  dataVencimento: string;
  atualizadoEm: string;
};

type ClienteFaturasResumo = {
  total: number;
  pagas: number;
  pendentes: number;
  vencidas: number;
  ultimoRegistroEm: string | null;
  faturas: FaturaResumoItem[];
};

@Injectable()
export class ClientesService {
  private statusColumnSupported: boolean | null = null;
  private avatarColumnSupported: boolean | null = null;
  private clienteAnexosTableSupported: boolean | null = null;
  private ultimoContatoColumnSupported: boolean | null = null;
  private proximoContatoColumnSupported: boolean | null = null;
  private tagsColumnSupported: boolean | null = null;

  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(ClienteAnexo)
    private clienteAnexoRepository: Repository<ClienteAnexo>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Proposta)
    private propostaRepository: Repository<Proposta>,
    @InjectRepository(Contrato)
    private contratoRepository: Repository<Contrato>,
    @InjectRepository(Fatura)
    private faturaRepository: Repository<Fatura>,
  ) {}

  async getTicketsResumo(clienteId: string, empresaId: string, limit = 5): Promise<ClienteTicketsResumo> {
    const limiteSeguro = Math.min(Math.max(Number(limit) || 5, 1), 20);

    const statusAbertos: StatusTicket[] = [
      StatusTicket.FILA,
      StatusTicket.EM_ATENDIMENTO,
      StatusTicket.ENVIO_ATIVO,
      StatusTicket.AGUARDANDO_CLIENTE,
      StatusTicket.AGUARDANDO_INTERNO,
    ];

    const statusResolvidos: StatusTicket[] = [StatusTicket.CONCLUIDO, StatusTicket.ENCERRADO];

    const [total, abertos, resolvidos, ticketsRecentes] = await Promise.all([
      this.ticketRepository.count({
        where: {
          empresaId,
          clienteId,
        },
      }),
      this.ticketRepository.count({
        where: {
          empresaId,
          clienteId,
          status: In(statusAbertos),
        },
      }),
      this.ticketRepository.count({
        where: {
          empresaId,
          clienteId,
          status: In(statusResolvidos),
        },
      }),
      this.ticketRepository.find({
        where: {
          empresaId,
          clienteId,
        },
        order: {
          updatedAt: 'DESC',
        },
        take: limiteSeguro,
      }),
    ]);

    const tickets = ticketsRecentes.map((ticket) => ({
      id: ticket.id,
      numero: ticket.numero ?? null,
      status: ticket.status,
      prioridade: ticket.prioridade,
      assunto: ticket.assunto ?? ticket.titulo ?? null,
      atualizadoEm: (ticket.updatedAt ?? ticket.createdAt).toISOString(),
    }));

    return {
      total,
      abertos,
      resolvidos,
      ultimoAtendimentoEm: tickets[0]?.atualizadoEm ?? null,
      tickets,
    };
  }

  async getPropostasResumo(
    clienteId: string,
    empresaId: string,
    limit = 5,
  ): Promise<ClientePropostasResumo> {
    const limiteSeguro = Math.min(Math.max(Number(limit) || 5, 1), 20);

    const statusAprovadas = [
      'aprovada',
      'contrato_gerado',
      'contrato_assinado',
      'fatura_criada',
      'aguardando_pagamento',
      'pago',
    ];
    const statusPendentes = ['rascunho', 'enviada', 'visualizada', 'negociacao'];
    const statusRejeitadas = ['rejeitada', 'expirada'];

    const baseWhere =
      "proposta.empresaId = :empresaId AND (proposta.cliente ->> 'id' = :clienteId OR proposta.cliente ->> 'clienteId' = :clienteId)";
    const baseParams = { empresaId, clienteId };

    const [total, aprovadas, pendentes, rejeitadas, propostasRecentes] = await Promise.all([
      this.propostaRepository
        .createQueryBuilder('proposta')
        .where(baseWhere, baseParams)
        .getCount(),
      this.propostaRepository
        .createQueryBuilder('proposta')
        .where(baseWhere, baseParams)
        .andWhere('LOWER(proposta.status) IN (:...statusAprovadas)', { statusAprovadas })
        .getCount(),
      this.propostaRepository
        .createQueryBuilder('proposta')
        .where(baseWhere, baseParams)
        .andWhere('LOWER(proposta.status) IN (:...statusPendentes)', { statusPendentes })
        .getCount(),
      this.propostaRepository
        .createQueryBuilder('proposta')
        .where(baseWhere, baseParams)
        .andWhere('LOWER(proposta.status) IN (:...statusRejeitadas)', { statusRejeitadas })
        .getCount(),
      this.propostaRepository
        .createQueryBuilder('proposta')
        .where(baseWhere, baseParams)
        .orderBy('proposta.atualizadaEm', 'DESC')
        .take(limiteSeguro)
        .getMany(),
    ]);

    const propostas = propostasRecentes.map((proposta) => ({
      id: proposta.id,
      numero: proposta.numero ?? null,
      titulo: proposta.titulo ?? null,
      status: proposta.status,
      valor: Number(proposta.total ?? proposta.valor ?? 0),
      atualizadaEm: (proposta.atualizadaEm ?? proposta.criadaEm).toISOString(),
    }));

    return {
      total,
      aprovadas,
      pendentes,
      rejeitadas,
      ultimoRegistroEm: propostas[0]?.atualizadaEm ?? null,
      propostas,
    };
  }

  async getContratosResumo(
    clienteId: string,
    empresaId: string,
    limit = 5,
  ): Promise<ClienteContratosResumo> {
    const limiteSeguro = Math.min(Math.max(Number(limit) || 5, 1), 20);

    const [total, pendentes, assinados, encerrados, contratosRecentes] = await Promise.all([
      this.contratoRepository.count({
        where: {
          empresa_id: empresaId,
          clienteId,
          ativo: true,
        },
      }),
      this.contratoRepository.count({
        where: {
          empresa_id: empresaId,
          clienteId,
          ativo: true,
          status: StatusContrato.AGUARDANDO_ASSINATURA,
        },
      }),
      this.contratoRepository.count({
        where: {
          empresa_id: empresaId,
          clienteId,
          ativo: true,
          status: StatusContrato.ASSINADO,
        },
      }),
      this.contratoRepository
        .createQueryBuilder('contrato')
        .where('contrato.empresa_id = :empresaId', { empresaId })
        .andWhere('contrato.clienteId = :clienteId', { clienteId })
        .andWhere('contrato.ativo = :ativo', { ativo: true })
        .andWhere('contrato.status IN (:...statusEncerrados)', {
          statusEncerrados: [StatusContrato.CANCELADO, StatusContrato.EXPIRADO],
        })
        .getCount(),
      this.contratoRepository.find({
        where: {
          empresa_id: empresaId,
          clienteId,
          ativo: true,
        },
        order: {
          updatedAt: 'DESC',
        },
        take: limiteSeguro,
      }),
    ]);

    const contratos = contratosRecentes.map((contrato) => ({
      id: contrato.id,
      numero: contrato.numero,
      status: contrato.status,
      tipo: contrato.tipo,
      valorTotal: Number(contrato.valorTotal || 0),
      dataInicio: contrato.dataInicio ? new Date(contrato.dataInicio).toISOString() : '',
      dataFim: contrato.dataFim ? new Date(contrato.dataFim).toISOString() : '',
      atualizadoEm: contrato.updatedAt.toISOString(),
    }));

    return {
      total,
      pendentes,
      assinados,
      encerrados,
      ultimoRegistroEm: contratos[0]?.atualizadoEm ?? null,
      contratos,
    };
  }

  async getFaturasResumo(
    clienteId: string,
    empresaId: string,
    limit = 5,
  ): Promise<ClienteFaturasResumo> {
    const limiteSeguro = Math.min(Math.max(Number(limit) || 5, 1), 20);

    const statusPendentes = [
      StatusFatura.PENDENTE,
      StatusFatura.ENVIADA,
      StatusFatura.PARCIALMENTE_PAGA,
    ];

    const [total, pagas, pendentes, vencidas, faturasRecentes] = await Promise.all([
      this.faturaRepository.count({
        where: {
          empresaId,
          clienteId,
          ativo: true,
        },
      }),
      this.faturaRepository.count({
        where: {
          empresaId,
          clienteId,
          ativo: true,
          status: StatusFatura.PAGA,
        },
      }),
      this.faturaRepository
        .createQueryBuilder('fatura')
        .where('fatura.empresa_id = :empresaId', { empresaId })
        .andWhere('fatura.clienteId = :clienteId', { clienteId })
        .andWhere('fatura.ativo = :ativo', { ativo: true })
        .andWhere('fatura.status IN (:...statusPendentes)', { statusPendentes })
        .getCount(),
      this.faturaRepository.count({
        where: {
          empresaId,
          clienteId,
          ativo: true,
          status: StatusFatura.VENCIDA,
        },
      }),
      this.faturaRepository.find({
        where: {
          empresaId,
          clienteId,
          ativo: true,
        },
        order: {
          updatedAt: 'DESC',
        },
        take: limiteSeguro,
      }),
    ]);

    const faturas = faturasRecentes.map((fatura) => ({
      id: fatura.id,
      numero: fatura.numero,
      status: fatura.status,
      valorTotal: Number(fatura.valorTotal || 0),
      valorPago: Number(fatura.valorPago || 0),
      dataVencimento: fatura.dataVencimento
        ? new Date(fatura.dataVencimento).toISOString()
        : '',
      atualizadoEm: (fatura.updatedAt ?? fatura.createdAt).toISOString(),
    }));

    return {
      total,
      pagas,
      pendentes,
      vencidas,
      ultimoRegistroEm: faturas[0]?.atualizadoEm ?? null,
      faturas,
    };
  }

  async create(clienteData: CreateClienteInput): Promise<Cliente> {
    const status = this.normalizeStatus(clienteData.status) ?? StatusCliente.LEAD;
    const ativo = clienteData.ativo ?? status !== StatusCliente.INATIVO;
    const avatarUrl = this.extractAvatarUrl(clienteData);
    const canPersistAvatar = avatarUrl !== undefined && (await this.hasAvatarColumn());

    const clientePayload: Partial<Cliente> = {
      nome: clienteData.nome,
      email: clienteData.email,
      telefone: clienteData.telefone,
      tipo: clienteData.tipo ?? TipoCliente.PESSOA_FISICA,
      documento: (clienteData as any).documento ?? (clienteData as any).cpf_cnpj,
      endereco: clienteData.endereco,
      cidade: clienteData.cidade,
      estado: clienteData.estado,
      cep: clienteData.cep,
      observacoes: clienteData.observacoes,
      empresaId: clienteData.empresaId,
      ativo,
    };

    if (canPersistAvatar) {
      clientePayload.avatar_url = avatarUrl ?? null;
    }

    const cliente = this.clienteRepository.create(clientePayload);

    const saved = await this.clienteRepository.save(cliente);

    if (await this.hasStatusColumn()) {
      await this.updateStatusColumn(saved.id, saved.empresaId, status);
    }

    await this.updateFollowupColumns(saved.id, saved.empresaId, {
      ultimo_contato: this.parseOptionalDate((clienteData as any).ultimo_contato),
      proximo_contato: this.parseOptionalDate((clienteData as any).proximo_contato),
    });

    await this.updateTagsColumn(
      saved.id,
      saved.empresaId,
      this.parseOptionalTags((clienteData as any).tags),
    );

    const reloaded = await this.findById(saved.id, saved.empresaId);
    if (reloaded) {
      return reloaded;
    }

    const fallback = { ...saved, status } as Cliente;
    if (avatarUrl !== undefined) {
      fallback.avatar_url = avatarUrl;
      fallback.avatar = avatarUrl ?? undefined;
      fallback.avatarUrl = avatarUrl ?? undefined;
    }
    return fallback;
  }

  async findAll(empresaId: string, params: PaginationParams): Promise<PaginatedResponse<Cliente>> {
    const page = this.toPositiveInt(params.page, 1);
    const limit = this.toPositiveInt(params.limit, 10);
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'DESC';
    const hasStatusColumn = await this.hasStatusColumn();

    const sortMap: Record<string, string> = {
      created_at: 'cliente.created_at',
      updated_at: 'cliente.updated_at',
      nome: 'cliente.nome',
      email: 'cliente.email',
      tipo: 'cliente.tipo',
      status: hasStatusColumn ? 'cliente.status' : 'cliente.ativo',
      ultimo_contato: 'cliente.ultimo_contato',
      proximo_contato: 'cliente.proximo_contato',
    };
    const sortColumn = sortMap[sortBy] ?? sortMap.created_at;
    const direction = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId });

    await this.applyFilters(queryBuilder, params);
    queryBuilder
      .orderBy(sortColumn, direction)
      .skip((page - 1) * limit)
      .take(limit);

    const [clientes, total] = await queryBuilder.getManyAndCount();
    const normalizedStatus = this.normalizeStatus(params.status as any);
    const data = await this.attachStatuses(clientes, normalizedStatus);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listForExport(empresaId: string, params: ClientesQueryParams): Promise<Cliente[]> {
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'DESC';
    const hasStatusColumn = await this.hasStatusColumn();

    const sortMap: Record<string, string> = {
      created_at: 'cliente.created_at',
      updated_at: 'cliente.updated_at',
      nome: 'cliente.nome',
      email: 'cliente.email',
      tipo: 'cliente.tipo',
      status: hasStatusColumn ? 'cliente.status' : 'cliente.ativo',
      ultimo_contato: 'cliente.ultimo_contato',
      proximo_contato: 'cliente.proximo_contato',
    };
    const sortColumn = sortMap[sortBy] ?? sortMap.created_at;
    const direction = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId });

    await this.applyFilters(queryBuilder, params);
    queryBuilder.orderBy(sortColumn, direction);

    const clientes = await queryBuilder.getMany();
    const normalizedStatus = this.normalizeStatus(params.status as any);
    return this.attachStatuses(clientes, normalizedStatus);
  }

  exportToCsv(clientes: Cliente[]): string {
    const headers = [
      'id',
      'nome',
      'email',
      'telefone',
      'tipo',
      'status',
      'documento',
      'cidade',
      'estado',
      'cep',
      'endereco',
      'ultimo_contato',
      'proximo_contato',
      'tags',
      'observacoes',
      'created_at',
      'updated_at',
    ];

    const rows = clientes.map((cliente) => [
      cliente.id,
      cliente.nome,
      cliente.email,
      cliente.telefone,
      cliente.tipo,
      cliente.status,
      cliente.documento,
      cliente.cidade,
      cliente.estado,
      cliente.cep,
      cliente.endereco,
      cliente.ultimo_contato ? new Date(cliente.ultimo_contato).toISOString() : '',
      cliente.proximo_contato ? new Date(cliente.proximo_contato).toISOString() : '',
      cliente.tags?.join(', ') ?? '',
      cliente.observacoes,
      cliente.created_at ? new Date(cliente.created_at).toISOString() : '',
      cliente.updated_at ? new Date(cliente.updated_at).toISOString() : '',
    ]);

    return [headers, ...rows]
      .map((line) => line.map((value) => this.escapeCsv(value)).join(','))
      .join('\n');
  }

  async findById(id: string, empresaId: string): Promise<Cliente | undefined> {
    const cliente = await this.clienteRepository.findOne({
      where: { id, empresaId },
    });

    if (!cliente) {
      return undefined;
    }

    const [withStatus] = await this.attachStatuses([cliente]);
    return withStatus;
  }

  async update(id: string, empresaId: string, updateData: UpdateClienteDto): Promise<Cliente> {
    const {
      status: _status,
      avatar: _avatar,
      avatarUrl: _avatarUrl,
      tags: _tags,
      ultimo_contato: _ultimoContato,
      proximo_contato: _proximoContato,
      ...rest
    } = updateData as any;

    const payload: Partial<Cliente> = { ...rest };

    if ((updateData as any).documento !== undefined || (updateData as any).cpf_cnpj !== undefined) {
      payload.documento = (updateData as any).documento ?? (updateData as any).cpf_cnpj;
    }

    const avatarUrl = this.extractAvatarUrl(updateData);
    if (avatarUrl !== undefined && (await this.hasAvatarColumn())) {
      payload.avatar_url = avatarUrl;
    } else {
      delete (payload as any).avatar_url;
    }

    const normalizedStatus = this.normalizeStatus((updateData as any).status);
    if (normalizedStatus) {
      payload.ativo = normalizedStatus !== StatusCliente.INATIVO;
    } else if (payload.ativo === false) {
      // Compatibilidade para clients antigos que só enviam ativo=false.
      (updateData as any).status = StatusCliente.INATIVO;
    }

    await this.clienteRepository.update({ id, empresaId }, payload);

    if (normalizedStatus && (await this.hasStatusColumn())) {
      await this.updateStatusColumn(id, empresaId, normalizedStatus);
    }

    await this.updateFollowupColumns(id, empresaId, {
      ultimo_contato: this.parseOptionalDate((updateData as any).ultimo_contato),
      proximo_contato: this.parseOptionalDate((updateData as any).proximo_contato),
    });

    await this.updateTagsColumn(id, empresaId, this.parseOptionalTags((updateData as any).tags));

    return this.findById(id, empresaId);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    await this.clienteRepository.update({ id, empresaId }, { ativo: false });

    if (await this.hasStatusColumn()) {
      await this.updateStatusColumn(id, empresaId, StatusCliente.INATIVO);
    }
  }

  async getByStatus(empresaId: string, status: StatusCliente): Promise<Cliente[]> {
    const normalizedStatus = this.normalizeStatus(status) ?? StatusCliente.LEAD;
    const ativo = normalizedStatus !== StatusCliente.INATIVO;

    const queryBuilder = this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId })
      .andWhere('cliente.ativo = :ativo', { ativo })
      .orderBy('cliente.updated_at', 'DESC');

    if (await this.hasStatusColumn()) {
      queryBuilder.andWhere('cliente.status = :status', { status: normalizedStatus });
    }

    const clientes = await queryBuilder.getMany();
    return this.attachStatuses(clientes, normalizedStatus);
  }

  async updateStatus(id: string, empresaId: string, status: StatusCliente): Promise<Cliente> {
    const normalizedStatus = this.normalizeStatus(status) ?? StatusCliente.LEAD;
    const ativo = normalizedStatus !== StatusCliente.INATIVO;

    await this.clienteRepository.update({ id, empresaId }, { ativo });

    if (await this.hasStatusColumn()) {
      await this.updateStatusColumn(id, empresaId, normalizedStatus);
    }

    return this.findById(id, empresaId);
  }

  async updateAvatar(id: string, empresaId: string, avatarUrl: string): Promise<Cliente> {
    if (!(await this.hasAvatarColumn())) {
      return this.findById(id, empresaId);
    }

    await this.clienteRepository.update({ id, empresaId }, { avatar_url: avatarUrl });
    return this.findById(id, empresaId);
  }

  async listAnexos(id: string, empresaId: string): Promise<ClienteAnexo[]> {
    if (!(await this.hasClienteAnexosTable())) {
      return [];
    }

    return this.clienteAnexoRepository.find({
      where: { clienteId: id, empresaId },
      order: { created_at: 'DESC' },
    });
  }

  async addAnexo(
    id: string,
    empresaId: string,
    anexoData: Pick<ClienteAnexo, 'nome' | 'tipo' | 'tamanho' | 'url'>,
  ): Promise<ClienteAnexo> {
    if (!(await this.hasClienteAnexosTable())) {
      throw new ServiceUnavailableException(
        'Anexos de cliente indisponiveis ate executar as migrations.',
      );
    }

    const anexo = this.clienteAnexoRepository.create({
      clienteId: id,
      empresaId,
      nome: anexoData.nome,
      tipo: anexoData.tipo,
      tamanho: anexoData.tamanho,
      url: anexoData.url,
    });

    return this.clienteAnexoRepository.save(anexo);
  }

  async removeAnexo(id: string, anexoId: string, empresaId: string): Promise<ClienteAnexo | null> {
    if (!(await this.hasClienteAnexosTable())) {
      throw new ServiceUnavailableException(
        'Anexos de cliente indisponiveis ate executar as migrations.',
      );
    }

    const anexo = await this.clienteAnexoRepository.findOne({
      where: { id: anexoId, clienteId: id, empresaId },
    });

    if (!anexo) {
      return null;
    }

    await this.clienteAnexoRepository.delete({ id: anexo.id });
    return anexo;
  }

  async getClientesProximoContato(empresaId: string): Promise<Cliente[]> {
    const queryBuilder = this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId })
      .andWhere('cliente.ativo = true');

    if (await this.hasProximoContatoColumn()) {
      queryBuilder
        .andWhere('cliente.proximo_contato IS NOT NULL')
        .orderBy('cliente.proximo_contato', 'ASC')
        .addOrderBy('cliente.updated_at', 'DESC');
    } else {
      queryBuilder.orderBy('cliente.updated_at', 'DESC');
    }

    const clientes = await queryBuilder.getMany();

    return this.attachStatuses(clientes);
  }

  async getEstatisticas(empresaId: string) {
    const totalClientes = await this.clienteRepository.count({
      where: { empresaId, ativo: true },
    });

    const inativos = await this.clienteRepository.count({
      where: { empresaId, ativo: false },
    });

    let ativos = totalClientes;
    let leads = 0;
    let prospects = 0;

    if (await this.hasStatusColumn()) {
      const [ativosCount, leadsCount, prospectsCount] = await Promise.all([
        this.countByStatus(empresaId, StatusCliente.CLIENTE),
        this.countByStatus(empresaId, StatusCliente.LEAD),
        this.countByStatus(empresaId, StatusCliente.PROSPECT),
      ]);

      ativos = ativosCount;
      leads = leadsCount;
      prospects = prospectsCount;
    }

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const novosClientesMes = await this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId })
      .andWhere('cliente.ativo = true')
      .andWhere('cliente.created_at >= :inicioMes', { inicioMes })
      .getCount();

    return {
      total: totalClientes,
      ativos,
      leads,
      prospects,
      inativos,
      totalClientes,
      clientesAtivos: ativos,
      novosClientesMes,
    };
  }

  private async applyFilters(
    queryBuilder: SelectQueryBuilder<Cliente>,
    params: ClientesQueryParams,
  ): Promise<void> {
    const normalizedStatus = this.normalizeStatus(params.status as any);
    const hasStatusColumn = await this.hasStatusColumn();

    if (normalizedStatus) {
      const ativo = normalizedStatus !== StatusCliente.INATIVO;
      queryBuilder.andWhere('cliente.ativo = :ativo', { ativo });

      if (hasStatusColumn) {
        queryBuilder.andWhere('cliente.status = :status', { status: normalizedStatus });
      }
    } else {
      queryBuilder.andWhere('cliente.ativo = true');
    }

    if (params.search) {
      queryBuilder.andWhere(
        '(cliente.nome ILIKE :search OR cliente.email ILIKE :search OR cliente.telefone ILIKE :search OR cliente.documento ILIKE :search)',
        {
          search: `%${params.search}%`,
        },
      );
    }

    if (params.tipo) {
      queryBuilder.andWhere('cliente.tipo = :tipo', { tipo: params.tipo });
    }

    const tag = this.normalizeTagFilter(params.tag);
    if (tag && (await this.hasTagsColumn())) {
      queryBuilder.andWhere(
        `
          EXISTS (
            SELECT 1
            FROM regexp_split_to_table(COALESCE(cliente.tags, ''), '\\s*,\\s*') AS tag_item
            WHERE LOWER(tag_item) = LOWER(:tag)
          )
        `,
        { tag },
      );
    }

    const followup = this.normalizeFollowup(params.followup);
    if (followup && (await this.hasProximoContatoColumn())) {
      queryBuilder.andWhere('cliente.proximo_contato IS NOT NULL');

      if (followup === 'vencido') {
        queryBuilder.andWhere('cliente.proximo_contato < CURRENT_DATE');
      } else {
        queryBuilder.andWhere('cliente.proximo_contato >= CURRENT_DATE');
      }
    }

    const ids = this.normalizeIds(params.ids);
    if (ids.length > 0) {
      queryBuilder.andWhere('cliente.id IN (:...ids)', { ids });
    }
  }

  private async attachStatuses(
    clientes: Cliente[],
    fallbackStatus?: StatusCliente,
  ): Promise<Cliente[]> {
    if (clientes.length === 0) {
      return clientes;
    }

    const hasStatusColumn = await this.hasStatusColumn();
    if (!hasStatusColumn) {
      clientes.forEach((cliente) => {
        cliente.status =
          fallbackStatus ?? (cliente.ativo ? StatusCliente.CLIENTE : StatusCliente.INATIVO);
      });
      const withAvatar = await this.attachAvatarFields(clientes);
      const withFollowup = await this.attachFollowupFields(withAvatar);
      return this.attachTagsFields(withFollowup);
    }

    const ids = clientes.map((cliente) => cliente.id);
    const rows: Array<{ id: string; status: StatusCliente }> = await this.clienteRepository.query(
      `
        SELECT id, status
        FROM clientes
        WHERE id = ANY($1::uuid[])
      `,
      [ids],
    );

    const statusById = new Map(rows.map((row) => [row.id, row.status]));

    clientes.forEach((cliente) => {
      cliente.status =
        statusById.get(cliente.id) ??
        fallbackStatus ??
        (cliente.ativo ? StatusCliente.CLIENTE : StatusCliente.INATIVO);
    });

    const withAvatar = await this.attachAvatarFields(clientes);
    const withFollowup = await this.attachFollowupFields(withAvatar);
    return this.attachTagsFields(withFollowup);
  }

  private async countByStatus(empresaId: string, status: StatusCliente): Promise<number> {
    const rows: Array<{ total: string }> = await this.clienteRepository.query(
      `
        SELECT COUNT(*)::text AS total
        FROM clientes
        WHERE empresa_id = $1
          AND status = $2
          AND ativo = $3
      `,
      [empresaId, status, status !== StatusCliente.INATIVO],
    );

    return Number(rows?.[0]?.total ?? 0);
  }

  private normalizeIds(ids?: string[] | string): string[] {
    if (!ids) {
      return [];
    }

    if (Array.isArray(ids)) {
      return ids.filter(Boolean);
    }

    return String(ids)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  private normalizeStatus(status?: string | StatusCliente): StatusCliente | undefined {
    if (!status) {
      return undefined;
    }

    const value = String(status) as StatusCliente;
    if (Object.values(StatusCliente).includes(value)) {
      return value;
    }

    return undefined;
  }

  private normalizeFollowup(value?: string): 'pendente' | 'vencido' | undefined {
    if (!value) {
      return undefined;
    }

    if (value === 'pendente' || value === 'vencido') {
      return value;
    }

    return undefined;
  }

  private normalizeTagFilter(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private parseOptionalTags(value: unknown): string[] | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => String(item).trim())
        .filter(Boolean);
      return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
    }

    const normalized = String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
  }

  private parseOptionalDate(value: unknown): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === '') {
      return null;
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed;
  }

  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private async hasStatusColumn(): Promise<boolean> {
    if (this.statusColumnSupported !== null) {
      return this.statusColumnSupported;
    }

    const result: Array<{ exists: boolean }> = await this.clienteRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clientes'
            AND column_name = 'status'
        ) AS "exists"
      `,
    );

    this.statusColumnSupported = Boolean(result?.[0]?.exists);
    return this.statusColumnSupported;
  }

  private async hasAvatarColumn(): Promise<boolean> {
    if (this.avatarColumnSupported !== null) {
      return this.avatarColumnSupported;
    }

    const result: Array<{ exists: boolean }> = await this.clienteRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clientes'
            AND column_name = 'avatar_url'
        ) AS "exists"
      `,
    );

    this.avatarColumnSupported = Boolean(result?.[0]?.exists);
    return this.avatarColumnSupported;
  }

  private async hasUltimoContatoColumn(): Promise<boolean> {
    if (this.ultimoContatoColumnSupported !== null) {
      return this.ultimoContatoColumnSupported;
    }

    const result: Array<{ exists: boolean }> = await this.clienteRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clientes'
            AND column_name = 'ultimo_contato'
        ) AS "exists"
      `,
    );

    this.ultimoContatoColumnSupported = Boolean(result?.[0]?.exists);
    return this.ultimoContatoColumnSupported;
  }

  private async hasProximoContatoColumn(): Promise<boolean> {
    if (this.proximoContatoColumnSupported !== null) {
      return this.proximoContatoColumnSupported;
    }

    const result: Array<{ exists: boolean }> = await this.clienteRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clientes'
            AND column_name = 'proximo_contato'
        ) AS "exists"
      `,
    );

    this.proximoContatoColumnSupported = Boolean(result?.[0]?.exists);
    return this.proximoContatoColumnSupported;
  }

  private async hasTagsColumn(): Promise<boolean> {
    if (this.tagsColumnSupported !== null) {
      return this.tagsColumnSupported;
    }

    const result: Array<{ exists: boolean }> = await this.clienteRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clientes'
            AND column_name = 'tags'
        ) AS "exists"
      `,
    );

    this.tagsColumnSupported = Boolean(result?.[0]?.exists);
    return this.tagsColumnSupported;
  }

  async isAnexosStorageAvailable(): Promise<boolean> {
    return this.hasClienteAnexosTable();
  }

  private async hasClienteAnexosTable(): Promise<boolean> {
    if (this.clienteAnexosTableSupported !== null) {
      return this.clienteAnexosTableSupported;
    }

    const result: Array<{ exists: boolean }> = await this.clienteRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'cliente_anexos'
        ) AS "exists"
      `,
    );

    this.clienteAnexosTableSupported = Boolean(result?.[0]?.exists);
    return this.clienteAnexosTableSupported;
  }

  private async attachAvatarFields(clientes: Cliente[]): Promise<Cliente[]> {
    if (clientes.length === 0) {
      return clientes;
    }

    if (!(await this.hasAvatarColumn())) {
      clientes.forEach((cliente) => {
        const avatar = this.extractAvatarUrl(cliente);
        cliente.avatar_url = avatar;
        cliente.avatar = avatar ?? undefined;
        cliente.avatarUrl = avatar ?? undefined;
      });
      return clientes;
    }

    const ids = clientes.map((cliente) => cliente.id);
    const rows: Array<{ id: string; avatar_url: string | null }> =
      await this.clienteRepository.query(
        `
        SELECT id, avatar_url
        FROM clientes
        WHERE id = ANY($1::uuid[])
      `,
        [ids],
      );

    const avatarById = new Map(rows.map((row) => [row.id, row.avatar_url]));

    clientes.forEach((cliente) => {
      const avatar = avatarById.get(cliente.id) ?? null;
      cliente.avatar_url = avatar;
      cliente.avatar = avatar ?? undefined;
      cliente.avatarUrl = avatar ?? undefined;
    });

    return clientes;
  }

  private async attachFollowupFields(clientes: Cliente[]): Promise<Cliente[]> {
    if (clientes.length === 0) {
      return clientes;
    }

    const [hasUltimoContatoColumn, hasProximoContatoColumn] = await Promise.all([
      this.hasUltimoContatoColumn(),
      this.hasProximoContatoColumn(),
    ]);

    if (!hasUltimoContatoColumn && !hasProximoContatoColumn) {
      clientes.forEach((cliente) => {
        cliente.ultimo_contato = undefined;
        cliente.proximo_contato = undefined;
      });
      return clientes;
    }

    const ids = clientes.map((cliente) => cliente.id);
    const rows: Array<{
      id: string;
      ultimo_contato?: Date | null;
      proximo_contato?: Date | null;
    }> = await this.clienteRepository.query(
      `
        SELECT id, ultimo_contato, proximo_contato
        FROM clientes
        WHERE id = ANY($1::uuid[])
      `,
      [ids],
    );

    const followupById = new Map(rows.map((row) => [row.id, row]));

    clientes.forEach((cliente) => {
      const followupData = followupById.get(cliente.id);
      cliente.ultimo_contato = hasUltimoContatoColumn
        ? ((followupData?.ultimo_contato as Date | null) ?? null)
        : undefined;
      cliente.proximo_contato = hasProximoContatoColumn
        ? ((followupData?.proximo_contato as Date | null) ?? null)
        : undefined;
    });

    return clientes;
  }

  private async attachTagsFields(clientes: Cliente[]): Promise<Cliente[]> {
    if (clientes.length === 0) {
      return clientes;
    }

    if (!(await this.hasTagsColumn())) {
      clientes.forEach((cliente) => {
        cliente.tags = undefined;
      });
      return clientes;
    }

    const ids = clientes.map((cliente) => cliente.id);
    const rows: Array<{ id: string; tags?: string | null }> = await this.clienteRepository.query(
      `
        SELECT id, tags
        FROM clientes
        WHERE id = ANY($1::uuid[])
      `,
      [ids],
    );

    const tagsById = new Map(rows.map((row) => [row.id, row.tags ?? null]));

    clientes.forEach((cliente) => {
      const rawTags = tagsById.get(cliente.id);
      if (!rawTags) {
        cliente.tags = [];
        return;
      }

      cliente.tags = rawTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    });

    return clientes;
  }

  private async updateFollowupColumns(
    id: string,
    empresaId: string,
    followupData: {
      ultimo_contato?: Date | null;
      proximo_contato?: Date | null;
    },
  ): Promise<void> {
    const [hasUltimoContatoColumn, hasProximoContatoColumn] = await Promise.all([
      this.hasUltimoContatoColumn(),
      this.hasProximoContatoColumn(),
    ]);

    const shouldUpdateUltimoContato = hasUltimoContatoColumn && followupData.ultimo_contato !== undefined;
    const shouldUpdateProximoContato = hasProximoContatoColumn && followupData.proximo_contato !== undefined;

    if (!shouldUpdateUltimoContato && !shouldUpdateProximoContato) {
      return;
    }

    const updateClauses: string[] = [];
    const values: Array<string | Date | null> = [];

    if (shouldUpdateUltimoContato) {
      updateClauses.push(`ultimo_contato = $${values.length + 1}`);
      values.push(followupData.ultimo_contato ?? null);
    }

    if (shouldUpdateProximoContato) {
      updateClauses.push(`proximo_contato = $${values.length + 1}`);
      values.push(followupData.proximo_contato ?? null);
    }

    values.push(id, empresaId);

    await this.clienteRepository.query(
      `
        UPDATE clientes
        SET ${updateClauses.join(', ')}
        WHERE id = $${values.length - 1}
          AND empresa_id = $${values.length}
      `,
      values,
    );
  }

  private async updateTagsColumn(
    id: string,
    empresaId: string,
    tags: string[] | null | undefined,
  ): Promise<void> {
    if (!(await this.hasTagsColumn()) || tags === undefined) {
      return;
    }

    const tagsValue = tags && tags.length > 0 ? tags.join(', ') : null;

    await this.clienteRepository.query(
      `
        UPDATE clientes
        SET tags = $1
        WHERE id = $2
          AND empresa_id = $3
      `,
      [tagsValue, id, empresaId],
    );
  }

  private extractAvatarUrl(value: unknown): string | null | undefined {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const typedValue = value as Record<string, unknown>;
    const avatar = typedValue.avatar_url ?? typedValue.avatarUrl ?? typedValue.avatar ?? undefined;

    if (avatar === undefined) {
      return undefined;
    }

    if (avatar === null) {
      return null;
    }

    const parsed = String(avatar).trim();
    return parsed.length > 0 ? parsed : null;
  }

  private async updateStatusColumn(
    id: string,
    empresaId: string,
    status: StatusCliente,
  ): Promise<void> {
    await this.clienteRepository.query(
      `
        UPDATE clientes
        SET status = $1
        WHERE id = $2
          AND empresa_id = $3
      `,
      [status, id, empresaId],
    );
  }

  private escapeCsv(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    const raw = String(value);
    const escaped = raw.replace(/"/g, '""');
    if (/[",\n\r]/.test(escaped)) {
      return `"${escaped}"`;
    }

    return escaped;
  }
}
