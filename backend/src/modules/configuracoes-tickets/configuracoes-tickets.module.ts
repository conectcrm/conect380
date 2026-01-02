import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { NivelAtendimento } from './entities/nivel-atendimento.entity';
import { StatusCustomizado } from './entities/status-customizado.entity';
import { TipoServico } from './entities/tipo-servico.entity';

// Services
import { NiveisAtendimentoService } from './services/niveis-atendimento.service';
import { StatusCustomizadosService } from './services/status-customizados.service';
import { TiposServicoService } from './services/tipos-servico.service';

// Controllers
import { NiveisAtendimentoController } from './controllers/niveis-atendimento.controller';
import { StatusCustomizadosController } from './controllers/status-customizados.controller';
import { TiposServicoController } from './controllers/tipos-servico.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NivelAtendimento,
      StatusCustomizado,
      TipoServico,
    ]),
  ],
  controllers: [
    NiveisAtendimentoController,
    StatusCustomizadosController,
    TiposServicoController,
  ],
  providers: [
    NiveisAtendimentoService,
    StatusCustomizadosService,
    TiposServicoService,
  ],
  exports: [
    NiveisAtendimentoService,
    StatusCustomizadosService,
    TiposServicoService,
  ],
})
export class ConfiguracoesTicketsModule { }
