import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaConfig } from '../entities/empresa-config.entity';
import { UpdateEmpresaConfigDto } from '../dto/update-empresa-config.dto';

@Injectable()
export class EmpresaConfigService {
  constructor(
    @InjectRepository(EmpresaConfig)
    private readonly configRepository: Repository<EmpresaConfig>,
  ) {}

  async getByEmpresaId(empresaId: string): Promise<EmpresaConfig> {
    let config = await this.configRepository.findOne({
      where: { empresaId },
    });

    // Se não existe, criar configuração padrão
    if (!config) {
      config = this.configRepository.create({ empresaId });
      await this.configRepository.save(config);
    }

    return config;
  }

  async update(empresaId: string, updateDto: UpdateEmpresaConfigDto): Promise<EmpresaConfig> {
    const config = await this.getByEmpresaId(empresaId);

    // Atualizar campos
    Object.assign(config, updateDto);

    return await this.configRepository.save(config);
  }

  async resetToDefaults(empresaId: string): Promise<EmpresaConfig> {
    const config = await this.getByEmpresaId(empresaId);

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

    return await this.configRepository.save(config);
  }
}
