import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanosService } from './planos.service';
import { CriarPlanoDto } from './dto/criar-plano.dto';
import { AtualizarPlanoDto } from './dto/atualizar-plano.dto';
import { Plano } from './entities/plano.entity';
import { ModuloSistema } from './entities/modulo-sistema.entity';

@Controller('planos')
// @UseGuards(JwtAuthGuard) // Temporariamente desabilitado para testes
export class PlanosController {
  constructor(private readonly planosService: PlanosService) { }

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
  async criar(@Body() dados: CriarPlanoDto): Promise<Plano> {
    console.log('🔍 Dados recebidos no controller:', dados);
    console.log('🔍 Tipos dos campos:', {
      nome: typeof dados.nome,
      codigo: typeof dados.codigo,
      preco: typeof dados.preco,
      limiteUsuarios: typeof dados.limiteUsuarios,
      limiteClientes: typeof dados.limiteClientes,
      limiteStorage: typeof dados.limiteStorage,
      limiteApiCalls: typeof dados.limiteApiCalls
    });
    return this.planosService.criar(dados);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarPlanoDto
  ): Promise<Plano> {
    console.log('📊 [PLANOS UPDATE] Dados recebidos para atualização:', {
      id,
      data: dados,
      types: {
        preco: typeof dados.preco,
        limiteUsuarios: typeof dados.limiteUsuarios,
        limiteClientes: typeof dados.limiteClientes,
        limiteStorage: typeof dados.limiteStorage,
        limiteApiCalls: typeof dados.limiteApiCalls,
      }
    });
    return this.planosService.atualizar(id, dados);
  }

  @Delete(':id')
  async remover(@Param('id') id: string): Promise<{ message: string }> {
    await this.planosService.remover(id);
    return { message: 'Plano removido com sucesso' };
  }

  @Put(':id/desativar')
  async desativar(@Param('id') id: string): Promise<Plano> {
    return this.planosService.desativar(id);
  }

  @Put(':id/ativar')
  async ativar(@Param('id') id: string): Promise<Plano> {
    return this.planosService.ativar(id);
  }
}
