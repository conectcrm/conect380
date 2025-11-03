import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from './user.entity';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('profile')
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil retornado com sucesso' })
  async getProfile(@CurrentUser() user: User) {
    return {
      success: true,
      data: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        role: user.role,
        avatar_url: user.avatar_url,
        idioma_preferido: user.idioma_preferido,
        empresa: {
          id: user.empresa.id,
          nome: user.empresa.nome,
          slug: user.empresa.slug,
        },
      },
    };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateData: Partial<User>,
  ) {
    const updatedUser = await this.usersService.update(user.id, updateData);
    return {
      success: true,
      data: updatedUser,
      message: 'Perfil atualizado com sucesso',
    };
  }

  @Get('team')
  @ApiOperation({ summary: 'Listar usuários da empresa' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
  async getTeam(@CurrentUser() user: User) {
    const team = await this.usersService.findByEmpresa(user.empresa_id);
    return {
      success: true,
      data: team.map(member => ({
        id: member.id,
        nome: member.nome,
        email: member.email,
        role: member.role,
        avatar_url: member.avatar_url,
        ativo: member.ativo,
        ultimo_login: member.ultimo_login,
      })),
    };
  }

  @Get(['', '/'])
  @ApiOperation({ summary: 'Listar usuários com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de usuários com filtros retornada com sucesso' })
  async listarUsuarios(
    @CurrentUser() user: User,
    @Query('busca') busca?: string,
    @Query('role') role?: string,
    @Query('ativo') ativo?: string,
    @Query('ordenacao') ordenacao?: string,
    @Query('direcao') direcao?: string,
    @Query('limite') limite?: string,
    @Query('pagina') pagina?: string,
  ) {
    const filtros = {
      busca: busca || '',
      role: role || '',
      ativo: ativo ? ativo === 'true' : undefined,
      ordenacao: ordenacao || 'nome',
      direcao: direcao || 'asc',
      limite: limite ? parseInt(limite) : 10,
      pagina: pagina ? parseInt(pagina) : 1,
      empresa_id: user.empresa_id,
    };

    const result = await this.usersService.listarComFiltros(filtros);
    console.log('Controller - Filtros:', filtros);
    console.log('Controller - Resultado:', result);
    return result.usuarios;
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas dos usuários' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  async obterEstatisticas(@CurrentUser() user: User) {
    const stats = await this.usersService.obterEstatisticas(user.empresa_id);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('atendentes')
  @ApiOperation({ summary: 'Listar usuários com permissão de atendimento' })
  @ApiResponse({ status: 200, description: 'Atendentes retornados com sucesso' })
  async listarAtendentes(@CurrentUser() user: User) {
    const atendentes = await this.usersService.listarAtendentes(user.empresa_id);
    return {
      success: true,
      data: atendentes,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  async criarUsuario(
    @CurrentUser() user: User,
    @Body() dadosUsuario: any,
  ) {
    console.log('🚀 UsersController.criarUsuario - Recebendo dados:', dadosUsuario);
    console.log('🚀 Usuário logado:', user.id, user.email);

    const novoUsuario = await this.usersService.criar({
      ...dadosUsuario,
      empresa_id: user.empresa_id,
    });

    console.log('✅ Usuário criado com sucesso:', novoUsuario.id);

    return {
      success: true,
      data: novoUsuario,
      message: 'Usuário criado com sucesso',
    };
  }

  @Post('debug-create')
  @ApiOperation({ summary: 'ENDPOINT TEMPORÁRIO: Criar usuário para debug (SEM AUTENTICAÇÃO)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  async criarUsuarioDebug(
    @Body() dadosUsuario: any,
  ) {
    console.log('🚀 UsersController.criarUsuarioDebug - Recebendo dados:', dadosUsuario);

    // Usar empresa padrão para teste
    const empresa_id_padrao = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    const novoUsuario = await this.usersService.criar({
      ...dadosUsuario,
      empresa_id: empresa_id_padrao,
    });

    console.log('✅ Usuário DEBUG criado com sucesso:', novoUsuario.id);

    return {
      success: true,
      data: novoUsuario,
      message: 'Usuário DEBUG criado com sucesso',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  async atualizarUsuario(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dadosAtualizacao: any,
  ) {
    const usuarioAtualizado = await this.usersService.atualizar(id, dadosAtualizacao, user.empresa_id);
    return {
      success: true,
      data: usuarioAtualizado,
      message: 'Usuário atualizado com sucesso',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir usuário' })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso' })
  async excluirUsuario(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.usersService.excluir(id, user.empresa_id);
    return {
      success: true,
      message: 'Usuário excluído com sucesso',
    };
  }

  @Put(':id/reset-senha')
  @ApiOperation({ summary: 'Resetar senha do usuário' })
  @ApiResponse({ status: 200, description: 'Senha resetada com sucesso' })
  async resetarSenha(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const novaSenha = await this.usersService.resetarSenha(id, user.empresa_id);
    return {
      success: true,
      data: { novaSenha },
      message: 'Senha resetada com sucesso',
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Alterar status do usuário (ativar/desativar)' })
  @ApiResponse({ status: 200, description: 'Status do usuário alterado com sucesso' })
  async alterarStatusUsuario(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('ativo') ativo: boolean,
  ) {
    const usuarioAtualizado = await this.usersService.alterarStatus(id, ativo, user.empresa_id);
    return {
      success: true,
      data: usuarioAtualizado,
      message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`,
    };
  }

  @Put('bulk/ativar')
  @ApiOperation({ summary: 'Ativar usuários em massa' })
  @ApiResponse({ status: 200, description: 'Usuários ativados com sucesso' })
  async ativarUsuarios(
    @CurrentUser() user: User,
    @Body('ids') ids: string[],
  ) {
    await this.usersService.ativarEmMassa(ids, user.empresa_id);
    return {
      success: true,
      message: 'Usuários ativados com sucesso',
    };
  }

  @Put('bulk/desativar')
  @ApiOperation({ summary: 'Desativar usuários em massa' })
  @ApiResponse({ status: 200, description: 'Usuários desativados com sucesso' })
  async desativarUsuarios(
    @CurrentUser() user: User,
    @Body('ids') ids: string[],
  ) {
    await this.usersService.desativarEmMassa(ids, user.empresa_id);
    return {
      success: true,
      message: 'Usuários desativados com sucesso',
    };
  }
}
