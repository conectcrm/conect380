import { Controller, Post, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Canal, TipoCanal, StatusCanal } from '../entities/canal.entity';
import { User } from '../../users/user.entity';

/**
 * 🚀 Controller temporário para setup inicial do sistema
 * Endpoints públicos (sem autenticação) para configuração inicial
 */
@Controller('api/setup')
export class SetupController {
  constructor(
    @InjectRepository(Canal)
    private canalRepo: Repository<Canal>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  /**
   * GET /api/setup/status
   * Verifica status do sistema
   */
  @Get('status')
  async status() {
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
          canalEmailExiste: !!canalEmail,
          totalUsuarios,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * POST /api/setup/criar-canal-email
   * Cria canal de e-mail para TODAS as empresas no sistema
   */
  @Post('criar-canal-email')
  async criarCanalEmailTodasEmpresas() {
    console.log('🚀 [SetupController] Criando canais de e-mail para todas as empresas...');

    try {
      // Buscar todas as empresas (via users únicos)
      const users = await this.userRepo.find({
        select: ['empresa_id'],
      });

      if (users.length === 0) {
        return {
          success: false,
          message: 'Nenhuma empresa encontrada no sistema',
        };
      }

      // Obter empresas únicas
      const empresasIds = [...new Set(
        users.map(u => u.empresa_id).filter(Boolean)
      )];

      console.log(`📊 Empresas encontradas: ${empresasIds.length}`);

      const canaisCriados = [];
      const canaisJaExistentes = [];

      for (const empresaId of empresasIds) {
        // Verificar se já existe canal de e-mail para esta empresa
        const canalExistente = await this.canalRepo.findOne({
          where: { empresaId: empresaId as string, tipo: TipoCanal.EMAIL },
        });

        if (canalExistente) {
          console.log(`✅ Canal de e-mail já existe para empresa: ${empresaId}`);
          canaisJaExistentes.push(canalExistente);
          continue;
        }

        // Criar canal de e-mail
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
        console.log(`✅ Canal criado para empresa ${empresaId}: ${canalSalvo.id}`);
        canaisCriados.push(canalSalvo);
      }

      return {
        success: true,
        message: `Processo concluído! ${canaisCriados.length} canais criados, ${canaisJaExistentes.length} já existiam.`,
        dados: {
          empresasTotal: empresasIds.length,
          canaisCriados: canaisCriados.length,
          canaisJaExistentes: canaisJaExistentes.length,
          canais: [...canaisCriados, ...canaisJaExistentes].map(c => ({
            id: c.id,
            empresaId: c.empresaId,
            nome: c.nome,
            tipo: c.tipo,
          })),
        },
      };
    } catch (error) {
      console.error('❌ [SetupController] Erro:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar canais de e-mail',
        error: error.stack,
      };
    }
  }

  /**
   * GET /api/setup/listar-canais
   * Lista todos os canais de todas as empresas (debug)
   */
  @Get('listar-canais')
  async listarTodosCanais() {
    try {
      const canais = await this.canalRepo.find({
        order: { createdAt: 'DESC' },
        take: 50,
      });

      return {
        success: true,
        total: canais.length,
        canais: canais.map(c => ({
          id: c.id,
          empresaId: c.empresaId,
          nome: c.nome,
          tipo: c.tipo,
          provider: c.provider,
          status: c.status,
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
