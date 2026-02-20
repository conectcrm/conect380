import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Header,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  ParseUUIDPipe,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ClientesService } from './clientes.service';
import { Cliente, StatusCliente } from './cliente.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { PaginationParams } from '../../common/interfaces/common.interface';
import { CacheInterceptor, CacheTTL } from '../../common/interceptors/cache.interceptor';
import { CacheService } from '../../common/services/cache.service';

const CLIENTES_UPLOADS_SUBDIR = 'clientes';
const CLIENTES_AVATAR_SUBDIR = 'avatar';
const CLIENTES_ANEXOS_SUBDIR = 'anexos';
const CLIENTE_AVATAR_SEGMENT = `/uploads/${CLIENTES_UPLOADS_SUBDIR}/${CLIENTES_AVATAR_SUBDIR}/`;
const CLIENTE_ANEXOS_SEGMENT = `/uploads/${CLIENTES_UPLOADS_SUBDIR}/${CLIENTES_ANEXOS_SUBDIR}/`;

const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const ensureClientesUploadDirectory = (subdir: string): string => {
  const uploadDir = path.resolve(__dirname, '../../../uploads', CLIENTES_UPLOADS_SUBDIR, subdir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

@ApiTags('clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_CLIENTES_READ)
@UseInterceptors(CacheInterceptor)
@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly clientesService: ClientesService,
    private readonly cacheService: CacheService,
  ) {}

  private getAvatarUploadDir(): string {
    return ensureClientesUploadDirectory(CLIENTES_AVATAR_SUBDIR);
  }

  private getAnexoUploadDir(): string {
    return ensureClientesUploadDirectory(CLIENTES_ANEXOS_SUBDIR);
  }

  private getLocalPathFromSegment(fileUrl?: string | null, segment?: string): string | null {
    if (!fileUrl || !segment) {
      return null;
    }

    const segmentIndex = fileUrl.indexOf(segment);
    if (segmentIndex === -1) {
      return null;
    }

    const filePart = fileUrl.substring(segmentIndex + segment.length);
    if (!filePart || filePart.includes('..')) {
      return null;
    }

    if (segment === CLIENTE_AVATAR_SEGMENT) {
      return path.join(this.getAvatarUploadDir(), filePart);
    }

    if (segment === CLIENTE_ANEXOS_SEGMENT) {
      return path.join(this.getAnexoUploadDir(), filePart);
    }

    return null;
  }

  private normalizeAnexoPayload(anexo: any) {
    if (!anexo) {
      return anexo;
    }

    return {
      ...anexo,
      cliente_id: anexo.clienteId ?? anexo.cliente_id,
      empresa_id: anexo.empresaId ?? anexo.empresa_id,
    };
  }

  private normalizeClientePayload(cliente: any) {
    if (!cliente) {
      return cliente;
    }

    return {
      ...cliente,
      empresa_id: cliente.empresaId ?? cliente.empresa_id,
      avatar_url: cliente.avatar_url ?? cliente.avatarUrl ?? cliente.avatar,
      avatar: cliente.avatar ?? cliente.avatar_url ?? cliente.avatarUrl,
      avatarUrl: cliente.avatarUrl ?? cliente.avatar_url ?? cliente.avatar,
    };
  }

  private invalidateClientesCache(empresaId: string) {
    const prefixes = [
      // Tenant-aware keys (current behavior)
      `${empresaId}:/clientes`,
      `${empresaId}:/api/clientes`,
      // Legacy/default tenant keys
      'default:/clientes',
      'default:/api/clientes',
      // Safety net: clear any clientes route regardless of tenant key format
      '/clientes',
      '/api/clientes',
    ];

    prefixes.forEach((prefix) => this.cacheService.invalidate(prefix));
  }

  @Get()
  @CacheTTL(2 * 60 * 1000) // 2 minutes
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'tipo', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Lista de clientes retornada com sucesso' })
  async findAll(@EmpresaId() empresaId: string, @Query() params: PaginationParams) {
    const response = await this.clientesService.findAll(empresaId, params);

    return {
      success: true,
      data: response.data.map((cliente) => this.normalizeClientePayload(cliente)),
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
      pagination: response.pagination,
    };
  }

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="clientes.csv"')
  @ApiOperation({ summary: 'Exportar clientes em CSV' })
  @ApiQuery({ name: 'ids', required: false, isArray: true, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'tipo', required: false, type: String })
  @ApiResponse({ status: 200, description: 'CSV de clientes gerado com sucesso' })
  async exportClientes(
    @EmpresaId() empresaId: string,
    @Query() params: PaginationParams & { ids?: string[] | string },
  ) {
    const clientes = await this.clientesService.listForExport(empresaId, params);
    const csv = this.clientesService.exportToCsv(
      clientes.map((cliente) => this.normalizeClientePayload(cliente)),
    );

    // Prefixo BOM para melhor compatibilidade com Excel.
    return `\uFEFF${csv}`;
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Listar clientes por status' })
  @ApiResponse({ status: 200, description: 'Clientes por status retornados com sucesso' })
  async getByStatus(@EmpresaId() empresaId: string, @Param('status') status: StatusCliente) {
    const clientes = await this.clientesService.getByStatus(empresaId, status);

    return {
      success: true,
      data: clientes.map((cliente) => this.normalizeClientePayload(cliente)),
    };
  }

  @Get('proximo-contato')
  @ApiOperation({ summary: 'Clientes com proximo contato agendado' })
  @ApiResponse({ status: 200, description: 'Lista de clientes com contatos agendados' })
  async getProximoContato(@EmpresaId() empresaId: string) {
    const clientes = await this.clientesService.getClientesProximoContato(empresaId);

    return {
      success: true,
      data: clientes.map((cliente) => this.normalizeClientePayload(cliente)),
    };
  }

  @Get('estatisticas')
  @CacheTTL(3 * 60 * 1000) // 3 minutes
  @ApiOperation({ summary: 'Obter estatisticas dos clientes' })
  @ApiResponse({ status: 200, description: 'Estatisticas retornadas com sucesso' })
  async getEstatisticas(@EmpresaId() empresaId: string) {
    const estatisticas = await this.clientesService.getEstatisticas(empresaId);

    return {
      success: true,
      data: estatisticas,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente retornado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente nao encontrado' })
  async findById(@EmpresaId() empresaId: string, @Param('id') id: string) {
    const cliente = await this.clientesService.findById(id, empresaId);

    if (!cliente) {
      throw new NotFoundException('Cliente nao encontrado');
    }

    return {
      success: true,
      data: this.normalizeClientePayload(cliente),
    };
  }

  @Post()
  @Permissions(Permission.CRM_CLIENTES_CREATE)
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados invalidos' })
  async create(@EmpresaId() empresaId: string, @Body() clienteData: Partial<Cliente>) {
    const cliente = await this.clientesService.create({
      ...clienteData,
      empresaId,
    });

    this.invalidateClientesCache(empresaId);

    return {
      success: true,
      data: this.normalizeClientePayload(cliente),
      message: 'Cliente criado com sucesso',
    };
  }

  @Put(':id')
  @Permissions(Permission.CRM_CLIENTES_UPDATE)
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente nao encontrado' })
  async update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() updateData: Partial<Cliente>,
  ) {
    const cliente = await this.clientesService.update(id, empresaId, updateData);

    if (!cliente) {
      return {
        success: false,
        message: 'Cliente nao encontrado',
      };
    }

    this.invalidateClientesCache(empresaId);

    return {
      success: true,
      data: this.normalizeClientePayload(cliente),
      message: 'Cliente atualizado com sucesso',
    };
  }

  @Put(':id/status')
  @Permissions(Permission.CRM_CLIENTES_UPDATE)
  @ApiOperation({ summary: 'Atualizar status do cliente' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  async updateStatus(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body('status') status: StatusCliente,
  ) {
    const cliente = await this.clientesService.updateStatus(id, empresaId, status);

    this.invalidateClientesCache(empresaId);

    return {
      success: true,
      data: this.normalizeClientePayload(cliente),
      message: 'Status atualizado com sucesso',
    };
  }

  @Post(':id/avatar')
  @Permissions(Permission.CRM_CLIENTES_UPDATE)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: () => ensureClientesUploadDirectory(CLIENTES_AVATAR_SUBDIR),
        filename: (req: any, file, cb) => {
          const clienteId = req?.params?.id || 'cliente';
          const ext = path.extname(file.originalname)?.toLowerCase() || '.png';
          const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.png';
          cb(null, `${clienteId}-${Date.now()}${safeExt}`);
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException('Formato de avatar nao suportado.') as any, false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Atualizar avatar do cliente' })
  @ApiResponse({ status: 200, description: 'Avatar atualizado com sucesso' })
  async uploadAvatar(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhuma imagem foi enviada.');
    }

    const cliente = await this.clientesService.findById(id, empresaId);
    const newAvatarPath = path.join(this.getAvatarUploadDir(), file.filename);

    if (!cliente) {
      await fs.promises.unlink(newAvatarPath).catch(() => undefined);
      throw new NotFoundException('Cliente nao encontrado');
    }

    const previousAvatarPath = this.getLocalPathFromSegment(
      (cliente as any).avatar_url,
      CLIENTE_AVATAR_SEGMENT,
    );
    const avatarUrl = `${CLIENTE_AVATAR_SEGMENT}${file.filename}`;

    try {
      const updatedCliente = await this.clientesService.updateAvatar(id, empresaId, avatarUrl);
      this.invalidateClientesCache(empresaId);

      if (previousAvatarPath && previousAvatarPath !== newAvatarPath) {
        await fs.promises.unlink(previousAvatarPath).catch((error) => {
          const errorCode = (error as NodeJS.ErrnoException)?.code;
          if (errorCode !== 'ENOENT') {
            throw error;
          }
        });
      }

      return {
        success: true,
        data: this.normalizeClientePayload(updatedCliente),
        message: 'Avatar atualizado com sucesso',
      };
    } catch {
      await fs.promises.unlink(newAvatarPath).catch(() => undefined);
      throw new InternalServerErrorException('Nao foi possivel atualizar o avatar do cliente.');
    }
  }

  @Get(':id/anexos')
  @ApiOperation({ summary: 'Listar anexos do cliente' })
  @ApiResponse({ status: 200, description: 'Anexos retornados com sucesso' })
  async listAnexos(@EmpresaId() empresaId: string, @Param('id', ParseUUIDPipe) id: string) {
    const cliente = await this.clientesService.findById(id, empresaId);
    if (!cliente) {
      throw new NotFoundException('Cliente nao encontrado');
    }

    const anexosStorageAvailable = await this.clientesService.isAnexosStorageAvailable();
    if (!anexosStorageAvailable) {
      return {
        success: true,
        data: [],
      };
    }

    const anexos = await this.clientesService.listAnexos(id, empresaId);
    return {
      success: true,
      data: anexos.map((anexo) => this.normalizeAnexoPayload(anexo)),
    };
  }

  @Post(':id/anexos')
  @Permissions(Permission.CRM_CLIENTES_UPDATE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: () => ensureClientesUploadDirectory(CLIENTES_ANEXOS_SUBDIR),
        filename: (req: any, file, cb) => {
          const clienteId = req?.params?.id || 'cliente';
          const originalExt = path.extname(file.originalname)?.toLowerCase() || '';
          const fallbackExt = '.bin';
          const safeExt = /^[.][a-z0-9]{1,10}$/i.test(originalExt) ? originalExt : fallbackExt;
          const baseName =
            path
              .basename(file.originalname, originalExt)
              .replace(/[^a-zA-Z0-9-_]/g, '')
              .slice(0, 40) || 'anexo';

          cb(null, `${clienteId}-${Date.now()}-${baseName}${safeExt}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException('Tipo de anexo nao suportado.') as any, false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Adicionar anexo ao cliente' })
  @ApiResponse({ status: 201, description: 'Anexo adicionado com sucesso' })
  async addAnexo(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado.');
    }

    const cliente = await this.clientesService.findById(id, empresaId);
    const newAnexoPath = path.join(this.getAnexoUploadDir(), file.filename);

    if (!cliente) {
      await fs.promises.unlink(newAnexoPath).catch(() => undefined);
      throw new NotFoundException('Cliente nao encontrado');
    }

    const anexosStorageAvailable = await this.clientesService.isAnexosStorageAvailable();
    if (!anexosStorageAvailable) {
      await fs.promises.unlink(newAnexoPath).catch(() => undefined);
      throw new ServiceUnavailableException(
        'Anexos de cliente indisponiveis ate executar as migrations.',
      );
    }

    const anexoUrl = `${CLIENTE_ANEXOS_SEGMENT}${file.filename}`;

    try {
      const anexo = await this.clientesService.addAnexo(id, empresaId, {
        nome: file.originalname,
        tipo: file.mimetype,
        tamanho: file.size,
        url: anexoUrl,
      });

      this.invalidateClientesCache(empresaId);

      return {
        success: true,
        data: this.normalizeAnexoPayload(anexo),
        message: 'Anexo adicionado com sucesso',
      };
    } catch {
      await fs.promises.unlink(newAnexoPath).catch(() => undefined);
      throw new InternalServerErrorException('Nao foi possivel adicionar o anexo do cliente.');
    }
  }

  @Delete(':id/anexos/:anexoId')
  @Permissions(Permission.CRM_CLIENTES_DELETE)
  @ApiOperation({ summary: 'Remover anexo do cliente' })
  @ApiResponse({ status: 200, description: 'Anexo removido com sucesso' })
  async removeAnexo(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('anexoId', ParseUUIDPipe) anexoId: string,
  ) {
    const anexosStorageAvailable = await this.clientesService.isAnexosStorageAvailable();
    if (!anexosStorageAvailable) {
      throw new ServiceUnavailableException(
        'Anexos de cliente indisponiveis ate executar as migrations.',
      );
    }

    const removed = await this.clientesService.removeAnexo(id, anexoId, empresaId);
    if (!removed) {
      throw new NotFoundException('Anexo nao encontrado');
    }

    const localPath = this.getLocalPathFromSegment(removed.url, CLIENTE_ANEXOS_SEGMENT);
    if (localPath) {
      await fs.promises.unlink(localPath).catch((error) => {
        const errorCode = (error as NodeJS.ErrnoException)?.code;
        if (errorCode !== 'ENOENT') {
          throw error;
        }
      });
    }

    this.invalidateClientesCache(empresaId);

    return {
      success: true,
      message: 'Anexo removido com sucesso',
    };
  }

  @Delete(':id')
  @Permissions(Permission.CRM_CLIENTES_DELETE)
  @ApiOperation({ summary: 'Excluir cliente' })
  @ApiResponse({ status: 200, description: 'Cliente excluido com sucesso' })
  async delete(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.clientesService.delete(id, empresaId);

    this.invalidateClientesCache(empresaId);

    return {
      success: true,
      message: 'Cliente excluido com sucesso',
    };
  }
}
