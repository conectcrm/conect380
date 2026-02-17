import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ensureDevelopmentOnly } from '../../common/utils/dev-only.util';
import { UsersService } from './users.service';

@ApiTags('users-debug')
@Controller('users-debug')
export class UsersDebugController {
  constructor(private readonly usersService: UsersService) {}

  private resolveDebugEmpresaId(): string {
    const empresaId = process.env.DEFAULT_EMPRESA_ID?.trim();

    if (!empresaId) {
      throw new BadRequestException('DEFAULT_EMPRESA_ID deve estar definido para endpoints de debug');
    }

    return empresaId;
  }

  @Post('create')
  @ApiOperation({ summary: 'ENDPOINT TEMPORARIO: Criar usuario para debug (SEM AUTENTICACAO)' })
  @ApiResponse({ status: 201, description: 'Usuario criado com sucesso' })
  async criarUsuarioDebug(@Body() dadosUsuario: any) {
    ensureDevelopmentOnly('POST /users-debug/create');
    const empresa_id_padrao = this.resolveDebugEmpresaId();

    const novoUsuario = await this.usersService.criar({
      ...dadosUsuario,
      empresa_id: empresa_id_padrao,
    });

    return {
      success: true,
      data: novoUsuario,
      message: 'Usuario DEBUG criado com sucesso',
    };
  }

  @Post('list-all')
  @ApiOperation({ summary: 'ENDPOINT TEMPORARIO: Listar todos os usuarios (SEM AUTENTICACAO)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios retornada com sucesso' })
  async listarTodosUsuarios() {
    ensureDevelopmentOnly('POST /users-debug/list-all');
    const empresa_id_padrao = this.resolveDebugEmpresaId();

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

    return {
      success: true,
      data: result.usuarios,
      total: result.total,
      message: 'Lista de usuarios retornada com sucesso',
    };
  }
}
