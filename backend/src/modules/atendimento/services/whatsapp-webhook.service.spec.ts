import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHmac } from 'crypto';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';
import { Canal, TipoCanal } from '../entities/canal.entity';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';
import { AIResponseService } from './ai-response.service';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { WhatsAppInteractiveService } from './whatsapp-interactive.service';
import { TicketService } from './ticket.service';
import { MensagemService } from './mensagem.service';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';
import { TriagemBotService } from '../../triagem/services/triagem-bot.service';

const mockIntegracaoRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockCanalRepo = {
  find: jest.fn(),
};

describe('WhatsAppWebhookService (segurança)', () => {
  let service: WhatsAppWebhookService;
  const originalAllowInsecure = process.env.ALLOW_INSECURE_WHATSAPP_WEBHOOK;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppWebhookService,
        { provide: getRepositoryToken(IntegracoesConfig), useValue: mockIntegracaoRepo },
        { provide: getRepositoryToken(Canal), useValue: mockCanalRepo },
        { provide: AIResponseService, useValue: {} },
        { provide: WhatsAppSenderService, useValue: {} },
        { provide: WhatsAppInteractiveService, useValue: {} },
        { provide: TicketService, useValue: {} },
        { provide: MensagemService, useValue: {} },
        { provide: AtendimentoGateway, useValue: {} },
        { provide: TriagemBotService, useValue: {} },
      ],
    }).compile();

    service = module.get(WhatsAppWebhookService);
    mockIntegracaoRepo.find.mockReset();
    mockIntegracaoRepo.findOne.mockReset();
    mockCanalRepo.find.mockReset();
    process.env.ALLOW_INSECURE_WHATSAPP_WEBHOOK = originalAllowInsecure;
  });

  afterAll(() => {
    process.env.ALLOW_INSECURE_WHATSAPP_WEBHOOK = originalAllowInsecure;
  });

  describe('validarPhoneNumberEmpresa', () => {
    it('retorna true quando phone_number_id pertence à integração da empresa', async () => {
      mockIntegracaoRepo.find.mockResolvedValue([
        { whatsappPhoneNumberId: '123', credenciais: {} },
      ]);
      mockCanalRepo.find.mockResolvedValue([]);

      const result = await service.validarPhoneNumberEmpresa('empresa-1', '123');

      expect(result).toBe(true);
      expect(mockIntegracaoRepo.find).toHaveBeenCalledWith({
        where: { empresaId: 'empresa-1', tipo: 'whatsapp_business_api', ativo: true },
      });
    });

    it('consulta canais quando não encontra phone_number_id nas integrações', async () => {
      mockIntegracaoRepo.find.mockResolvedValue([]);
      mockCanalRepo.find.mockResolvedValue([
        {
          empresaId: 'empresa-1',
          tipo: TipoCanal.WHATSAPP,
          ativo: true,
          configuracao: { credenciais: { whatsapp_phone_number_id: 'abc' } },
        },
      ]);

      const result = await service.validarPhoneNumberEmpresa('empresa-1', 'abc');

      expect(result).toBe(true);
      expect(mockCanalRepo.find).toHaveBeenCalledWith({
        where: { empresaId: 'empresa-1', tipo: TipoCanal.WHATSAPP, ativo: true },
      });
    });

    it('retorna false quando ocorre erro ao consultar repositórios', async () => {
      mockIntegracaoRepo.find.mockRejectedValue(new Error('db indisponível'));

      const result = await service.validarPhoneNumberEmpresa('empresa-1', 'xyz');

      expect(result).toBe(false);
      expect(mockCanalRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('validarAssinatura', () => {
    const payload = { object: 'test' };

    it('valida assinatura quando app secret está configurado', async () => {
      const secret = 'super-secret';
      const expectedSignature =
        'sha256=' + createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

      mockIntegracaoRepo.findOne.mockResolvedValue({
        credenciais: { whatsapp_app_secret: secret },
      });

      const result = await service.validarAssinatura('empresa-1', payload, expectedSignature);

      expect(result).toBe(true);
    });

    it('retorna false quando assinatura não bate', async () => {
      mockIntegracaoRepo.findOne.mockResolvedValue({
        credenciais: { whatsapp_app_secret: 'secret' },
      });

      const result = await service.validarAssinatura('empresa-1', payload, 'sha256=invalid');

      expect(result).toBe(false);
    });

    it('permite callback sem secret apenas quando ALLOW_INSECURE_WHATSAPP_WEBHOOK=true', async () => {
      mockIntegracaoRepo.findOne.mockResolvedValue({ credenciais: {} });

      process.env.ALLOW_INSECURE_WHATSAPP_WEBHOOK = 'true';
      const permitido = await service.validarAssinatura('empresa-1', payload, '');

      process.env.ALLOW_INSECURE_WHATSAPP_WEBHOOK = 'false';
      const bloqueado = await service.validarAssinatura('empresa-1', payload, '');

      expect(permitido).toBe(true);
      expect(bloqueado).toBe(false);
    });
  });
});
