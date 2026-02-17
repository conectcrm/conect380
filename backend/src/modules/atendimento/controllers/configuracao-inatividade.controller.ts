import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Departamento } from '../../triagem/entities/departamento.entity';
import { ConfiguracaoInactivityDto } from '../dto/configuracao-inatividade.dto';
import { ConfiguracaoInatividade } from '../entities/configuracao-inatividade.entity';
import { InactivityMonitorService } from '../services/inactivity-monitor.service';

@Controller('atendimento/configuracao-inatividade')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class ConfiguracaoInactividadeController {
  private readonly logger = new Logger(ConfiguracaoInactividadeController.name);

  constructor(
    @InjectRepository(ConfiguracaoInatividade)
    private readonly repository: Repository<ConfiguracaoInatividade>,
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>,
    private readonly monitorService: InactivityMonitorService,
  ) {}

  @Get()
  async buscarPorEmpresa(@EmpresaId() empresaId: string, @Query('departamentoId') departamentoId?: string) {
    this.validarEmpresa(empresaId);

    const where: { empresaId: string; departamentoId?: string | null } = { empresaId };
    where.departamentoId = departamentoId ? departamentoId : null;

    let config = await this.repository.findOne({ where });

    if (!config) {
      config = this.repository.create({
        empresaId,
        departamentoId: departamentoId || null,
        timeoutMinutos: 1440,
        enviarAviso: true,
        avisoMinutosAntes: 60,
        mensagemAviso: null,
        mensagemFechamento: null,
        ativo: false,
        statusAplicaveis: ['AGUARDANDO', 'EM_ATENDIMENTO'],
      });
    }

    return {
      sucesso: true,
      dados: config,
      sugestoes: {
        timeouts: [
          { valor: 30, label: '30 minutos' },
          { valor: 60, label: '1 hora' },
          { valor: 120, label: '2 horas' },
          { valor: 240, label: '4 horas' },
          { valor: 480, label: '8 horas' },
          { valor: 720, label: '12 horas' },
          { valor: 1440, label: '24 horas' },
          { valor: 2880, label: '48 horas' },
        ],
        mensagemAvisoPadrao:
          'Este atendimento sera encerrado automaticamente em {{minutos}} minutos por inatividade.\n\n' +
          'Se ainda precisar de ajuda, responda esta mensagem.',
        mensagemFechamentoPadrao:
          'Este atendimento foi encerrado automaticamente devido a inatividade.\n\n' +
          'Se precisar de ajuda novamente, inicie uma nova conversa.',
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async salvar(@EmpresaId() empresaId: string, @Body() dto: ConfiguracaoInactivityDto) {
    this.validarEmpresa(empresaId);
    const savedConfig = await this.salvarOuAtualizar(empresaId, dto);

    return {
      sucesso: true,
      mensagem: 'Configuracao salva com sucesso',
      dados: savedConfig,
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async atualizar(@EmpresaId() empresaId: string, @Body() dto: ConfiguracaoInactivityDto) {
    this.validarEmpresa(empresaId);
    const savedConfig = await this.salvarOuAtualizar(empresaId, dto);

    return {
      sucesso: true,
      mensagem: 'Configuracao atualizada com sucesso',
      dados: savedConfig,
    };
  }

  @Put(['ativar', ':empresaId/ativar'])
  async toggleAtivar(
    @EmpresaId() empresaId: string,
    @Body('ativo') ativo: boolean,
    @Body('departamentoId') departamentoIdBody?: string,
    @Query('departamentoId') departamentoIdQuery?: string,
  ) {
    this.validarEmpresa(empresaId);

    const departamentoId = departamentoIdBody ?? departamentoIdQuery ?? null;
    const where: { empresaId: string; departamentoId?: string | null } = { empresaId };
    where.departamentoId = departamentoId;

    const config = await this.repository.findOne({ where });

    if (!config) {
      return {
        sucesso: false,
        erro: 'Configuracao nao encontrada. Configure primeiro.',
      };
    }

    config.ativo = Boolean(ativo);
    const salvo = await this.repository.save(config);

    return {
      sucesso: true,
      mensagem: salvo.ativo ? 'Fechamento automatico ATIVADO' : 'Fechamento automatico DESATIVADO',
      dados: salvo,
    };
  }

  @Post('verificar-agora')
  @HttpCode(HttpStatus.OK)
  async verificarAgora(
    @EmpresaId() empresaId: string,
    @Query('departamentoId') departamentoId?: string,
  ) {
    this.validarEmpresa(empresaId);
    const resultado = await this.monitorService.verificarImediatamente(empresaId, departamentoId);

    return {
      sucesso: true,
      mensagem: 'Verificacao executada com sucesso',
      resultado,
    };
  }

  @Get(['departamentos', 'departamentos/:empresaId'])
  async listarDepartamentos(@EmpresaId() empresaId: string) {
    this.validarEmpresa(empresaId);

    const departamentos = await this.departamentoRepository.find({
      where: { empresaId, ativo: true },
      select: ['id', 'nome', 'descricao', 'cor', 'icone'],
      order: { ordem: 'ASC', nome: 'ASC' },
    });

    return {
      sucesso: true,
      dados: departamentos,
    };
  }

  @Get(['lista', 'lista/:empresaId'])
  async listarPorEmpresa(@EmpresaId() empresaId: string) {
    this.validarEmpresa(empresaId);

    const configs = await this.repository.find({
      where: { empresaId },
      relations: ['departamento'],
      order: { departamentoId: 'ASC' },
    });

    return {
      sucesso: true,
      dados: configs,
    };
  }

  private validarEmpresa(empresaId?: string): asserts empresaId is string {
    if (!empresaId) {
      throw new ForbiddenException('Usuario nao possui empresa associada');
    }
  }

  private async salvarOuAtualizar(empresaId: string, dto: ConfiguracaoInactivityDto) {
    if (dto.timeoutMinutos < 5) {
      throw new BadRequestException('Timeout minimo e 5 minutos');
    }

    if (dto.avisoMinutosAntes && dto.avisoMinutosAntes >= dto.timeoutMinutos) {
      throw new BadRequestException('Aviso deve ser menor que o timeout');
    }

    const where: { empresaId: string; departamentoId?: string | null } = { empresaId };
    where.departamentoId = dto.departamentoId || null;

    this.logger.debug(`Salvando configuracao de inatividade para empresa=${empresaId}`);

    let config = await this.repository.findOne({ where });

    if (!config) {
      config = this.repository.create({
        empresaId,
        departamentoId: dto.departamentoId || null,
      });
    }

    config.timeoutMinutos = dto.timeoutMinutos;
    config.enviarAviso = dto.enviarAviso ?? true;
    config.avisoMinutosAntes = dto.avisoMinutosAntes ?? 60;
    config.mensagemAviso = dto.mensagemAviso || null;
    config.mensagemFechamento = dto.mensagemFechamento || null;
    config.ativo = dto.ativo ?? true;
    config.statusAplicaveis = dto.statusAplicaveis || ['AGUARDANDO', 'EM_ATENDIMENTO'];

    return await this.repository.save(config);
  }
}
