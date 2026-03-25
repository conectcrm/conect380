import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { SystemBranding } from './entities/system-branding.entity';
import { UpdateSystemBrandingDto } from './dto/update-system-branding.dto';

export type SystemMaintenanceSeverity = 'info' | 'warning' | 'critical';

export interface SystemMaintenanceBannerConfig {
  enabled: boolean;
  title: string;
  message: string;
  severity: SystemMaintenanceSeverity;
  startsAt: string | null;
  expectedEndAt: string | null;
}

export interface SystemBrandingEffectiveConfig {
  logoFullUrl: string;
  logoFullLightUrl: string;
  logoIconUrl: string;
  loadingLogoUrl: string;
  faviconUrl: string;
  maintenanceBanner: SystemMaintenanceBannerConfig;
}

export interface SystemBrandingAdminData {
  logoFullUrl: string | null;
  logoFullLightUrl: string | null;
  logoIconUrl: string | null;
  loadingLogoUrl: string | null;
  faviconUrl: string | null;
  maintenanceEnabled: boolean;
  maintenanceTitle: string | null;
  maintenanceMessage: string | null;
  maintenanceStartsAt: string | null;
  maintenanceExpectedEndAt: string | null;
  maintenanceSeverity: SystemMaintenanceSeverity;
}

export interface SystemBrandingAdminResponse {
  data: SystemBrandingAdminData;
  effective: SystemBrandingEffectiveConfig;
  defaults: SystemBrandingEffectiveConfig;
  updatedAt: string | null;
}

const GLOBAL_BRANDING_KEY = 'global';
const DEFAULT_MAINTENANCE_SEVERITY: SystemMaintenanceSeverity = 'warning';
const BRANDING_MIGRATION_HINT =
  'Execute as migracoes pendentes do backend para habilitar o branding completo.';

const DEFAULT_SYSTEM_BRANDING: SystemBrandingEffectiveConfig = {
  logoFullUrl: '',
  logoFullLightUrl: '',
  logoIconUrl: '',
  loadingLogoUrl: '',
  faviconUrl: '/favicon.svg',
  maintenanceBanner: {
    enabled: false,
    title: 'Manutencao programada',
    message: 'O sistema pode apresentar instabilidade durante o deploy.',
    severity: DEFAULT_MAINTENANCE_SEVERITY,
    startsAt: null,
    expectedEndAt: null,
  },
};

@Injectable()
export class SystemBrandingService {
  private readonly logger = new Logger(SystemBrandingService.name);
  private readonly ownerEmpresaIds: Set<string>;

  constructor(
    @InjectRepository(SystemBranding)
    private readonly systemBrandingRepository: Repository<SystemBranding>,
  ) {
    this.ownerEmpresaIds = this.parseOwnerIds(process.env.PLATFORM_OWNER_EMPRESA_IDS);
  }

  private parseOwnerIds(raw?: string): Set<string> {
    if (!raw || typeof raw !== 'string') {
      return new Set();
    }

    const ids = raw
      .split(/[;,]/g)
      .map((item) => item.trim())
      .filter(Boolean);

    return new Set(ids);
  }

  private isSchemaMismatchError(error: unknown): boolean {
    const message =
      (error instanceof QueryFailedError ? error.message : (error as any)?.message || '')
        .toString()
        .toLowerCase();

    if (!message.includes('does not exist')) {
      return false;
    }

    if (message.includes('system_branding')) {
      return true;
    }

    return [
      'maintenance_enabled',
      'maintenance_title',
      'maintenance_message',
      'maintenance_starts_at',
      'maintenance_expected_end_at',
      'maintenance_severity',
      'loading_logo_url',
    ].some((columnName) => message.includes(columnName));
  }

  private async findGlobalRecordSafely(): Promise<SystemBranding | null> {
    try {
      return await this.systemBrandingRepository.findOne({
        where: { chave: GLOBAL_BRANDING_KEY },
      });
    } catch (error) {
      if (this.isSchemaMismatchError(error)) {
        this.logger.warn(
          `Tabela system_branding sem colunas esperadas. ${BRANDING_MIGRATION_HINT}`,
        );
        return null;
      }

      throw error;
    }
  }

  private sanitizeOptionalAsset(value: string | null | undefined): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private sanitizeOptionalText(value: string | null | undefined): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private parseOptionalIsoDate(value: string | null | undefined): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return null;
    }

    const parsed = new Date(normalizedValue);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Data de manutencao invalida.');
    }

    return parsed;
  }

  private normalizeMaintenanceSeverity(
    value: string | null | undefined,
  ): SystemMaintenanceSeverity {
    if (value === 'info' || value === 'warning' || value === 'critical') {
      return value;
    }
    return DEFAULT_MAINTENANCE_SEVERITY;
  }

  private toIsoOrNull(value: Date | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString();
  }

  private toEffectiveConfig(record: SystemBranding | null): SystemBrandingEffectiveConfig {
    const customFull = record?.logoFullUrl || null;
    const customFullLight = record?.logoFullLightUrl || null;
    const customIcon = record?.logoIconUrl || null;
    const customLoadingLogo = record?.loadingLogoUrl || null;
    const customFavicon = record?.faviconUrl || null;
    const maintenanceTitle =
      this.sanitizeOptionalText(record?.maintenanceTitle || null) ||
      DEFAULT_SYSTEM_BRANDING.maintenanceBanner.title;
    const maintenanceMessage =
      this.sanitizeOptionalText(record?.maintenanceMessage || null) ||
      DEFAULT_SYSTEM_BRANDING.maintenanceBanner.message;

    return {
      // Se apenas uma logo horizontal foi enviada, reutiliza nos dois contextos.
      logoFullUrl:
        customFull ||
        customFullLight ||
        DEFAULT_SYSTEM_BRANDING.logoFullUrl,
      logoFullLightUrl:
        customFullLight ||
        customFull ||
        DEFAULT_SYSTEM_BRANDING.logoFullLightUrl,
      logoIconUrl: customIcon || DEFAULT_SYSTEM_BRANDING.logoIconUrl,
      loadingLogoUrl:
        customLoadingLogo ||
        customIcon ||
        DEFAULT_SYSTEM_BRANDING.loadingLogoUrl,
      faviconUrl: customFavicon || customIcon || DEFAULT_SYSTEM_BRANDING.faviconUrl,
      maintenanceBanner: {
        enabled: Boolean(record?.maintenanceEnabled),
        title: maintenanceTitle,
        message: maintenanceMessage,
        severity: this.normalizeMaintenanceSeverity(record?.maintenanceSeverity),
        startsAt: this.toIsoOrNull(record?.maintenanceStartsAt),
        expectedEndAt: this.toIsoOrNull(record?.maintenanceExpectedEndAt),
      },
    };
  }

  private async ensureGlobalBrandingRecord(): Promise<SystemBranding | null> {
    let record = await this.findGlobalRecordSafely();

    if (!record) {
      try {
        await this.systemBrandingRepository.query(
          `
            INSERT INTO "system_branding" ("chave")
            SELECT $1
            WHERE NOT EXISTS (
              SELECT 1 FROM "system_branding" WHERE "chave" = $1
            )
          `,
          [GLOBAL_BRANDING_KEY],
        );
      } catch (error) {
        if (this.isSchemaMismatchError(error)) {
          this.logger.warn(`Falha ao garantir registro global de branding. ${BRANDING_MIGRATION_HINT}`);
          return null;
        }

        throw error;
      }

      record = await this.findGlobalRecordSafely();
    }

    return record;
  }

  async getPublicBranding(): Promise<SystemBrandingEffectiveConfig> {
    const record = await this.findGlobalRecordSafely();
    return this.toEffectiveConfig(record);
  }

  async getRuntimeBrandingForEmpresa(
    empresaId: string | null | undefined,
  ): Promise<SystemBrandingEffectiveConfig> {
    const normalizedEmpresaId = String(empresaId || '').trim();
    if (!normalizedEmpresaId) {
      return {
        ...DEFAULT_SYSTEM_BRANDING,
        maintenanceBanner: { ...DEFAULT_SYSTEM_BRANDING.maintenanceBanner },
      };
    }

    if (!this.ownerEmpresaIds.has(normalizedEmpresaId)) {
      return {
        ...DEFAULT_SYSTEM_BRANDING,
        maintenanceBanner: { ...DEFAULT_SYSTEM_BRANDING.maintenanceBanner },
      };
    }

    return this.getPublicBranding();
  }

  async getAdminBranding(): Promise<SystemBrandingAdminResponse> {
    const record = await this.findGlobalRecordSafely();

    return {
      data: {
        logoFullUrl: record?.logoFullUrl ?? null,
        logoFullLightUrl: record?.logoFullLightUrl ?? null,
        logoIconUrl: record?.logoIconUrl ?? null,
        loadingLogoUrl: record?.loadingLogoUrl ?? null,
        faviconUrl: record?.faviconUrl ?? null,
        maintenanceEnabled: Boolean(record?.maintenanceEnabled),
        maintenanceTitle: record?.maintenanceTitle ?? null,
        maintenanceMessage: record?.maintenanceMessage ?? null,
        maintenanceStartsAt: this.toIsoOrNull(record?.maintenanceStartsAt),
        maintenanceExpectedEndAt: this.toIsoOrNull(record?.maintenanceExpectedEndAt),
        maintenanceSeverity: this.normalizeMaintenanceSeverity(record?.maintenanceSeverity),
      },
      effective: this.toEffectiveConfig(record),
      defaults: {
        ...DEFAULT_SYSTEM_BRANDING,
        maintenanceBanner: { ...DEFAULT_SYSTEM_BRANDING.maintenanceBanner },
      },
      updatedAt: record?.updatedAt ? record.updatedAt.toISOString() : null,
    };
  }

  async updateBranding(
    dto: UpdateSystemBrandingDto,
    updatedBy: string | null,
  ): Promise<SystemBrandingAdminResponse> {
    const record = await this.ensureGlobalBrandingRecord();
    if (!record) {
      throw new BadRequestException(
        `Branding indisponivel por schema desatualizado. ${BRANDING_MIGRATION_HINT}`,
      );
    }

    const logoFullUrl = this.sanitizeOptionalAsset(dto.logoFullUrl);
    const logoFullLightUrl = this.sanitizeOptionalAsset(dto.logoFullLightUrl);
    const logoIconUrl = this.sanitizeOptionalAsset(dto.logoIconUrl);
    const loadingLogoUrl = this.sanitizeOptionalAsset(dto.loadingLogoUrl);
    const faviconUrl = this.sanitizeOptionalAsset(dto.faviconUrl);
    const maintenanceTitle = this.sanitizeOptionalText(dto.maintenanceTitle);
    const maintenanceMessage = this.sanitizeOptionalText(dto.maintenanceMessage);
    const maintenanceStartsAt = this.parseOptionalIsoDate(dto.maintenanceStartsAt);
    const maintenanceExpectedEndAt = this.parseOptionalIsoDate(dto.maintenanceExpectedEndAt);
    const maintenanceSeverity =
      dto.maintenanceSeverity === undefined
        ? undefined
        : this.normalizeMaintenanceSeverity(dto.maintenanceSeverity);

    if (logoFullUrl !== undefined) {
      record.logoFullUrl = logoFullUrl;
    }
    if (logoFullLightUrl !== undefined) {
      record.logoFullLightUrl = logoFullLightUrl;
    }
    if (logoIconUrl !== undefined) {
      record.logoIconUrl = logoIconUrl;
    }
    if (loadingLogoUrl !== undefined) {
      record.loadingLogoUrl = loadingLogoUrl;
    }
    if (faviconUrl !== undefined) {
      record.faviconUrl = faviconUrl;
    }
    if (dto.maintenanceEnabled !== undefined) {
      record.maintenanceEnabled = Boolean(dto.maintenanceEnabled);
    }
    if (maintenanceTitle !== undefined) {
      record.maintenanceTitle = maintenanceTitle;
    }
    if (maintenanceMessage !== undefined) {
      record.maintenanceMessage = maintenanceMessage;
    }
    if (maintenanceStartsAt !== undefined) {
      record.maintenanceStartsAt = maintenanceStartsAt;
    }
    if (maintenanceExpectedEndAt !== undefined) {
      record.maintenanceExpectedEndAt = maintenanceExpectedEndAt;
    }
    if (maintenanceSeverity !== undefined) {
      record.maintenanceSeverity = maintenanceSeverity;
    }

    record.updatedBy = updatedBy;

    try {
      await this.systemBrandingRepository.save(record);
    } catch (error) {
      if (this.isSchemaMismatchError(error)) {
        throw new BadRequestException(
          `Nao foi possivel atualizar branding no schema atual. ${BRANDING_MIGRATION_HINT}`,
        );
      }

      throw error;
    }

    return this.getAdminBranding();
  }
}
