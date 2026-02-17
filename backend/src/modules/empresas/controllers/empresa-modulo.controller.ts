import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { ensureDevelopmentOnly } from '../../../common/utils/dev-only.util';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateEmpresaModuloDto } from '../dto/create-empresa-modulo.dto';
import { UpdateEmpresaModuloDto } from '../dto/update-empresa-modulo.dto';
import { ModuloEnum, PlanoEnum } from '../entities/empresa-modulo.entity';
import { EmpresaModuloService } from '../services/empresa-modulo.service';

@Controller('empresas/modulos')
export class EmpresaModuloController {
  constructor(private readonly empresaModuloService: EmpresaModuloService) {}

  @Post('seed-all-public')
  async seedAllEmpresasPublic() {
    ensureDevelopmentOnly('POST /empresas/modulos/seed-all-public');
    try {
      const result = await this.empresaModuloService.seedAllEmpresas();
      return {
        success: true,
        message: 'Todas as empresas foram configuradas com plano ENTERPRISE',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('ativos')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  async listarModulosAtivos(@EmpresaId() empresaId: string) {
    const modulos = await this.empresaModuloService.listarModulosAtivos(empresaId);

    return {
      success: true,
      data: modulos,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  async listar(@EmpresaId() empresaId: string) {
    const modulos = await this.empresaModuloService.listar(empresaId);

    return {
      success: true,
      data: modulos,
    };
  }

  @Get('verificar/:modulo')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  async verificarModulo(@EmpresaId() empresaId: string, @Param('modulo') modulo: ModuloEnum) {
    const ativo = await this.empresaModuloService.isModuloAtivo(empresaId, modulo);

    return {
      success: true,
      data: { modulo, ativo },
    };
  }

  @Get('plano')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  async getPlano(@EmpresaId() empresaId: string) {
    const plano = await this.empresaModuloService.getPlanoAtual(empresaId);

    return {
      success: true,
      data: { plano },
    };
  }

  @Post('ativar')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  async ativarModulo(@EmpresaId() empresaId: string, @Body() dto: CreateEmpresaModuloDto) {
    const modulo = await this.empresaModuloService.ativar(empresaId, dto);

    return {
      success: true,
      message: `Modulo ${dto.modulo} ativado com sucesso`,
      data: modulo,
    };
  }

  @Delete(':modulo')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  async desativarModulo(@EmpresaId() empresaId: string, @Param('modulo') modulo: ModuloEnum) {
    await this.empresaModuloService.desativar(empresaId, modulo);

    return {
      success: true,
      message: `Modulo ${modulo} desativado com sucesso`,
    };
  }

  @Patch(':modulo')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  async atualizarModulo(
    @EmpresaId() empresaId: string,
    @Param('modulo') modulo: ModuloEnum,
    @Body() dto: UpdateEmpresaModuloDto,
  ) {
    const moduloAtualizado = await this.empresaModuloService.atualizar(empresaId, modulo, dto);

    return {
      success: true,
      message: `Modulo ${modulo} atualizado com sucesso`,
      data: moduloAtualizado,
    };
  }

  @Post('plano/:plano')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  async ativarPlano(@EmpresaId() empresaId: string, @Param('plano') plano: PlanoEnum) {
    await this.empresaModuloService.ativarPlano(empresaId, plano);

    return {
      success: true,
      message: `Plano ${plano} ativado com sucesso`,
    };
  }
}
