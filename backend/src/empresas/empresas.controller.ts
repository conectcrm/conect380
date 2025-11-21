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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto, VerificarEmailDto } from './dto/empresas.dto';

@ApiTags('empresas')
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) { }

  @Post('registro')
  @ApiOperation({ summary: 'Registrar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa registrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Empresa já existe' })
  async registrarEmpresa(@Body() createEmpresaDto: CreateEmpresaDto) {
    process.stdout.write('\n🎯 [CONTROLLER] POST /empresas/registro chamado\n');
    process.stdout.write(`📦 [CONTROLLER] Plano: ${createEmpresaDto.plano}\n`);

    try {
      const empresa = await this.empresasService.registrarEmpresa(createEmpresaDto);
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

  @Get(':id')
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
  @ApiOperation({ summary: 'Atualizar dados da empresa' })
  async atualizarEmpresa(@Param('id') id: string, @Body() updateData: Partial<CreateEmpresaDto>) {
    try {
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
  constructor(private readonly empresasService: EmpresasService) { }

  @Get()
  @ApiOperation({ summary: 'Obter empresas do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de empresas retornada com sucesso' })
  async getMinhasEmpresas() {
    try {
      // Por enquanto vamos retornar dados mock
      // TODO: Implementar busca real baseada no usuário autenticado
      const empresasMock = [
        {
          id: '1',
          nome: 'Empresa Exemplo',
          cnpj: '12.345.678/0001-90',
          email: 'contato@empresa.com',
          telefone: '(11) 99999-9999',
          endereco: {
            logradouro: 'Rua Exemplo, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567',
          },
          plano: 'premium',
          status: 'ativa',
          dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          configuracoes: {
            whatsapp: true,
            email: true,
            sms: false,
          },
        },
      ];

      return {
        success: true,
        empresas: empresasMock,
      };
    } catch (error) {
      throw new HttpException('Erro ao buscar empresas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
