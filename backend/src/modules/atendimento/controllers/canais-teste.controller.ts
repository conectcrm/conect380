import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ensureDevelopmentOnly } from '../../../common/utils/dev-only.util';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { Canal } from '../entities/canal.entity';

@Controller('test/canais')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CONFIG_INTEGRACOES_MANAGE)
export class TestCanaisController {
  constructor(
    @InjectRepository(Canal)
    private canalRepo: Repository<Canal>,
  ) {}

  @Get()
  async listarTest(@EmpresaId() empresaId: string) {
    ensureDevelopmentOnly('GET /test/canais');

    try {
      const canais = await this.canalRepo.find({
        where: { empresaId },
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        data: canais,
        total: canais.length,
        message: 'Controller de teste funcionando',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message ?? 'Erro ao listar canais de teste',
      };
    }
  }
}
