import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fatura, StatusFatura } from '../entities/fatura.entity';
import { ItemFatura } from '../entities/item-fatura.entity';
import {
  AmbienteDocumentoFiscal,
  AMBIENTES_DOCUMENTO_FISCAL,
  CancelarDocumentoFiscalDto,
  CriarRascunhoDocumentoFiscalDto,
  EmitirDocumentoFiscalDto,
  OperacaoDocumentoFiscal,
  TipoDocumentoFiscal,
  TIPOS_DOCUMENTO_FISCAL,
} from '../dto/documento-fiscal.dto';

const DOCUMENTOS_FISCAIS_SUPORTADOS = new Set<string>(TIPOS_DOCUMENTO_FISCAL);
const AMBIENTES_SUPORTADOS = new Set<string>(AMBIENTES_DOCUMENTO_FISCAL);
const DEFAULT_PROVIDER = 'fiscal_stub_local';

export type StatusDocumentoFiscal =
  | 'nao_iniciado'
  | 'rascunho'
  | 'pendente_emissao'
  | 'emitida'
  | 'erro'
  | 'cancelada';

interface EventoDocumentoFiscal {
  timestamp: string;
  acao: string;
  status: StatusDocumentoFiscal;
  mensagem?: string | null;
  usuarioId?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface DocumentoFiscalState {
  provider?: string;
  tipo?: TipoDocumentoFiscal;
  ambiente?: AmbienteDocumentoFiscal;
  status?: StatusDocumentoFiscal;
  numeroDocumento?: string | null;
  serie?: string | null;
  chaveAcesso?: string | null;
  protocolo?: string | null;
  loteId?: string | null;
  ultimaMensagem?: string | null;
  atualizadoEm?: string | null;
  atualizadoPor?: string | null;
  historico?: EventoDocumentoFiscal[];
  resumo?: {
    valorServicos: number;
    valorTributos: number;
    valorTotal: number;
  };
}

export interface DocumentoFiscalStatusResponse {
  faturaId: number;
  faturaNumero: string;
  tipo: TipoDocumentoFiscal | null;
  ambiente: AmbienteDocumentoFiscal;
  status: StatusDocumentoFiscal;
  provider: string | null;
  numeroDocumento: string | null;
  serie: string | null;
  chaveAcesso: string | null;
  protocolo: string | null;
  loteId: string | null;
  ultimaMensagem: string | null;
  atualizadoEm: string | null;
  historico: EventoDocumentoFiscal[];
  resumo: {
    valorServicos: number;
    valorTributos: number;
    valorTotal: number;
  };
}

@Injectable()
export class DocumentoFiscalService {
  constructor(
    @InjectRepository(Fatura)
    private readonly faturaRepository: Repository<Fatura>,
    @InjectRepository(ItemFatura)
    private readonly itemFaturaRepository: Repository<ItemFatura>,
  ) {}

  async criarRascunho(
    faturaId: number,
    empresaId: string,
    dto: CriarRascunhoDocumentoFiscalDto = {},
    userId?: string,
  ): Promise<DocumentoFiscalStatusResponse> {
    const fatura = await this.carregarFatura(faturaId, empresaId);
    const detalhes = this.toObject(fatura.detalhesTributarios);

    const tipoDocumento = this.normalizarTipoDocumento(
      dto.tipo || this.extrairTipoDocumentoDeDetalhes(detalhes) || 'nfse',
    );
    const ambiente = this.normalizarAmbiente(dto.ambiente);
    const resumo = this.montarResumoFinanceiro(fatura);

    const documentoAtual = this.toObject(detalhes.documento);
    const fiscalAtual = this.toObject(detalhes.fiscal) as Partial<DocumentoFiscalState>;

    const proximoFiscal: DocumentoFiscalState = {
      provider: String(fiscalAtual.provider || DEFAULT_PROVIDER),
      tipo: tipoDocumento,
      ambiente,
      status: 'rascunho',
      numeroDocumento: this.toNullableString(fiscalAtual.numeroDocumento || documentoAtual.numero),
      serie: this.toNullableString(fiscalAtual.serie || documentoAtual.serie),
      chaveAcesso: this.toNullableString(fiscalAtual.chaveAcesso || documentoAtual.chaveAcesso),
      protocolo: this.toNullableString(fiscalAtual.protocolo),
      loteId: this.toNullableString(fiscalAtual.loteId),
      ultimaMensagem:
        dto.observacoes?.trim() || 'Rascunho fiscal criado e pronto para emissao.',
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: userId || null,
      historico: this.adicionarHistorico(fiscalAtual.historico, {
        acao: 'rascunho_criado',
        status: 'rascunho',
        mensagem: dto.observacoes || 'Rascunho fiscal criado.',
        usuarioId: userId,
        metadata: {
          tipoDocumento,
          ambiente,
        },
      }),
      resumo,
    };

    const detalhesAtualizados: Record<string, unknown> = {
      ...detalhes,
      documento: {
        ...documentoAtual,
        tipo: tipoDocumento,
        numero: proximoFiscal.numeroDocumento,
        serie: proximoFiscal.serie,
        chaveAcesso: proximoFiscal.chaveAcesso,
      },
      fiscal: proximoFiscal,
    };

    fatura.detalhesTributarios = detalhesAtualizados;
    await this.faturaRepository.save(fatura);

    return this.montarRespostaStatus(fatura, detalhesAtualizados);
  }

  async emitir(
    faturaId: number,
    empresaId: string,
    dto: EmitirDocumentoFiscalDto = {},
    userId?: string,
  ): Promise<DocumentoFiscalStatusResponse> {
    const fatura = await this.carregarFatura(faturaId, empresaId);
    if (fatura.status === StatusFatura.CANCELADA) {
      throw new BadRequestException('Nao e possivel emitir documento fiscal para fatura cancelada.');
    }

    const detalhes = this.toObject(fatura.detalhesTributarios);
    const documentoAtual = this.toObject(detalhes.documento);
    const fiscalAtual = this.toObject(detalhes.fiscal) as Partial<DocumentoFiscalState>;

    const tipoDocumento = this.normalizarTipoDocumento(
      dto.tipo || this.extrairTipoDocumentoDeDetalhes(detalhes) || fiscalAtual.tipo,
    );
    const ambiente = this.normalizarAmbiente(dto.ambiente || fiscalAtual.ambiente);

    if (fiscalAtual.status === 'emitida' && !dto.forcarReemissao) {
      return this.montarRespostaStatus(fatura, detalhes);
    }

    const numeroDocumento =
      this.toNullableString(documentoAtual.numero) || this.gerarNumeroDocumento(fatura, tipoDocumento);
    const serie = this.toNullableString(documentoAtual.serie) || (tipoDocumento === 'nfe' ? '1' : 'A1');
    const chaveAcesso = this.toNullableString(documentoAtual.chaveAcesso) || this.gerarChaveAcesso();
    const protocolo = this.gerarProtocolo();
    const resumo = this.montarResumoFinanceiro(fatura);

    const proximoFiscal: DocumentoFiscalState = {
      provider: String(fiscalAtual.provider || DEFAULT_PROVIDER),
      tipo: tipoDocumento,
      ambiente,
      status: 'emitida',
      numeroDocumento,
      serie,
      chaveAcesso,
      protocolo,
      loteId: this.toNullableString(fiscalAtual.loteId) || this.gerarLoteId(fatura),
      ultimaMensagem: dto.observacoes?.trim() || 'Documento fiscal emitido com sucesso.',
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: userId || null,
      historico: this.adicionarHistorico(fiscalAtual.historico, {
        acao: dto.forcarReemissao ? 'documento_reemitido' : 'documento_emitido',
        status: 'emitida',
        mensagem: dto.observacoes || 'Documento fiscal emitido.',
        usuarioId: userId,
        metadata: {
          tipoDocumento,
          ambiente,
          numeroDocumento,
          protocolo,
        },
      }),
      resumo,
    };

    const detalhesAtualizados: Record<string, unknown> = {
      ...detalhes,
      documento: {
        ...documentoAtual,
        tipo: tipoDocumento,
        numero: numeroDocumento,
        serie,
        chaveAcesso,
      },
      fiscal: proximoFiscal,
    };

    fatura.detalhesTributarios = detalhesAtualizados;
    await this.faturaRepository.save(fatura);

    return this.montarRespostaStatus(fatura, detalhesAtualizados);
  }

  async cancelarOuInutilizar(
    faturaId: number,
    empresaId: string,
    dto: CancelarDocumentoFiscalDto,
    userId?: string,
  ): Promise<DocumentoFiscalStatusResponse> {
    const fatura = await this.carregarFatura(faturaId, empresaId);
    const detalhes = this.toObject(fatura.detalhesTributarios);
    const documentoAtual = this.toObject(detalhes.documento);
    const fiscalAtual = this.toObject(detalhes.fiscal) as Partial<DocumentoFiscalState>;
    const statusAtual = this.normalizarStatusFiscal(fiscalAtual.status);
    const tipoOperacao = this.normalizarOperacao(dto.tipoOperacao);
    const motivo = String(dto.motivo || '').trim();

    if (!motivo) {
      throw new BadRequestException('Informe o motivo do cancelamento/inutilizacao.');
    }

    if (statusAtual === 'cancelada') {
      throw new BadRequestException(
        'Documento fiscal ja esta cancelado/inutilizado para esta fatura.',
      );
    }

    if (tipoOperacao === 'cancelar' && statusAtual !== 'emitida') {
      throw new BadRequestException(
        'Documento fiscal ainda nao foi emitido. Utilize a inutilizacao da numeracao.',
      );
    }

    if (tipoOperacao === 'inutilizar' && statusAtual === 'emitida') {
      throw new BadRequestException(
        'Documento fiscal emitido deve ser cancelado, e nao inutilizado.',
      );
    }

    const tipoDocumento = this.normalizarTipoDocumento(
      fiscalAtual.tipo || this.extrairTipoDocumentoDeDetalhes(detalhes) || 'nfse',
    );
    const ambiente = this.normalizarAmbiente(dto.ambiente || fiscalAtual.ambiente);
    const manterIdentificacao = tipoOperacao === 'cancelar';
    const numeroDocumento = manterIdentificacao
      ? this.toNullableString(fiscalAtual.numeroDocumento || documentoAtual.numero)
      : null;
    const serie = manterIdentificacao
      ? this.toNullableString(fiscalAtual.serie || documentoAtual.serie)
      : null;
    const chaveAcesso = manterIdentificacao
      ? this.toNullableString(fiscalAtual.chaveAcesso || documentoAtual.chaveAcesso)
      : null;

    const resumo = this.montarResumoFinanceiro(fatura);
    const proximoFiscal: DocumentoFiscalState = {
      provider: String(fiscalAtual.provider || DEFAULT_PROVIDER),
      tipo: tipoDocumento,
      ambiente,
      status: 'cancelada',
      numeroDocumento,
      serie,
      chaveAcesso,
      protocolo: this.toNullableString(fiscalAtual.protocolo),
      loteId: this.toNullableString(fiscalAtual.loteId),
      ultimaMensagem: motivo,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: userId || null,
      historico: this.adicionarHistorico(fiscalAtual.historico, {
        acao: tipoOperacao === 'cancelar' ? 'documento_cancelado' : 'numeracao_inutilizada',
        status: 'cancelada',
        mensagem: motivo,
        usuarioId: userId,
        metadata: {
          operacao: tipoOperacao,
          tipoDocumento,
          ambiente,
          numeroDocumento: numeroDocumento || undefined,
        },
      }),
      resumo,
    };

    const detalhesAtualizados: Record<string, unknown> = {
      ...detalhes,
      documento: {
        ...documentoAtual,
        tipo: tipoDocumento,
        numero: numeroDocumento,
        serie,
        chaveAcesso,
      },
      fiscal: proximoFiscal,
    };

    fatura.detalhesTributarios = detalhesAtualizados;
    await this.faturaRepository.save(fatura);

    return this.montarRespostaStatus(fatura, detalhesAtualizados);
  }

  async consultarStatus(
    faturaId: number,
    empresaId: string,
  ): Promise<DocumentoFiscalStatusResponse> {
    const fatura = await this.carregarFatura(faturaId, empresaId);
    return this.montarRespostaStatus(fatura, this.toObject(fatura.detalhesTributarios));
  }

  private async carregarFatura(faturaId: number, empresaId: string): Promise<Fatura> {
    const fatura = await this.faturaRepository.findOne({
      where: {
        id: faturaId,
        empresaId,
        ativo: true,
      },
      relations: ['itens'],
    });

    if (!fatura) {
      throw new NotFoundException('Fatura nao encontrada.');
    }

    if (!Array.isArray(fatura.itens) || fatura.itens.length === 0) {
      fatura.itens = await this.itemFaturaRepository.find({
        where: { faturaId: fatura.id },
      });
    }

    return fatura;
  }

  private montarRespostaStatus(
    fatura: Fatura,
    detalhesTributarios: Record<string, unknown>,
  ): DocumentoFiscalStatusResponse {
    const documento = this.toObject(detalhesTributarios.documento);
    const fiscal = this.toObject(detalhesTributarios.fiscal) as Partial<DocumentoFiscalState>;
    const tipoDocumento = this.normalizarTipoDocumentoOptional(
      fiscal.tipo || this.toNullableString(documento.tipo),
    );
    const ambiente = this.normalizarAmbiente(fiscal.ambiente);
    const resumo =
      fiscal.resumo && typeof fiscal.resumo === 'object'
        ? {
            valorServicos: this.roundMoney((fiscal.resumo as Record<string, unknown>).valorServicos),
            valorTributos: this.roundMoney((fiscal.resumo as Record<string, unknown>).valorTributos),
            valorTotal: this.roundMoney((fiscal.resumo as Record<string, unknown>).valorTotal),
          }
        : this.montarResumoFinanceiro(fatura);

    return {
      faturaId: fatura.id,
      faturaNumero: String(fatura.numero || ''),
      tipo: tipoDocumento,
      ambiente,
      status: this.normalizarStatusFiscal(fiscal.status),
      provider: this.toNullableString(fiscal.provider),
      numeroDocumento: this.toNullableString(fiscal.numeroDocumento || documento.numero),
      serie: this.toNullableString(fiscal.serie || documento.serie),
      chaveAcesso: this.toNullableString(fiscal.chaveAcesso || documento.chaveAcesso),
      protocolo: this.toNullableString(fiscal.protocolo),
      loteId: this.toNullableString(fiscal.loteId),
      ultimaMensagem: this.toNullableString(fiscal.ultimaMensagem),
      atualizadoEm: this.toNullableString(fiscal.atualizadoEm),
      historico: this.normalizarHistorico(fiscal.historico),
      resumo,
    };
  }

  private extrairTipoDocumentoDeDetalhes(
    detalhesTributarios: Record<string, unknown>,
  ): TipoDocumentoFiscal | null {
    const documento = this.toObject(detalhesTributarios.documento);
    return this.normalizarTipoDocumentoOptional(this.toNullableString(documento.tipo));
  }

  private montarResumoFinanceiro(fatura: Fatura): {
    valorServicos: number;
    valorTributos: number;
    valorTotal: number;
  } {
    const itens = Array.isArray(fatura.itens) ? fatura.itens : [];
    const valorServicos = this.roundMoney(
      itens.reduce((acc, item) => acc + this.toNumber(item?.valorTotal), 0),
    );
    const valorTributos = this.roundMoney(fatura.valorImpostos);
    const valorTotal = this.roundMoney(fatura.valorTotal);

    return { valorServicos, valorTributos, valorTotal };
  }

  private gerarNumeroDocumento(fatura: Fatura, tipo: TipoDocumentoFiscal): string {
    const prefixo = tipo === 'nfe' ? 'NFE' : 'NFSE';
    const ano = new Date().getFullYear();
    return `${prefixo}-${ano}-${String(fatura.id).padStart(6, '0')}`;
  }

  private gerarChaveAcesso(): string {
    const base = `${Date.now()}${Math.floor(Math.random() * 1_000_000_000)}`;
    return base.slice(0, 44).padEnd(44, '0');
  }

  private gerarProtocolo(): string {
    return `PRT-${Date.now()}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;
  }

  private gerarLoteId(fatura: Fatura): string {
    return `LOT-${fatura.id}-${Date.now()}`;
  }

  private adicionarHistorico(
    historicoAtual: unknown,
    evento: {
      acao: string;
      status: StatusDocumentoFiscal;
      mensagem?: string;
      usuarioId?: string;
      metadata?: Record<string, unknown>;
    },
  ): EventoDocumentoFiscal[] {
    const historico = this.normalizarHistorico(historicoAtual);
    historico.push({
      timestamp: new Date().toISOString(),
      acao: evento.acao,
      status: evento.status,
      mensagem: evento.mensagem || null,
      usuarioId: evento.usuarioId || null,
      metadata: evento.metadata || null,
    });

    return historico.slice(-80);
  }

  private normalizarHistorico(historicoAtual: unknown): EventoDocumentoFiscal[] {
    if (!Array.isArray(historicoAtual)) {
      return [];
    }

    return historicoAtual
      .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      .map((item) => {
        const evento = item as Record<string, unknown>;
        return {
          timestamp: String(evento.timestamp || new Date().toISOString()),
          acao: String(evento.acao || 'atualizacao'),
          status: this.normalizarStatusFiscal(evento.status),
          mensagem: this.toNullableString(evento.mensagem),
          usuarioId: this.toNullableString(evento.usuarioId),
          metadata:
            evento.metadata && typeof evento.metadata === 'object' && !Array.isArray(evento.metadata)
              ? (evento.metadata as Record<string, unknown>)
              : null,
        };
      });
  }

  private normalizarStatusFiscal(value: unknown): StatusDocumentoFiscal {
    const status = String(value || '').trim().toLowerCase();
    const validos: StatusDocumentoFiscal[] = [
      'nao_iniciado',
      'rascunho',
      'pendente_emissao',
      'emitida',
      'erro',
      'cancelada',
    ];

    return validos.includes(status as StatusDocumentoFiscal)
      ? (status as StatusDocumentoFiscal)
      : 'nao_iniciado';
  }

  private normalizarOperacao(value: unknown): OperacaoDocumentoFiscal {
    const operacao = String(value || 'cancelar')
      .trim()
      .toLowerCase();
    return operacao === 'inutilizar' ? 'inutilizar' : 'cancelar';
  }

  private normalizarTipoDocumento(value: unknown): TipoDocumentoFiscal {
    const tipo = this.normalizarTipoDocumentoOptional(value);
    if (!tipo) {
      throw new BadRequestException('Tipo de documento fiscal invalido. Use nfse ou nfe.');
    }
    return tipo;
  }

  private normalizarTipoDocumentoOptional(value: unknown): TipoDocumentoFiscal | null {
    const tipo = String(value || '')
      .trim()
      .toLowerCase();
    if (!tipo) {
      return null;
    }
    return DOCUMENTOS_FISCAIS_SUPORTADOS.has(tipo) ? (tipo as TipoDocumentoFiscal) : null;
  }

  private normalizarAmbiente(value: unknown): AmbienteDocumentoFiscal {
    const ambiente = String(value || '')
      .trim()
      .toLowerCase();
    if (AMBIENTES_SUPORTADOS.has(ambiente)) {
      return ambiente as AmbienteDocumentoFiscal;
    }
    return 'homologacao';
  }

  private toObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private toNullableString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private roundMoney(value: unknown): number {
    const amount = this.toNumber(value);
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }
}
