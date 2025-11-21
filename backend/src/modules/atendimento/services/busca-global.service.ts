import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cliente } from '../../clientes/cliente.entity';
import { Ticket } from '../entities/ticket.entity';
import {
  BuscaGlobalRequestDto,
  BuscaGlobalResponseDto,
  ResultadoBuscaDto,
  TipoRecursoBusca,
} from '../dto/busca-global.dto';

@Injectable()
export class BuscaGlobalService {
  private readonly logger = new Logger(BuscaGlobalService.name);

  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,

    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  /**
   * Realizar busca global em múltiplas entidades
   */
  async buscar(dto: BuscaGlobalRequestDto): Promise<BuscaGlobalResponseDto> {
    const startTime = Date.now();
    this.logger.log(`🔍 Iniciando busca global: "${dto.query}"`);

    try {
      const resultados: ResultadoBuscaDto[] = [];
      const tipos = dto.tipos || Object.values(TipoRecursoBusca);

      // Executar buscas em paralelo
      const promises: Promise<ResultadoBuscaDto[]>[] = [];

      if (tipos.includes(TipoRecursoBusca.CLIENTE)) {
        promises.push(this.buscarClientes(dto.query, dto.empresaId));
      }

      if (tipos.includes(TipoRecursoBusca.TICKET)) {
        promises.push(this.buscarTickets(dto.query, dto.empresaId));
      }

      // TODO: Adicionar busca em PROPOSTAS quando integrar módulo
      // if (tipos.includes(TipoRecursoBusca.PROPOSTA)) {
      //   promises.push(this.buscarPropostas(dto.query, dto.empresaId));
      // }

      // TODO: Adicionar busca em FATURAS quando integrar módulo
      // if (tipos.includes(TipoRecursoBusca.FATURA)) {
      //   promises.push(this.buscarFaturas(dto.query, dto.empresaId));
      // }

      // Aguardar todas as buscas
      const resultadosArrays = await Promise.all(promises);

      // Unificar resultados
      resultadosArrays.forEach((arr) => resultados.push(...arr));

      // Ordenar por relevância
      resultados.sort((a, b) => b.relevancia - a.relevancia);

      // Limitar resultados
      const resultadosLimitados = resultados.slice(0, dto.limite);

      // Calcular contadores
      const contadores = {
        propostas: resultados.filter((r) => r.tipo === TipoRecursoBusca.PROPOSTA).length,
        faturas: resultados.filter((r) => r.tipo === TipoRecursoBusca.FATURA).length,
        clientes: resultados.filter((r) => r.tipo === TipoRecursoBusca.CLIENTE).length,
        pedidos: resultados.filter((r) => r.tipo === TipoRecursoBusca.PEDIDO).length,
        tickets: resultados.filter((r) => r.tipo === TipoRecursoBusca.TICKET).length,
      };

      const tempoMs = Date.now() - startTime;
      this.logger.log(`✅ Busca concluída em ${tempoMs}ms: ${resultados.length} resultados`);

      return {
        resultados: resultadosLimitados,
        totalResultados: resultados.length,
        tempoMs,
        contadores,
      };
    } catch (error) {
      this.logger.error('❌ Erro na busca global:', error.message);
      throw error;
    }
  }

  /**
   * Buscar clientes
   */
  private async buscarClientes(query: string, empresaId: string): Promise<ResultadoBuscaDto[]> {
    try {
      const queryLower = `%${query.toLowerCase()}%`;

      const clientes = await this.clienteRepository
        .createQueryBuilder('cliente')
        .where('cliente.empresa_id = :empresaId', { empresaId })
        .andWhere(
          '(LOWER(cliente.nome) LIKE :query OR LOWER(cliente.email) LIKE :query OR LOWER(cliente.telefone) LIKE :query OR LOWER(cliente.documento) LIKE :query)',
          { query: queryLower },
        )
        .orderBy('cliente.created_at', 'DESC')
        .take(10)
        .getMany();

      return clientes.map((cliente) => ({
        tipo: TipoRecursoBusca.CLIENTE,
        id: cliente.id,
        titulo: cliente.nome,
        subtitulo: `${cliente.email} ${cliente.telefone ? '• ' + cliente.telefone : ''}`,
        status: cliente.status,
        data: cliente.created_at,
        relevancia: this.calcularRelevancia(
          query,
          `${cliente.nome} ${cliente.email} ${cliente.telefone} ${cliente.documento}`,
        ),
        highlight: this.encontrarHighlight(query, cliente.nome, cliente.email, cliente.telefone),
        dados: cliente,
      }));
    } catch (error) {
      this.logger.error('❌ Erro ao buscar clientes:', error.message);
      return [];
    }
  }

  /**
   * Buscar tickets
   */
  private async buscarTickets(query: string, empresaId: string): Promise<ResultadoBuscaDto[]> {
    try {
      const queryLower = `%${query.toLowerCase()}%`;

      const tickets = await this.ticketRepository
        .createQueryBuilder('ticket')
        .where('ticket.empresaId = :empresaId', { empresaId })
        .andWhere(
          '(LOWER(ticket.assunto) LIKE :query OR LOWER(ticket.contatoNome) LIKE :query OR CAST(ticket.numero AS VARCHAR) LIKE :query)',
          { query: queryLower },
        )
        .orderBy('ticket.createdAt', 'DESC')
        .take(10)
        .getMany();

      return tickets.map((ticket) => ({
        tipo: TipoRecursoBusca.TICKET,
        id: ticket.id,
        titulo: `Ticket #${ticket.numero}`,
        subtitulo: `${ticket.assunto || 'Sem assunto'} • ${ticket.contatoNome || 'Sem nome'}`,
        status: ticket.status,
        data: ticket.createdAt,
        relevancia: this.calcularRelevancia(
          query,
          `${ticket.numero} ${ticket.assunto} ${ticket.contatoNome}`,
        ),
        highlight: this.encontrarHighlight(
          query,
          ticket.assunto,
          ticket.contatoNome,
          String(ticket.numero),
        ),
        dados: ticket,
      }));
    } catch (error) {
      this.logger.error('❌ Erro ao buscar tickets:', error.message);
      return [];
    }
  }

  /**
   * TODO: Buscar propostas (quando integrar módulo)
   */
  // private async buscarPropostas(
  //   query: string,
  //   empresaId: string,
  // ): Promise<ResultadoBuscaDto[]> {
  //   // Implementar quando integrar com módulo de propostas
  //   return [];
  // }

  /**
   * TODO: Buscar faturas (quando integrar módulo)
   */
  // private async buscarFaturas(
  //   query: string,
  //   empresaId: string,
  // ): Promise<ResultadoBuscaDto[]> {
  //   // Implementar quando integrar com módulo de faturamento
  //   return [];
  // }

  /**
   * Calcular relevância de um resultado (0-1)
   */
  private calcularRelevancia(query: string, texto: string): number {
    const queryLower = query.toLowerCase();
    const textoLower = texto.toLowerCase();

    // Exact match = 1.0
    if (textoLower === queryLower) {
      return 1.0;
    }

    // Começa com query = 0.9
    if (textoLower.startsWith(queryLower)) {
      return 0.9;
    }

    // Contém palavra exata = 0.8
    const words = textoLower.split(/\s+/);
    if (words.includes(queryLower)) {
      return 0.8;
    }

    // Contém query = 0.6
    if (textoLower.includes(queryLower)) {
      return 0.6;
    }

    // Contém palavras similares = 0.4
    const queryWords = queryLower.split(/\s+/);
    const matches = queryWords.filter((qw) =>
      words.some((w) => w.includes(qw) || qw.includes(w)),
    ).length;

    if (matches > 0) {
      return 0.4 + (matches / queryWords.length) * 0.2;
    }

    // Default
    return 0.3;
  }

  /**
   * Encontrar termo que foi destacado na busca
   */
  private encontrarHighlight(...textos: string[]): string {
    for (const texto of textos) {
      if (texto && texto.length > 0) {
        return texto.substring(0, 50);
      }
    }
    return '';
  }
}
