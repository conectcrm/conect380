import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanosService } from './planos.service';
import { CriarPlanoDto } from './dto/criar-plano.dto';
import { AtualizarPlanoDto } from './dto/atualizar-plano.dto';
import { Plano } from './entities/plano.entity';
import { ModuloSistema } from './entities/modulo-sistema.entity';

@Controller('planos')
@UseGuards(JwtAuthGuard)
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

    const novoPlano = await this.planosService.criar(dados);
    console.log(`🎉 [PLANOS SUCCESS] Novo plano "${novoPlano.nome}" criado com sucesso!`);

    return novoPlano;
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

    const planoAtualizado = await this.planosService.atualizar(id, dados);
    console.log(`✅ [PLANOS SUCCESS] Plano "${planoAtualizado.nome}" atualizado com sucesso!`);

    return planoAtualizado;
  }

  @Delete(':id')
  async remover(@Param('id') id: string): Promise<{ message: string }> {
    await this.planosService.remover(id);
    console.log(`🗑️ [PLANOS SUCCESS] Plano com ID "${id}" removido com sucesso!`);
    return { message: 'Plano removido com sucesso' };
  }

  @Put(':id/desativar')
  async desativar(@Param('id') id: string): Promise<Plano> {
    const plano = await this.planosService.desativar(id);
    console.log(`⏸️ [PLANOS SUCCESS] Plano "${plano.nome}" desativado com sucesso!`);
    return plano;
  }

  @Put(':id/ativar')
  async ativar(@Param('id') id: string): Promise<Plano> {
    const plano = await this.planosService.ativar(id);
    console.log(`✅ [PLANOS SUCCESS] Plano "${plano.nome}" ativado com sucesso!`);
    return plano;
  }

  @Put(':id/toggle-status')
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
    console.log(`${icon} [PLANOS SUCCESS] Plano "${plano.nome}" ${acao} com sucesso!`);

    return plano;
  }
}
