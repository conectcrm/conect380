import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contrato, StatusContrato } from '../entities/contrato.entity';
import { AssinaturaContrato, StatusAssinatura } from '../entities/assinatura-contrato.entity';
import { CreateContratoDto, UpdateContratoDto } from '../dto/contrato.dto';
import { PdfContratoService } from './pdf-contrato.service';
import { AssinaturaDigitalService } from './assinatura-digital.service';

@Injectable()
export class ContratosService {
  private readonly logger = new Logger(ContratosService.name);

  constructor(
    @InjectRepository(Contrato)
    private contratoRepository: Repository<Contrato>,
    @InjectRepository(AssinaturaContrato)
    private assinaturaRepository: Repository<AssinaturaContrato>,
    private pdfContratoService: PdfContratoService,
    private assinaturaDigitalService: AssinaturaDigitalService,
  ) { }

  async criarContrato(createContratoDto: CreateContratoDto): Promise<Contrato> {
    try {
      // Gerar número único do contrato
      const numero = await this.gerarNumeroContrato();

      const contrato = this.contratoRepository.create({
        ...createContratoDto,
        numero,
        status: StatusContrato.AGUARDANDO_ASSINATURA,
      });

      const contratoSalvo = await this.contratoRepository.save(contrato);

      // Gerar PDF do contrato
      const caminhoArquivoPDF = await this.pdfContratoService.gerarPDFContrato(contratoSalvo);

      // Atualizar com caminho do PDF e hash
      const hashDocumento = await this.pdfContratoService.calcularHashDocumento(caminhoArquivoPDF);

      contratoSalvo.caminhoArquivoPDF = caminhoArquivoPDF;
      contratoSalvo.hashDocumento = hashDocumento;

      const contratoAtualizado = await this.contratoRepository.save(contratoSalvo);

      this.logger.log(`Contrato criado: ${contratoAtualizado.numero}`);

      return contratoAtualizado;
    } catch (error) {
      this.logger.error(`Erro ao criar contrato: ${error.message}`);
      throw new BadRequestException('Erro ao criar contrato');
    }
  }

  async buscarContratos(
    empresaId: number,
    filtros?: {
      status?: StatusContrato;
      clienteId?: number;
      dataInicio?: Date;
      dataFim?: Date;
    }
  ): Promise<Contrato[]> {
    // Consulta simplificada para teste - sem joins por enquanto
    const query = this.contratoRepository
      .createQueryBuilder('contrato')
      .where('contrato.ativo = :ativo', { ativo: true });

    if (filtros?.status) {
      query.andWhere('contrato.status = :status', { status: filtros.status });
    }

    if (filtros?.clienteId) {
      query.andWhere('contrato.clienteId = :clienteId', { clienteId: filtros.clienteId });
    }

    if (filtros?.dataInicio) {
      query.andWhere('contrato.dataInicio >= :dataInicio', { dataInicio: filtros.dataInicio });
    }

    if (filtros?.dataFim) {
      query.andWhere('contrato.dataFim <= :dataFim', { dataFim: filtros.dataFim });
    }

    return query
      .orderBy('contrato.createdAt', 'DESC')
      .getMany();
  }

  async buscarContratoPorId(id: number): Promise<Contrato> {
    const contrato = await this.contratoRepository.findOne({
      where: { id, ativo: true },
      relations: ['proposta', 'usuarioResponsavel', 'assinaturas', 'assinaturas.usuario'],
    });

    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado');
    }

    return contrato;
  }

  async buscarContratoPorNumero(numero: string): Promise<Contrato> {
    const contrato = await this.contratoRepository.findOne({
      where: { numero, ativo: true },
      relations: ['proposta', 'usuarioResponsavel', 'assinaturas', 'assinaturas.usuario'],
    });

    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado');
    }

    return contrato;
  }

  async atualizarContrato(id: number, updateContratoDto: UpdateContratoDto): Promise<Contrato> {
    const contrato = await this.buscarContratoPorId(id);

    if (contrato.status === StatusContrato.ASSINADO) {
      throw new BadRequestException('Não é possível alterar contrato já assinado');
    }

    Object.assign(contrato, updateContratoDto);

    // Se alterou dados importantes, regenerar PDF
    const camposImportantes = ['objeto', 'valorTotal', 'dataInicio', 'dataFim', 'condicoesPagamento'];
    const houveAlteracaoImportante = camposImportantes.some(campo =>
      updateContratoDto.hasOwnProperty(campo)
    );

    if (houveAlteracaoImportante) {
      const novoCaminhoArquivoPDF = await this.pdfContratoService.gerarPDFContrato(contrato);
      const novoHashDocumento = await this.pdfContratoService.calcularHashDocumento(novoCaminhoArquivoPDF);

      contrato.caminhoArquivoPDF = novoCaminhoArquivoPDF;
      contrato.hashDocumento = novoHashDocumento;

      // Invalidar assinaturas pendentes
      await this.invalidarAssinaturasPendentes(id);
    }

    const contratoAtualizado = await this.contratoRepository.save(contrato);
    this.logger.log(`Contrato atualizado: ${contratoAtualizado.numero}`);

    return contratoAtualizado;
  }

  async marcarComoAssinado(id: number): Promise<Contrato> {
    const contrato = await this.buscarContratoPorId(id);

    if (contrato.status === StatusContrato.ASSINADO) {
      throw new BadRequestException('Contrato já está assinado');
    }

    // Verificar se todas as assinaturas obrigatórias foram realizadas
    const assinaturasAssinadas = contrato.assinaturas.filter(a => a.isAssinado());

    if (assinaturasAssinadas.length === 0) {
      throw new BadRequestException('Nenhuma assinatura válida encontrada');
    }

    contrato.status = StatusContrato.ASSINADO;
    contrato.dataAssinatura = new Date();

    const contratoAtualizado = await this.contratoRepository.save(contrato);
    this.logger.log(`Contrato assinado: ${contratoAtualizado.numero}`);

    return contratoAtualizado;
  }

  async cancelarContrato(id: number, motivo?: string): Promise<Contrato> {
    const contrato = await this.buscarContratoPorId(id);

    if (contrato.status === StatusContrato.ASSINADO) {
      throw new BadRequestException('Não é possível cancelar contrato já assinado');
    }

    contrato.status = StatusContrato.CANCELADO;
    if (motivo) {
      contrato.observacoes = `${contrato.observacoes || ''}\n\nCancelado: ${motivo}`;
    }

    const contratoAtualizado = await this.contratoRepository.save(contrato);
    this.logger.log(`Contrato cancelado: ${contratoAtualizado.numero}`);

    return contratoAtualizado;
  }

  async verificarContratosExpirados(): Promise<void> {
    const contratosExpirados = await this.contratoRepository
      .createQueryBuilder('contrato')
      .where('contrato.status = :status', { status: StatusContrato.AGUARDANDO_ASSINATURA })
      .andWhere('contrato.dataVencimento < :agora', { agora: new Date() })
      .andWhere('contrato.ativo = :ativo', { ativo: true })
      .getMany();

    for (const contrato of contratosExpirados) {
      contrato.status = StatusContrato.EXPIRADO;
      await this.contratoRepository.save(contrato);
      this.logger.log(`Contrato expirado: ${contrato.numero}`);
    }
  }

  private async gerarNumeroContrato(): Promise<string> {
    const ano = new Date().getFullYear();

    const ultimoContrato = await this.contratoRepository
      .createQueryBuilder('contrato')
      .where('contrato.numero LIKE :pattern', { pattern: `CT${ano}%` })
      .orderBy('contrato.numero', 'DESC')
      .getOne();

    let proximoNumero = 1;

    if (ultimoContrato) {
      const numeroAtual = parseInt(ultimoContrato.numero.replace(`CT${ano}`, ''));
      proximoNumero = numeroAtual + 1;
    }

    return `CT${ano}${proximoNumero.toString().padStart(6, '0')}`;
  }

  private async invalidarAssinaturasPendentes(contratoId: number): Promise<void> {
    await this.assinaturaRepository
      .createQueryBuilder()
      .update()
      .set({ status: StatusAssinatura.EXPIRADO })
      .where('contratoId = :contratoId', { contratoId })
      .andWhere('status = :status', { status: StatusAssinatura.PENDENTE })
      .execute();
  }
}
