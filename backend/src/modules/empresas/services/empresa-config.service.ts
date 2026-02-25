import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaConfig } from '../entities/empresa-config.entity';
import { UpdateEmpresaConfigDto } from '../dto/update-empresa-config.dto';

@Injectable()
export class EmpresaConfigService {
  private static readonly SECRET_FIELD_NAMES = [
    'smtpSenha',
    'whatsappApiToken',
    'smsApiKey',
    'pushApiKey',
  ] as const;
  private static readonly SECRET_MASK_VALUE = '__CONFIGURED_SECRET__';
  private static readonly SECRET_ENCRYPTED_PREFIX = 'enc:v1:';
  private static readonly SECRET_FIELDS: Array<(typeof EmpresaConfigService.SECRET_FIELD_NAMES)[number]> =
    [...EmpresaConfigService.SECRET_FIELD_NAMES];
  private static readonly SECRET_DB_COLUMNS: Record<
    (typeof EmpresaConfigService.SECRET_FIELD_NAMES)[number],
    string
  > = {
    smtpSenha: 'smtp_senha',
    whatsappApiToken: 'whatsapp_api_token',
    smsApiKey: 'sms_api_key',
    pushApiKey: 'push_api_key',
  };
  private readonly logger = new Logger(EmpresaConfigService.name);

  constructor(
    @InjectRepository(EmpresaConfig)
    private readonly configRepository: Repository<EmpresaConfig>,
  ) {}

  private hasValidEncryptionKey(): boolean {
    const rawKey = (process.env.ENCRYPTION_KEY || '').trim();
    return /^[a-fA-F0-9]{64}$/.test(rawKey);
  }

  private async maybeBackfillLegacyPlainSecrets(config: EmpresaConfig): Promise<EmpresaConfig> {
    if (!config?.id || !this.hasValidEncryptionKey()) {
      return config;
    }

    const rawSecrets = await this.configRepository
      .createQueryBuilder('cfg')
      .select('cfg.id', 'id')
      .addSelect('cfg.smtp_senha', 'smtp_senha')
      .addSelect('cfg.whatsapp_api_token', 'whatsapp_api_token')
      .addSelect('cfg.sms_api_key', 'sms_api_key')
      .addSelect('cfg.push_api_key', 'push_api_key')
      .where('cfg.id = :id', { id: config.id })
      .getRawOne<Record<string, string | null>>();

    if (!rawSecrets) {
      return config;
    }

    const fieldsToBackfill: Array<keyof EmpresaConfig> = [];

    for (const field of EmpresaConfigService.SECRET_FIELDS) {
      const dbColumn = EmpresaConfigService.SECRET_DB_COLUMNS[field];
      const rawValue = rawSecrets[dbColumn];
      const currentValue = config[field];

      if (
        typeof rawValue === 'string' &&
        rawValue.length > 0 &&
        !rawValue.startsWith(EmpresaConfigService.SECRET_ENCRYPTED_PREFIX) &&
        typeof currentValue === 'string' &&
        currentValue.length > 0
      ) {
        fieldsToBackfill.push(field);
      }
    }

    if (fieldsToBackfill.length === 0) {
      return config;
    }

    // Reatribui os valores decriptografados/plain para que o transformer persista criptografado.
    for (const field of fieldsToBackfill) {
      const currentValue = config[field];
      if (typeof currentValue === 'string') {
        (config[field] as any) = currentValue;
      }
    }

    const saved = await this.configRepository.save(config);
    this.logger.log(
      `Segredos legados recriptografados em empresa_configuracoes (empresaId=${config.empresaId}, campos=${fieldsToBackfill.length})`,
    );
    return saved;
  }

  private async getOrCreateRawByEmpresaId(empresaId: string): Promise<EmpresaConfig> {
    let config = await this.configRepository.findOne({
      where: { empresaId },
    });

    // Se não existe, criar configuração padrão
    if (!config) {
      config = this.configRepository.create({ empresaId });
      await this.configRepository.save(config);
    }

    return this.maybeBackfillLegacyPlainSecrets(config);
  }

  private maskSecret(value?: string | null): string | null {
    if (!value) return null;
    return EmpresaConfigService.SECRET_MASK_VALUE;
  }

  private sanitizeSecretsForResponse(config: EmpresaConfig): EmpresaConfig {
    const sanitized = { ...config } as EmpresaConfig;

    for (const field of EmpresaConfigService.SECRET_FIELDS) {
      const currentValue = sanitized[field];
      if (typeof currentValue === 'string' || currentValue === null) {
        (sanitized[field] as any) = this.maskSecret(currentValue as string | null);
      }
    }

    return sanitized;
  }

  private normalizeSecretUpdates(
    config: EmpresaConfig,
    updateDto: UpdateEmpresaConfigDto,
  ): Partial<UpdateEmpresaConfigDto> {
    const normalized: Partial<UpdateEmpresaConfigDto> = { ...updateDto };

    for (const field of EmpresaConfigService.SECRET_FIELDS) {
      const key = field as keyof UpdateEmpresaConfigDto;
      const incomingValue = normalized[key];

      if (incomingValue === undefined) {
        continue;
      }

      if (incomingValue === EmpresaConfigService.SECRET_MASK_VALUE) {
        delete normalized[key];
        continue;
      }

      if (typeof incomingValue === 'string' && incomingValue.trim() === '') {
        (config[field] as any) = null;
        delete normalized[key];
      }
    }

    return normalized;
  }

  async getByEmpresaId(empresaId: string): Promise<EmpresaConfig> {
    const config = await this.getOrCreateRawByEmpresaId(empresaId);
    return this.sanitizeSecretsForResponse(config);
  }

  async update(empresaId: string, updateDto: UpdateEmpresaConfigDto): Promise<EmpresaConfig> {
    const config = await this.getOrCreateRawByEmpresaId(empresaId);
    const normalizedUpdate = this.normalizeSecretUpdates(config, updateDto);

    // Atualizar campos
    Object.assign(config, normalizedUpdate);

    const saved = await this.configRepository.save(config);
    return this.sanitizeSecretsForResponse(saved);
  }

  async resetToDefaults(empresaId: string): Promise<EmpresaConfig> {
    const config = await this.getOrCreateRawByEmpresaId(empresaId);

    // Resetar para valores padrão
    config.corPrimaria = '#159A9C';
    config.corSecundaria = '#002333';
    config.autenticacao2FA = false;
    config.sessaoExpiracaoMinutos = 30;
    config.senhaComplexidade = 'media';
    config.auditoria = true;
    config.limiteUsuarios = 10;
    config.aprovacaoNovoUsuario = false;
    config.emailsHabilitados = true;
    config.portaSMTP = 587;
    config.apiHabilitada = false;
    config.backupAutomatico = true;
    config.backupFrequencia = 'diario';
    config.backupRetencaoDias = 30;

    const saved = await this.configRepository.save(config);
    return this.sanitizeSecretsForResponse(saved);
  }
}
