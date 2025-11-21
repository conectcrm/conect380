import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssinaturaContrato,
  StatusAssinatura,
  TipoAssinatura,
} from '../entities/assinatura-contrato.entity';
import { Contrato, StatusContrato } from '../entities/contrato.entity';
import {
  CreateAssinaturaDto,
  ProcessarAssinaturaDto,
  RejeitarAssinaturaDto,
} from '../dto/assinatura.dto';
import { EmailIntegradoService } from '../../propostas/email-integrado.service';
import * as crypto from 'crypto';

@Injectable()
export class AssinaturaDigitalService {
  private readonly logger = new Logger(AssinaturaDigitalService.name);

  constructor(
    @InjectRepository(AssinaturaContrato)
    private assinaturaRepository: Repository<AssinaturaContrato>,
    @InjectRepository(Contrato)
    private contratoRepository: Repository<Contrato>,
    private emailService: EmailIntegradoService,
  ) {}

  async criarAssinatura(createAssinaturaDto: CreateAssinaturaDto): Promise<AssinaturaContrato> {
    try {
      // Verificar se o contrato existe e está aguardando assinatura
      const contrato = await this.contratoRepository.findOne({
        where: { id: createAssinaturaDto.contratoId },
        relations: ['proposta', 'usuarioResponsavel'],
      });

      if (!contrato) {
        throw new NotFoundException('Contrato não encontrado');
      }

      if (contrato.status !== StatusContrato.AGUARDANDO_ASSINATURA) {
        throw new BadRequestException('Contrato não está aguardando assinatura');
      }

      // Verificar se já existe assinatura pendente para este usuário
      const assinaturaExistente = await this.assinaturaRepository.findOne({
        where: {
          contratoId: createAssinaturaDto.contratoId,
          usuarioId: createAssinaturaDto.usuarioId,
          status: StatusAssinatura.PENDENTE,
        },
      });

      if (assinaturaExistente) {
        throw new BadRequestException(
          'Já existe uma solicitação de assinatura pendente para este usuário',
        );
      }

      // Gerar token de validação único
      const tokenValidacao = this.gerarTokenValidacao();

      // Definir data de expiração (padrão: 30 dias)
      const dataExpiracao = createAssinaturaDto.dataExpiracao
        ? new Date(createAssinaturaDto.dataExpiracao)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

      const assinatura = this.assinaturaRepository.create({
        ...createAssinaturaDto,
        status: StatusAssinatura.PENDENTE,
        tokenValidacao,
        dataEnvio: new Date(),
        dataExpiracao,
      });

      const assinaturaSalva = await this.assinaturaRepository.save(assinatura);

      // Enviar email de solicitação de assinatura
      await this.enviarEmailSolicitacaoAssinatura(assinaturaSalva, contrato);

      this.logger.log(
        `Assinatura criada para contrato ${contrato.numero}, usuário ${createAssinaturaDto.usuarioId}`,
      );

      return assinaturaSalva;
    } catch (error) {
      this.logger.error(`Erro ao criar assinatura: ${error.message}`);
      throw error;
    }
  }

  async processarAssinatura(
    processarAssinaturaDto: ProcessarAssinaturaDto,
  ): Promise<AssinaturaContrato> {
    try {
      // Buscar assinatura pelo token
      const assinatura = await this.assinaturaRepository.findOne({
        where: { tokenValidacao: processarAssinaturaDto.tokenValidacao },
        relations: ['contrato', 'usuario'],
      });

      if (!assinatura) {
        throw new NotFoundException('Token de assinatura inválido');
      }

      if (assinatura.status !== StatusAssinatura.PENDENTE) {
        throw new BadRequestException('Esta assinatura já foi processada');
      }

      if (assinatura.isExpirado()) {
        assinatura.status = StatusAssinatura.EXPIRADO;
        await this.assinaturaRepository.save(assinatura);
        throw new BadRequestException('Token de assinatura expirado');
      }

      // Processar assinatura
      assinatura.status = StatusAssinatura.ASSINADO;
      assinatura.dataAssinatura = new Date();
      assinatura.hashAssinatura = processarAssinaturaDto.hashAssinatura;
      assinatura.ipAssinatura = processarAssinaturaDto.ipAssinatura;
      assinatura.userAgent = processarAssinaturaDto.userAgent;

      if (processarAssinaturaDto.metadados) {
        assinatura.metadados = processarAssinaturaDto.metadados;
      }

      const assinaturaAtualizada = await this.assinaturaRepository.save(assinatura);

      // Verificar se todas as assinaturas necessárias foram realizadas
      await this.verificarAssinaturasCompletas(assinatura.contratoId);

      this.logger.log(`Assinatura processada para contrato ${assinatura.contrato.numero}`);

      return assinaturaAtualizada;
    } catch (error) {
      this.logger.error(`Erro ao processar assinatura: ${error.message}`);
      throw error;
    }
  }

  async rejeitarAssinatura(
    rejeitarAssinaturaDto: RejeitarAssinaturaDto,
  ): Promise<AssinaturaContrato> {
    try {
      const assinatura = await this.assinaturaRepository.findOne({
        where: { tokenValidacao: rejeitarAssinaturaDto.tokenValidacao },
        relations: ['contrato', 'usuario'],
      });

      if (!assinatura) {
        throw new NotFoundException('Token de assinatura inválido');
      }

      if (assinatura.status !== StatusAssinatura.PENDENTE) {
        throw new BadRequestException('Esta assinatura já foi processada');
      }

      assinatura.status = StatusAssinatura.REJEITADO;
      assinatura.motivoRejeicao = rejeitarAssinaturaDto.motivoRejeicao;

      const assinaturaAtualizada = await this.assinaturaRepository.save(assinatura);

      this.logger.log(`Assinatura rejeitada para contrato ${assinatura.contrato.numero}`);

      return assinaturaAtualizada;
    } catch (error) {
      this.logger.error(`Erro ao rejeitar assinatura: ${error.message}`);
      throw error;
    }
  }

  async buscarAssinaturasPorContrato(contratoId: number): Promise<AssinaturaContrato[]> {
    return this.assinaturaRepository.find({
      where: { contratoId },
      relations: ['usuario'],
      order: { createdAt: 'DESC' },
    });
  }

  async buscarAssinaturaPorToken(token: string): Promise<AssinaturaContrato> {
    const assinatura = await this.assinaturaRepository.findOne({
      where: { tokenValidacao: token },
      relations: ['contrato', 'contrato.proposta', 'usuario'],
    });

    if (!assinatura) {
      throw new NotFoundException('Token de assinatura não encontrado');
    }

    return assinatura;
  }

  async verificarAssinaturasExpiradas(): Promise<void> {
    const assinaturasExpiradas = await this.assinaturaRepository
      .createQueryBuilder('assinatura')
      .where('assinatura.status = :status', { status: StatusAssinatura.PENDENTE })
      .andWhere('assinatura.dataExpiracao < :agora', { agora: new Date() })
      .getMany();

    for (const assinatura of assinaturasExpiradas) {
      assinatura.status = StatusAssinatura.EXPIRADO;
      await this.assinaturaRepository.save(assinatura);
      this.logger.log(`Assinatura expirada: Token ${assinatura.tokenValidacao}`);
    }
  }

  private async verificarAssinaturasCompletas(contratoId: number): Promise<void> {
    const contrato = await this.contratoRepository.findOne({
      where: { id: contratoId },
      relations: ['assinaturas'],
    });

    if (!contrato) return;

    // Verificar se todas as assinaturas obrigatórias foram realizadas
    const assinaturasAssinadas = contrato.assinaturas.filter(
      (a) => a.status === StatusAssinatura.ASSINADO,
    );
    const assinaturasPendentes = contrato.assinaturas.filter(
      (a) => a.status === StatusAssinatura.PENDENTE,
    );

    // Para este exemplo, consideramos que o contrato está pronto quando há pelo menos uma assinatura
    // Em cenários reais, você pode ter regras mais complexas
    if (assinaturasAssinadas.length > 0 && assinaturasPendentes.length === 0) {
      contrato.status = StatusContrato.ASSINADO;
      contrato.dataAssinatura = new Date();
      await this.contratoRepository.save(contrato);

      this.logger.log(`Contrato ${contrato.numero} marcado como assinado`);
    }
  }

  private gerarTokenValidacao(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private gerarTemplateEmailAssinatura(dados: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">✍️ Solicitação de Assinatura</h1>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Olá <strong>${dados.nomeUsuario}</strong>,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Você foi solicitado para assinar o seguinte contrato:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">📋 Detalhes do Contrato</h3>
            <p style="margin: 5px 0;"><strong>Número:</strong> ${dados.numeroContrato}</p>
            <p style="margin: 5px 0;"><strong>Objeto:</strong> ${dados.objetoContrato}</p>
            <p style="margin: 5px 0;"><strong>Valor:</strong> ${dados.valorContrato}</p>
            <p style="margin: 5px 0;"><strong>Válido até:</strong> ${dados.dataVencimento}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dados.linkAssinatura}" 
               style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
              ✍️ Assinar Contrato
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              ⚠️ <strong>Importante:</strong> Este link é válido até ${dados.dataVencimento}. Após esta data, uma nova solicitação será necessária.
            </p>
          </div>
          
          <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
            Este email foi enviado automaticamente pelo sistema ${dados.empresa}.
          </p>
        </div>
      </div>
    `;
  }

  private async enviarEmailSolicitacaoAssinatura(
    assinatura: AssinaturaContrato,
    contrato: Contrato,
  ): Promise<void> {
    try {
      // Buscar dados do usuário para obter o email
      const usuario = await this.assinaturaRepository
        .createQueryBuilder('assinatura')
        .leftJoinAndSelect('assinatura.usuario', 'usuario')
        .where('assinatura.id = :id', { id: assinatura.id })
        .getOne();

      if (!usuario?.usuario?.email) {
        this.logger.warn(`Usuário sem email para assinatura do contrato ${contrato.numero}`);
        return;
      }

      const linkAssinatura = `${process.env.FRONTEND_URL}/contratos/assinar/${assinatura.tokenValidacao}`;

      const templateData = {
        nomeUsuario: usuario.usuario.nome || 'Usuário',
        numeroContrato: contrato.numero,
        objetoContrato: contrato.objeto,
        valorContrato: contrato.valorTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        dataVencimento: assinatura.dataExpiracao.toLocaleDateString('pt-BR'),
        linkAssinatura,
        empresa: process.env.EMPRESA_NOME || 'ConectCRM',
      };

      await this.emailService.enviarEmailGenerico({
        to: usuario.usuario.email,
        subject: `Solicitação de Assinatura - Contrato ${contrato.numero}`,
        html: this.gerarTemplateEmailAssinatura(templateData),
      });

      this.logger.log(`Email de solicitação de assinatura enviado para ${usuario.usuario.email}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar email de solicitação de assinatura: ${error.message}`);
    }
  }
}
