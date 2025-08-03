import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { AssinaturasService } from './assinaturas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CriarAssinaturaDto } from './dto/criar-assinatura.dto';

@Controller('assinaturas')
@UseGuards(JwtAuthGuard)
export class AssinaturasController {
  constructor(private readonly assinaturasService: AssinaturasService) { }

  @Get()
  async listar(@Query('status') status?: 'ativa' | 'cancelada' | 'suspensa' | 'pendente') {
    return this.assinaturasService.listarTodas(status);
  }

  @Get('empresa/:empresaId')
  async buscarPorEmpresa(@Param('empresaId') empresaId: string) {
    return this.assinaturasService.buscarPorEmpresa(empresaId);
  }

  @Get('empresa/:empresaId/limites')
  async verificarLimites(@Param('empresaId') empresaId: string) {
    return this.assinaturasService.verificarLimites(empresaId);
  }

  @Post()
  async criar(@Body() dados: CriarAssinaturaDto) {
    return this.assinaturasService.criar(dados);
  }

  @Patch('empresa/:empresaId/plano')
  async alterarPlano(
    @Param('empresaId') empresaId: string,
    @Body('novoPlanoId') novoPlanoId: string
  ) {
    return this.assinaturasService.alterarPlano(empresaId, novoPlanoId);
  }

  @Patch('empresa/:empresaId/cancelar')
  async cancelar(
    @Param('empresaId') empresaId: string,
    @Body('dataFim') dataFim?: string
  ) {
    const dataFimParsed = dataFim ? new Date(dataFim) : undefined;
    return this.assinaturasService.cancelar(empresaId, dataFimParsed);
  }

  @Patch('empresa/:empresaId/suspender')
  async suspender(@Param('empresaId') empresaId: string) {
    return this.assinaturasService.suspender(empresaId);
  }

  @Patch('empresa/:empresaId/reativar')
  async reativar(@Param('empresaId') empresaId: string) {
    return this.assinaturasService.reativar(empresaId);
  }

  @Patch('empresa/:empresaId/contadores')
  async atualizarContadores(
    @Param('empresaId') empresaId: string,
    @Body() dados: {
      usuariosAtivos?: number;
      clientesCadastrados?: number;
      storageUtilizado?: number;
    }
  ) {
    return this.assinaturasService.atualizarContadores(empresaId, dados);
  }

  @Post('empresa/:empresaId/api-call')
  async registrarChamadaApi(@Param('empresaId') empresaId: string) {
    const permiteCall = await this.assinaturasService.registrarChamadaApi(empresaId);

    return {
      success: true,
      permiteCall,
      message: permiteCall ? 'Chamada API registrada' : 'Limite de chamadas API excedido'
    };
  }
}
