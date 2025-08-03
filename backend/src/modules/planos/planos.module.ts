import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plano } from './entities/plano.entity';
import { ModuloSistema } from './entities/modulo-sistema.entity';
import { PlanoModulo } from './entities/plano-modulo.entity';
import { AssinaturaEmpresa } from './entities/assinatura-empresa.entity';
import { PlanosService } from './planos.service';
import { PlanosController } from './planos.controller';
import { AssinaturasService } from './assinaturas.service';
import { AssinaturasController } from './assinaturas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plano,
      ModuloSistema,
      PlanoModulo,
      AssinaturaEmpresa
    ])
  ],
  controllers: [PlanosController, AssinaturasController],
  providers: [PlanosService, AssinaturasService],
  exports: [PlanosService, AssinaturasService]
})
export class PlanosModule { }
