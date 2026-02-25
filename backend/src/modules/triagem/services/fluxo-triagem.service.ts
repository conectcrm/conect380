// @ts-nocheck
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FluxoTriagem } from '../entities/fluxo-triagem.entity';
import { CreateFluxoDto, UpdateFluxoDto, PublicarFluxoDto } from '../dto';
import { validarFluxoParaPublicacao } from '../utils/loop-detector.util';

@Injectable()
export class FluxoTriagemService {
  private readonly logger = new Logger(FluxoTriagemService.name);

  constructor(
    @InjectRepository(FluxoTriagem)
    private readonly fluxoRepository: Repository<FluxoTriagem>,
  ) {}

  /**
   * Criar novo fluxo
   */
  async create(empresaId: string, dto: CreateFluxoDto): Promise<FluxoTriagem> {
    const fluxo = this.fluxoRepository.create({
      empresaId,
      nome: dto.nome,
      descricao: dto.descricao,
      codigo: dto.codigo,
      tipo: dto.tipo,
      canais: dto.canais,
      palavrasGatilho: dto.palavrasGatilho || [],
      horarioAtivo: dto.horarioAtivo,
      prioridade: dto.prioridade || 0,
      estrutura: dto.estrutura,
      permiteVoltar: dto.permiteVoltar ?? true,
      permiteSair: dto.permiteSair ?? true,
      salvarHistorico: dto.salvarHistorico ?? true,
      tentarEntenderTextoLivre: dto.tentarEntenderTextoLivre ?? false,
      ativo: dto.ativo ?? true,
      publicado: false,
      versao: 1,
    });

    const saved = await this.fluxoRepository.save(fluxo);
    this.logger.log(`Fluxo criado: ${saved.id} - ${saved.nome}`);
    return saved;
  }

  /**
   * Listar fluxos com filtros
   */
  async findAll(empresaId: string, filtros?: any): Promise<FluxoTriagem[]> {
    const query = this.fluxoRepository
      .createQueryBuilder('fluxo')
      .where('fluxo.empresaId = :empresaId', { empresaId });

    if (filtros?.ativo !== undefined) {
      query.andWhere('fluxo.ativo = :ativo', { ativo: filtros.ativo });
    }

    if (filtros?.publicado !== undefined) {
      query.andWhere('fluxo.publicado = :publicado', { publicado: filtros.publicado });
    }

    if (filtros?.tipo) {
      query.andWhere('fluxo.tipo = :tipo', { tipo: filtros.tipo });
    }

    if (filtros?.canal) {
      query.andWhere(':canal = ANY(fluxo.canais)', { canal: filtros.canal });
    }

    query.orderBy('fluxo.prioridade', 'DESC');
    query.addOrderBy('fluxo.createdAt', 'DESC');

    return query.getMany();
  }

  /**
   * Buscar fluxo por ID
   */
  async findOne(empresaId: string, id: string): Promise<FluxoTriagem> {
    const fluxo = await this.fluxoRepository.findOne({
      where: { id, empresaId },
    });

    if (!fluxo) {
      throw new NotFoundException(`Fluxo ${id} não encontrado`);
    }

    return fluxo;
  }

  /**
   * Buscar fluxos por canal
   */
  async findByCanal(empresaId: string, canal: string): Promise<FluxoTriagem[]> {
    return this.fluxoRepository
      .createQueryBuilder('fluxo')
      .where('fluxo.empresaId = :empresaId', { empresaId })
      .andWhere(':canal = ANY(fluxo.canais)', { canal })
      .andWhere('fluxo.ativo = true')
      .andWhere('fluxo.publicado = true')
      .orderBy('fluxo.prioridade', 'DESC')
      .getMany();
  }

  /**
   * Buscar fluxo padrão para um canal
   * Retorna o fluxo com maior prioridade publicado para o canal
   */
  async findFluxoPadrao(empresaId: string, canal: string): Promise<FluxoTriagem | null> {
    const fluxo = await this.fluxoRepository
      .createQueryBuilder('fluxo')
      .where('fluxo.empresaId = :empresaId', { empresaId })
      .andWhere(':canal = ANY(fluxo.canais)', { canal })
      .andWhere('fluxo.ativo = true')
      .andWhere('fluxo.publicado = true')
      .orderBy('fluxo.prioridade', 'DESC')
      .addOrderBy('fluxo.createdAt', 'DESC')
      .getOne();

    return fluxo || null;
  }

  /**
   * Atualizar fluxo
   */
  async update(empresaId: string, id: string, dto: UpdateFluxoDto): Promise<FluxoTriagem> {
    this.logger.log(`🔍 [UPDATE] Iniciando atualização do fluxo ${id}`);
    this.logger.log(
      `[UPDATE] DTO recebido (resumo): ${JSON.stringify({
        keys: dto ? Object.keys(dto) : [],
        nome: dto?.nome ? String(dto.nome).slice(0, 80) : null,
        publicado: (dto as any)?.publicado ?? null,
        hasEstrutura: Boolean((dto as any)?.estrutura),
        estruturaTipo: Array.isArray((dto as any)?.estrutura)
          ? 'array'
          : typeof (dto as any)?.estrutura,
      })}`,
    );

    const fluxo = await this.findOne(empresaId, id);
    this.logger.log(`🔍 [UPDATE] Fluxo encontrado: ${fluxo.nome}, publicado: ${fluxo.publicado}`);

    // Se está publicado, não pode alterar estrutura
    if (fluxo.publicado && dto.estrutura) {
      this.logger.error(`❌ [UPDATE] Tentativa de alterar estrutura de fluxo publicado`);
      throw new BadRequestException(
        'Não é possível alterar a estrutura de um fluxo publicado. Despublique primeiro ou crie uma nova versão.',
      );
    }

    Object.assign(fluxo, dto);

    if (dto.estrutura) {
      fluxo.estrutura = dto.estrutura;
    }

    const updated = await this.fluxoRepository.save(fluxo);
    this.logger.log(`✅ [UPDATE] Fluxo atualizado: ${updated.id} - ${updated.nome}`);
    return updated;
  }

  /**
   * Deletar fluxo (soft delete)
   */
  async remove(empresaId: string, id: string): Promise<void> {
    const fluxo = await this.findOne(empresaId, id);

    // Se está publicado, não pode deletar
    if (fluxo.publicado) {
      throw new BadRequestException(
        'Não é possível deletar um fluxo publicado. Despublique primeiro.',
      );
    }

    await this.fluxoRepository.remove(fluxo);
    this.logger.log(`Fluxo deletado: ${id}`);
  }

  /**
   * Publicar fluxo
   */
  async publicar(
    empresaId: string,
    id: string,
    dto: PublicarFluxoDto,
    usuarioId: string,
  ): Promise<FluxoTriagem> {
    const fluxo = await this.findOne(empresaId, id);

    if (fluxo.publicado) {
      throw new BadRequestException('Fluxo já está publicado');
    }

    // Validar estrutura antes de publicar
    this.validarEstrutura(fluxo.estrutura);

    // 🔍 Validar se há loops infinitos
    try {
      validarFluxoParaPublicacao(fluxo.estrutura);
    } catch (error: any) {
      this.logger.error(`❌ Tentativa de publicar fluxo com loop: ${id}`, error.message);
      throw new BadRequestException(error.message);
    }

    // 📦 Salvar versão antes de publicar
    fluxo.salvarVersao(usuarioId, 'Versão publicada');

    fluxo.publicado = true;
    fluxo.publishedAt = new Date();

    // Ativar fluxo automaticamente ao publicar, a menos que explicitamente desativado
    const deveAtivar = dto.ativo ?? true;
    fluxo.ativo = deveAtivar;

    if (dto.definirComoPadrao) {
      const { max } = await this.fluxoRepository
        .createQueryBuilder('fluxo')
        .select('COALESCE(MAX(fluxo.prioridade), 0)', 'max')
        .where('fluxo.empresaId = :empresaId', { empresaId })
        .getRawOne<{ max: string | null }>();

      const prioridadeAtual = Number(max) || 0;
      fluxo.prioridade = prioridadeAtual + 1;
    }

    if (dto.criarNovaVersao) {
      fluxo.versao += 1;
    }

    const updated = await this.fluxoRepository.save(fluxo);
    this.logger.log(`Fluxo publicado: ${updated.id} - v${updated.versao}`);
    return updated;
  }

  /**
   * Despublicar fluxo
   */
  async despublicar(empresaId: string, id: string): Promise<FluxoTriagem> {
    const fluxo = await this.findOne(empresaId, id);

    if (!fluxo.publicado) {
      throw new BadRequestException('Fluxo não está publicado');
    }

    fluxo.publicado = false;
    fluxo.publishedAt = null;

    const updated = await this.fluxoRepository.save(fluxo);
    this.logger.log(`Fluxo despublicado: ${updated.id}`);
    return updated;
  }

  /**
   * Duplicar fluxo
   */
  async duplicar(
    empresaId: string,
    id: string,
    novoNome?: string,
    usuarioId?: string,
  ): Promise<FluxoTriagem> {
    const original = await this.findOne(empresaId, id);

    const duplicado = this.fluxoRepository.create({
      empresaId,
      nome: novoNome || `${original.nome} (Cópia)`,
      descricao: original.descricao,
      codigo: `${original.codigo}_COPY_${Date.now()}`,
      tipo: original.tipo,
      canais: original.canais,
      palavrasGatilho: original.palavrasGatilho,
      horarioAtivo: original.horarioAtivo,
      prioridade: original.prioridade,
      estrutura: original.estrutura,
      permiteVoltar: original.permiteVoltar,
      permiteSair: original.permiteSair,
      salvarHistorico: original.salvarHistorico,
      tentarEntenderTextoLivre: original.tentarEntenderTextoLivre,
      ativo: false, // Duplicado inicia inativo
      publicado: false,
      versao: 1,
    });

    const saved = await this.fluxoRepository.save(duplicado);
    this.logger.log(`Fluxo duplicado: ${original.id} → ${saved.id}`);
    return saved;
  }

  /**
   * Obter estatísticas de um fluxo
   */
  async getEstatisticas(empresaId: string, id: string) {
    const fluxo = await this.findOne(empresaId, id);

    const taxaConclusao =
      fluxo.totalExecucoes > 0
        ? ((fluxo.totalConclusoes / fluxo.totalExecucoes) * 100).toFixed(2)
        : 0;

    const taxaAbandono =
      fluxo.totalExecucoes > 0
        ? ((fluxo.totalAbandonos / fluxo.totalExecucoes) * 100).toFixed(2)
        : 0;

    return {
      fluxoId: fluxo.id,
      nome: fluxo.nome,
      versao: fluxo.versao,
      publicado: fluxo.publicado,
      totalExecucoes: fluxo.totalExecucoes,
      totalConclusoes: fluxo.totalConclusoes,
      totalAbandonos: fluxo.totalAbandonos,
      taxaConclusao: parseFloat(taxaConclusao),
      taxaAbandono: parseFloat(taxaAbandono),
      tempoMedioConclusaoSegundos: fluxo.tempoMedioConclusaoSegundos,
    };
  }

  /**
   * Listar versões de um fluxo (pelo código)
   */
  async getVersoes(empresaId: string, id: string): Promise<FluxoTriagem[]> {
    const fluxo = await this.findOne(empresaId, id);

    return this.fluxoRepository.find({
      where: {
        empresaId,
        codigo: fluxo.codigo,
      },
      order: {
        versao: 'DESC',
      },
    });
  }

  /**
   * Obter histórico de versões de um fluxo
   */
  async getHistoricoVersoes(empresaId: string, id: string): Promise<any[]> {
    const fluxo = await this.findOne(empresaId, id);

    if (!fluxo.historicoVersoes || fluxo.historicoVersoes.length === 0) {
      return [];
    }

    return fluxo.getHistoricoOrdenado();
  }

  /**
   * Restaurar uma versão anterior do fluxo
   */
  async restaurarVersao(
    empresaId: string,
    id: string,
    numeroVersao: number,
    usuarioId: string,
  ): Promise<FluxoTriagem> {
    const fluxo = await this.findOne(empresaId, id);

    const sucesso = fluxo.restaurarVersao(numeroVersao);

    if (!sucesso) {
      throw new NotFoundException(`Versão ${numeroVersao} não encontrada no histórico`);
    }

    this.logger.log(`Fluxo ${id} restaurado para versão ${numeroVersao} por usuário ${usuarioId}`);

    return await this.fluxoRepository.save(fluxo);
  }

  /**
   * Salvar snapshot da versão atual
   */
  async salvarVersao(
    empresaId: string,
    id: string,
    usuarioId: string,
    descricao?: string,
  ): Promise<FluxoTriagem> {
    const fluxo = await this.findOne(empresaId, id);

    fluxo.salvarVersao(usuarioId, descricao);

    this.logger.log(`Versão ${fluxo.versaoAtual - 1} do fluxo ${id} salva com sucesso`);

    return await this.fluxoRepository.save(fluxo);
  }

  /**
   * Validar estrutura do fluxo antes de publicar
   */
  private validarEstrutura(estrutura: any): void {
    if (!estrutura) {
      throw new BadRequestException('Estrutura do fluxo não definida');
    }

    if (!estrutura.etapaInicial) {
      throw new BadRequestException('Etapa inicial não definida');
    }

    if (!estrutura.etapas || Object.keys(estrutura.etapas).length === 0) {
      throw new BadRequestException('Nenhuma etapa definida no fluxo');
    }

    // Verificar se etapa inicial existe
    if (!estrutura.etapas[estrutura.etapaInicial]) {
      throw new BadRequestException(
        `Etapa inicial "${estrutura.etapaInicial}" não encontrada nas etapas definidas`,
      );
    }

    this.logger.log('Estrutura do fluxo validada com sucesso');
  }
}
