import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users-debug')
@Controller('users-debug')
export class UsersDebugController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @ApiOperation({ summary: 'ENDPOINT TEMPORÁRIO: Criar usuário para debug (SEM AUTENTICAÇÃO)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  async criarUsuarioDebug(@Body() dadosUsuario: any) {
    console.log('🚀 UsersDebugController.criarUsuarioDebug - Recebendo dados:', dadosUsuario);

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

  @Post('list-all')
  @ApiOperation({ summary: 'ENDPOINT TEMPORÁRIO: Listar todos os usuários (SEM AUTENTICAÇÃO)' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
  async listarTodosUsuarios() {
    console.log('🚀 UsersDebugController.listarTodosUsuarios - Listando todos os usuários');

    const empresa_id_padrao = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    const result = await this.usersService.listarComFiltros({
      empresa_id: empresa_id_padrao,
      busca: '',
      role: '',
      ativo: undefined,
      ordenacao: 'nome',
      direcao: 'asc',
      limite: 100,
      pagina: 1,
    });

    console.log('✅ Usuários encontrados:', result.usuarios.length);

    return {
      success: true,
      data: result.usuarios,
      total: result.total,
      message: 'Lista de usuários retornada com sucesso',
    };
  }
}
