import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';
import { UpdateSystemBrandingDto } from './dto/update-system-branding.dto';
import { SystemBrandingService } from './system-branding.service';
import { PlatformOwnerGuard } from '../../common/guards/platform-owner.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const BRANDING_UPLOADS_SUBDIR = 'system-branding';
const BRANDING_UPLOADS_SEGMENT = `/uploads/${BRANDING_UPLOADS_SUBDIR}/`;
const BRANDING_ASSET_MAX_SIZE = parseInt(process.env.BRANDING_ASSET_MAX_SIZE || '', 10) || 5 * 1024 * 1024;

const BRANDING_ASSET_KIND_TO_FIELD = {
  'logo-full': 'logoFullUrl',
  'logo-full-light': 'logoFullLightUrl',
  'logo-icon': 'logoIconUrl',
  'loading-logo': 'loadingLogoUrl',
  favicon: 'faviconUrl',
} as const;

type BrandingAssetKind = keyof typeof BRANDING_ASSET_KIND_TO_FIELD;
type BrandingAssetField = (typeof BRANDING_ASSET_KIND_TO_FIELD)[BrandingAssetKind];

const BRANDING_MIME_TYPES_BY_KIND: Record<BrandingAssetKind, string[]> = {
  'logo-full': ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  'logo-full-light': ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  'logo-icon': ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  'loading-logo': ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  favicon: [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
  ],
};

const BRANDING_MIME_TO_EXTENSION: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
};

const resolveBrandingUploadKind = (value: unknown): BrandingAssetKind | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized in BRANDING_ASSET_KIND_TO_FIELD
    ? (normalized as BrandingAssetKind)
    : null;
};

const resolveBrandingAssetExtension = (file: Express.Multer.File): string => {
  const fromName = path.extname(file.originalname || '').toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico'].includes(fromName)) {
    return fromName;
  }

  return BRANDING_MIME_TO_EXTENSION[file.mimetype] || '.png';
};

const resolveUploadsRootDirectory = (): string =>
  process.env.UPLOADS_PATH?.trim() || path.resolve(process.cwd(), 'uploads');

const ensureBrandingUploadDirectory = (): string => {
  const targetDir = path.resolve(resolveUploadsRootDirectory(), BRANDING_UPLOADS_SUBDIR);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
};

@Controller()
export class SystemBrandingController {
  private readonly logger = new Logger(SystemBrandingController.name);

  constructor(private readonly systemBrandingService: SystemBrandingService) {}

  @Get('system-branding/public')
  async getPublicBranding() {
    return this.systemBrandingService.getPublicBranding();
  }

  @Get('admin/system-branding')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, PlatformOwnerGuard)
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
  async getAdminBranding() {
    return this.systemBrandingService.getAdminBranding();
  }

  @Put('admin/system-branding')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, PlatformOwnerGuard)
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
  async updateBranding(@Body() dto: UpdateSystemBrandingDto, @Req() req: any) {
    const updatedBy: string | null = req?.user?.id || null;
    return this.systemBrandingService.updateBranding(dto, updatedBy);
  }

  @Post('admin/system-branding/assets/:kind')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, PlatformOwnerGuard)
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, ensureBrandingUploadDirectory()),
        filename: (req: any, file, cb) => {
          const kind = resolveBrandingUploadKind(req?.params?.kind);
          const prefix = kind || 'branding-asset';
          const ext = resolveBrandingAssetExtension(file);
          cb(null, `${prefix}-${Date.now()}-${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: BRANDING_ASSET_MAX_SIZE },
      fileFilter: (req: any, file, cb) => {
        const kind = resolveBrandingUploadKind(req?.params?.kind);
        if (!kind) {
          return cb(
            new BadRequestException(
              'Tipo de asset de branding invalido. Use: logo-full, logo-full-light, logo-icon, loading-logo ou favicon.',
            ) as any,
            false,
          );
        }

        const allowedMimeTypes = BRANDING_MIME_TYPES_BY_KIND[kind];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Formato nao suportado para ${kind}. Use: ${allowedMimeTypes.join(', ')}.`,
            ) as any,
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async uploadBrandingAsset(
    @Param('kind') kindParam: string,
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: any,
  ) {
    const kind = resolveBrandingUploadKind(kindParam);
    if (!kind) {
      throw new BadRequestException(
        'Tipo de asset de branding invalido. Use: logo-full, logo-full-light, logo-icon, loading-logo ou favicon.',
      );
    }

    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado para o asset de branding.');
    }

    const field = BRANDING_ASSET_KIND_TO_FIELD[kind] as BrandingAssetField;
    const uploadedAssetUrl = `${BRANDING_UPLOADS_SEGMENT}${file.filename}`;
    const uploadedFilePath = path.resolve(ensureBrandingUploadDirectory(), file.filename);
    const previousBranding = await this.systemBrandingService.getAdminBranding();
    const previousAssetUrl = previousBranding?.data?.[field] ?? null;

    try {
      const updatedBy: string | null = req?.user?.id || null;
      const updatedBranding = await this.systemBrandingService.updateBranding(
        { [field]: uploadedAssetUrl },
        updatedBy,
      );

      if (previousAssetUrl && previousAssetUrl !== uploadedAssetUrl) {
        await this.removeBrandingAssetIfLocal(previousAssetUrl);
      }

      return {
        success: true,
        data: {
          kind,
          field,
          url: uploadedAssetUrl,
          branding: updatedBranding,
        },
        message: 'Arquivo de branding enviado com sucesso.',
      };
    } catch (error) {
      await fs.promises.unlink(uploadedFilePath).catch(() => undefined);
      throw error;
    }
  }

  private resolveBrandingAssetLocalPath(assetUrl: string): string | null {
    const normalizedValue = assetUrl.trim();
    if (!normalizedValue) {
      return null;
    }

    let pathname = normalizedValue;
    if (normalizedValue.startsWith('http://') || normalizedValue.startsWith('https://')) {
      try {
        pathname = new URL(normalizedValue).pathname || '';
      } catch {
        return null;
      }
    }

    if (!pathname.startsWith(BRANDING_UPLOADS_SEGMENT)) {
      return null;
    }

    const uploadsRoot = path.resolve(resolveUploadsRootDirectory());
    const relativePath = pathname.replace(/^\/uploads\//, '');
    const localPath = path.resolve(uploadsRoot, relativePath);
    const expectedRoot = `${uploadsRoot}${path.sep}`;

    if (!localPath.startsWith(expectedRoot)) {
      return null;
    }

    return localPath;
  }

  private async removeBrandingAssetIfLocal(assetUrl: string): Promise<void> {
    const localPath = this.resolveBrandingAssetLocalPath(assetUrl);
    if (!localPath) {
      return;
    }

    try {
      await fs.promises.unlink(localPath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') {
        this.logger.warn(`[Uploads] Falha ao remover asset de branding antigo: ${localPath}`);
      }
    }
  }
}
