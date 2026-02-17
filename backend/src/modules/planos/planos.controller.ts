import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlanosService } from './planos.service';
import { CriarPlanoDto } from './dto/criar-plano.dto';
import { AtualizarPlanoDto } from './dto/atualizar-plano.dto';
import { Plano } from './entities/plano.entity';
import { ModuloSistema } from './entities/modulo-sistema.entity';
import { UserRole } from '../users/user.entity';

@Controller('planos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanosController {
  private readonly logger = new Logger(PlanosController.name);

  constructor(private readonly planosService: PlanosService) {}

  @Get()
  async listarTodos(): Promise<Plano[]> {
    return this.planosService.listarTodos();
  }

  @Get('modulos')
  async listarModulosDisponiveis(): Promise<ModuloSistema[]> {
    return this.planosService.listarModulosDisponiveis();
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string): Promise<Plano> {
    return this.planosService.buscarPorId(id);
  }

  @Get('codigo/:codigo')
  async buscarPorCodigo(@Param('codigo') codigo: string): Promise<Plano> {
    return this.planosService.buscarPorCodigo(codigo);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async criar(@Body() dados: CriarPlanoDto): Promise<Plano> {
    this.logger.log('🔍 Dados recebidos no controller:', dados);
    this.logger.log('🔍 Tipos dos campos:', {
      nome: typeof dados.nome,
      codigo: typeof dados.codigo,
      preco: typeof dados.preco,
      limiteUsuarios: typeof dados.limiteUsuarios,
      limiteClientes: typeof dados.limiteClientes,
      limiteStorage: typeof dados.limiteStorage,
      limiteApiCalls: typeof dados.limiteApiCalls,
    });

    const novoPlano = await this.planosService.criar(dados);
    this.logger.log(`🎉 [PLANOS SUCCESS] Novo plano "${novoPlano.nome}" criado com sucesso!`);

    return novoPlano;
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async atualizar(@Param('id') id: string, @Body() dados: AtualizarPlanoDto): Promise<Plano> {
    this.logger.log('📊 [PLANOS UPDATE] Dados recebidos para atualização:', {
      id,
      data: dados,
      types: {
        preco: typeof dados.preco,
        limiteUsuarios: typeof dados.limiteUsuarios,
        limiteClientes: typeof dados.limiteClientes,
        limiteStorage: typeof dados.limiteStorage,
        limiteApiCalls: typeof dados.limiteApiCalls,
      },
    });

    const planoAtualizado = await this.planosService.atualizar(id, dados);
    this.logger.log(`✅ [PLANOS SUCCESS] Plano "${planoAtualizado.nome}" atualizado com sucesso!`);

    return planoAtualizado;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remover(@Param('id') id: string): Promise<{ message: string }> {
    await this.planosService.remover(id);
    this.logger.log(`🗑️ [PLANOS SUCCESS] Plano com ID "${id}" removido com sucesso!`);
    return { message: 'Plano removido com sucesso' };
  }

  @Put(':id/desativar')
  @Roles(UserRole.ADMIN)
  async desativar(@Param('id') id: string): Promise<Plano> {
    const plano = await this.planosService.desativar(id);
    this.logger.log(`⏸️ [PLANOS SUCCESS] Plano "${plano.nome}" desativado com sucesso!`);
    return plano;
  }

  @Put(':id/ativar')
  @Roles(UserRole.ADMIN)
  async ativar(@Param('id') id: string): Promise<Plano> {
    const plano = await this.planosService.ativar(id);
    this.logger.log(`✅ [PLANOS SUCCESS] Plano "${plano.nome}" ativado com sucesso!`);
    return plano;
  }

  @Put(':id/toggle-status')
  @Roles(UserRole.ADMIN)
  async toggleStatus(@Param('id') id: string): Promise<Plano> {
    const planoAtual = await this.planosService.buscarPorId(id);
    if (!planoAtual) {
      throw new Error('Plano não encontrado');
    }

    const plano = planoAtual.ativo
      ? await this.planosService.desativar(id)
      : await this.planosService.ativar(id);

    const acao = plano.ativo ? 'ativado' : 'desativado';
    const icon = plano.ativo ? '✅' : '⏸️';
    this.logger.log(`${icon} [PLANOS SUCCESS] Plano "${plano.nome}" ${acao} com sucesso!`);

    return plano;
  }
}
