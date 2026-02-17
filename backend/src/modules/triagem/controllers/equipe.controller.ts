import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import {
  AdicionarAtendenteEquipeDto,
  CreateEquipeDto,
  UpdateEquipeDto,
} from '../dto';
import { AtribuicaoService } from '../services/atribuicao.service';

@Controller('equipes')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class EquipeController {
  constructor(private readonly atribuicaoService: AtribuicaoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@EmpresaId() empresaId: string, @Body() dto: CreateEquipeDto) {
    return this.atribuicaoService.criarEquipe(empresaId, dto);
  }

  @Get()
  async listar(@EmpresaId() empresaId: string) {
    return this.atribuicaoService.listarEquipes(empresaId);
  }

  @Get(':id')
  async buscar(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.atribuicaoService.buscarEquipe(empresaId, id);
  }

  @Put(':id')
  async atualizar(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEquipeDto,
  ) {
    return this.atribuicaoService.atualizarEquipe(empresaId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remover(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.atribuicaoService.removerEquipe(empresaId, id);
  }

  @Post(':id/atendentes')
  @HttpCode(HttpStatus.CREATED)
  async adicionarAtendente(
    @EmpresaId() empresaId: string,
    @Param('id') equipeId: string,
    @Body() dto: AdicionarAtendenteEquipeDto,
  ) {
    return this.atribuicaoService.adicionarAtendenteNaEquipe(
      empresaId,
      equipeId,
      dto.atendenteId,
      dto.funcao || 'membro',
    );
  }

  @Delete(':id/atendentes/:atendenteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerAtendente(
    @EmpresaId() empresaId: string,
    @Param('id') equipeId: string,
    @Param('atendenteId') atendenteId: string,
  ) {
    await this.atribuicaoService.removerAtendenteDaEquipe(empresaId, equipeId, atendenteId);
  }

  @Get(':id/atendentes')
  async listarAtendentes(@EmpresaId() empresaId: string, @Param('id') equipeId: string) {
    return this.atribuicaoService.listarAtendentesEquipe(empresaId, equipeId);
  }

  @Get(':id/atribuicoes')
  async listarAtribuicoes(@EmpresaId() empresaId: string, @Param('id') equipeId: string) {
    return this.atribuicaoService.listarAtribuicoesEquipe(empresaId, equipeId);
  }
}
