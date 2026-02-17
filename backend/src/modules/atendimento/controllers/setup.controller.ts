import { Controller, Get, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ensureDevelopmentOnly } from '../../../common/utils/dev-only.util';
import { User } from '../../users/user.entity';
import { Canal, StatusCanal, TipoCanal } from '../entities/canal.entity';

@Controller('api/setup')
export class SetupController {
  constructor(
    @InjectRepository(Canal)
    private canalRepo: Repository<Canal>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Get('status')
  async status() {
    ensureDevelopmentOnly('GET /api/setup/status');

    try {
      const totalCanais = await this.canalRepo.count();
      const canalEmail = await this.canalRepo.findOne({
        where: { tipo: TipoCanal.EMAIL },
      });
      const totalUsuarios = await this.userRepo.count();

      return {
        success: true,
        sistema: 'ConectCRM',
        versao: '2.0.0',
        status: 'online',
        dados: {
          totalCanais,
          canalEmailExiste: Boolean(canalEmail),
          totalUsuarios,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message ?? 'Erro ao obter status',
      };
    }
  }

  @Post('criar-canal-email')
  async criarCanalEmailTodasEmpresas() {
    ensureDevelopmentOnly('POST /api/setup/criar-canal-email');

    try {
      const users = await this.userRepo.find({
        select: ['empresa_id'],
      });

      if (users.length === 0) {
        return {
          success: false,
          message: 'Nenhuma empresa encontrada no sistema',
        };
      }

      const empresasIds = [...new Set(users.map((u) => u.empresa_id).filter(Boolean))];
      const canaisCriados: Canal[] = [];
      const canaisJaExistentes: Canal[] = [];

      for (const empresaId of empresasIds) {
        const canalExistente = await this.canalRepo.findOne({
          where: { empresaId: empresaId as string, tipo: TipoCanal.EMAIL },
        });

        if (canalExistente) {
          canaisJaExistentes.push(canalExistente);
          continue;
        }

        const novoCanal = this.canalRepo.create({
          empresaId: empresaId as string,
          nome: 'E-mail Principal',
          tipo: TipoCanal.EMAIL,
          provider: 'sendgrid',
          status: StatusCanal.ATIVO,
          configuracao: {
            tipo: 'email',
            descricao: 'Canal de atendimento por e-mail via SendGrid',
          },
        });

        const canalSalvo = await this.canalRepo.save(novoCanal);
        canaisCriados.push(canalSalvo);
      }

      return {
        success: true,
        message: `Processo concluido! ${canaisCriados.length} canais criados, ${canaisJaExistentes.length} ja existiam.`,
        dados: {
          empresasTotal: empresasIds.length,
          canaisCriados: canaisCriados.length,
          canaisJaExistentes: canaisJaExistentes.length,
          canais: [...canaisCriados, ...canaisJaExistentes].map((c) => ({
            id: c.id,
            empresaId: c.empresaId,
            nome: c.nome,
            tipo: c.tipo,
          })),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message ?? 'Erro ao criar canais de e-mail',
        error: error?.stack,
      };
    }
  }

  @Get('listar-canais')
  async listarTodosCanais() {
    ensureDevelopmentOnly('GET /api/setup/listar-canais');

    try {
      const canais = await this.canalRepo.find({
        order: { createdAt: 'DESC' },
        take: 50,
      });

      return {
        success: true,
        total: canais.length,
        canais: canais.map((c) => ({
          id: c.id,
          empresaId: c.empresaId,
          nome: c.nome,
          tipo: c.tipo,
          provider: c.provider,
          status: c.status,
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message ?? 'Erro ao listar canais',
      };
    }
  }
}
