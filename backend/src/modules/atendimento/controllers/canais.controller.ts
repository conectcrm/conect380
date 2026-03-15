import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { Canal, TipoCanal, StatusCanal } from '../entities/canal.entity';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';
// import { OrquestradorService } from '../services/orquestrador.service'; // Temporariamente desabilitado
import { CriarCanalDto, AtualizarCanalDto } from '../dto';
import { ValidacaoIntegracoesService } from '../services/validacao-integracoes.service';
import { EmailSenderService } from '../services/email-sender.service';

@Controller('api/atendimento/canais')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CONFIG_INTEGRACOES_MANAGE)
export class CanaisController {
  private readonly logger = new Logger(CanaisController.name);

  constructor(
    @InjectRepository(Canal)
    private canalRepo: Repository<Canal>,
    @InjectRepository(IntegracoesConfig)
    private integracaoRepo: Repository<IntegracoesConfig>,
    private validacaoService: ValidacaoIntegracoesService,
    private emailSenderService: EmailSenderService,
    // OrquestradorService temporariamente removido
  ) {
    this.logger.log('✅ CanaisController criado!');
  }


  private maskSecretValue(value: unknown): string {
    if (value === null || value === undefined) return '[masked]';
    const str = String(value);
    if (!str) return '[masked]';
    const suffix = str.slice(-4);
    return `${'*'.repeat(Math.max(str.length - 4, 4))}${suffix}`;
  }

  private sanitizeForLog(value: any, depth = 0): any {
    if (depth > 5) return '[max-depth]';
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) {
      return value.slice(0, 20).map((item) => this.sanitizeForLog(item, depth + 1));
    }
    if (typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        if (/(token|secret|senha|password|api[_-]?key|webhook_verify_token)/i.test(key)) {
          out[key] = this.maskSecretValue(val);
          continue;
        }
        if (typeof val === 'string' && /(html|body|mensagem|conteudo|text)/i.test(key)) {
          out[key] = val.length > 120 ? `${val.slice(0, 120)}...` : val;
          continue;
        }
        out[key] = this.sanitizeForLog(val, depth + 1);
      }
      return out;
    }
    return value;
  }

  private safeStringifyForLog(value: any): string {
    try {
      return JSON.stringify(this.sanitizeForLog(value));
    } catch {
      return '[unserializable]';
    }
  }
  @Get()
  async listar(@EmpresaId() empresaId: string) {
    this.logger.log('🔍 [CanaisController] GET /atendimento/canais chamado');

    try {
      this.logger.log('🔍 [CanaisController] empresaId:', empresaId);
      if (!empresaId) {
        this.logger.warn(
          '⚠️ [CanaisController] empresaId ausente no token do usuário. Abortando listagem.',
        );
        return {
          success: false,
          message: 'empresaId ausente no token do usuário',
          data: [],
          total: 0,
        };
      }

      // Buscar APENAS canais de comunicação (whatsapp, telegram, email, chat, telefone)
      const canais = await this.canalRepo.find({
        where: { empresaId },
        order: { createdAt: 'DESC' },
      });

      this.logger.log('🔍 [CanaisController] Canais de comunicação encontrados:', canais.length);

      // ✅ CORREÇÃO: Não misturar com configurações de IA (openai/anthropic)
      // Integrações de IA devem ter endpoint separado se necessário

      return {
        success: true,
        data: canais,
        total: canais.length,
      };
    } catch (error) {
      this.logger.error('❌ [CanaisController] Erro ao listar canais:', error);
      this.logger.error('❌ [CanaisController] Stack:', error.stack);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }

  /**
   * ✅ NOVO: Endpoint separado para listar integrações de IA (OpenAI, Anthropic)
   * Não mistura com canais de comunicação (WhatsApp, Telegram, Email)
   */
  @Get('integracoes')
  async listarIntegracoes(@EmpresaId() empresaId: string) {
    this.logger.log('🤖 [CanaisController] GET /atendimento/canais/integracoes chamado');

    try {
      if (!empresaId) {
        return {
          success: false,
          message: 'empresaId ausente no token do usuário',
          data: [],
        };
      }

      const integracoes = await this.integracaoRepo.find({
        where: { empresaId },
        order: { criadoEm: 'DESC' },
      });

      this.logger.log('🤖 [CanaisController] Integrações de IA encontradas:', integracoes.length);

      return {
        success: true,
        data: integracoes,
        total: integracoes.length,
      };
    } catch (error) {
      this.logger.error('❌ [CanaisController] Erro ao listar integrações:', error);
      return {
        success: false,
        message: error.message || 'Erro ao listar integrações',
        data: [],
      };
    }
  }

  /**
   * 📧 Endpoint de teste de envio de e-mail
   * Envia um e-mail de teste para verificar se a configuração está correta
   */
  @Post('validar-email')
  async testarEmail(@EmpresaId() empresaId: string, @Body() body: { emailTeste: string }) {
    this.logger.log('📧 [CanaisController] POST /atendimento/canais/validar-email chamado');

    try {
      if (!empresaId) {
        return {
          success: false,
          message: 'empresaId ausente no token do usuário',
        };
      }

      const { emailTeste } = body;
      if (!emailTeste) {
        return {
          success: false,
          message: 'Campo emailTeste é obrigatório',
        };
      }

      this.logger.log(`📧 Enviando e-mail de teste para: ${emailTeste}`);

      const messageId = await this.emailSenderService.enviarTexto(
        empresaId,
        emailTeste,
        '✅ Teste de Configuração - ConectCRM',
        'Este é um e-mail de teste para validar a configuração do canal de e-mail.\n\nSe você recebeu esta mensagem, sua configuração está funcionando corretamente!',
      );

      if (messageId) {
        this.logger.log('✅ E-mail de teste enviado com sucesso:', messageId);
        return {
          success: true,
          message: 'E-mail de teste enviado com sucesso!',
          messageId: messageId,
        };
      } else {
        this.logger.error('❌ Erro ao enviar e-mail de teste');
        return {
          success: false,
          message: 'Erro ao enviar e-mail de teste',
        };
      }
    } catch (error) {
      this.logger.error('❌ [CanaisController] Erro ao testar e-mail:', error);
      return {
        success: false,
        message: error.message || 'Erro ao testar e-mail',
      };
    }
  }

  /**
   * 🚀 Endpoint temporário para criar canal de e-mail automaticamente
   * Usar: POST /api/atendimento/canais/criar-canal-email
   */
  @Post('criar-canal-email')
  async criarCanalEmail(@EmpresaId() empresaId: string) {
    this.logger.log('📧 [CanaisController] POST /atendimento/canais/criar-canal-email chamado');

    try {
      if (!empresaId) {
        return {
          success: false,
          message: 'empresaId ausente no token do usuário',
        };
      }

      // Verificar se já existe canal de e-mail
      const canalExistente = await this.canalRepo.findOne({
        where: { empresaId, tipo: TipoCanal.EMAIL },
      });

      if (canalExistente) {
        this.logger.log('✅ Canal de e-mail já existe:', canalExistente.id);
        return {
          success: true,
          message: 'Canal de e-mail já existe',
          data: canalExistente,
          alreadyExists: true,
        };
      }

      // Criar novo canal de e-mail
      const novoCanal = this.canalRepo.create({
        empresaId,
        nome: 'E-mail Principal',
        tipo: TipoCanal.EMAIL,
        provider: 'sendgrid',
        status: StatusCanal.ATIVO,
        configuracao: {
          tipo: 'email',
          descricao: 'Canal de atendimento por e-mail via SendGrid',
        },
      });

      await this.canalRepo.save(novoCanal);

      this.logger.log('✅ Canal de e-mail criado com sucesso:', novoCanal.id);

      return {
        success: true,
        message: 'Canal de e-mail criado com sucesso!',
        data: novoCanal,
      };
    } catch (error) {
      this.logger.error('❌ [CanaisController] Erro ao criar canal de e-mail:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar canal de e-mail',
      };
    }
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string, @EmpresaId() empresaId: string) {

    const canal = await this.canalRepo.findOne({
      where: { id, empresaId },
      // relations removidas temporariamente
    });

    if (!canal) {
      return {
        success: false,
        message: 'Canal não encontrado',
      };
    }

    return {
      success: true,
      data: canal,
    };
  }

  @Post()
  async criar(@EmpresaId() empresaId: string, @Body() dto: any) {
    const tipo = dto.tipo || dto.nome?.toLowerCase();
    if (!empresaId) {
      this.logger.warn(
        '⚠️ [CanaisController] empresaId ausente no token do usuário. Abortando criação.',
      );
      return {
        success: false,
        message: 'empresaId ausente no token do usuário',
      };
    }

    this.logger.log('🔍 [CanaisController] POST /atendimento/canais chamado');
    this.logger.log('🔍 [CanaisController] Tipo:', tipo);
    this.logger.log('🔍 [CanaisController] DTO:', this.safeStringifyForLog(dto));

    // Se for openai ou anthropic, salvar em integracoes_config
    if (tipo === 'openai' || tipo === 'anthropic') {
      this.logger.log('🤖 [CanaisController] Salvando configuração de IA:', tipo);
      this.logger.log('🤖 [CanaisController] empresaId:', empresaId);

      try {
        // Buscar ou criar configuração
        let config = await this.integracaoRepo.findOne({
          where: { empresaId, tipo },
        });

        this.logger.log('🔍 [CanaisController] Config existente encontrada?', config ? 'SIM' : 'NÃO');

        const credenciais = dto.configuracao?.credenciais || dto.credenciais || {};
        this.logger.log(
          '📝 [CanaisController] Credenciais recebidas:',
          this.safeStringifyForLog(credenciais),
        );

        // Mapear campos do frontend para backend
        const credenciaisFormatadas: any = {};

        if (tipo === 'openai') {
          credenciaisFormatadas.api_key = credenciais.api_key || credenciais.openai_api_key;
          credenciaisFormatadas.model =
            credenciais.model || credenciais.openai_model || 'gpt-4o-mini';
          credenciaisFormatadas.max_tokens =
            credenciais.max_tokens || credenciais.openai_max_tokens || 2000;
          credenciaisFormatadas.temperature =
            credenciais.temperature || credenciais.openai_temperature || 0.7;
          credenciaisFormatadas.auto_responder = credenciais.auto_responder || false;
        } else if (tipo === 'anthropic') {
          credenciaisFormatadas.api_key = credenciais.api_key || credenciais.anthropic_api_key;
          credenciaisFormatadas.model =
            credenciais.model || credenciais.anthropic_model || 'claude-3-5-sonnet-20241022';
          credenciaisFormatadas.max_tokens =
            credenciais.max_tokens || credenciais.anthropic_max_tokens || 2000;
          credenciaisFormatadas.auto_responder = credenciais.auto_responder || false;
        }

        this.logger.log(
          '📝 [CanaisController] Credenciais formatadas:',
          this.safeStringifyForLog(credenciaisFormatadas),
        );

        if (config) {
          // Atualizar existente
          this.logger.log('🔄 [CanaisController] Atualizando configuração existente...');
          config.credenciais = credenciaisFormatadas;
          config.ativo = dto.ativo !== undefined ? dto.ativo : true;
          await this.integracaoRepo.save(config);
          this.logger.log('✅ [CanaisController] Configuração IA atualizada:', config.id);
        } else {
          // Criar nova
          this.logger.log('➕ [CanaisController] Criando nova configuração...');
          config = this.integracaoRepo.create({
            empresaId,
            tipo,
            ativo: dto.ativo !== undefined ? dto.ativo : true,
            credenciais: credenciaisFormatadas,
          });
          await this.integracaoRepo.save(config);
          this.logger.log('✅ [CanaisController] Nova configuração IA criada:', config.id);
        }

        this.logger.log('✅ [CanaisController] Config final salva:', this.safeStringifyForLog(config));

        return {
          success: true,
          message: `Configuração ${tipo.toUpperCase()} salva com sucesso!`,
          data: config,
        };
      } catch (error) {
        this.logger.error('❌ [CanaisController] Erro ao salvar config IA:', error);
        this.logger.error('❌ [CanaisController] Stack trace:', error.stack);
        return {
          success: false,
          message: `Erro ao salvar configuração: ${error.message}`,
        };
      }
    }

    // Caso contrário, criar canal normal
    this.logger.log('📝 [CanaisController] Criando canal normal:', tipo);
    this.logger.log(
      '📝 [CanaisController] Configuracao recebida:',
      this.safeStringifyForLog(dto.configuracao),
    );

    // 🔧 Normalizar estrutura de configuração para WhatsApp
    let configuracaoFinal = dto.configuracao;

    if (tipo === 'whatsapp' || tipo?.toLowerCase() === 'whatsapp') {
      const credenciaisRecebidas = dto.configuracao?.credenciais || dto.configuracao || {};
      const webhookVerifyToken =
        credenciaisRecebidas.whatsapp_webhook_verify_token ||
        credenciaisRecebidas.webhook_verify_token ||
        process.env.WHATSAPP_VERIFY_TOKEN;

      if (!webhookVerifyToken) {
        return {
          success: false,
          message:
            'whatsapp_webhook_verify_token obrigatorio para canais WhatsApp em ambiente seguro',
        };
      }

      configuracaoFinal = {
        credenciais: {
          whatsapp_api_token: credenciaisRecebidas.whatsapp_api_token || credenciaisRecebidas.token,
          whatsapp_phone_number_id:
            credenciaisRecebidas.whatsapp_phone_number_id || credenciaisRecebidas.phone_number_id,
          whatsapp_business_account_id:
            credenciaisRecebidas.whatsapp_business_account_id ||
            credenciaisRecebidas.business_account_id,
          whatsapp_webhook_verify_token: webhookVerifyToken,
        },
      };

      this.logger.log(
        '✅ [CanaisController] WhatsApp - Configuração normalizada:',
        this.safeStringifyForLog(configuracaoFinal),
      );
    }

    const canal = this.canalRepo.create({
      nome: dto.nome,
      tipo,
      empresaId,
      ativo: false, // Inicia desativado até configuração completa
      configuracao: configuracaoFinal, // ✅ Salva a estrutura normalizada
    });

    await this.canalRepo.save(canal);

    this.logger.log('✅ [CanaisController] Canal salvo com ID:', canal.id);
    this.logger.log(
      '✅ [CanaisController] Configuracao salva:',
      this.safeStringifyForLog(canal.configuracao),
    );

    return {
      success: true,
      message: 'Canal criado com sucesso',
      data: canal,
    };
  }

  @Put(':id')
  async atualizar(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: AtualizarCanalDto,
  ) {

    this.logger.log('🔍 [CanaisController] PUT /atendimento/canais/:id chamado');
    this.logger.log('🔍 [CanaisController] ID:', id);
    this.logger.log('🔍 [CanaisController] DTO:', this.safeStringifyForLog(dto));

    const canal = await this.canalRepo.findOne({
      where: { id, empresaId },
    });

    if (!canal) {
      return {
        success: false,
        message: 'Canal não encontrado',
      };
    }

    // ✅ Atualizar campos explicitamente para garantir que configuracao seja salva
    if (dto.nome !== undefined) canal.nome = dto.nome;
    if (dto.ativo !== undefined) canal.ativo = dto.ativo;
    if (dto.configuracao !== undefined) {
      this.logger.log(
        '📝 [CanaisController] Atualizando configuracao:',
        this.safeStringifyForLog(dto.configuracao),
      );

      // 🔧 MERGE inteligente para WhatsApp - preserva campos existentes e adiciona/atualiza novos
      if (canal.tipo === 'whatsapp' || canal.tipo?.toLowerCase() === 'whatsapp') {
        // Preservar configuração existente e fazer merge com a nova
        const configExistente = canal.configuracao || {};
        const credenciaisExistentes = configExistente.credenciais || {};
        const novasCredenciais = dto.configuracao.credenciais || dto.configuracao || {};

        // Merge das credenciais preservando todos os campos
        const credenciaisMerged = {
          whatsapp_api_token:
            novasCredenciais.whatsapp_api_token || credenciaisExistentes.whatsapp_api_token,
          whatsapp_phone_number_id:
            novasCredenciais.whatsapp_phone_number_id ||
            credenciaisExistentes.whatsapp_phone_number_id,
          whatsapp_business_account_id:
            novasCredenciais.whatsapp_business_account_id ||
            credenciaisExistentes.whatsapp_business_account_id,
          whatsapp_webhook_verify_token:
            novasCredenciais.whatsapp_webhook_verify_token ||
            credenciaisExistentes.whatsapp_webhook_verify_token,
        };

        // Remove propriedades undefined para manter o objeto limpo
        Object.keys(credenciaisMerged).forEach((key) => {
          if (credenciaisMerged[key] === undefined) {
            delete credenciaisMerged[key];
          }
        });

        this.logger.log(
          '🔄 [CanaisController] Merge WhatsApp - Credenciais antes:',
          this.safeStringifyForLog(credenciaisExistentes),
        );
        this.logger.log(
          '🔄 [CanaisController] Merge WhatsApp - Credenciais novas:',
          this.safeStringifyForLog(novasCredenciais),
        );
        this.logger.log(
          '✅ [CanaisController] Merge WhatsApp - Credenciais mescladas:',
          this.safeStringifyForLog(credenciaisMerged),
        );

        canal.configuracao = {
          ...configExistente,
          ...dto.configuracao,
          credenciais: credenciaisMerged,
        };
      } else {
        // Para outros tipos de canal, sobrescreve normalmente
        canal.configuracao = dto.configuracao;
      }
    }

    await this.canalRepo.save(canal);

    this.logger.log('✅ [CanaisController] Canal atualizado');
    this.logger.log(
      '✅ [CanaisController] Configuracao atualizada:',
      this.safeStringifyForLog(canal.configuracao),
    );

    // 🔧 CRÍTICO: Se for WhatsApp, atualizar TAMBÉM atendimento_integracoes_config
    const tipoCanal = canal.tipo?.toString().toLowerCase();
    if (tipoCanal === 'whatsapp' || tipoCanal === 'whatsapp_business_api') {
      this.logger.log(
        '🔄 [CanaisController] Atualizando atendimento_integracoes_config para WhatsApp...',
      );

      try {
        // Buscar ou criar configuração na tabela de integrações
        let integracao = await this.integracaoRepo.findOne({
          where: {
            empresaId,
            tipo: 'whatsapp_business_api',
          },
        });

        const credenciais = canal.configuracao?.credenciais || {};

        this.logger.log(
          '📝 [CanaisController] Credenciais a salvar:',
          this.safeStringifyForLog(credenciais),
        );

        if (integracao) {
          // Atualizar configuração existente
          this.logger.log('🔄 [CanaisController] Atualizando integração existente:', integracao.id);

          // ⚠️ IMPORTANTE: Atualizar AMBOS os campos (JSONB E colunas diretas)
          // O whatsapp-sender.service usa campo JSONB, mas colunas servem como backup

          integracao.credenciais = {
            ...integracao.credenciais,
            ...credenciais,
          };

          // Atualizar também as colunas diretas
          if (credenciais.whatsapp_api_token) {
            integracao.whatsappApiToken = credenciais.whatsapp_api_token;
          }
          if (credenciais.whatsapp_phone_number_id) {
            integracao.whatsappPhoneNumberId = credenciais.whatsapp_phone_number_id;
          }
          if (credenciais.whatsapp_business_account_id) {
            integracao.whatsappBusinessAccountId = credenciais.whatsapp_business_account_id;
          }
          if (credenciais.whatsapp_webhook_verify_token) {
            integracao.whatsappWebhookVerifyToken = credenciais.whatsapp_webhook_verify_token;
          }

          integracao.ativo = canal.ativo;
          integracao.whatsappAtivo = canal.ativo;

          await this.integracaoRepo.save(integracao);
          this.logger.log('✅ [CanaisController] Integração atualizada com sucesso!');
          this.logger.log(
            '✅ [CanaisController] Credenciais JSONB:',
            this.safeStringifyForLog(integracao.credenciais),
          );
          this.logger.log(
            '✅ [CanaisController] Token coluna:',
            integracao.whatsappApiToken?.substring(0, 20) + '...',
          );
        } else {
          // Criar nova configuração
          this.logger.log('➕ [CanaisController] Criando nova integração...');

          integracao = this.integracaoRepo.create({
            empresaId,
            tipo: 'whatsapp_business_api',
            ativo: canal.ativo,
            credenciais: credenciais,
            whatsappAtivo: canal.ativo,
            whatsappApiToken: credenciais.whatsapp_api_token,
            whatsappPhoneNumberId: credenciais.whatsapp_phone_number_id,
            whatsappBusinessAccountId: credenciais.whatsapp_business_account_id,
            whatsappWebhookVerifyToken: credenciais.whatsapp_webhook_verify_token,
          });

          await this.integracaoRepo.save(integracao);
          this.logger.log('✅ [CanaisController] Nova integração criada:', integracao.id);
        }
      } catch (error) {
        this.logger.error('❌ [CanaisController] Erro ao atualizar integração:', error.message);
        this.logger.error(error.stack);
        // Não falha a atualização do canal, apenas loga o erro
      }
    }

    // Se foi ativado, inicializar
    if (dto.ativo === true) {
      try {
        // await this.orquestradorService.inicializarCanal(canal);
        // TODO: Implementar inicialização manual
      } catch (error) {
        canal.ativo = false;
        await this.canalRepo.save(canal);

        return {
          success: false,
          message: `Erro ao inicializar canal: ${error.message}`,
        };
      }
    }

    return {
      success: true,
      message: 'Canal atualizado com sucesso',
      data: canal,
    };
  }

  @Delete(':id')
  async deletar(@EmpresaId() empresaId: string, @Param('id') id: string) {

    const canal = await this.canalRepo.findOne({
      where: { id, empresaId },
    });

    if (!canal) {
      return {
        success: false,
        message: 'Canal não encontrado',
      };
    }

    await this.canalRepo.softDelete(id);

    return {
      success: true,
      message: 'Canal excluído com sucesso',
    };
  }

  @Post(':id/ativar')
  async ativar(@EmpresaId() empresaId: string, @Param('id') id: string) {

    const canal = await this.canalRepo.findOne({
      where: { id, empresaId },
    });

    if (!canal) {
      return {
        success: false,
        message: 'Canal não encontrado',
      };
    }

    try {
      // await this.orquestradorService.inicializarCanal(canal);
      // TODO: Implementar inicialização manual

      canal.ativo = true;
      await this.canalRepo.save(canal);

      return {
        success: true,
        message: 'Canal ativado com sucesso',
        data: canal,
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao ativar canal: ${error.message}`,
      };
    }
  }

  @Post(':id/desativar')
  async desativar(@EmpresaId() empresaId: string, @Param('id') id: string) {

    const canal = await this.canalRepo.findOne({
      where: { id, empresaId },
    });

    if (!canal) {
      return {
        success: false,
        message: 'Canal não encontrado',
      };
    }

    canal.ativo = false;
    await this.canalRepo.save(canal);

    return {
      success: true,
      message: 'Canal desativado com sucesso',
      data: canal,
    };
  }

  /**
   * 🧪 Endpoint para validar credenciais de integração
   * POST /atendimento/canais/validar
   * Body: { tipo: 'whatsapp' | 'openai' | 'anthropic' | 'telegram' | 'twilio', credenciais: object }
   */
  @Post('validar')
  async validarIntegracao(@Body() dto: { tipo: string; credenciais: any }) {
    this.logger.log('🔍 [CanaisController] POST /atendimento/canais/validar chamado');
    this.logger.log('🔍 [CanaisController] Tipo:', dto.tipo);

    try {
      const resultado = await this.validacaoService.validarIntegracao(dto.tipo, dto.credenciais);

      this.logger.log('✅ [CanaisController] Validação concluída:', resultado.valido);

      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      this.logger.error('❌ [CanaisController] Erro na validação:', error.message);

      return {
        success: false,
        message: `Erro ao validar integração: ${error.message}`,
        data: {
          valido: false,
          mensagem: error.message,
        },
      };
    }
  }

  /**
   * 📱 Endpoint para testar envio de mensagem
   * POST /atendimento/canais/validar-mensagem
   * Body: { tipo: 'whatsapp', numero: string, mensagem: string, credenciais: object }
   */
  @Post('validar-mensagem')
  async testarMensagem(
    @Body() dto: { tipo: string; numero: string; mensagem: string; credenciais: any },
  ) {
    this.logger.log('🔍 [CanaisController] POST /atendimento/canais/validar-mensagem chamado');
    this.logger.log('🔍 [CanaisController] Tipo:', dto.tipo);
    this.logger.log('🔍 [CanaisController] Número:', dto.numero);

    try {
      const resultado = await this.validacaoService.testarEnvioMensagem(
        dto.tipo,
        dto.numero,
        dto.mensagem,
        dto.credenciais,
      );

      this.logger.log('✅ [CanaisController] Mensagem enviada com sucesso!');

      return {
        success: true,
        message: 'Mensagem enviada com sucesso!',
        data: resultado,
      };
    } catch (error) {
      this.logger.error('❌ [CanaisController] Erro ao enviar mensagem:', error.message);

      return {
        success: false,
        message: `Erro ao enviar mensagem: ${error.message}`,
      };
    }
  }
}

