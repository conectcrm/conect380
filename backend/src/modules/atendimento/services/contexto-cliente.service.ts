import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Cliente } from '../../clientes/cliente.entity';
import { Contato } from '../../clientes/contato.entity';
import { Ticket } from '../entities/ticket.entity';
import { ContextoClienteResponseDto } from '../dto/contexto-cliente.dto';

@Injectable()
export class ContextoClienteService {
  private readonly logger = new Logger(ContextoClienteService.name);

  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,

    @InjectRepository(Contato)
    private contatoRepository: Repository<Contato>,

    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  /**
   * Obter contexto completo do cliente
   */
  async obterContextoCompleto(
    clienteId: string,
    empresaId?: string,
  ): Promise<ContextoClienteResponseDto> {
    this.logger.log(`📊 Obtendo contexto completo do cliente ${clienteId}`);

    try {
      // 1. Buscar dados do cliente
      const cliente = await this.buscarCliente(clienteId, empresaId);

      if (!cliente) {
        throw new NotFoundException(`Cliente ${clienteId} não encontrado`);
      }

      // 2. Buscar dados em paralelo
      const [estatisticas, historico] = await Promise.all([
        this.calcularEstatisticas(clienteId, empresaId, cliente),
        this.obterHistorico(clienteId, empresaId, cliente),
      ]);

      // 3. Montar resposta
      const contexto: ContextoClienteResponseDto = {
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          documento: cliente.documento,
          empresa: cliente.empresa,
          cargo: cliente.cargo,
          segmento: this.determinarSegmento(cliente),
          primeiroContato: cliente.created_at,
          ultimoContato: cliente.ultimo_contato || cliente.updated_at,
          tags: cliente.tags || [],
        },
        estatisticas,
        historico,
      };

      this.logger.log(`✅ Contexto do cliente ${clienteId} obtido com sucesso`);
      return contexto;
    } catch (error) {
      this.logger.error(`❌ Erro ao obter contexto do cliente ${clienteId}:`, error.message);
      throw error;
    }
  }

  /**
   * Obter contexto completo do cliente por telefone (fallback)
   */
  async obterContextoPorTelefone(
    telefone: string,
    empresaId?: string,
  ): Promise<ContextoClienteResponseDto> {
    this.logger.log(`📞 Obtendo contexto do cliente por telefone ${telefone}`);

    try {
      // 1. Buscar cliente por telefone
      const cliente = await this.buscarClientePorTelefone(telefone, empresaId);

      if (!cliente) {
        // Se não encontrar cliente, retornar contexto vazio com telefone
        this.logger.warn(
          `⚠️ Cliente com telefone ${telefone} não encontrado. Retornando contexto vazio.`,
        );

        return {
          cliente: {
            id: null,
            nome: telefone, // Usar telefone como nome temporário
            email: null,
            telefone: telefone,
            documento: null,
            empresa: null,
            cargo: null,
            segmento: 'Novo',
            primeiroContato: new Date(),
            ultimoContato: new Date(),
            tags: [],
          },
          estatisticas: {
            valorTotalGasto: 0,
            totalTickets: 0,
            ticketsResolvidos: 0,
            ticketsAbertos: 0,
            avaliacaoMedia: 0,
            tempoMedioResposta: 'N/A',
          },
          historico: {
            propostas: [],
            faturas: [],
            tickets: [],
          },
        };
      }

      // 2. Se encontrou cliente, usar método padrão com UUID
      return this.obterContextoCompleto(cliente.id, empresaId);
    } catch (error) {
      this.logger.error(`❌ Erro ao obter contexto por telefone ${telefone}:`, error.message);
      throw error;
    }
  }

  /**
   * Buscar dados básicos do cliente
   */
  private async buscarCliente(clienteId: string, empresaId?: string): Promise<Cliente> {
    const where: any = { id: clienteId };

    if (empresaId) {
      where.empresa_id = empresaId;
    }

    return this.clienteRepository.findOne({ where });
  }

  /**
   * Buscar cliente por telefone
   */
  private async buscarClientePorTelefone(
    telefone: string,
    empresaId?: string,
  ): Promise<Cliente | null> {
    const where: any = { telefone };

    if (empresaId) {
      where.empresa_id = empresaId;
    }

    return this.clienteRepository.findOne({ where });
  }

  /**
   * Calcular estatísticas do cliente
   */
  private async calcularEstatisticas(
    clienteId: string,
    empresaId?: string,
    clienteCache?: Cliente,
  ): Promise<ContextoClienteResponseDto['estatisticas']> {
    this.logger.log(`📈 Calculando estatísticas do cliente ${clienteId}`);

    try {
      const telefonesRelacionados = await this.coletarTelefonesRelacionados(
        clienteId,
        empresaId,
        clienteCache,
      );
      const tickets = await this.buscarTicketsDoCliente(
        clienteId,
        empresaId,
        telefonesRelacionados,
      );

      const totalTickets = tickets.length;
      const ticketsResolvidos = tickets.filter((t) => {
        const status = (t.status || '').toString().toLowerCase();
        return ['resolvido', 'fechado'].includes(status);
      }).length;

      const ticketsAbertos = tickets.filter((t) => {
        const status = (t.status || '').toString().toLowerCase();
        return ['aberto', 'em_atendimento', 'aguardando', 'aguardando_cliente'].includes(status);
      }).length;

      // Calcular avaliação média (mock - implementar quando tiver tabela de avaliações)
      const avaliacaoMedia = 4.5;

      // Calcular tempo médio de resposta (mock)
      const tempoMedioResposta = '5 minutos';

      // Valor total gasto (mock - implementar quando integrar com propostas/faturas)
      const valorTotalGasto = 0;

      return {
        valorTotalGasto,
        totalTickets,
        ticketsResolvidos,
        ticketsAbertos,
        avaliacaoMedia,
        tempoMedioResposta,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao calcular estatísticas:', error.message);

      // Retornar estatísticas vazias em caso de erro
      return {
        valorTotalGasto: 0,
        totalTickets: 0,
        ticketsResolvidos: 0,
        ticketsAbertos: 0,
        avaliacaoMedia: 0,
        tempoMedioResposta: 'N/A',
      };
    }
  }

  /**
   * Obter histórico do cliente (propostas, faturas, tickets)
   */
  private async obterHistorico(
    clienteId: string,
    empresaId?: string,
    clienteCache?: Cliente,
  ): Promise<ContextoClienteResponseDto['historico']> {
    this.logger.log(`📜 Obtendo histórico do cliente ${clienteId}`);

    try {
      const telefonesRelacionados = await this.coletarTelefonesRelacionados(
        clienteId,
        empresaId,
        clienteCache,
      );
      const tickets = await this.buscarTicketsDoCliente(
        clienteId,
        empresaId,
        telefonesRelacionados,
      );

      const ticketsRecentes = tickets
        .sort((a, b) => {
          const dataA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dataB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dataB - dataA;
        })
        .slice(0, 5);

      // TODO: Buscar propostas quando integrar com módulo de propostas
      const propostas = [];

      // TODO: Buscar faturas quando integrar com módulo de faturamento
      const faturas = [];

      return {
        propostas,
        faturas,
        tickets: ticketsRecentes.map((t) => ({
          id: t.id,
          numero: t.numero,
          status: t.status,
          assunto: t.assunto,
          criadoEm: t.createdAt,
          canalId: t.canalId,
        })),
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter histórico:', error.message);

      return {
        propostas: [],
        faturas: [],
        tickets: [],
      };
    }
  }

  /**
   * Determinar segmento do cliente (VIP, Regular, Novo)
   */
  private determinarSegmento(cliente: Cliente): 'VIP' | 'Regular' | 'Novo' {
    // Lógica simples: baseada em tags ou valor estimado
    if (cliente.tags?.includes('VIP')) {
      return 'VIP';
    }

    // Se valor estimado > 10000, é VIP
    if (cliente.valor_estimado && Number(cliente.valor_estimado) > 10000) {
      return 'VIP';
    }

    // Se cliente novo (menos de 30 dias)
    const diasDesdeContato = Math.floor(
      (Date.now() - new Date(cliente.created_at).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diasDesdeContato <= 30) {
      return 'Novo';
    }

    return 'Regular';
  }

  /**
   * Obter apenas estatísticas (endpoint separado)
   */
  async obterEstatisticas(
    clienteId: string,
    empresaId?: string,
  ): Promise<ContextoClienteResponseDto['estatisticas']> {
    return this.calcularEstatisticas(clienteId, empresaId);
  }

  /**
   * Obter apenas histórico (endpoint separado)
   */
  async obterHistorico2(
    clienteId: string,
    empresaId?: string,
  ): Promise<ContextoClienteResponseDto['historico']> {
    return this.obterHistorico(clienteId, empresaId);
  }

  private normalizarTelefone(telefone?: string | null): string | null {
    if (!telefone) {
      return null;
    }

    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length < 8) {
      return null;
    }

    return numeros;
  }

  private async coletarTelefonesRelacionados(
    clienteId: string,
    empresaId?: string,
    clienteCache?: Cliente,
  ): Promise<string[]> {
    const telefones = new Set<string>();

    let clienteReferencia = clienteCache;
    if (!clienteReferencia) {
      clienteReferencia = await this.buscarCliente(clienteId, empresaId);
    }

    const telefonePrincipal = this.normalizarTelefone(clienteReferencia?.telefone);
    if (telefonePrincipal) {
      telefones.add(telefonePrincipal);
    }

    const contatos = await this.contatoRepository.find({ where: { clienteId } });
    contatos.forEach((contato) => {
      const telefoneContato = this.normalizarTelefone(contato.telefone);
      if (telefoneContato) {
        telefones.add(telefoneContato);
      }
    });

    return Array.from(telefones);
  }

  private async buscarTicketsDoCliente(
    clienteId: string,
    empresaId: string | undefined,
    telefones: string[],
  ): Promise<Ticket[]> {
    const colunaClienteId = this.ticketRepository.metadata.findColumnWithPropertyName('clienteId');
    const colunaEmpresaId = this.ticketRepository.metadata.findColumnWithPropertyName('empresaId');
    const possuiColunaClienteId = Boolean(colunaClienteId);

    if (!possuiColunaClienteId && telefones.length === 0) {
      this.logger.warn(
        `⚠️ Nenhuma forma de correlacionar tickets para cliente ${clienteId} (sem telefone e sem coluna clienteId).`,
      );
      return [];
    }

    const query = this.ticketRepository.createQueryBuilder('ticket');

    if (empresaId && colunaEmpresaId) {
      query.andWhere(`ticket.${colunaEmpresaId.databaseName} = :empresaId`, { empresaId });
    }

    const campoTelefoneNormalizado = `REGEXP_REPLACE(COALESCE(ticket.contato_telefone, ''), '\\D', '', 'g')`;

    if (possuiColunaClienteId && telefones.length > 0) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`ticket.${colunaClienteId!.databaseName} = :clienteId`, { clienteId });
          qb.orWhere(`${campoTelefoneNormalizado} IN (:...telefones)`, { telefones });
        }),
      );
    } else if (possuiColunaClienteId) {
      query.andWhere(`ticket.${colunaClienteId.databaseName} = :clienteId`, { clienteId });
    } else if (telefones.length > 0) {
      query.andWhere(`${campoTelefoneNormalizado} IN (:...telefones)`, { telefones });
    }

    query.orderBy('ticket.created_at', 'DESC');

    return query.getMany();
  }
}
