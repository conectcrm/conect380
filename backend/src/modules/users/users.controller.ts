import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Express, Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from './user.entity';

const AVATAR_UPLOAD_SUBDIR = 'avatars';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_SEGMENT = `/uploads/${AVATAR_UPLOAD_SUBDIR}/`;

const ensureAvatarDirectory = (): string => {
  const uploadDir = path.resolve(__dirname, '../../../uploads', AVATAR_UPLOAD_SUBDIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('[Uploads] Diretório de avatares criado:', uploadDir);
  }
  return uploadDir;
};

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  private getAvatarUploadDir(): string {
    return ensureAvatarDirectory();
  }

  private getLocalAvatarPath(avatarUrl?: string | null): string | null {
    if (!avatarUrl) {
      return null;
    }

    const segmentIndex = avatarUrl.indexOf(AVATAR_SEGMENT);
    if (segmentIndex === -1) {
      return null;
    }

    const filePart = avatarUrl.substring(segmentIndex + AVATAR_SEGMENT.length);
    if (!filePart || filePart.includes('..')) {
      return null;
    }

    return path.join(this.getAvatarUploadDir(), filePart);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil retornado com sucesso' })
  async getProfile(@CurrentUser() user: User) {
    const empresa = user.empresa
      ? {
        id: user.empresa.id,
        nome: user.empresa.nome,
        slug: user.empresa.slug,
        cnpj: user.empresa.cnpj,
        plano: user.empresa.plano,
        ativo: user.empresa.ativo,
        subdominio: user.empresa.subdominio,
      }
      : null;

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
        empresa,
      },
    };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  async updateProfile(@CurrentUser() user: User, @Body() updateData: Partial<User>) {
    const updatedUser = await this.usersService.update(user.id, updateData);
    return {
      success: true,
      data: updatedUser,
      message: 'Perfil atualizado com sucesso',
    };
  }

  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: () => ensureAvatarDirectory(),
        filename: (req, file, cb) => {
          const request = req as Request & { user?: User };
          const userId = request?.user?.id || 'user';
          const ext = path.extname(file.originalname)?.toLowerCase() || '.png';
          const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.png';
          const fileName = `${userId}-${Date.now()}${safeExt}`;
          cb(null, fileName);
        },
      }),
      limits: {
        fileSize: parseInt(process.env.AVATAR_MAX_SIZE || '', 10) || 2 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Formato de imagem não suportado. Use JPG, PNG ou WEBP.',
            ) as any,
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Atualizar avatar do usuário logado' })
  @ApiResponse({ status: 200, description: 'Avatar atualizado com sucesso' })
  async uploadAvatar(@CurrentUser() user: User, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Nenhuma imagem foi enviada. Selecione uma foto em JPG, PNG ou WEBP.',
      );
    }

    const newAvatarRelativePath = `${AVATAR_SEGMENT}${file.filename}`;
    const newAvatarFullPath = path.join(this.getAvatarUploadDir(), file.filename);
    const previousAvatarPath = this.getLocalAvatarPath(user.avatar_url);

    try {
      const updatedUser = await this.usersService.update(user.id, {
        avatar_url: newAvatarRelativePath,
      });

      if (!updatedUser) {
        throw new InternalServerErrorException('Usuário não encontrado ao atualizar avatar.');
      }

      if (previousAvatarPath) {
        try {
          await fs.promises.unlink(previousAvatarPath);
        } catch (unlinkError) {
          const errorCode = (unlinkError as NodeJS.ErrnoException)?.code;
          if (errorCode !== 'ENOENT') {
            console.warn(
              '[Uploads] Falha ao remover avatar antigo:',
              previousAvatarPath,
              unlinkError,
            );
          }
        }
      }

      return {
        success: true,
        data: {
          id: updatedUser.id,
          nome: updatedUser.nome,
          email: updatedUser.email,
          avatar_url: updatedUser.avatar_url ?? newAvatarRelativePath,
        },
        message: 'Avatar atualizado com sucesso',
      };
    } catch (error) {
      try {
        await fs.promises.unlink(newAvatarFullPath);
      } catch (cleanupError) {
        const errorCode = (cleanupError as NodeJS.ErrnoException)?.code;
        if (errorCode !== 'ENOENT') {
          console.error(
            '[Uploads] Falha ao remover avatar após erro:',
            newAvatarFullPath,
            cleanupError,
          );
        }
      }

      console.error('[Uploads] Erro ao atualizar avatar do usuário:', error);
      throw new InternalServerErrorException(
        'Não foi possível atualizar seu avatar. Tente novamente em instantes.',
      );
    }
  }

  @Get('team')
  @ApiOperation({ summary: 'Listar usuários da empresa' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
  async getTeam(@CurrentUser() user: User) {
    const team = await this.usersService.findByEmpresa(user.empresa_id);
    return {
      success: true,
      data: team.map((member) => ({
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
      limite: limite ? parseInt(limite, 10) : 10,
      pagina: pagina ? parseInt(pagina, 10) : 1,
      empresa_id: user.empresa_id,
    };

    const result = await this.usersService.listarComFiltros(filtros);

    return {
      success: true,
      data: {
        items: result.usuarios,
        total: result.total,
        pagina: filtros.pagina,
        limite: filtros.limite,
      },
    };
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
  async criarUsuario(@CurrentUser() user: User, @Body() dadosUsuario: any) {
    const novoUsuario = await this.usersService.criar({
      ...dadosUsuario,
      empresa_id: user.empresa_id,
    });

    return {
      success: true,
      data: novoUsuario,
      message: 'Usuário criado com sucesso',
    };
  }

  @Post('debug-create')
  @ApiOperation({ summary: 'ENDPOINT TEMPORÁRIO: Criar usuário para debug (sem autenticação)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  async criarUsuarioDebug(@Body() dadosUsuario: any) {
    const empresaIdPadrao = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    const novoUsuario = await this.usersService.criar({
      ...dadosUsuario,
      empresa_id: empresaIdPadrao,
    });

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
    const usuarioAtualizado = await this.usersService.atualizar(
      id,
      dadosAtualizacao,
      user.empresa_id,
    );
    return {
      success: true,
      data: usuarioAtualizado,
      message: 'Usuário atualizado com sucesso',
    };
  }

  @Put(':id/reset-senha')
  @ApiOperation({ summary: 'Resetar senha do usuário' })
  @ApiResponse({ status: 200, description: 'Senha resetada com sucesso' })
  async resetarSenha(@CurrentUser() user: User, @Param('id') id: string) {
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
  async ativarUsuarios(@CurrentUser() user: User, @Body('ids') ids: string[]) {
    await this.usersService.ativarEmMassa(ids, user.empresa_id);
    return {
      success: true,
      message: 'Usuários ativados com sucesso',
    };
  }

  @Put('bulk/desativar')
  @ApiOperation({ summary: 'Desativar usuários em massa' })
  @ApiResponse({ status: 200, description: 'Usuários desativados com sucesso' })
  async desativarUsuarios(@CurrentUser() user: User, @Body('ids') ids: string[]) {
    await this.usersService.desativarEmMassa(ids, user.empresa_id);
    return {
      success: true,
      message: 'Usuários desativados com sucesso',
    };
  }
}
