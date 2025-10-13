import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensagem, TipoMensagem, RemetenteMensagem, StatusMensagem } from '../entities/mensagem.entity';

export interface CriarMensagemDto {
  ticketId: string;
  tipo: string;
  remetente: string;
  conteudo: string;
  atendenteId?: string;
  idExterno?: string; // ID da mensagem no WhatsApp, Telegram, etc
  midia?: {
    url?: string;
    tipo?: string;
    tamanho?: number;
    nome?: string;
  };
  metadata?: Record<string, any>;
}

export interface AtualizarStatusMensagemDto {
  status: StatusMensagem;
  erro?: string;
}

@Injectable()
export class MensagemService {
  private readonly logger = new Logger(MensagemService.name);

  constructor(
    @InjectRepository(Mensagem)
    private mensagemRepository: Repository<Mensagem>,
  ) { }

  /**
   * Salva uma nova mensagem
   */
  async salvar(dados: CriarMensagemDto): Promise<Mensagem> {
    this.logger.log(`💬 Salvando mensagem para ticket ${dados.ticketId}`);

    const mensagem = this.mensagemRepository.create({
      ticketId: dados.ticketId,
      tipo: dados.tipo,
      remetente: dados.remetente,
      conteudo: dados.conteudo,
      idExterno: dados.idExterno,
      midia: dados.midia || null,
      // status: StatusMensagem.ENVIADA as any, // Coluna não existe no banco
    });

    const mensagemSalva = await this.mensagemRepository.save(mensagem);
    this.logger.log(`✅ Mensagem salva: ${mensagemSalva.id}`);

    return mensagemSalva;
  }

  /**
   * Busca mensagens de um ticket
   */
  async buscarPorTicket(ticketId: string, limite = 100): Promise<Mensagem[]> {
    this.logger.log(`📨 Buscando mensagens do ticket ${ticketId}`);

    const mensagens = await this.mensagemRepository.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
      take: limite,
    });

    this.logger.log(`📊 Encontradas ${mensagens.length} mensagens`);

    return mensagens;
  }

  /**
   * Busca mensagem por ID
   */
  async buscarPorId(id: string): Promise<Mensagem> {
    const mensagem = await this.mensagemRepository.findOne({
      where: { id },
    });

    if (!mensagem) {
      throw new NotFoundException(`Mensagem ${id} não encontrada`);
    }

    return mensagem;
  }

  /**
   * Busca mensagem por ID externo (WhatsApp, Telegram, etc)
   */
  async buscarPorIdExterno(idExterno: string): Promise<Mensagem | null> {
    return await this.mensagemRepository.findOne({
      where: { idExterno },
    });
  }

  /**
   * Marca mensagem como lida
   */
  async marcarComoLida(id: string): Promise<Mensagem> {
    const mensagem = await this.buscarPorId(id);

    // mensagem.status = StatusMensagem.LIDA; // Coluna não existe no banco

    const mensagemAtualizada = await this.mensagemRepository.save(mensagem);
    this.logger.log(`✓✓ Mensagem ${id} marcada como lida`);

    return mensagemAtualizada;
  }

  /**
   * Marca mensagem como lida pelo ID externo
   */
  async marcarComoLidaPorIdExterno(idExterno: string): Promise<void> {
    await this.mensagemRepository.update(
      { idExterno },
      { /* status: StatusMensagem.LIDA */ }, // Coluna não existe no banco
    );

    this.logger.log(`✓✓ Mensagem externa ${idExterno} marcada como lida`);
  }

  /**
   * Marca mensagem como entregue
   */
  async marcarComoEntregue(id: string): Promise<Mensagem> {
    const mensagem = await this.buscarPorId(id);

    // mensagem.status = StatusMensagem.ENTREGUE; // Coluna não existe no banco

    const mensagemAtualizada = await this.mensagemRepository.save(mensagem);
    this.logger.log(`✓ Mensagem ${id} marcada como entregue`);

    return mensagemAtualizada;
  }

  /**
   * Atualiza status da mensagem
   */
  async atualizarStatus(id: string, dto: AtualizarStatusMensagemDto): Promise<Mensagem> {
    const mensagem = await this.buscarPorId(id);

    // mensagem.status = dto.status; // Coluna não existe no banco

    const mensagemAtualizada = await this.mensagemRepository.save(mensagem);
    this.logger.log(`📝 Status da mensagem ${id} atualizado para ${dto.status}`);

    return mensagemAtualizada;
  }

  /**
   * Busca última mensagem de um ticket
   */
  async buscarUltima(ticketId: string): Promise<Mensagem | null> {
    return await this.mensagemRepository.findOne({
      where: { ticketId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Conta mensagens de um ticket
   */
  async contar(ticketId: string): Promise<number> {
    return await this.mensagemRepository.count({
      where: { ticketId },
    });
  }

  /**
   * Conta mensagens não lidas de um ticket
   */
  async contarNaoLidas(ticketId: string): Promise<number> {
    return await this.mensagemRepository.count({
      where: {
        ticketId,
        remetente: RemetenteMensagem.CLIENTE,
        // status: StatusMensagem.ENVIADA, // Coluna não existe no banco
      },
    });
  }

  /**
   * Busca mensagens do cliente (histórico completo)
   */
  async buscarHistoricoCliente(
    empresaId: string,
    clienteNumero: string,
    limite = 50,
  ): Promise<Mensagem[]> {
    const query = `
      SELECT m.* 
      FROM mensagens m
      INNER JOIN atendimento_tickets t ON t.id = m.ticketId
      WHERE t.empresaId = $1 
        AND t.contato_telefone = $2
      ORDER BY m.createdAt DESC
      LIMIT $3
    `;

    return await this.mensagemRepository.query(query, [empresaId, clienteNumero, limite]);
  }

  /**
   * Salva mensagem de texto simples (atalho)
   */
  async salvarTexto(
    ticketId: string,
    conteudo: string,
    remetente: RemetenteMensagem,
    atendenteId?: string,
    idExterno?: string,
  ): Promise<Mensagem> {
    return await this.salvar({
      ticketId,
      tipo: TipoMensagem.TEXTO,
      remetente: remetente as string,
      conteudo,
      atendenteId,
      idExterno,
    });
  }

  /**
   * Salva mensagem do cliente (atalho para webhook)
   */
  async salvarMensagemCliente(
    ticketId: string,
    conteudo: string,
    idExterno?: string,
    midia?: any,
  ): Promise<Mensagem> {
    return await this.salvar({
      ticketId,
      tipo: midia ? this.detectarTipoMidia(midia) : TipoMensagem.TEXTO,
      remetente: RemetenteMensagem.CLIENTE as string,
      conteudo,
      idExterno,
      midia,
    });
  }

  /**
   * Salva mensagem do atendente (atalho)
   */
  async salvarMensagemAtendente(
    ticketId: string,
    atendenteId: string,
    conteudo: string,
    idExterno?: string,
  ): Promise<Mensagem> {
    return await this.salvar({
      ticketId,
      tipo: TipoMensagem.TEXTO,
      remetente: RemetenteMensagem.ATENDENTE as string,
      conteudo,
      atendenteId,
      idExterno,
    });
  }

  /**
   * Salva mensagem do bot/IA (atalho)
   */
  async salvarMensagemBot(
    ticketId: string,
    conteudo: string,
    idExterno?: string,
  ): Promise<Mensagem> {
    return await this.salvar({
      ticketId,
      tipo: TipoMensagem.TEXTO,
      remetente: RemetenteMensagem.BOT as string,
      conteudo,
      idExterno,
    });
  }

  /**
   * Detecta tipo de mídia
   */
  private detectarTipoMidia(midia: any): TipoMensagem {
    if (!midia) return TipoMensagem.TEXTO;

    const tipo = midia.tipo || midia.mime_type || '';

    if (tipo.includes('image')) return TipoMensagem.IMAGEM;
    if (tipo.includes('audio')) return TipoMensagem.AUDIO;
    if (tipo.includes('video')) return TipoMensagem.VIDEO;
    if (tipo.includes('application')) return TipoMensagem.DOCUMENTO;

    return TipoMensagem.TEXTO;
  }

  /**
   * Deleta mensagens antigas (limpeza)
   */
  async deletarAntigas(dias: number): Promise<number> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);

    const resultado = await this.mensagemRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :dataLimite', { dataLimite })
      .execute();

    this.logger.log(`🗑️ Deletadas ${resultado.affected} mensagens antigas`);

    return resultado.affected || 0;
  }

  /**
   * Busca mensagens para análise de IA (últimas N mensagens)
   */
  async buscarParaAnaliseIA(ticketId: string, quantidade = 10): Promise<Mensagem[]> {
    return await this.mensagemRepository.find({
      where: { ticketId },
      order: { createdAt: 'DESC' },
      take: quantidade,
    });
  }
}
