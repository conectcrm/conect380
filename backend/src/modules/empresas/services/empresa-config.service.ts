import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { Repository } from 'typeorm';
import { UpdateEmpresaConfigDto } from '../dto/update-empresa-config.dto';
import { EmpresaConfig } from '../entities/empresa-config.entity';

type EmpresaConfigSecretField = 'smtpSenha' | 'whatsappApiToken' | 'smsApiKey' | 'pushApiKey';

type BackupSnapshotInfo = {
  fileName: string;
  generatedAt: string;
  sizeBytes: number;
};

type SmtpTestPayload = Pick<UpdateEmpresaConfigDto, 'servidorSMTP' | 'portaSMTP' | 'smtpUsuario' | 'smtpSenha'>;

@Injectable()
export class EmpresaConfigService {
  private static readonly SECRET_FIELD_NAMES: EmpresaConfigSecretField[] = [
    'smtpSenha',
    'whatsappApiToken',
    'smsApiKey',
    'pushApiKey',
  ];
  private static readonly SECRET_MASK_VALUE = '__CONFIGURED_SECRET__';
  private static readonly SECRET_ENCRYPTED_PREFIX = 'enc:v1:';
  private static readonly SECRET_DB_COLUMNS: Record<EmpresaConfigSecretField, string> = {
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

  private getBackupDirectory(empresaId: string): string {
    return path.resolve(process.cwd(), 'backups', 'empresa-configuracoes', empresaId);
  }

  private sanitizeBackupLimit(limit?: number): number {
    if (!Number.isFinite(limit)) {
      return 20;
    }

    const normalized = Math.trunc(limit as number);
    if (normalized < 1) {
      return 1;
    }

    if (normalized > 100) {
      return 100;
    }

    return normalized;
  }

  private resolveSecretInput(
    incomingValue: string | null | undefined,
    currentValue: string | null | undefined,
  ): string | null {
    if (
      incomingValue == null ||
      incomingValue === EmpresaConfigService.SECRET_MASK_VALUE
    ) {
      return currentValue ?? null;
    }

    if (incomingValue.trim() === '') {
      return null;
    }

    return incomingValue;
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

    const fieldsToBackfill: EmpresaConfigSecretField[] = [];

    for (const field of EmpresaConfigService.SECRET_FIELD_NAMES) {
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
        (config[field] as string) = currentValue;
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

    // Se nao existe, cria com padrao.
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

    for (const field of EmpresaConfigService.SECRET_FIELD_NAMES) {
      const currentValue = sanitized[field];
      if (typeof currentValue === 'string' || currentValue === null) {
        (sanitized[field] as string | null) = this.maskSecret(currentValue as string | null);
      }
    }

    return sanitized;
  }

  private normalizeSecretUpdates(
    config: EmpresaConfig,
    updateDto: UpdateEmpresaConfigDto,
  ): Partial<UpdateEmpresaConfigDto> {
    const normalized: Partial<UpdateEmpresaConfigDto> = { ...updateDto };

    for (const field of EmpresaConfigService.SECRET_FIELD_NAMES) {
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
        (config[field] as string | null) = null;
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

    Object.assign(config, normalizedUpdate);

    const saved = await this.configRepository.save(config);
    return this.sanitizeSecretsForResponse(saved);
  }

  async testSmtpConnection(
    empresaId: string,
    payload: Partial<SmtpTestPayload>,
  ): Promise<{ success: boolean; message: string }> {
    const config = await this.getOrCreateRawByEmpresaId(empresaId);

    const host = payload.servidorSMTP?.trim() || config.servidorSMTP;
    const port = payload.portaSMTP ?? config.portaSMTP ?? 587;
    const user = payload.smtpUsuario?.trim() || config.smtpUsuario;
    const pass = this.resolveSecretInput(payload.smtpSenha, config.smtpSenha);

    if (!host || !user || !pass) {
      throw new BadRequestException(
        'Preencha Servidor SMTP, Usuario SMTP e Senha SMTP para testar a conexao.',
      );
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      await transporter.verify();

      return {
        success: true,
        message: 'Conexao SMTP validada com sucesso.',
      };
    } catch (error) {
      this.logger.warn(
        `Falha no teste SMTP (empresaId=${empresaId}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new BadRequestException(
        'Falha ao validar SMTP. Confira host, porta, usuario, senha e conectividade de rede.',
      );
    }
  }

  async executeBackupSnapshot(empresaId: string): Promise<{
    success: boolean;
    message: string;
    backup: BackupSnapshotInfo;
  }> {
    const generatedAt = new Date().toISOString();
    const safeTimestamp = generatedAt.replace(/[:.]/g, '-');
    const fileName = `snapshot-${safeTimestamp}.json`;
    const backupDir = this.getBackupDirectory(empresaId);
    const backupFilePath = path.join(backupDir, fileName);

    try {
      const config = await this.getByEmpresaId(empresaId);

      const snapshotPayload = {
        empresaId,
        type: 'empresa-configuracoes',
        generatedAt,
        config,
      };

      await fs.mkdir(backupDir, { recursive: true });
      await fs.writeFile(backupFilePath, JSON.stringify(snapshotPayload, null, 2), 'utf8');

      const stats = await fs.stat(backupFilePath);

      return {
        success: true,
        message: `Snapshot criado com sucesso em ${new Date(generatedAt).toLocaleString('pt-BR')}.`,
        backup: {
          fileName,
          generatedAt,
          sizeBytes: stats.size,
        },
      };
    } catch (error) {
      this.logger.error(
        `Falha ao criar snapshot de configuracoes (empresaId=${empresaId})`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Nao foi possivel executar o backup das configuracoes da empresa.',
      );
    }
  }

  async listBackupSnapshots(empresaId: string, limit = 20): Promise<BackupSnapshotInfo[]> {
    const backupDir = this.getBackupDirectory(empresaId);
    const normalizedLimit = this.sanitizeBackupLimit(limit);

    let entries: import('fs').Dirent[];
    try {
      entries = await fs.readdir(backupDir, { withFileTypes: true });
    } catch {
      return [];
    }

    const files = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'));

    const snapshots = await Promise.all(
      files.map(async (entry) => {
        const filePath = path.join(backupDir, entry.name);
        const stats = await fs.stat(filePath);
        return {
          fileName: entry.name,
          generatedAt: stats.mtime.toISOString(),
          sizeBytes: stats.size,
        } as BackupSnapshotInfo;
      }),
    );

    return snapshots
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
      .slice(0, normalizedLimit);
  }

  async resetToDefaults(empresaId: string): Promise<EmpresaConfig> {
    const config = await this.getOrCreateRawByEmpresaId(empresaId);

    // Geral
    config.descricao = null;
    config.site = null;
    config.logoUrl = null;
    config.corPrimaria = '#159A9C';
    config.corSecundaria = '#002333';

    // Seguranca
    config.autenticacao2FA = false;
    config.sessaoExpiracaoMinutos = 30;
    config.senhaComplexidade = 'media';
    config.auditoria = true;
    config.forceSsl = true;
    config.ipWhitelist = null;

    // Usuarios
    config.limiteUsuarios = 10;
    config.aprovacaoNovoUsuario = false;
    config.conviteExpiracaoHoras = 48;
    config.alcadaAprovacaoFinanceira = null;

    // Email/SMTP
    config.emailsHabilitados = true;
    config.servidorSMTP = null;
    config.portaSMTP = 587;
    config.smtpUsuario = null;
    config.smtpSenha = null;

    // Comunicacao
    config.whatsappHabilitado = false;
    config.whatsappNumero = null;
    config.whatsappApiToken = null;
    config.smsHabilitado = false;
    config.smsProvider = null;
    config.smsApiKey = null;
    config.pushHabilitado = false;
    config.pushProvider = null;
    config.pushApiKey = null;

    // Integracoes
    config.apiHabilitada = false;
    config.webhooksAtivos = 0;

    // Backup
    config.backupAutomatico = true;
    config.backupFrequencia = 'diario';
    config.backupRetencaoDias = 30;

    const saved = await this.configRepository.save(config);
    return this.sanitizeSecretsForResponse(saved);
  }
}
