import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { NucleoAtendimento } from './entities/nucleo-atendimento.entity';
import { Departamento } from './entities/departamento.entity';
import { FluxoTriagem } from './entities/fluxo-triagem.entity';
import { SessaoTriagem } from './entities/sessao-triagem.entity';
import { Contato } from '../clientes/contato.entity';
import { Equipe } from './entities/equipe.entity';
import { AtendenteEquipe } from './entities/atendente-equipe.entity';
import { AtendenteAtribuicao } from './entities/atendente-atribuicao.entity';
import { EquipeAtribuicao } from './entities/equipe-atribuicao.entity';
import { User } from '../users/user.entity';
import { Ticket } from '../atendimento/entities/ticket.entity';
import { TriagemLog } from './entities/triagem-log.entity';

// Services
import { NucleoService } from './services/nucleo.service';
import { DepartamentoService } from './services/departamento.service';
import { TriagemBotService } from './services/triagem-bot.service';
import { FluxoTriagemService } from './services/fluxo-triagem.service';
import { AtribuicaoService } from './services/atribuicao.service';
import { TriagemLogService } from './services/triagem-log.service';
import { TriagemMessageSenderService } from './services/triagem-message-sender.service';

// Controllers
import { NucleoController } from './controllers/nucleo.controller';
import { DepartamentoController } from './controllers/departamento.controller';
import { TriagemController } from './controllers/triagem.controller';
import { FluxoController } from './controllers/fluxo.controller';
import { EquipeController } from './controllers/equipe.controller';
import { AtribuicaoController } from './controllers/atribuicao.controller';
import { AtendimentoModule } from '../atendimento/atendimento.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NucleoAtendimento,
      Departamento,
      FluxoTriagem,
      SessaoTriagem,
      Contato,
      Equipe,
      AtendenteEquipe,
      AtendenteAtribuicao,
      EquipeAtribuicao,
      User,
      Ticket,
      TriagemLog,
    ]),
    forwardRef(() => AtendimentoModule),
  ],
  controllers: [
    NucleoController,
    DepartamentoController,
    TriagemController,
    FluxoController,
    EquipeController,
    AtribuicaoController,
  ],
  providers: [
    NucleoService,
    DepartamentoService,
    TriagemBotService,
    FluxoTriagemService,
    AtribuicaoService,
    TriagemLogService,
    TriagemMessageSenderService,
  ],
  exports: [
    NucleoService,
    DepartamentoService,
    TriagemBotService,
    FluxoTriagemService,
    AtribuicaoService,
    TriagemLogService,
    TriagemMessageSenderService,
    TypeOrmModule, // ✅ Exportar repositories para testes
  ],
})
export class TriagemModule {}
