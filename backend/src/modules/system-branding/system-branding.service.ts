import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemBranding } from './entities/system-branding.entity';
import { UpdateSystemBrandingDto } from './dto/update-system-branding.dto';

export interface SystemBrandingEffectiveConfig {
  logoFullUrl: string;
  logoFullLightUrl: string;
  logoIconUrl: string;
  loadingLogoUrl: string;
  faviconUrl: string;
}

export interface SystemBrandingAdminResponse {
  data: {
    logoFullUrl: string | null;
    logoFullLightUrl: string | null;
    logoIconUrl: string | null;
    loadingLogoUrl: string | null;
    faviconUrl: string | null;
  };
  effective: SystemBrandingEffectiveConfig;
  defaults: SystemBrandingEffectiveConfig;
  updatedAt: string | null;
}

const GLOBAL_BRANDING_KEY = 'global';

const DEFAULT_SYSTEM_BRANDING: SystemBrandingEffectiveConfig = {
  logoFullUrl: '/brand/conect360-logo-horizontal.svg',
  logoFullLightUrl: '/brand/conect360-logo-horizontal-light.svg',
  logoIconUrl: '/brand/conect360-logo-icon.svg',
  loadingLogoUrl: '/brand/conect360-logo-icon.svg',
  faviconUrl: '/favicon.svg',
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

  private toEffectiveConfig(record: SystemBranding | null): SystemBrandingEffectiveConfig {
    const customFull = record?.logoFullUrl || null;
    const customFullLight = record?.logoFullLightUrl || null;
    const customIcon = record?.logoIconUrl || null;
    const customLoadingLogo = record?.loadingLogoUrl || null;
    const customFavicon = record?.faviconUrl || null;

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
      },
      effective: this.toEffectiveConfig(record),
      defaults: { ...DEFAULT_SYSTEM_BRANDING },
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

    record.updatedBy = updatedBy;

    await this.systemBrandingRepository.save(record);
    return this.getAdminBranding();
  }
}
