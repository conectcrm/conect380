import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
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
  constructor(private readonly usersService: UsersService) {}

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
}
