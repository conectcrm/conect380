import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto, VerificarEmailDto } from './dto/empresas.dto';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Permission } from '../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { UserRole } from '../modules/users/user.entity';

@ApiTags('empresas')
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  private extractRequestIp(req: any): string | null {
    const forwardedFor = req?.headers?.['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0]?.trim() || null;
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return String(forwardedFor[0]).trim() || null;
    }

    return req?.ip || req?.socket?.remoteAddress || null;
  }

  private extractUserAgent(req: any): string | null {
    const userAgent = req?.headers?.['user-agent'];
    return typeof userAgent === 'string' && userAgent.trim() ? userAgent.trim() : null;
  }


  @Post('registro')
  @ApiOperation({ summary: 'Registrar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa registrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Empresa já existe' })
  async registrarEmpresa(@Body() createEmpresaDto: CreateEmpresaDto, @Request() req: any) {

    try {
      const empresa = await this.empresasService.registrarEmpresa(createEmpresaDto, {
        ip: this.extractRequestIp(req),
        userAgent: this.extractUserAgent(req),
      });
      return {
        success: true,
        message: 'Empresa registrada com sucesso. Verifique seu email para ativar a conta.',
        data: empresa,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('verificar-cnpj/:cnpj')
  @ApiOperation({ summary: 'Verificar disponibilidade de CNPJ' })
  async verificarCNPJ(@Param('cnpj') cnpj: string) {
    try {
      const disponivel = await this.empresasService.verificarCNPJDisponivel(cnpj);
      return {
        disponivel,
        message: disponivel ? 'CNPJ disponível' : 'CNPJ já cadastrado',
      };
    } catch (error) {
      throw new HttpException('Erro ao verificar CNPJ', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('verificar-email/:email')
  @ApiOperation({ summary: 'Verificar disponibilidade de email' })
  async verificarEmail(@Param('email') email: string) {
    try {
      const disponivel = await this.empresasService.verificarEmailDisponivel(email);
      return {
        disponivel,
        message: disponivel ? 'Email disponível' : 'Email já cadastrado',
      };
    } catch (error) {
      throw new HttpException('Erro ao verificar email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('verificar-email')
  @ApiOperation({ summary: 'Verificar email de ativação' })
  async verificarEmailAtivacao(@Body() verificarEmailDto: VerificarEmailDto) {
    try {
      const resultado = await this.empresasService.verificarEmailAtivacao(verificarEmailDto.token);
      return {
        success: true,
        message: 'Email verificado com sucesso!',
        data: resultado,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Token inválido ou expirado',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reenviar-ativacao')
  @ApiOperation({ summary: 'Reenviar email de ativação' })
  async reenviarEmailAtivacao(@Body() body: { email: string }) {
    try {
      await this.empresasService.reenviarEmailAtivacao(body.email);
      return {
        success: true,
        message: 'Email de ativação reenviado com sucesso!',
      };
    } catch (error) {
      throw new HttpException(error.message || 'Erro ao reenviar email', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('subdominio/:subdominio')
  @ApiOperation({ summary: 'Obter empresa por subdomínio' })
  async obterEmpresaPorSubdominio(@Param('subdominio') subdominio: string) {
    try {
      const empresa = await this.empresasService.obterPorSubdominio(subdominio);
      if (!empresa) {
        throw new HttpException('Empresa não encontrada', HttpStatus.NOT_FOUND);
      }
      return empresa;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id([0-9a-fA-F-]{36})')
  @ApiOperation({ summary: 'Obter empresa por ID' })
  async obterEmpresaPorId(@Param('id') id: string) {
    try {
      const empresa = await this.empresasService.obterPorId(id);
      if (!empresa) {
        throw new HttpException('Empresa não encontrada', HttpStatus.NOT_FOUND);
      }
      return empresa;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.CONFIG_EMPRESA_UPDATE)
  @ApiOperation({ summary: 'Atualizar dados da empresa' })
  async atualizarEmpresa(
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateEmpresaDto>,
  ) {
    try {
      const empresaIdUsuario = req.user?.empresa_id;
      if (!empresaIdUsuario || empresaIdUsuario !== id) {
        throw new HttpException('Acesso negado para atualizar esta empresa', HttpStatus.FORBIDDEN);
      }

      const empresa = await this.empresasService.atualizarEmpresa(id, updateData);
      return {
        success: true,
        message: 'Empresa atualizada com sucesso',
        data: empresa,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao atualizar empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('planos')
  @ApiOperation({ summary: 'Listar planos disponíveis' })
  async listarPlanos() {
    try {
      const planos = await this.empresasService.listarPlanos();
      return planos;
    } catch (error) {
      throw new HttpException('Erro ao listar planos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('status/:empresaId')
  @ApiOperation({ summary: 'Verificar status da empresa' })
  async verificarStatusEmpresa(@Param('empresaId') empresaId: string) {
    try {
      const status = await this.empresasService.verificarStatusEmpresa(empresaId);
      return status;
    } catch (error) {
      throw new HttpException(
        'Erro ao verificar status da empresa',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Controller('minhas-empresas')
@ApiTags('minhas-empresas')
export class MinhasEmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  private mapPlano(planoRaw: string, valorMensal: number | null, limites?: Record<string, any>) {
    const plano = (planoRaw || 'starter').toString().toLowerCase();

    const limitesUsuarios =
      typeof limites?.usuarios === 'number' ? limites.usuarios : plano === 'enterprise' ? -1 : 0;
    const limitesClientes =
      typeof limites?.clientes === 'number' ? limites.clientes : plano === 'enterprise' ? -1 : 0;
    const limitesArmazenamento =
      typeof limites?.armazenamento === 'string'
        ? limites.armazenamento
        : plano === 'enterprise'
          ? 'Ilimitado'
          : '0GB';

    if (plano === 'enterprise') {
      return {
        id: 'enterprise',
        nome: 'Enterprise',
        preco: Number(valorMensal ?? 0),
        features: [],
        limitesUsuarios,
        limitesClientes,
        limitesArmazenamento,
        limites: {
          usuarios: limitesUsuarios,
          clientes: limitesClientes,
          armazenamento: limitesArmazenamento,
        },
      };
    }

    if (plano === 'professional' || plano === 'business' || plano === 'pro') {
      return {
        id: 'professional',
        nome: 'Professional',
        preco: Number(valorMensal ?? 0),
        features: [],
        limitesUsuarios,
        limitesClientes,
        limitesArmazenamento,
        limites: {
          usuarios: limitesUsuarios,
          clientes: limitesClientes,
          armazenamento: limitesArmazenamento,
        },
      };
    }

    return {
      id: 'starter',
      nome: 'Starter',
      preco: Number(valorMensal ?? 0),
      features: [],
      limitesUsuarios,
      limitesClientes,
      limitesArmazenamento,
      limites: {
        usuarios: limitesUsuarios,
        clientes: limitesClientes,
        armazenamento: limitesArmazenamento,
      },
    };
  }

  private mapStatus(statusRaw: string | null | undefined, ativo: boolean): string {
    const status = (statusRaw || '').toLowerCase();
    if (status === 'ativa' || status === 'trial' || status === 'suspensa' || status === 'inativa') {
      return status;
    }
    return ativo ? 'ativa' : 'inativa';
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter empresas do usuario' })
  @ApiResponse({ status: 200, description: 'Lista de empresas retornada com sucesso' })
  async getMinhasEmpresas(@Request() req) {
    try {
      const empresaId = req.user?.empresa_id;
      if (!empresaId) {
        throw new HttpException('empresa_id ausente no token', HttpStatus.UNAUTHORIZED);
      }

      const empresa = await this.empresasService.obterPorId(empresaId);

      const dataCriacao = empresa.created_at ? empresa.created_at.toISOString() : new Date().toISOString();
      const dataVencimento = empresa.data_expiracao
        ? empresa.data_expiracao.toISOString()
        : dataCriacao;
      const ultimoAcesso = empresa.ultimo_acesso ? empresa.ultimo_acesso.toISOString() : dataCriacao;
      const plano = this.mapPlano(empresa.plano, empresa.valor_mensal, empresa.limites || {});
      const status = this.mapStatus(empresa.status, empresa.ativo);

      return {
        success: true,
        empresas: [
          {
            id: empresa.id,
            nome: empresa.nome,
            descricao: null,
            cnpj: empresa.cnpj,
            email: empresa.email,
            telefone: empresa.telefone,
            endereco: empresa.endereco,
            plano,
            status,
            isActive: true,
            dataVencimento,
            dataCriacao,
            ultimoAcesso,
            configuracoes: (empresa.configuracoes as Record<string, unknown>) || {},
            estatisticas: {
              usuariosAtivos: 0,
              totalUsuarios: 0,
              clientesCadastrados: 0,
              propostasEsteAno: 0,
              propostasEsteMes: 0,
              faturaAcumulada: 0,
              crescimentoMensal: 0,
              armazenamentoUsado: '0GB',
              armazenamentoTotal: plano.limitesArmazenamento,
              ultimasAtividades: [],
            },
            permissoes: {
              podeEditarConfiguracoes: true,
              podeGerenciarUsuarios: true,
              podeVerRelatorios: true,
              podeExportarDados: true,
              podeAlterarPlano: true,
            },
          },
        ],
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar empresas',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('switch')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Alternar contexto da empresa ativa' })
  @ApiResponse({ status: 200, description: 'Contexto da empresa atualizado com sucesso' })
  async switchEmpresa(@Request() req, @Body() body: { empresaId?: string }) {
    try {
      const empresaIdUsuario = req.user?.empresa_id;
      const empresaIdSolicitada = body?.empresaId;

      if (!empresaIdUsuario) {
        throw new HttpException('empresa_id ausente no token', HttpStatus.UNAUTHORIZED);
      }

      if (!empresaIdSolicitada) {
        throw new HttpException('empresaId é obrigatório', HttpStatus.BAD_REQUEST);
      }

      // O modelo atual é 1 usuário -> 1 empresa.
      // Mantemos a troca apenas para o próprio contexto do usuário.
      if (empresaIdSolicitada !== empresaIdUsuario) {
        throw new HttpException(
          'Usuário não possui acesso à empresa informada',
          HttpStatus.FORBIDDEN,
        );
      }

      const empresa = await this.empresasService.obterPorId(empresaIdSolicitada);

      return {
        success: true,
        empresaId: empresa.id,
        configuracoes: (empresa.configuracoes as Record<string, unknown>) || {},
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao alternar empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
