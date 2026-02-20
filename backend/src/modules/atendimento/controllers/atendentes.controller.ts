import { Logger, Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { AtendenteService } from '../services/atendente.service';
import { CriarAtendenteDto, AtualizarAtendenteDto, AtualizarStatusAtendenteDto } from '../dto';

@Controller('atendimento/atendentes')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.ATENDIMENTO_FILAS_MANAGE)
export class AtendentesController {
  private readonly logger = new Logger(AtendentesController.name);
  constructor(private atendenteService: AtendenteService) {
    this.logger.log('✅ AtendentesController inicializado');
  }

  @Get()
  async listar(@EmpresaId() empresaId: string) {
    const atendentes = await this.atendenteService.listar(empresaId);

    return {
      success: true,
      data: atendentes,
      total: atendentes.length,
    };
  }

  @Get(':id')
  async buscarPorId(@EmpresaId() empresaId: string, @Param('id') id: string) {
    const atendente = await this.atendenteService.buscarPorId(id, empresaId);

    return {
      success: true,
      data: atendente,
    };
  }

  @Post()
  async criar(@EmpresaId() empresaId: string, @Body() dto: CriarAtendenteDto) {
    // ⚡ Service cria User automaticamente se não existir
    const resultado = await this.atendenteService.criar(dto, empresaId);

    return {
      success: true,
      message: resultado.usuarioCriado
        ? 'Atendente criado! Usuário gerado automaticamente.'
        : 'Atendente criado e vinculado ao usuário existente',
      data: resultado.atendente,
      senhaTemporaria: resultado.senhaTemporaria, // ⚡ Frontend vai usar isso!
    };
  }

  @Put(':id')
  async atualizar(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: AtualizarAtendenteDto,
  ) {
    const atendente = await this.atendenteService.atualizar(id, dto, empresaId);

    return {
      success: true,
      message: 'Atendente atualizado com sucesso',
      data: atendente,
    };
  }

  @Delete(':id')
  async deletar(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.atendenteService.deletar(id, empresaId);

    return {
      success: true,
      message: 'Atendente excluído com sucesso',
    };
  }

  @Put(':id/status')
  async atualizarStatus(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: AtualizarStatusAtendenteDto,
  ) {
    const atendente = await this.atendenteService.atualizarStatus(id, dto.status, empresaId);

    return {
      success: true,
      message: 'Status atualizado com sucesso',
      data: atendente,
    };
  }
}
