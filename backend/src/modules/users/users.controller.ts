import { Logger,
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
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Express, Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User, UserRole } from './user.entity';

const AVATAR_UPLOAD_SUBDIR = 'avatars';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_SEGMENT = `/uploads/${AVATAR_UPLOAD_SUBDIR}/`;
const avatarLogger = new Logger('UsersController');

const ensureAvatarDirectory = (): string => {
  const uploadDir = path.resolve(__dirname, '../../../uploads', AVATAR_UPLOAD_SUBDIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    avatarLogger.log('[Uploads] Diretório de avatares criado:', uploadDir);
  }
  return uploadDir;
};

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmpresaGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

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

  private normalizeRoleInput(role: unknown): UserRole | null {
    if (typeof role !== 'string') {
      return null;
    }

    const normalized = role.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    switch (normalized) {
      case 'superadmin':
        return UserRole.SUPERADMIN;
      case 'admin':
      case 'administrador':
        return UserRole.ADMIN;
      case 'gerente':
      case 'manager':
      case 'gestor':
        return UserRole.GERENTE;
      case 'vendedor':
        return UserRole.VENDEDOR;
      case 'suporte':
      case 'support':
      case 'user':
      case 'usuario':
      case 'operacional':
        return UserRole.SUPORTE;
      case 'financeiro':
        return UserRole.FINANCEIRO;
      default:
        return null;
    }
  }

  private getManageableRoles(actorRole: UserRole): Set<UserRole> {
    if (actorRole === UserRole.SUPERADMIN) {
      return new Set([
        UserRole.SUPERADMIN,
        UserRole.ADMIN,
        UserRole.GERENTE,
        UserRole.VENDEDOR,
        UserRole.SUPORTE,
        UserRole.FINANCEIRO,
      ]);
    }

    if (actorRole === UserRole.ADMIN) {
      return new Set([UserRole.GERENTE, UserRole.VENDEDOR, UserRole.SUPORTE, UserRole.FINANCEIRO]);
    }

    if (actorRole === UserRole.GERENTE) {
      return new Set([UserRole.VENDEDOR, UserRole.SUPORTE]);
    }

    return new Set();
  }

  private ensureCanAssignRole(actor: User, requestedRole: unknown): void {
    const actorRole = this.normalizeRoleInput(actor.role) ?? UserRole.VENDEDOR;
    const normalizedRequestedRole =
      requestedRole === undefined
        ? UserRole.VENDEDOR
        : this.normalizeRoleInput(requestedRole);

    if (requestedRole !== undefined && !normalizedRequestedRole) {
      throw new BadRequestException('Perfil de usuario invalido');
    }

    if (!normalizedRequestedRole || !this.getManageableRoles(actorRole).has(normalizedRequestedRole)) {
      throw new ForbiddenException('Sem permissao para atribuir este perfil');
    }
  }

  private async ensureCanManageUser(actor: User, userId: string, action: string): Promise<User> {
    const target = await this.usersService.findOne(userId, actor.empresa_id);
    if (!target) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const actorRole = this.normalizeRoleInput(actor.role) ?? UserRole.VENDEDOR;
    const targetRole = this.normalizeRoleInput(target.role);

    if (target.id === actor.id && actorRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        `Nao e permitido ${action} o proprio usuario por este endpoint`,
      );
    }

    if (!targetRole || !this.getManageableRoles(actorRole).has(targetRole)) {
      throw new ForbiddenException(`Sem permissao para ${action} este usuario`);
    }

    return target;
  }

  private sanitizeUser(user?: User | null): any {
    if (!user) {
      return user;
    }

    const { senha, ...safeUser } = user as User & { senha?: string };
    return safeUser;
  }

  private sanitizeProfileUpdatePayload(updateData: Partial<User>): Partial<User> {
    const allowedKeys = new Set(['nome', 'telefone', 'avatar_url', 'idioma_preferido', 'configuracoes']);
    const forbiddenKeys = ['role', 'empresa_id', 'ativo', 'senha', 'permissoes', 'deve_trocar_senha'];
    const payload = updateData ?? {};

    const forbiddenProvided = forbiddenKeys.filter((key) => key in payload);
    if (forbiddenProvided.length > 0) {
      throw new ForbiddenException(
        `Nao e permitido alterar os campos: ${forbiddenProvided.join(', ')}`,
      );
    }

    const unknownKeys = Object.keys(payload).filter((key) => !allowedKeys.has(key));
    if (unknownKeys.length > 0) {
      throw new BadRequestException(`Campos nao permitidos: ${unknownKeys.join(', ')}`);
    }

    const sanitized = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => allowedKeys.has(key) && value !== undefined),
    ) as Partial<User>;

    if (Object.keys(sanitized).length === 0) {
      throw new BadRequestException('Nenhum campo valido para atualizacao de perfil');
    }

    return sanitized;
  }

  private sanitizeUserCreatePayload(dadosUsuario: any): Partial<User> {
    const allowedKeys = new Set([
      'nome',
      'email',
      'senha',
      'telefone',
      'role',
      'permissoes',
      'avatar_url',
      'idioma_preferido',
      'configuracoes',
      'status_atendente',
      'capacidade_maxima',
    ]);
    const payload = dadosUsuario ?? {};
    const unknownKeys = Object.keys(payload).filter((key) => !allowedKeys.has(key));
    if (unknownKeys.length > 0) {
      throw new BadRequestException(`Campos nao permitidos: ${unknownKeys.join(', ')}`);
    }

    return payload;
  }

  private sanitizeUserAdminUpdatePayload(dadosAtualizacao: any): Partial<User> {
    const allowedKeys = new Set([
      'nome',
      'email',
      'telefone',
      'role',
      'permissoes',
      'avatar_url',
      'idioma_preferido',
      'configuracoes',
      'status_atendente',
      'capacidade_maxima',
    ]);
    const payload = dadosAtualizacao ?? {};
    const unknownKeys = Object.keys(payload).filter((key) => !allowedKeys.has(key));

    if (unknownKeys.length > 0) {
      throw new BadRequestException(`Campos nao permitidos: ${unknownKeys.join(', ')}`);
    }

    const sanitized = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined),
    ) as Partial<User>;

    if (Object.keys(sanitized).length === 0) {
      throw new BadRequestException('Nenhum campo valido para atualizacao');
    }

    return sanitized;
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
  @Permissions(Permission.USERS_PROFILE_UPDATE)
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  async updateProfile(@CurrentUser() user: User, @Body() updateData: Partial<User>) {
    const safeUpdateData = this.sanitizeProfileUpdatePayload(updateData);
    const updatedUser = await this.usersService.update(user.id, safeUpdateData);
    return {
      success: true,
      data: this.sanitizeUser(updatedUser),
      message: 'Perfil atualizado com sucesso',
    };
  }

  @Post('profile/avatar')
  @Permissions(Permission.USERS_PROFILE_UPDATE)
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
            this.logger.warn(
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
          this.logger.error(
            '[Uploads] Falha ao remover avatar após erro:',
            newAvatarFullPath,
            cleanupError,
          );
        }
      }

      this.logger.error('[Uploads] Erro ao atualizar avatar do usuário:', error);
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
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
  @Permissions(Permission.USERS_READ)
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
        items: result.usuarios.map((usuario) => this.sanitizeUser(usuario)),
        total: result.total,
        pagina: filtros.pagina,
        limite: filtros.limite,
      },
    };
  }

  @Get('estatisticas')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
  @Permissions(Permission.USERS_READ)
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
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
  @Permissions(Permission.USERS_READ)
  @ApiOperation({ summary: 'Listar usuários com permissão de atendimento' })
  @ApiResponse({ status: 200, description: 'Atendentes retornados com sucesso' })
  async listarAtendentes(@CurrentUser() user: User) {
    const atendentes = await this.usersService.listarAtendentes(user.empresa_id);
    return {
      success: true,
      data: atendentes.map((atendente) => this.sanitizeUser(atendente)),
    };
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
  @Permissions(Permission.USERS_CREATE)
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  async criarUsuario(@CurrentUser() user: User, @Body() dadosUsuario: any) {
    const payload = this.sanitizeUserCreatePayload(dadosUsuario);
    this.ensureCanAssignRole(user, payload.role);

    const novoUsuario = await this.usersService.criar({
      ...payload,
      empresa_id: user.empresa_id,
    });

    return {
      success: true,
      data: this.sanitizeUser(novoUsuario),
      message: 'Usuário criado com sucesso',
    };
  }

  @Put(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
  @Permissions(Permission.USERS_UPDATE)
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  async atualizarUsuario(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dadosAtualizacao: any,
  ) {
    await this.ensureCanManageUser(user, id, 'atualizar');
    const payload = this.sanitizeUserAdminUpdatePayload(dadosAtualizacao);
    if (payload.role !== undefined) {
      this.ensureCanAssignRole(user, payload.role);
    }

    const usuarioAtualizado = await this.usersService.atualizar(
      id,
      payload,
      user.empresa_id,
    );
    return {
      success: true,
      data: this.sanitizeUser(usuarioAtualizado),
      message: 'Usuário atualizado com sucesso',
    };
  }

  @Put(':id/reset-senha')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
  @Permissions(Permission.USERS_RESET_PASSWORD)
  @ApiOperation({ summary: 'Resetar senha do usuário' })
  @ApiResponse({ status: 200, description: 'Senha resetada com sucesso' })
  async resetarSenha(@CurrentUser() user: User, @Param('id') id: string) {
    await this.ensureCanManageUser(user, id, 'resetar senha de');

    const novaSenha = await this.usersService.resetarSenha(id, user.empresa_id);
    return {
      success: true,
      data: { novaSenha },
      message: 'Senha resetada com sucesso',
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
  @Permissions(Permission.USERS_STATUS_UPDATE)
  @ApiOperation({ summary: 'Alterar status do usuário (ativar/desativar)' })
  @ApiResponse({ status: 200, description: 'Status do usuário alterado com sucesso' })
  async alterarStatusUsuario(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('ativo') ativo: boolean,
  ) {
    await this.ensureCanManageUser(user, id, 'alterar status de');
    const usuarioAtualizado = await this.usersService.alterarStatus(id, ativo, user.empresa_id);
    return {
      success: true,
      data: this.sanitizeUser(usuarioAtualizado),
      message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`,
    };
  }

  @Put('bulk/ativar')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
  @Permissions(Permission.USERS_BULK_UPDATE)
  @ApiOperation({ summary: 'Ativar usuários em massa' })
  @ApiResponse({ status: 200, description: 'Usuários ativados com sucesso' })
  async ativarUsuarios(@CurrentUser() user: User, @Body('ids') ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Informe ao menos um ID para ativar');
    }

    for (const id of ids) {
      await this.ensureCanManageUser(user, id, 'ativar');
    }

    await this.usersService.ativarEmMassa(ids, user.empresa_id);
    return {
      success: true,
      message: 'Usuários ativados com sucesso',
    };
  }

  @Put('bulk/desativar')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
  @Permissions(Permission.USERS_BULK_UPDATE)
  @ApiOperation({ summary: 'Desativar usuários em massa' })
  @ApiResponse({ status: 200, description: 'Usuários desativados com sucesso' })
  async desativarUsuarios(@CurrentUser() user: User, @Body('ids') ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Informe ao menos um ID para desativar');
    }

    for (const id of ids) {
      await this.ensureCanManageUser(user, id, 'desativar');
    }

    await this.usersService.desativarEmMassa(ids, user.empresa_id);
    return {
      success: true,
      message: 'Usuários desativados com sucesso',
    };
  }
}
