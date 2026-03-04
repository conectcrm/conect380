import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

const DEFAULT_SYSTEM_BRANDING: SystemBrandingEffectiveConfig = {
  logoFullUrl: '/brand/conect360-logo-horizontal.svg',
  logoFullLightUrl: '/brand/conect360-logo-horizontal-light.svg',
  logoIconUrl: '/brand/conect360-logo-icon.svg',
  loadingLogoUrl: '/brand/conect360-logo-icon.svg',
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
  constructor(
    @InjectRepository(SystemBranding)
    private readonly systemBrandingRepository: Repository<SystemBranding>,
  ) {}

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

  private async ensureGlobalBrandingRecord(): Promise<SystemBranding> {
    let record = await this.systemBrandingRepository.findOne({
      where: { chave: GLOBAL_BRANDING_KEY },
    });

    if (!record) {
      record = this.systemBrandingRepository.create({
        chave: GLOBAL_BRANDING_KEY,
      });
      record = await this.systemBrandingRepository.save(record);
    }

    return record;
  }

  async getPublicBranding(): Promise<SystemBrandingEffectiveConfig> {
    const record = await this.systemBrandingRepository.findOne({
      where: { chave: GLOBAL_BRANDING_KEY },
    });
    return this.toEffectiveConfig(record);
  }

  async getAdminBranding(): Promise<SystemBrandingAdminResponse> {
    const record = await this.systemBrandingRepository.findOne({
      where: { chave: GLOBAL_BRANDING_KEY },
    });

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

    await this.systemBrandingRepository.save(record);
    return this.getAdminBranding();
  }
}
