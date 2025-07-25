import { Controller, Get, Post, Body, UseGuards, Request, Query, Logger } from '@nestjs/common';
import { UserActivitiesService } from './services/user-activities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AtividadeTipo } from './entities/user-activity.entity';

@ApiTags('user-activities')
@Controller('users/atividades')
export class UserActivitiesController {
  private readonly logger = new Logger(UserActivitiesController.name);

  constructor(private readonly userActivitiesService: UserActivitiesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter atividades de usuários' })
  @ApiResponse({ status: 200, description: 'Atividades listadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async listarAtividades(@Request() req: any, @Query('limit') limit: number) {
    this.logger.log(`Obtendo atividades para empresa ${req.user.empresaId}`);
    
    return this.userActivitiesService.listarAtividades(
      req.user.empresaId, 
      limit ? parseInt(limit.toString(), 10) : 20
    );
  }

  @Post('registrar')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Registrar atividade de usuário' })
  @ApiResponse({ status: 201, description: 'Atividade registrada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async registrarAtividade(@Request() req: any, @Body() dadosAtividade: {
    tipo: AtividadeTipo;
    descricao: string;
    detalhes?: string;
  }) {
    this.logger.log(`Registrando atividade: ${dadosAtividade.tipo}`);
    
    return this.userActivitiesService.registrarAtividade(
      req.user.id,
      req.user.empresaId,
      dadosAtividade.tipo,
      dadosAtividade.descricao,
      dadosAtividade.detalhes
    );
  }
}
