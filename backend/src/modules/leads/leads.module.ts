import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead } from './lead.entity';
import { OportunidadesModule } from '../oportunidades/oportunidades.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lead]), OportunidadesModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
