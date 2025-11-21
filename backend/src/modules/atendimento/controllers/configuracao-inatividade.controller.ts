/**
 * 🎛️ Controller de Configuração de Inatividade
 *
 * Endpoints para gerenciar fechamento automático de tickets por inatividade
 * 🔐 SEGURANÇA: Todos os endpoints protegidos com JWT - empresa_id extraído do token
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracaoInatividade } from '../entities/configuracao-inatividade.entity';
import { InactivityMonitorService } from '../services/inactivity-monitor.service';
import { Departamento } from '../../triagem/entities/departamento.entity';
import { ConfiguracaoInactivityDto } from '../dto/configuracao-inatividade.dto';

@Controller('atendimento/configuracao-inatividade')
@UseGuards(AuthGuard('jwt')) // 🔐 Proteção global - requer autenticação JWT
export class ConfiguracaoInactividadeController {
  constructor(
    @InjectRepository(ConfiguracaoInatividade)
    private readonly repository: Repository<ConfiguracaoInatividade>,
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>,
    private readonly monitorService: InactivityMonitorService,
  ) { }

  /**
   * GET /atendimento/configuracao-inatividade
   * Busca configuração de inatividade da empresa do usuário logado
   * 🔐 SEGURANÇA: empresa_id extraído do JWT
   *
   * Query params:
   * - departamentoId: UUID do departamento (opcional, se omitido = global)
   */
  @Get()
  async buscarPorEmpresa(
    @Request() req,
    @Query('departamentoId') departamentoId?: string,
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT
    const empresaId = req.user.empresa_id;

    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }

    const where: any = { empresaId };

    if (departamentoId) {
      where.departamentoId = departamentoId;
    } else {
      // Buscar configuração global (departamentoId = null)
      where.departamentoId = null;
    }

    let config = await this.repository.findOne({ where });

    // Se não existir, retorna configuração padrão
    if (!config) {
      config = this.repository.create({
        empresaId,
        departamentoId: departamentoId || null,
        timeoutMinutos: 1440, // 24 horas
        enviarAviso: true,
        avisoMinutosAntes: 60,
        mensagemAviso: null,
        mensagemFechamento: null,
        ativo: false, // Desativado até configurar explicitamente
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
          '⚠️ Este atendimento será encerrado automaticamente em {{minutos}} minutos por inatividade.\n\n' +
          'Se ainda precisar de ajuda, por favor responda esta mensagem.',
        mensagemFechamentoPadrao:
          '✅ Este atendimento foi encerrado automaticamente devido à inatividade.\n\n' +
          'Se precisar de ajuda novamente, inicie uma nova conversa. Estamos sempre à disposição!',
      },
    };
  }

  /**
   * POST /atendimento/configuracao-inatividade
   * Cria ou atualiza configuração (global ou por departamento)
   * 🔐 SEGURANÇA: empresa_id extraído do JWT
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async salvar(@Request() req, @Body() dto: ConfiguracaoInactivityDto) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT
    const empresaId = req.user.empresa_id;

    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }

    console.log('🔍 [Controller] Recebido DTO:', JSON.stringify(dto));
    console.log('🔍 [Controller] Tipo do DTO:', typeof dto);
    console.log('🔍 [Controller] Keys do DTO:', Object.keys(dto));
    console.log('🔍 [Controller] timeoutMinutos:', dto.timeoutMinutos, typeof dto.timeoutMinutos);

    // Validações
    if (dto.timeoutMinutos < 5) {
      console.log('❌ [Controller] Validação falhou: timeout muito baixo');
      return {
        sucesso: false,
        erro: 'Timeout mínimo é 5 minutos',
      };
    }

    if (dto.avisoMinutosAntes && dto.avisoMinutosAntes >= dto.timeoutMinutos) {
      console.log('❌ [Controller] Validação falhou: aviso >= timeout');
      return {
        sucesso: false,
        erro: 'Aviso deve ser menor que o timeout',
      };
    }

    // Buscar ou criar
    const where: any = { empresaId };
    if (dto.departamentoId) {
      where.departamentoId = dto.departamentoId;
    } else {
      where.departamentoId = null;
    }

    console.log('🔍 [Controller] Buscando configuração com where:', JSON.stringify(where));
    let config = await this.repository.findOne({ where });

    if (!config) {
      console.log('✨ [Controller] Criando nova configuração');
      config = this.repository.create({
        empresaId,
        departamentoId: dto.departamentoId || null,
      });
    } else {
      console.log('✏️ [Controller] Atualizando configuração existente:', config.id);
    }

    // Atualizar campos
    config.timeoutMinutos = dto.timeoutMinutos;
    config.enviarAviso = dto.enviarAviso ?? true;
    config.avisoMinutosAntes = dto.avisoMinutosAntes ?? 60;
    config.mensagemAviso = dto.mensagemAviso || null;
    config.mensagemFechamento = dto.mensagemFechamento || null;
    config.ativo = dto.ativo ?? true;
    config.statusAplicaveis = dto.statusAplicaveis || ['AGUARDANDO', 'EM_ATENDIMENTO'];

    console.log(
      '💾 [Controller] Salvando configuração:',
      JSON.stringify({
        id: config.id,
        timeoutMinutos: config.timeoutMinutos,
        avisoMinutosAntes: config.avisoMinutosAntes,
        ativo: config.ativo,
      }),
    );

    const savedConfig = await this.repository.save(config);

    console.log('✅ [Controller] Configuração salva com ID:', savedConfig.id);

    return {
      sucesso: true,
      mensagem: 'Configuração salva com sucesso',
      dados: savedConfig,
    };
  }

  /**
   * PUT /atendimento/configuracao-inatividade/:empresaId/ativar
   * Ativa/desativa fechamento automático
   */
  @Put(':empresaId/ativar')
  async toggleAtivar(@Param('empresaId') empresaId: string, @Body('ativo') ativo: boolean) {
    const config = await this.repository.findOne({
      where: { empresaId },
    });

    if (!config) {
      return {
        sucesso: false,
        erro: 'Configuração não encontrada. Configure primeiro.',
      };
    }

    config.ativo = ativo;
    await this.repository.save(config);

    return {
      sucesso: true,
      mensagem: ativo ? 'Fechamento automático ATIVADO' : 'Fechamento automático DESATIVADO',
      dados: config,
    };
  }

  /**
   * POST /atendimento/configuracao-inatividade/verificar-agora
   * Força verificação imediata (útil para testes)
   * Query params opcionais: empresaId, departamentoId
   */
  @Post('verificar-agora')
  @HttpCode(HttpStatus.OK)
  async verificarAgora(
    @Query('empresaId') empresaId?: string,
    @Query('departamentoId') departamentoId?: string,
  ) {
    const resultado = await this.monitorService.verificarImediatamente(empresaId, departamentoId);

    return {
      sucesso: true,
      mensagem: 'Verificação executada com sucesso',
      resultado,
    };
  }

  /**
   * GET /atendimento/configuracao-inatividade
   * Lista todas as configurações (admin)
   */
  @Get()
  async listarTodas() {
    const configs = await this.repository.find({
      relations: ['departamento'],
      order: {
        empresaId: 'ASC',
        departamentoId: 'ASC',
      },
    });

    return {
      sucesso: true,
      total: configs.length,
      dados: configs,
    };
  }

  /**
   * GET /atendimento/configuracao-inatividade/departamentos/:empresaId
   * Lista departamentos de uma empresa (para seleção no frontend)
   */
  @Get('departamentos/:empresaId')
  async listarDepartamentos(@Param('empresaId') empresaId: string) {
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

  /**
   * GET /atendimento/configuracao-inatividade/lista/:empresaId
   * Lista TODAS as configurações de uma empresa (global + departamentos)
   */
  @Get('lista/:empresaId')
  async listarPorEmpresa(@Param('empresaId') empresaId: string) {
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
}
