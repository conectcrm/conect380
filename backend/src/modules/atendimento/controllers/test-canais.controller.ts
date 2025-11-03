import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Canal } from '../entities/canal.entity';

@Controller('test/canais')
@UseGuards(JwtAuthGuard)
export class TestCanaisController {
  constructor(
    @InjectRepository(Canal)
    private canalRepo: Repository<Canal>,
  ) {
    console.log('✅ TestCanaisController criado!');
  }

  @Get()
  async listarTest(@Req() req) {
    console.log('🧪 [TestCanaisController] GET /test/canais chamado');
    console.log('🧪 [TestCanaisController] req.user:', JSON.stringify(req.user, null, 2));

    try {
      const empresaId = req.user.empresa_id || req.user.empresaId;
      console.log('🧪 [TestCanaisController] empresaId:', empresaId);

      const canais = await this.canalRepo.find({
        where: { empresaId },
        order: { createdAt: 'DESC' },
      });

      console.log('🧪 [TestCanaisController] Canais encontrados:', canais.length);

      return {
        success: true,
        data: canais,
        total: canais.length,
        message: 'Controller de teste funcionando!',
      };
    } catch (error) {
      console.error('❌ [TestCanaisController] Erro:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }
}
