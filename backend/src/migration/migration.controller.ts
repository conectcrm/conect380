import { Logger, Controller, Post, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

@Controller('migration')
@UseGuards(JwtAuthGuard)
export class MigrationController {
  private readonly logger = new Logger(MigrationController.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
  ) {}

  @Post('update-domains')
  async updateDomains() {
    try {
      this.logger.log('🚀 Iniciando migração de domínios Fênix → Conect CRM...');

      // 1. Atualizar empresa padrão
      const empresaResult = await this.empresaRepository
        .createQueryBuilder()
        .update(Empresa)
        .set({
          nome: 'Conect Tecnologia',
          slug: 'conect-tecnologia',
          email: 'contato@conectcrm.com.br',
          updated_at: new Date(),
        })
        .where('cnpj = :cnpj AND nome = :nome', {
          cnpj: '12.345.678/0001-99',
          nome: 'Fênix Tecnologia',
        })
        .execute();

      this.logger.log('📊 Empresa atualizada:', empresaResult.affected, 'linhas afetadas');

      // 2. Atualizar usuários
      const usuariosUpdates = [
        { old: 'admin@fenixcrm.com', new: 'admin@conectcrm.com' },
        { old: 'maria@fenixcrm.com', new: 'maria@conectcrm.com' },
        { old: 'joao@fenixcrm.com', new: 'joao@conectcrm.com' },
      ];

      const resultados = [];

      for (const update of usuariosUpdates) {
        const result = await this.userRepository
          .createQueryBuilder()
          .update(User)
          .set({
            email: update.new,
            updated_at: new Date(),
          })
          .where('email = :oldEmail', { oldEmail: update.old })
          .execute();

        if (result.affected > 0) {
          this.logger.log(`✅ Usuário atualizado: ${update.old} → ${update.new}`);
          resultados.push(`${update.old} → ${update.new}`);
        }
      }

      // 3. Verificar dados finais
      const empresaFinal = await this.empresaRepository.findOne({
        where: { cnpj: '12.345.678/0001-99' },
      });

      const usuariosFinal = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.empresa', 'empresa')
        .where('empresa.cnpj = :cnpj', { cnpj: '12.345.678/0001-99' })
        .select(['user.nome', 'user.email', 'user.role'])
        .getMany();

      return {
        success: true,
        message: 'Migração de domínios concluída com sucesso!',
        empresaAtualizada: empresaResult.affected,
        usuariosAtualizados: resultados,
        dadosFinais: {
          empresa: empresaFinal,
          usuarios: usuariosFinal,
        },
        credenciais: [
          'admin@conectcrm.com | admin123',
          'maria@conectcrm.com | manager123',
          'joao@conectcrm.com | vendedor123',
        ],
      };
    } catch (error) {
      this.logger.error('❌ Erro durante a migração:', error);
      return {
        success: false,
        message: 'Erro durante a migração',
        error: error.message,
      };
    }
  }
}
