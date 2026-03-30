import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanoCobranca, StatusPlanoCobranca } from '../entities/plano-cobranca.entity';
import { Fatura, TipoFatura } from '../entities/fatura.entity';
import { CreatePlanoCobrancaDto, UpdatePlanoCobrancaDto } from '../dto/plano-cobranca.dto';
import { CreateFaturaDto } from '../dto/fatura.dto';
import { FaturamentoService } from './faturamento.service';
import { EmailIntegradoService } from '../../propostas/email-integrado.service';

@Injectable()
export class CobrancaService {
  private readonly logger = new Logger(CobrancaService.name);

  constructor(
    @InjectRepository(PlanoCobranca)
    private planoCobrancaRepository: Repository<PlanoCobranca>,
    @InjectRepository(Fatura)
    private faturaRepository: Repository<Fatura>,
    private faturamentoService: FaturamentoService,
    private emailService: EmailIntegradoService,
  ) {}

  async criarPlanoCobranca(
    createPlanoDto: CreatePlanoCobrancaDto,
    empresaId: string,
  ): Promise<PlanoCobranca> {
    try {
      // Gerar código único
      const codigo = await this.gerarCodigoPlano();

      // Calcular primeira cobrança
      const proximaCobranca = new Date(createPlanoDto.dataInicio);
      proximaCobranca.setDate(createPlanoDto.diaVencimento);

      // Se o dia já passou neste mês, vencer no próximo mês
      if (proximaCobranca < new Date(createPlanoDto.dataInicio)) {
        proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);
      }

      const plano = this.planoCobrancaRepository.create({
        ...createPlanoDto,
        empresaId,
        codigo,
        proximaCobranca,
        status: StatusPlanoCobranca.ATIVO,
      });

      const planoSalvo = await this.planoCobrancaRepository.save(plano);

      this.logger.log(`Plano de cobrança criado: ${planoSalvo.codigo}`);

      return planoSalvo;
    } catch (error) {
      this.logger.error(`Erro ao criar plano de cobrança: ${error.message}`);
      throw new BadRequestException('Erro ao criar plano de cobrança');
    }
  }

  async buscarPlanosCobranca(
    empresaId: string,
    filtros?: {
    status?: StatusPlanoCobranca;
    clienteId?: string;
    contratoId?: number;
  },
  ): Promise<PlanoCobranca[]> {
    const query = this.planoCobrancaRepository
      .createQueryBuilder('plano')
      .leftJoinAndSelect('plano.contrato', 'contrato')
      .leftJoinAndSelect('plano.usuarioResponsavel', 'usuario')
      .where('plano.ativo = :ativo', { ativo: true })
      .andWhere('contrato.empresa_id = :empresaId', { empresaId });

    if (filtros?.status) {
      query.andWhere('plano.status = :status', { status: filtros.status });
    }

    if (typeof filtros?.clienteId === 'string' && filtros.clienteId.trim()) {
      query.andWhere('plano.clienteId = :clienteId', { clienteId: filtros.clienteId.trim() });
    }

    if (filtros?.contratoId) {
      query.andWhere('plano.contratoId = :contratoId', { contratoId: filtros.contratoId });
    }

    return query.orderBy('plano.createdAt', 'DESC').getMany();
  }

  async buscarPlanoPorId(id: number, empresaId: string): Promise<PlanoCobranca> {
    const plano = await this.planoCobrancaRepository
      .createQueryBuilder('plano')
      .leftJoinAndSelect('plano.contrato', 'contrato')
      .leftJoinAndSelect('plano.usuarioResponsavel', 'usuario')
      .leftJoinAndSelect('plano.faturas', 'faturas')
      .where('plano.id = :id', { id })
      .andWhere('plano.ativo = :ativo', { ativo: true })
      .andWhere('contrato.empresa_id = :empresaId', { empresaId })
      .getOne();

    if (!plano) {
      throw new NotFoundException('Plano de cobrança não encontrado');
    }

    return plano;
  }

  async buscarPlanoPorCodigo(codigo: string, empresaId: string): Promise<PlanoCobranca> {
    const plano = await this.planoCobrancaRepository
      .createQueryBuilder('plano')
      .leftJoinAndSelect('plano.contrato', 'contrato')
      .leftJoinAndSelect('plano.usuarioResponsavel', 'usuario')
      .leftJoinAndSelect('plano.faturas', 'faturas')
      .where('plano.codigo = :codigo', { codigo })
      .andWhere('plano.ativo = :ativo', { ativo: true })
      .andWhere('contrato.empresa_id = :empresaId', { empresaId })
      .getOne();

    if (!plano) {
      throw new NotFoundException('Plano de cobrança não encontrado');
    }

    return plano;
  }

  async atualizarPlanoCobranca(
    id: number,
    updatePlanoDto: UpdatePlanoCobrancaDto,
    empresaId: string,
  ): Promise<PlanoCobranca> {
    const plano = await this.buscarPlanoPorId(id, empresaId);

    Object.assign(plano, updatePlanoDto);

    // Recalcular próxima cobrança se mudou parâmetros importantes
    if (updatePlanoDto.diaVencimento) {
      plano.proximaCobranca = plano.calcularProximaCobranca();
    }

    const planoAtualizado = await this.planoCobrancaRepository.save(plano);
    this.logger.log(`Plano de cobrança atualizado: ${planoAtualizado.codigo}`);

    return planoAtualizado;
  }

  async pausarPlanoCobranca(id: number, empresaId: string): Promise<PlanoCobranca> {
    const plano = await this.buscarPlanoPorId(id, empresaId);

    plano.status = StatusPlanoCobranca.PAUSADO;

    const planoAtualizado = await this.planoCobrancaRepository.save(plano);
    this.logger.log(`Plano de cobrança pausado: ${planoAtualizado.codigo}`);

    return planoAtualizado;
  }

  async reativarPlanoCobranca(id: number, empresaId: string): Promise<PlanoCobranca> {
    const plano = await this.buscarPlanoPorId(id, empresaId);

    if (plano.status !== StatusPlanoCobranca.PAUSADO) {
      throw new BadRequestException('Apenas planos pausados podem ser reativados');
    }

    plano.status = StatusPlanoCobranca.ATIVO;
    plano.proximaCobranca = plano.calcularProximaCobranca();

    const planoAtualizado = await this.planoCobrancaRepository.save(plano);
    this.logger.log(`Plano de cobrança reativado: ${planoAtualizado.codigo}`);

    return planoAtualizado;
  }

  async cancelarPlanoCobranca(
    id: number,
    empresaId: string,
    motivo?: string,
  ): Promise<PlanoCobranca> {
    const plano = await this.buscarPlanoPorId(id, empresaId);

    plano.status = StatusPlanoCobranca.CANCELADO;
    plano.dataFim = new Date();

    if (motivo) {
      plano.descricao = `${plano.descricao || ''}\n\nCancelado: ${motivo}`;
    }

    const planoAtualizado = await this.planoCobrancaRepository.save(plano);
    this.logger.log(`Plano de cobrança cancelado: ${planoAtualizado.codigo}`);

    return planoAtualizado;
  }

  async processarCobrancasRecorrentes(empresaId: string): Promise<void> {
    this.logger.log('Iniciando processamento de cobranças recorrentes...');

    // Buscar planos ativos que precisam de cobrança
    const planosParaCobranca = await this.planoCobrancaRepository
      .createQueryBuilder('plano')
      .leftJoin('plano.contrato', 'contrato')
      .where('plano.status = :status', { status: StatusPlanoCobranca.ATIVO })
      .andWhere('plano.proximaCobranca <= :agora', { agora: new Date() })
      .andWhere('plano.ativo = :ativo', { ativo: true })
      .andWhere('contrato.empresa_id = :empresaId', { empresaId })
      .getMany();

    this.logger.log(`Encontrados ${planosParaCobranca.length} planos para cobrança`);

    for (const plano of planosParaCobranca) {
      try {
        await this.gerarFaturaRecorrente(plano, empresaId);
      } catch (error) {
        this.logger.error(`Erro ao processar cobrança do plano ${plano.codigo}: ${error.message}`);
      }
    }

    this.logger.log('Processamento de cobranças recorrentes concluído');
  }

  async gerarFaturaRecorrente(plano: PlanoCobranca, empresaId: string): Promise<Fatura> {
    try {
      const planoEscopoEmpresa = await this.planoCobrancaRepository
        .createQueryBuilder('plano')
        .leftJoinAndSelect('plano.contrato', 'contrato')
        .where('plano.id = :id', { id: plano.id })
        .andWhere('plano.ativo = :ativo', { ativo: true })
        .andWhere('contrato.empresa_id = :empresaId', { empresaId })
        .getOne();

      if (!planoEscopoEmpresa) {
        throw new BadRequestException('Plano de cobranca nao pertence a empresa autenticada');
      }

      const planoAtual = planoEscopoEmpresa;

      if (!planoAtual.podeGerarNovaFatura()) {
        throw new BadRequestException('Plano nao pode gerar nova fatura');
      }

      const faturaExistente = await this.faturaRepository.findOne({
        where: {
          empresaId,
          contratoId: planoAtual.contratoId,
          dataVencimento: planoAtual.proximaCobranca,
          ativo: true,
        },
      });

      if (faturaExistente) {
        this.logger.warn(`Fatura ja existe para o periodo: ${planoAtual.codigo}`);
        return faturaExistente;
      }

      const diasAtraso = Math.max(
        0,
        Math.ceil(
          (new Date().getTime() - planoAtual.proximaCobranca.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      const { juros, multa } = planoAtual.calcularJurosMulta(planoAtual.valorRecorrente, diasAtraso);

      const createFaturaDto: CreateFaturaDto = {
        contratoId: planoAtual.contratoId,
        clienteId: planoAtual.clienteId,
        usuarioResponsavelId: planoAtual.usuarioResponsavelId,
        tipo: TipoFatura.RECORRENTE,
        descricao: `${planoAtual.nome} - Periodo: ${planoAtual.proximaCobranca.toLocaleDateString('pt-BR')}`,
        dataVencimento: planoAtual.proximaCobranca.toISOString().split('T')[0],
        valorDesconto: 0,
        itens: [
          {
            descricao: planoAtual.nome,
            quantidade: 1,
            valorUnitario: planoAtual.valorRecorrente,
            unidade: 'mes',
            codigoProduto: planoAtual.codigo,
          },
        ],
      };

      const fatura = await this.faturamentoService.criarFatura(createFaturaDto, empresaId);

      if (juros > 0 || multa > 0) {
        fatura.valorJuros = juros;
        fatura.valorMulta = multa;
        fatura.valorTotal += juros + multa;
        await this.faturaRepository.save(fatura);
      }

      planoAtual.ciclosExecutados++;
      planoAtual.proximaCobranca = planoAtual.calcularProximaCobranca();

      if (planoAtual.limiteCiclos && planoAtual.ciclosExecutados >= planoAtual.limiteCiclos) {
        planoAtual.status = StatusPlanoCobranca.EXPIRADO;
        planoAtual.dataFim = new Date();
      }

      await this.planoCobrancaRepository.save(planoAtual);

      if (planoAtual.configuracoes?.notificacoesEmail !== false) {
        await this.enviarEmailCobranca(fatura, planoAtual);
      }

      this.logger.log(`Fatura recorrente gerada: ${fatura.numero} para plano ${planoAtual.codigo}`);

      return fatura;
    } catch (error) {
      this.logger.error(`Erro ao gerar fatura recorrente: ${error.message}`);
      throw error;
    }
  }

  async enviarLembreteVencimento(empresaId: string): Promise<void> {
    this.logger.log('Enviando lembretes de vencimento...');

    // Buscar planos que precisam de lembrete
    const dataLembrete = new Date();
    dataLembrete.setDate(dataLembrete.getDate() + 3); // 3 dias antes do vencimento

    const planosLembrete = await this.planoCobrancaRepository
      .createQueryBuilder('plano')
      .leftJoin('plano.contrato', 'contrato')
      .where('plano.status = :status', { status: StatusPlanoCobranca.ATIVO })
      .andWhere('plano.enviarLembrete = :enviarLembrete', { enviarLembrete: true })
      .andWhere('DATE(plano.proximaCobranca) = DATE(:dataLembrete)', { dataLembrete })
      .andWhere('contrato.empresa_id = :empresaId', { empresaId })
      .getMany();

    for (const plano of planosLembrete) {
      try {
        await this.enviarEmailLembrete(plano);
      } catch (error) {
        this.logger.error(`Erro ao enviar lembrete para plano ${plano.codigo}: ${error.message}`);
      }
    }

    this.logger.log(`Enviados ${planosLembrete.length} lembretes de vencimento`);
  }

  private async gerarCodigoPlano(): Promise<string> {
    const ano = new Date().getFullYear();

    const ultimoPlano = await this.planoCobrancaRepository
      .createQueryBuilder('plano')
      .where('plano.codigo LIKE :pattern', { pattern: `PC${ano}%` })
      .orderBy('plano.codigo', 'DESC')
      .getOne();

    let proximoNumero = 1;

    if (ultimoPlano) {
      const numeroAtual = parseInt(ultimoPlano.codigo.replace(`PC${ano}`, ''));
      proximoNumero = numeroAtual + 1;
    }

    return `PC${ano}${proximoNumero.toString().padStart(6, '0')}`;
  }

  private async enviarEmailCobranca(fatura: Fatura, plano: PlanoCobranca): Promise<void> {
    try {
      const emailCliente = `cliente${plano.clienteId}@exemplo.com`;

      const emailData = {
        to: emailCliente,
        subject: `🔔 Nova Cobrança - ${plano.nome}`,
        html: this.gerarEmailCobranca(fatura, plano),
      };

      await this.emailService.enviarEmailGenerico(emailData);
      this.logger.log(`Email de cobrança enviado para plano ${plano.codigo}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar email de cobrança: ${error.message}`);
    }
  }

  private async enviarEmailLembrete(plano: PlanoCobranca): Promise<void> {
    try {
      const emailCliente = `cliente${plano.clienteId}@exemplo.com`;

      const emailData = {
        to: emailCliente,
        subject: `⏰ Lembrete - Vencimento em ${plano.diasAntesLembrete} dias`,
        html: this.gerarEmailLembrete(plano),
      };

      await this.emailService.enviarEmailGenerico(emailData);
      this.logger.log(`Lembrete enviado para plano ${plano.codigo}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar lembrete: ${error.message}`);
    }
  }

  private gerarEmailCobranca(fatura: Fatura, plano: PlanoCobranca): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50;">🔔 Nova Cobrança Disponível</h1>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Plano: ${plano.nome}</h3>
          <p><strong>Período:</strong> ${fatura.dataVencimento.toLocaleDateString('pt-BR')}</p>
          <p><strong>Valor:</strong> R$ ${fatura.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Vencimento:</strong> ${fatura.dataVencimento.toLocaleDateString('pt-BR')}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/faturas/${fatura.id}" 
             style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            💳 Pagar Agora
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          Cobrança automática do seu plano recorrente.
        </p>
      </div>
    `;
  }

  private gerarEmailLembrete(plano: PlanoCobranca): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f39c12;">⏰ Lembrete de Vencimento</h1>
        
        <p>Olá!</p>
        
        <p>Este é um lembrete amigável de que sua próxima cobrança vence em <strong>${plano.diasAntesLembrete} dias</strong>.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
          <h3>Detalhes da Cobrança</h3>
          <p><strong>Plano:</strong> ${plano.nome}</p>
          <p><strong>Valor:</strong> R$ ${plano.valorRecorrente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Vencimento:</strong> ${plano.proximaCobranca.toLocaleDateString('pt-BR')}</p>
        </div>
        
        <p>Certifique-se de que sua forma de pagamento está atualizada para evitar interrupções no serviço.</p>
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          Você está recebendo este lembrete porque optou por notificações de cobrança.
        </p>
      </div>
    `;
  }
}
