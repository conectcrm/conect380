import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { AtribuirAtendenteDto, AtribuirEquipeDto, BuscarAtendentesDisponiveisDto } from '../dto';
import { AtribuicaoService } from '../services/atribuicao.service';

@Controller('atribuicoes')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CONFIG_AUTOMACOES_MANAGE)
export class AtribuicaoController {
  private readonly logger = new Logger(AtribuicaoController.name);

  constructor(private readonly atribuicaoService: AtribuicaoService) {}

  @Post('atendente')
  @HttpCode(HttpStatus.CREATED)
  async atribuirAtendente(@EmpresaId() empresaId: string, @Body() dto: AtribuirAtendenteDto) {
    return this.atribuicaoService.atribuirAtendenteANucleoDepartamento(empresaId, dto);
  }

  @Delete('atendente/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerAtribuicaoAtendente(
    @EmpresaId() empresaId: string,
    @Param('id') atribuicaoId: string,
  ) {
    await this.atribuicaoService.removerAtribuicaoAtendente(empresaId, atribuicaoId);
  }

  @Get('atendente/:atendenteId')
  async listarAtribuicoesAtendente(
    @EmpresaId() empresaId: string,
    @Param('atendenteId') atendenteId: string,
  ) {
    return this.atribuicaoService.listarAtribuicoesAtendente(empresaId, atendenteId);
  }

  @Post('equipe')
  @HttpCode(HttpStatus.CREATED)
  async atribuirEquipe(@EmpresaId() empresaId: string, @Body() dto: AtribuirEquipeDto) {
    this.logger.log('[AtribuicaoController] Recebido DTO de atribuicao de equipe', dto);
    return this.atribuicaoService.atribuirEquipeANucleoDepartamento(empresaId, dto);
  }

  @Delete('equipe/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerAtribuicaoEquipe(@EmpresaId() empresaId: string, @Param('id') atribuicaoId: string) {
    await this.atribuicaoService.removerAtribuicaoEquipe(empresaId, atribuicaoId);
  }

  @Get('equipe/:equipeId')
  async listarAtribuicoesEquipe(
    @EmpresaId() empresaId: string,
    @Param('equipeId') equipeId: string,
  ) {
    return this.atribuicaoService.listarAtribuicoesEquipe(empresaId, equipeId);
  }

  @Get('disponiveis')
  async buscarAtendentesDisponiveis(
    @EmpresaId() empresaId: string,
    @Query() query: BuscarAtendentesDisponiveisDto,
  ) {
    return this.atribuicaoService.buscarAtendentesDisponiveis(
      empresaId,
      query.nucleoId,
      query.departamentoId,
    );
  }
}
