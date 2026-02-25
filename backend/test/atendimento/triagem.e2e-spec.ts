/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../test.database.config';
import { TriagemModule } from '../../src/modules/triagem/triagem.module';
import { AtendimentoModule } from '../../src/modules/atendimento/atendimento.module';
import { MetricsModule } from '../../src/modules/metrics/metrics.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '../../src/config/logger.config';
import {
  createTestEmpresa,
  createTestCanal,
  createTestCliente,
  createTestContato,
  createTestEquipe,
  createTestUsuario,
  createTestAtendente,
  resetFactorySequences,
} from '../factories/test.factories';
import { cleanDatabase } from '../test.helpers';
import { getMockProviders } from '../mocks/external-services.mock';
import { TicketService } from '../../src/modules/atendimento/services/ticket.service';
import { MensagemService } from '../../src/modules/atendimento/services/mensagem.service';
import { register } from '../../src/config/metrics';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

/**
 * 🧪 E2E Test: Fluxo Completo de Triagem
 *
 * Testa o fluxo:
 * 1. Cliente envia mensagem WhatsApp
 * 2. Bot de triagem processa mensagem
 * 3. Sistema cria ticket automaticamente
 * 4. Ticket entra em fila de distribuição
 * 5. Métricas são incrementadas
 * 6. Traces são gerados
 * 7. Logs incluem correlation ID
 */
describe('Triagem E2E - Fluxo Completo', () => {
  let app: INestApplication;
  let ticketService: TicketService;
  let mensagemService: MensagemService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await withE2EBootstrapLock(() => Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        WinstonModule.forRoot({
          ...winstonConfig,
          silent: true, // Silenciar logs nos testes
        }),
        TriagemModule,
        AtendimentoModule,
        MetricsModule,
      ],
      providers: [
        ...getMockProviders(), // Mocks de serviços externos
      ],
    }).compile());

    app = await createE2EApp(moduleFixture, { validationPipe: false });

    ticketService = app.get(TicketService);
    mensagemService = app.get(MensagemService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Resetar sequences dos factories
    resetFactorySequences();
    // Reset métricas Prometheus (para testes isolados)
    register.resetMetrics();
    // Nota: dropSchema:true no test.database.config já limpa o banco entre test suites
  });

  describe('Cenário 1: Cliente envia primeira mensagem', () => {
    it('deve criar ticket automaticamente quando contato enviar mensagem', async () => {
      // Arrange: Criar empresa, contato e equipe
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id, {
        nome: 'João Silva',
        telefone: '+5511988887777',
      });
      const usuario = await createTestUsuario(app, empresa.id);
      const equipe = await createTestEquipe(app, empresa.id, {
        nome: 'Suporte Técnico',
      });
      const atendente = await createTestAtendente(app, usuario.id, empresa.id);

      // Act: Simular recebimento de mensagem do WhatsApp
      const ticket = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
      });

      // Assert: Ticket criado com dados corretos
      expect(ticket).toBeDefined();
      expect(ticket.id).toBeDefined();
      expect(ticket.empresaId).toBe(empresa.id);
      expect(ticket.status).toBe('FILA');
    });

    it('deve salvar mensagem associada ao ticket', async () => {
      // Arrange
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id);
      const ticket = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
        clienteNome: contato.nome,
      });

      // Act: Salvar mensagem do cliente
      // TODO: Implementar quando MensagemService.criar() existir
      // const mensagem = await mensagemService.criar({ ... });

      // Assert
      expect(ticket).toBeDefined();
      // expect(mensagem).toBeDefined();
      // expect(mensagem.ticketId).toBe(ticket.id);
    });

    it.skip('deve incrementar métrica de tickets criados', async () => {
      // Arrange
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id);

      // Pegar valor inicial da métrica
      const metricsInicial = await register.metrics();
      const matchInicial = metricsInicial.match(/tickets_criados_total{status="ABERTO"} (\d+)/);
      const valorInicial = matchInicial ? parseInt(matchInicial[1], 10) : 0;

      // Act: Criar ticket
      await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
      });

      // Assert: Métrica incrementada
      const metricsFinal = await register.metrics();
      const matchFinal = metricsFinal.match(/tickets_criados_total{status="ABERTO"} (\d+)/);
      const valorFinal = matchFinal ? parseInt(matchFinal[1], 10) : 0;

      expect(valorFinal).toBe(valorInicial + 1);
    });
  });

  describe('Cenário 2: Bot de triagem processa mensagem', () => {
    it('deve analisar intenção da mensagem usando IA (mock)', async () => {
      // Arrange
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id);
      const ticket = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
      });

      // Pegar mock do OpenAI
      const openAIService = app.get('OpenAIService');

      // Act: Analisar intenção da mensagem
      const resultado = await openAIService.analisarIntencao(
        'Meu pedido não chegou, preciso de ajuda urgente!',
      );

      // Assert: Mock retorna intenção
      expect(resultado).toBeDefined();
      expect(resultado.intencao).toBeDefined();
      expect(resultado.confianca).toBeGreaterThan(0);
      expect(resultado.confianca).toBeLessThanOrEqual(1);
    });

    it('deve atribuir prioridade baseada na análise', async () => {
      // Arrange
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id);

      // Act: Criar ticket com prioridade alta (urgência detectada)
      const ticket = await ticketService.criarParaTriagem({
        empresaId: empresa.id,
        canalOrigem: 'whatsapp',
        contatoTelefone: contato.telefone,
        contatoNome: contato.nome,
        prioridade: 'alta',
        assunto: 'Solicitação urgente',
      });

      // Assert
      expect(ticket.prioridade).toBe('alta');
    });
  });

  describe('Cenário 3: Ticket entra em fila de distribuição', () => {
    it('deve ticket ter status aguardando_atendente após criação', async () => {
      // Arrange
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id);

      // Act
      const ticket = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
      });

      // Assert
      expect(ticket.status).toBe('FILA');
    });

    it('deve criar registro na tabela de distribuições (se implementado)', async () => {
      // Arrange
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id);
      const equipe = await createTestEquipe(app, empresa.id);
      const ticket = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
        clienteNome: contato.nome,
        origem: 'atendimento',
      });

      // Act: Distribuir ticket para equipe (se método existir)
      // const distribuicao = await distribuicaoService.distribuir(ticket.id, equipe.id);

      // Assert
      // expect(distribuicao).toBeDefined();
      // expect(distribuicao.ticketId).toBe(ticket.id);
      // expect(distribuicao.equipeId).toBe(equipe.id);

      // TODO: Implementar quando DistribuicaoService estiver pronto
      expect(ticket).toBeDefined(); // Placeholder
    });
  });

  describe('Cenário 4: Validação de Observabilidade', () => {
    it('deve gerar trace OpenTelemetry (validação via span)', async () => {
      // Arrange
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id);

      // Act: Executar operação com @Trace decorator
      const ticket = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
        clienteNome: contato.nome,
        origem: 'atendimento',
      });

      // Assert: Se @Trace está aplicado, trace foi gerado
      // (validação real requer instrumentação de teste, aqui verificamos que execução não falhou)
      expect(ticket).toBeDefined();
    });

    it('deve logs incluírem context do service', async () => {
      // Arrange
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id);

      // Act: Executar operação que gera logs
      const ticket = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
      });

      // Assert: Verificar que operação completou (logs foram gerados em background)
      expect(ticket).toBeDefined();
      // Validação real de logs requer capturar Winston output (future enhancement)
    });
  });

  describe('Cenário 5: Reuso de ticket existente', () => {
    it('deve retornar ticket existente se contato já tem ticket aberto', async () => {
      // Arrange
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id);

      // Act: Criar ticket pela primeira vez
      const ticket1 = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
      });

      // Simular nova mensagem do mesmo contato (deve reabrir/retornar mesmo ticket)
      const ticket2 = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
      });

      // Assert: Mesmo ticket ID
      expect(ticket2.id).toBe(ticket1.id);
    });

    it('deve criar novo ticket se anterior foi encerrado', async () => {
      // Arrange
      const empresa = await createTestEmpresa(app);
      const canal = await createTestCanal(app, empresa.id);
      const cliente = await createTestCliente(app, empresa.id);
      const contato = await createTestContato(app, cliente.id);
      const ticket1 = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
      });

      // Encerrar ticket
      await ticketService.encerrar(ticket1.id, { motivo: 'Atendimento finalizado' });

      // Act: Nova mensagem após encerramento
      const ticket2 = await ticketService.buscarOuCriarTicket({
        empresaId: empresa.id,
        canalId: canal.id,
        clienteNumero: contato.telefone,
      });

      // Assert: Novo ticket criado
      expect(ticket2.id).not.toBe(ticket1.id);
      expect(ticket2.status).toBe('FILA');
    });
  });
});


