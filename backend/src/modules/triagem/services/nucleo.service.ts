import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NucleoAtendimento } from '../entities/nucleo-atendimento.entity';
import {
  CreateNucleoDto,
  UpdateNucleoDto,
  FilterNucleoDto,
} from '../dto';
import { HorarioUtil } from '../utils/horario.util';

@Injectable()
export class NucleoService {
  private readonly logger = new Logger(NucleoService.name);

  constructor(
    @InjectRepository(NucleoAtendimento)
    private readonly nucleoRepository: Repository<NucleoAtendimento>,
  ) { }

  /**
   * Cria um novo núcleo de atendimento
   */
  async create(
    empresaId: string,
    createNucleoDto: CreateNucleoDto,
  ): Promise<NucleoAtendimento> {
    this.logger.log(
      `Criando núcleo "${createNucleoDto.nome}" para empresa ${empresaId}`,
    );

    // Validar atendentes (verificar se existem)
    // TODO: Validar IDs dos atendentes no banco

    const nucleo = this.nucleoRepository.create({
      nome: createNucleoDto.nome,
      descricao: createNucleoDto.descricao,
      cor: createNucleoDto.cor,
      icone: createNucleoDto.icone,
      ativo: createNucleoDto.ativo ?? true,
      prioridade: createNucleoDto.prioridade,
      tipoDistribuicao: createNucleoDto.tipoDistribuicao,
      atendentesIds: createNucleoDto.atendentesIds || [],
      supervisorId: createNucleoDto.supervisorId,
      capacidadeMaximaTickets: createNucleoDto.capacidadeMaxima,
      slaRespostaMinutos: createNucleoDto.slaRespostaMinutos,
      slaResolucaoHoras: createNucleoDto.slaResolucaoHoras,
      horarioFuncionamento: createNucleoDto.horarioFuncionamento as any,
      mensagemBoasVindas: createNucleoDto.mensagemBoasVindas,
      mensagemForaHorario: createNucleoDto.mensagemForaHorario,
      empresaId,
    });

    const saved = await this.nucleoRepository.save(nucleo);
    this.logger.log(`Núcleo "${saved.nome}" criado com ID: ${saved.id}`);

    return saved;
  }

  /**
   * Busca todos os núcleos com filtros opcionais
   */
  async findAll(
    empresaId: string,
    filters?: FilterNucleoDto,
  ): Promise<NucleoAtendimento[]> {
    try {
      console.log('[DEBUG NUCLEO] ========== INICIO findAll ==========');
      console.log('[DEBUG NUCLEO] empresaId recebido:', empresaId);
      console.log('[DEBUG NUCLEO] typeof empresaId:', typeof empresaId);

      const query = this.nucleoRepository
        .createQueryBuilder('nucleo')
        .where('nucleo.empresaId = :empresaId', { empresaId })
        // .leftJoinAndSelect('nucleo.supervisor', 'supervisor') // Comentado temporariamente
        .orderBy('nucleo.prioridade', 'ASC')
        .addOrderBy('nucleo.nome', 'ASC');

      if (filters?.nome) {
        query.andWhere('nucleo.nome ILIKE :nome', {
          nome: `%${filters.nome}%`,
        });
      }

      if (filters?.ativo !== undefined) {
        query.andWhere('nucleo.ativo = :ativo', { ativo: filters.ativo });
      }

      if (filters?.tipoDistribuicao) {
        query.andWhere('nucleo.tipoDistribuicao = :tipo', {
          tipo: filters.tipoDistribuicao,
        });
      }

      if (filters?.supervisorId) {
        query.andWhere('nucleo.supervisorId = :supervisorId', {
          supervisorId: filters.supervisorId,
        });
      }

      if (filters?.visivelNoBot !== undefined) {
        query.andWhere('nucleo.visivelNoBot = :visivelNoBot', {
          visivelNoBot: filters.visivelNoBot,
        });
      }

      console.log('[DEBUG NUCLEO] SQL gerado:', query.getSql());
      console.log('[DEBUG NUCLEO] Parametros:', query.getParameters());
      console.log('[DEBUG NUCLEO] Executando query...');

      const result = await query.getMany();

      console.log('[DEBUG NUCLEO] Query executada com sucesso!');
      console.log('[DEBUG NUCLEO] Resultados encontrados:', result.length);
      console.log('[DEBUG NUCLEO] ========== FIM findAll ==========');

      return result;
    } catch (error) {
      console.error('[DEBUG NUCLEO] ❌ ERRO CAPTURADO:');
      console.error('[DEBUG NUCLEO] Mensagem:', error.message);
      console.error('[DEBUG NUCLEO] Stack:', error.stack);
      console.error('[DEBUG NUCLEO] ========== FIM COM ERRO ==========');
      throw error;
    }
  }

  /**
   * Busca núcleo por ID
   */
  async findOne(empresaId: string, id: string): Promise<NucleoAtendimento> {
    const nucleo = await this.nucleoRepository.findOne({
      where: { id, empresaId },
      relations: ['supervisor'],
    });

    if (!nucleo) {
      throw new NotFoundException(`Núcleo com ID ${id} não encontrado`);
    }

    return nucleo;
  }

  /**
   * Atualiza um núcleo
   */
  async update(
    empresaId: string,
    id: string,
    updateNucleoDto: UpdateNucleoDto,
  ): Promise<NucleoAtendimento> {
    const nucleo = await this.findOne(empresaId, id);

    // Mapear DTO para entity
    if (updateNucleoDto.nome) nucleo.nome = updateNucleoDto.nome;
    if (updateNucleoDto.descricao) nucleo.descricao = updateNucleoDto.descricao;
    if (updateNucleoDto.cor) nucleo.cor = updateNucleoDto.cor;
    if (updateNucleoDto.icone) nucleo.icone = updateNucleoDto.icone;
    if (updateNucleoDto.ativo !== undefined) nucleo.ativo = updateNucleoDto.ativo;
    if (updateNucleoDto.visivelNoBot !== undefined) nucleo.visivelNoBot = updateNucleoDto.visivelNoBot;
    if (updateNucleoDto.prioridade) nucleo.prioridade = updateNucleoDto.prioridade;
    if (updateNucleoDto.tipoDistribuicao) nucleo.tipoDistribuicao = updateNucleoDto.tipoDistribuicao;
    if (updateNucleoDto.atendentesIds) nucleo.atendentesIds = updateNucleoDto.atendentesIds;
    if (updateNucleoDto.supervisorId) nucleo.supervisorId = updateNucleoDto.supervisorId;
    if (updateNucleoDto.capacidadeMaxima) nucleo.capacidadeMaximaTickets = updateNucleoDto.capacidadeMaxima;
    if (updateNucleoDto.slaRespostaMinutos) nucleo.slaRespostaMinutos = updateNucleoDto.slaRespostaMinutos;
    if (updateNucleoDto.slaResolucaoHoras) nucleo.slaResolucaoHoras = updateNucleoDto.slaResolucaoHoras;
    if (updateNucleoDto.horarioFuncionamento) nucleo.horarioFuncionamento = updateNucleoDto.horarioFuncionamento as any;
    if (updateNucleoDto.mensagemBoasVindas) nucleo.mensagemBoasVindas = updateNucleoDto.mensagemBoasVindas;
    if (updateNucleoDto.mensagemForaHorario) nucleo.mensagemForaHorario = updateNucleoDto.mensagemForaHorario;
    const updated = await this.nucleoRepository.save(nucleo);

    this.logger.log(`Núcleo ${id} atualizado`);
    return updated;
  }

  /**
   * Remove um núcleo
   */
  async remove(empresaId: string, id: string): Promise<void> {
    const nucleo = await this.findOne(empresaId, id);

    // Verificar se há atendimentos ativos
    // TODO: Verificar sessões e tickets ativos antes de remover

    await this.nucleoRepository.remove(nucleo);
    this.logger.log(`Núcleo ${id} removido`);
  }

  /**
   * Busca núcleo com menos carga de atendimentos
   * NOTA: Núcleos não têm filtro por canal (propriedade não existe na tabela)
   */
  async findNucleoComMenorCarga(
    empresaId: string,
    canal: string, // Parâmetro mantido por compatibilidade de API, mas não usado
  ): Promise<NucleoAtendimento | null> {
    const nucleos = await this.nucleoRepository
      .createQueryBuilder('nucleo')
      .where('nucleo.empresaId = :empresaId', { empresaId })
      .andWhere('nucleo.ativo = true')
      // Removido filtro por canais - propriedade não existe na tabela nucleos_atendimento
      .andWhere('nucleo.totalTicketsAbertos < nucleo.capacidadeMaximaTickets')
      .orderBy('nucleo.totalTicketsAbertos', 'ASC')
      .addOrderBy('nucleo.prioridade', 'ASC')
      .getMany();

    if (nucleos.length === 0) {
      return null;
    }

    // Filtrar por horário de funcionamento
    // NOTA: Transformar em instância para ter acesso aos métodos
    const nucleosDisponiveis = nucleos.filter((nucleo) => {
      // Criar instância da classe para ter acesso ao método
      const nucleoInstance = Object.assign(new NucleoAtendimento(), nucleo);
      return nucleoInstance.estaEmHorarioFuncionamento();
    });

    return nucleosDisponiveis.length > 0 ? nucleosDisponiveis[0] : null;
  }

  /**
   * Incrementa tickets abertos do núcleo
   */
  async incrementarTicketsAbertos(id: string): Promise<void> {
    await this.nucleoRepository.increment({ id }, 'totalTicketsAbertos', 1);
  }

  /**
   * Decrementa tickets abertos do núcleo
   */
  async decrementarTicketsAbertos(id: string): Promise<void> {
    await this.nucleoRepository.decrement({ id }, 'totalTicketsAbertos', 1);
  }

  /**
   * Incrementa tickets resolvidos
   */
  async incrementarTicketsResolvidos(id: string): Promise<void> {
    await this.nucleoRepository.increment({ id }, 'totalTicketsResolvidos', 1);
  }

  /**
   * Atualiza métricas do núcleo
   */
  async atualizarMetricas(
    id: string,
    metricas: {
      tempoMedioAtendimento?: number;
      taxaSatisfacao?: number;
    },
  ): Promise<void> {
    const nucleo = await this.nucleoRepository.findOne({ where: { id } });
    if (!nucleo) return;

    if (metricas.tempoMedioAtendimento !== undefined) {
      nucleo.tempoMedioAtendimentoMinutos = metricas.tempoMedioAtendimento;
    }
    if (metricas.taxaSatisfacao !== undefined) {
      nucleo.taxaSatisfacao = metricas.taxaSatisfacao;
    }

    await this.nucleoRepository.save(nucleo);
  }

  /**
   * Lista núcleos ativos por canal
   * NOTA: Núcleos não têm filtro por canal (propriedade não existe na tabela)
   * Retorna todos os núcleos ativos da empresa
   */
  async findByCanal(
    empresaId: string,
    canal: string, // Parâmetro mantido por compatibilidade de API, mas não usado
  ): Promise<NucleoAtendimento[]> {
    return this.nucleoRepository
      .createQueryBuilder('nucleo')
      .where('nucleo.empresaId = :empresaId', { empresaId })
      .andWhere('nucleo.ativo = true')
      // Removido filtro por canais - propriedade não existe na tabela nucleos_atendimento
      .orderBy('nucleo.prioridade', 'ASC')
      .getMany();
  }

  /**
   * Busca núcleos e departamentos visíveis no bot
   * Retorna estrutura hierárquica para seleção do usuário
   * Filtra por horário de funcionamento e disponibilidade
   */
  async findOpcoesParaBot(empresaId: string): Promise<any[]> {
    console.log('🔍 [NUCLEO DEBUG] Buscando núcleos para empresaId:', empresaId);
    const nucleos = await this.nucleoRepository
      .createQueryBuilder('nucleo')
      .leftJoinAndSelect('nucleo.empresa', 'empresa')
      .where('nucleo.empresaId = :empresaId', { empresaId })
      .andWhere('nucleo.ativo = true')
      .andWhere('nucleo.visivelNoBot = true')
      .orderBy('nucleo.prioridade', 'ASC')
      .addOrderBy('nucleo.nome', 'ASC')
      .getMany();

    console.log('🔍 [NUCLEO DEBUG] Núcleos encontrados:', nucleos.length);
    console.log('🔍 [NUCLEO DEBUG] Núcleos:', nucleos.map(n => ({ id: n.id, nome: n.nome, empresaId: n.empresaId })));

    // Para cada núcleo, buscar departamentos visíveis e verificar horário
    console.log('🔍 [NUCLEO DEBUG] Processando núcleos e verificando disponibilidade...');
    const dataAtual = new Date();

    const resultado = await Promise.all(
      nucleos.map(async (nucleo) => {
        console.log('🔍 [NUCLEO DEBUG] Processando núcleo:', nucleo.nome, 'ID:', nucleo.id);

        // Verificar horário de funcionamento
        const verificacaoHorario = HorarioUtil.verificarDisponibilidade(
          nucleo.horarioFuncionamento as any,
          dataAtual,
        );

        console.log('⏰ [NUCLEO DEBUG] Verificação horário:', {
          nucleo: nucleo.nome,
          estaAberto: verificacaoHorario.estaAberto,
          motivo: verificacaoHorario.motivoFechado,
        });

        // Buscar departamentos
        const departamentos = await this.nucleoRepository.manager
          .getRepository('departamentos')
          .createQueryBuilder('dep')
          .where('dep.nucleoId = :nucleoId', { nucleoId: nucleo.id })
          .andWhere('dep.ativo = true')
          .andWhere('dep.visivelNoBot = true')
          .orderBy('dep.ordem', 'ASC')
          .addOrderBy('dep.nome', 'ASC')
          .getMany();

        console.log('🔍 [NUCLEO DEBUG] Departamentos encontrados para', nucleo.nome, ':', departamentos.length);

        return {
          id: nucleo.id,
          nome: nucleo.nome,
          descricao: nucleo.descricao,
          cor: nucleo.cor,
          icone: nucleo.icone,
          mensagemBoasVindas: nucleo.mensagemBoasVindas,
          mensagemForaHorario: nucleo.mensagemForaHorario,
          horarioFuncionamento: nucleo.horarioFuncionamento,
          disponivel: verificacaoHorario.estaAberto,
          motivoIndisponivel: verificacaoHorario.motivoFechado,
          proximaAbertura: verificacaoHorario.proximaAbertura,
          atendentesIds: nucleo.atendentesIds || [], // 🆕 IDs dos atendentes do núcleo
          departamentos: departamentos.map((dep: any) => ({
            id: dep.id,
            nome: dep.nome,
            descricao: dep.descricao,
            cor: dep.cor,
            icone: dep.icone,
          })),
        };
      }),
    );

    console.log('🔍 [NUCLEO DEBUG] Total de núcleos processados:', resultado.length);
    console.log('🔍 [NUCLEO DEBUG] Núcleos disponíveis:', resultado.filter(n => n.disponivel).length);
    console.log('🔍 [NUCLEO DEBUG] Núcleos com departamentos:', resultado.filter(n => n.departamentos.length > 0).length);

    // Retornar TODOS os núcleos (disponíveis e indisponíveis)
    // O FlowEngine decidirá como apresentá-los
    const filtrados = resultado.filter(nucleo => nucleo.departamentos.length > 0);
    console.log('🔍 [NUCLEO DEBUG] Retornando:', filtrados.length, 'núcleos');

    return filtrados;
  }
}
