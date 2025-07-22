import { Controller, Post, Body, Get, Param, Query, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto, VerificarEmailDto } from './dto/empresas.dto';

@ApiTags('empresas')
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post('registro')
  @ApiOperation({ summary: 'Registrar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa registrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Empresa já existe' })
  async registrarEmpresa(@Body() createEmpresaDto: CreateEmpresaDto) {
    try {
      const empresa = await this.empresasService.registrarEmpresa(createEmpresaDto);
      return {
        success: true,
        message: 'Empresa registrada com sucesso. Verifique seu email para ativar a conta.',
        data: empresa
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
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
        message: disponivel ? 'CNPJ disponível' : 'CNPJ já cadastrado'
      };
    } catch (error) {
      throw new HttpException(
        'Erro ao verificar CNPJ',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('verificar-email/:email')
  @ApiOperation({ summary: 'Verificar disponibilidade de email' })
  async verificarEmail(@Param('email') email: string) {
    try {
      const disponivel = await this.empresasService.verificarEmailDisponivel(email);
      return {
        disponivel,
        message: disponivel ? 'Email disponível' : 'Email já cadastrado'
      };
    } catch (error) {
      throw new HttpException(
        'Erro ao verificar email',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
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
        data: resultado
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Token inválido ou expirado',
        HttpStatus.BAD_REQUEST
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
        message: 'Email de ativação reenviado com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao reenviar email',
        HttpStatus.BAD_REQUEST
      );
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
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
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
      throw new HttpException(
        'Erro ao listar planos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
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
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
