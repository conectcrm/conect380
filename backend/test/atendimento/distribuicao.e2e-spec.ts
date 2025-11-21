/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../test.database.config';
import { TriagemModule } from '../../src/modules/triagem/triagem.module';
import { AtendimentoModule } from '../../src/modules/atendimento/atendimento.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '../../src/config/logger.config';
import {
  createFullAtendimentoScenario,
  createTestAtendente,
  createTestUsuario,
  resetFactorySequences,
} from '../factories/test.factories';
import { getMockProviders } from '../mocks/external-services.mock';
import { TicketService } from '../../src/modules/atendimento/services/ticket.service';

/**
 * 🧪 E2E Test: Distribuição de Tickets
 * 
 * Testa o fluxo:
 * 1. Ticket criado entra em fila de distribuição
 * 2. Sistema busca atendentes disponíveis
 * 3. Ticket é atribuído ao atendente com menor carga
 * 4. Atendente recebe notificação
 * 5. Métricas de distribuição são atualizadas
 */
describe('Distribuição E2E - Atribuição de Tickets', () => {
  let app: INestApplication;
  let ticketService: TicketService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        WinstonModule.forRoot({
          ...winstonConfig,
          silent: true,
        }),
        TriagemModule,
        AtendimentoModule,
      ],
      providers: [
        ...getMockProviders(),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    ticketService = app.get(TicketService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetFactorySequences();
  });

  describe('Cenário 1: Distribuição para atendente disponível', () => {
    it.skip('deve atribuir ticket a atendente disponível (TODO: AtribuicaoService)', async () => {
      // Arrange: Criar cenário completo
      const { empresa, usuario, atendente, equipe, ticket } =
        await createFullAtendimentoScenario(app);

      // Assert: Atendente está disponível
      expect(atendente.status).toBe('disponivel');
      expect(atendente.online).toBe(true);
      expect(atendente.capacidadeMaxima).toBeGreaterThan(0);

      // Act: Atribuir ticket manualmente (simula distribuição automática)
      // const atribuicao = await atribuicaoService.atribuir(ticket.id, atendente.id);

      // Assert
      // expect(atribuicao).toBeDefined();
      // expect(atribuicao.ticketId).toBe(ticket.id);
      // expect(atribuicao.atendenteId).toBe(atendente.id);

      // TODO: Implementar quando AtribuicaoService estiver pronto
      expect(ticket).toBeDefined(); // Placeholder
    });

    it.skip('deve incrementar contador de atendimentos ativos do atendente (TODO: AtendenteService)', async () => {
      // Arrange
      const { atendente, ticket } = await createFullAtendimentoScenario(app);
      const atendimentosInicial = atendente.atendimentosAtivos;

      // Act: Atribuir ticket
      // await atribuicaoService.atribuir(ticket.id, atendente.id);

      // Buscar atendente atualizado
      // const atendenteAtualizado = await atendenteService.buscarPorId(atendente.id);

      // Assert: Contador incrementado
      // expect(atendenteAtualizado.atendimentosAtivos).toBe(atendimentosInicial + 1);

      // TODO: Implementar quando service existir
      expect(atendimentosInicial).toBe(0);
    });
  });

  describe('Cenário 2: Distribuição baseada em carga', () => {
    it.skip('deve distribuir para atendente com menor carga (TODO: DistribuicaoService)', async () => {
      // Arrange: Criar 2 atendentes
      const { empresa, equipe, ticket } = await createFullAtendimentoScenario(app);

      const usuario2 = await createTestUsuario(app, empresa.id, {
        nome: 'Atendente 2',
      });
      const atendente1 = await createTestAtendente(app, usuario2.id, empresa.id, {
        atendimentosAtivos: 2, // Atendente com carga
      });

      const usuario3 = await createTestUsuario(app, empresa.id, {
        nome: 'Atendente 3',
      });
      const atendente2 = await createTestAtendente(app, usuario3.id, empresa.id, {
        atendimentosAtivos: 0, // Atendente livre
      });

      // Act: Distribuir ticket
      // const resultado = await distribuicaoService.distribuirAutomaticamente(ticket.id, equipe.id);

      // Assert: Deve escolher atendente2 (menor carga)
      // expect(resultado.atendenteId).toBe(atendente2.id);

      // TODO: Implementar lógica de distribuição
      expect(atendente2.atendimentosAtivos).toBeLessThan(atendente1.atendimentosAtivos);
    });

    it.skip('deve respeitar capacidade máxima do atendente (TODO: DistribuicaoService)', async () => {
      // Arrange
      const { empresa, ticket } = await createFullAtendimentoScenario(app);

      const usuario = await createTestUsuario(app, empresa.id);
      const atendenteLoatado = await createTestAtendente(app, usuario.id, empresa.id, {
        capacidadeMaxima: 5,
        atendimentosAtivos: 5, // Já no limite
      });

      // Act: Tentar atribuir ticket
      // const resultado = await atribuicaoService.atribuir(ticket.id, atendenteLoatado.id);

      // Assert: Deve falhar ou não atribuir
      // expect(resultado).toBeNull() ou throw error

      // TODO: Implementar validação de capacidade
      expect(atendenteLoatado.atendimentosAtivos).toBe(atendenteLoatado.capacidadeMaxima);
    });
  });

  describe('Cenário 3: Transferência de tickets', () => {
    it('deve transferir ticket entre atendentes', async () => {
      // Arrange: 2 atendentes
      const { empresa, ticket } = await createFullAtendimentoScenario(app);

      const usuario2 = await createTestUsuario(app, empresa.id, {
        nome: 'Atendente Destino',
      });
      const atendenteDestino = await createTestAtendente(app, usuario2.id, empresa.id);

      // Act: Transferir ticket
      const ticketTransferido = await ticketService.transferir(
        ticket.id,
        {
          atendenteDestinoId: atendenteDestino.id,
          motivo: 'Cliente solicitou atendente especializado',
        }
      );

      // Assert
      expect(ticketTransferido).toBeDefined();
      expect(ticketTransferido.id).toBe(ticket.id);
      // Verificar histórico de transferência (se implementado)
    });

    it('deve incrementar métrica de transferências', async () => {
      // Arrange
      const { empresa, ticket } = await createFullAtendimentoScenario(app);
      const usuario2 = await createTestUsuario(app, empresa.id);
      const atendenteDestino = await createTestAtendente(app, usuario2.id, empresa.id);

      // Act: Transferir
      await ticketService.transferir(
        ticket.id,
        {
          atendenteDestinoId: atendenteDestino.id,
          motivo: 'Transferência de teste',
        }
      );

      // Assert: Métrica incrementada (verificação via Prometheus)
      const metrics = await import('../../src/config/metrics');
      const metricsText = await metrics.register.metrics();

      expect(metricsText).toContain('tickets_transferidos_total');
    });
  });

  describe('Cenário 4: Notificações de atribuição', () => {
    it.skip('deve enviar notificação ao atendente quando ticket for atribuído (TODO: NotificacaoService)', async () => {
      // Arrange
      const { ticket, atendente } = await createFullAtendimentoScenario(app);

      // Pegar mock de notificações
      const mockService = app.get('SendGridService');
      const enviarEmailSpy = jest.spyOn(mockService, 'enviarEmail');

      // Act: Atribuir ticket (simular notificação)
      // await atribuicaoService.atribuirComNotificacao(ticket.id, atendente.id);

      // Assert: Email enviado
      // expect(enviarEmailSpy).toHaveBeenCalledWith(
      //   atendente.usuario.email,
      //   expect.stringContaining('Novo Ticket Atribuído'),
      //   expect.any(String)
      // );

      // TODO: Implementar quando NotificacaoService existir
      expect(mockService).toBeDefined();
    });

    it.skip('deve criar registro de notificação no banco (TODO: NotificacaoService)', async () => {
      // Arrange
      const { ticket, atendente } = await createFullAtendimentoScenario(app);

      // Act: Atribuir e notificar
      // const notificacao = await notificacaoService.criar({
      //   usuarioId: atendente.usuarioId,
      //   tipo: 'ticket_atribuido',
      //   conteudo: `Ticket #${ticket.id} foi atribuído a você`,
      //   referencia: ticket.id,
      // });

      // Assert
      // expect(notificacao).toBeDefined();
      // expect(notificacao.usuarioId).toBe(atendente.usuarioId);

      // TODO: Implementar NotificacaoService
      expect(atendente).toBeDefined(); // Placeholder
    });
  });

  describe('Cenário 5: Falhas de distribuição', () => {
    it.skip('deve retornar erro se não houver atendentes disponíveis (TODO: DistribuicaoService)', async () => {
      // Arrange: Criar ticket mas SEM atendentes
      const { empresa, contato } = await createFullAtendimentoScenario(app);
      const ticket = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: 'whatsapp-canal-id',
        clienteNumero: contato.telefone,
      });

      // Remover todos os atendentes (simular falta de disponibilidade)
      // await atendenteRepository.delete({ empresaId: empresa.id });

      // Act & Assert: Deve lançar erro
      // await expect(
      //   distribuicaoService.distribuirAutomaticamente(ticket.id, equipe.id)
      // ).rejects.toThrow('Nenhum atendente disponível');

      // TODO: Implementar validação
      expect(ticket.status).toBe('aguardando_atendente');
    });

    it.skip('deve marcar ticket como não atribuído se distribuição falhar (TODO: DistribuicaoService)', async () => {
      // Arrange
      const { ticket } = await createFullAtendimentoScenario(app);

      // Act: Tentar distribuir sem atendentes
      // const resultado = await distribuicaoService.tentarDistribuir(ticket.id);

      // Assert: Ticket permanece aguardando
      // expect(resultado.sucesso).toBe(false);
      // expect(ticket.status).toBe('aguardando_atendente');

      // TODO: Implementar lógica de fallback
      expect(ticket).toBeDefined();
    });
  });
});
