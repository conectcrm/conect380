import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { OportunidadesService } from './oportunidades.service';
import { CreateOportunidadeDto, UpdateOportunidadeDto, UpdateEstagioDto, MetricasQueryDto } from './dto/oportunidade.dto';
import { CreateAtividadeDto } from './dto/atividade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { EstagioOportunidade } from './oportunidade.entity';

@Controller('oportunidades')
// @UseGuards(JwtAuthGuard) // Temporariamente comentado para teste
export class OportunidadesController {
  constructor(private readonly oportunidadesService: OportunidadesService) {}

  @Post()
  create(@Body() createOportunidadeDto: CreateOportunidadeDto, @CurrentUser() user?: User) {
    // Mock user para teste com UUID válido
    const mockUser = user || { 
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // UUID fixo para teste
      role: 'admin', 
      empresa_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
      nome: 'Admin Teste'
    } as User;
    return this.oportunidadesService.create(createOportunidadeDto, mockUser);
  }

  @Get()
  findAll(
    @CurrentUser() user?: User,
    @Query('estagio') estagio?: EstagioOportunidade,
    @Query('responsavel_id') responsavel_id?: string,
    @Query('cliente_id') cliente_id?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    // Mock user para teste
    const mockUser = user || { 
      id: 'mock-user', 
      role: 'admin', 
      empresa_id: '1',
      nome: 'Admin Teste'
    } as User;

    const filters = {
      estagio,
      responsavel_id: responsavel_id ? parseInt(responsavel_id) : undefined,
      cliente_id: cliente_id ? parseInt(cliente_id) : undefined,
      dataInicio,
      dataFim
    };

    return this.oportunidadesService.findAll(mockUser, filters);
  }

  @Get('pipeline')
  getPipelineData(@CurrentUser() user?: User) {
    // Mock user para teste
    const mockUser = user || { 
      id: 'mock-user', 
      role: 'admin', 
      empresa_id: '1',
      nome: 'Admin Teste'
    } as User;
    return this.oportunidadesService.getPipelineData(mockUser);
  }

  @Get('metricas')
  getMetricas(
    @CurrentUser() user?: User,
    @Query() queryDto?: MetricasQueryDto,
  ) {
    // Mock user para teste
    const mockUser = user || { 
      id: 'mock-user', 
      role: 'admin', 
      empresa_id: '1',
      nome: 'Admin Teste'
    } as User;
    return this.oportunidadesService.getMetricas(mockUser, queryDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: User) {
    // Mock user para teste
    const mockUser = user || { 
      id: 'mock-user', 
      role: 'admin', 
      empresa_id: '1',
      nome: 'Admin Teste'
    } as User;
    return this.oportunidadesService.findOne(id, mockUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateOportunidadeDto: UpdateOportunidadeDto,
    @CurrentUser() user?: User
  ) {
    // Mock user para teste
    const mockUser = user || { 
      id: 'mock-user', 
      role: 'admin', 
      empresa_id: '1',
      nome: 'Admin Teste'
    } as User;
    return this.oportunidadesService.update(id, updateOportunidadeDto, mockUser);
  }

  @Patch(':id/estagio')
  updateEstagio(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstagioDto: UpdateEstagioDto,
    @CurrentUser() user?: User
  ) {
    // Mock user para teste
    const mockUser = user || { 
      id: 'mock-user', 
      role: 'admin', 
      empresa_id: '1',
      nome: 'Admin Teste'
    } as User;
    return this.oportunidadesService.updateEstagio(id, updateEstagioDto, mockUser);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: User) {
    // Mock user para teste
    const mockUser = user || { 
      id: 'mock-user', 
      role: 'admin', 
      empresa_id: '1',
      nome: 'Admin Teste'
    } as User;
    return this.oportunidadesService.remove(id, mockUser);
  }

  @Post(':id/atividades')
  createAtividade(
    @Param('id', ParseIntPipe) id: number,
    @Body() createAtividadeDto: CreateAtividadeDto,
    @CurrentUser() user?: User
  ) {
    // Mock user para teste
    const mockUser = user || { 
      id: 'mock-user', 
      role: 'admin', 
      empresa_id: '1',
      nome: 'Admin Teste'
    } as User;
    createAtividadeDto.oportunidade_id = id;
    return this.oportunidadesService.createAtividade(createAtividadeDto, mockUser);
  }
}
