import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Canal, TipoCanal, StatusCanal } from '../entities/canal.entity';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';
// import { OrquestradorService } from '../services/orquestrador.service'; // Temporariamente desabilitado
import { CriarCanalDto, AtualizarCanalDto } from '../dto';
import { ValidacaoIntegracoesService } from '../services/validacao-integracoes.service';
import { EmailSenderService } from '../services/email-sender.service';

@Controller('api/atendimento/canais')
@UseGuards(JwtAuthGuard)
export class CanaisController {
  constructor(
    @InjectRepository(Canal)
    private canalRepo: Repository<Canal>,
    @InjectRepository(IntegracoesConfig)
    private integracaoRepo: Repository<IntegracoesConfig>,
    private validacaoService: ValidacaoIntegracoesService,
    private emailSenderService: EmailSenderService,
    // OrquestradorService temporariamente removido
  ) {
    console.log('✅ CanaisController criado!');
  }

  // Endpoint de debug para verificar conteúdo do token
  @Get('debug/token')
  async debugToken(@Req() req) {
    console.log('🔍 [CanaisController] DEBUG TOKEN - req.user:', JSON.stringify(req.user, null, 2));
    return {
      success: true,
      user: req.user,
      empresaId: req.user?.empresa_id || req.user?.empresaId,
      availableFields: Object.keys(req.user || {}),
    };
  }

  @Get()
  async listar(@Req() req) {
    console.log('🔍 [CanaisController] GET /atendimento/canais chamado');
    console.log('🔍 [CanaisController] req.user:', req.user);

    try {
      const empresaId = req.user.empresa_id || req.user.empresaId;
      console.log('🔍 [CanaisController] empresaId:', empresaId);
      if (!empresaId) {
        console.warn(
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

      console.log('🔍 [CanaisController] Canais de comunicação encontrados:', canais.length);

      // ✅ CORREÇÃO: Não misturar com configurações de IA (openai/anthropic)
      // Integrações de IA devem ter endpoint separado se necessário

      return {
        success: true,
        data: canais,
        total: canais.length,
      };
    } catch (error) {
      console.error('❌ [CanaisController] Erro ao listar canais:', error);
      console.error('❌ [CanaisController] Stack:', error.stack);
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
  async listarIntegracoes(@Req() req) {
    console.log('🤖 [CanaisController] GET /atendimento/canais/integracoes chamado');

    try {
      const empresaId = req.user.empresa_id || req.user.empresaId;
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

      console.log('🤖 [CanaisController] Integrações de IA encontradas:', integracoes.length);

      return {
        success: true,
        data: integracoes,
        total: integracoes.length,
      };
    } catch (error) {
      console.error('❌ [CanaisController] Erro ao listar integrações:', error);
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
  @Post('testar-email')
  async testarEmail(@Req() req, @Body() body: { emailTeste: string }) {
    console.log('📧 [CanaisController] POST /atendimento/canais/testar-email chamado');

    try {
      const empresaId = req.user.empresa_id || req.user.empresaId;
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

      console.log(`📧 Enviando e-mail de teste para: ${emailTeste}`);

      const messageId = await this.emailSenderService.enviarTexto(
        empresaId,
        emailTeste,
        '✅ Teste de Configuração - ConectCRM',
        'Este é um e-mail de teste para validar a configuração do canal de e-mail.\n\nSe você recebeu esta mensagem, sua configuração está funcionando corretamente!',
      );

      if (messageId) {
        console.log('✅ E-mail de teste enviado com sucesso:', messageId);
        return {
          success: true,
          message: 'E-mail de teste enviado com sucesso!',
          messageId: messageId,
        };
      } else {
        console.error('❌ Erro ao enviar e-mail de teste');
        return {
          success: false,
          message: 'Erro ao enviar e-mail de teste',
        };
      }
    } catch (error) {
      console.error('❌ [CanaisController] Erro ao testar e-mail:', error);
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
  async criarCanalEmail(@Req() req) {
    console.log('📧 [CanaisController] POST /atendimento/canais/criar-canal-email chamado');

    try {
      const empresaId = req.user.empresa_id || req.user.empresaId;
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
        console.log('✅ Canal de e-mail já existe:', canalExistente.id);
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

      console.log('✅ Canal de e-mail criado com sucesso:', novoCanal.id);

      return {
        success: true,
        message: 'Canal de e-mail criado com sucesso!',
        data: novoCanal,
      };
    } catch (error) {
      console.error('❌ [CanaisController] Erro ao criar canal de e-mail:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar canal de e-mail',
      };
    }
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string, @Req() req) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

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
  async criar(@Req() req, @Body() dto: any) {
    const empresaId = req.user.empresa_id || req.user.empresaId;
    const tipo = dto.tipo || dto.nome?.toLowerCase();
    if (!empresaId) {
      console.warn(
        '⚠️ [CanaisController] empresaId ausente no token do usuário. Abortando criação.',
      );
      return {
        success: false,
        message: 'empresaId ausente no token do usuário',
      };
    }

    console.log('🔍 [CanaisController] POST /atendimento/canais chamado');
    console.log('🔍 [CanaisController] Tipo:', tipo);
    console.log('🔍 [CanaisController] DTO:', JSON.stringify(dto, null, 2));

    // Se for openai ou anthropic, salvar em integracoes_config
    if (tipo === 'openai' || tipo === 'anthropic') {
      console.log('🤖 [CanaisController] Salvando configuração de IA:', tipo);
      console.log('🤖 [CanaisController] empresaId:', empresaId);

      try {
        // Buscar ou criar configuração
        let config = await this.integracaoRepo.findOne({
          where: { empresaId, tipo },
        });

        console.log('🔍 [CanaisController] Config existente encontrada?', config ? 'SIM' : 'NÃO');

        const credenciais = dto.configuracao?.credenciais || dto.credenciais || {};
        console.log(
          '📝 [CanaisController] Credenciais recebidas:',
          JSON.stringify(credenciais, null, 2),
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

        console.log(
          '📝 [CanaisController] Credenciais formatadas:',
          JSON.stringify(credenciaisFormatadas, null, 2),
        );

        if (config) {
          // Atualizar existente
          console.log('🔄 [CanaisController] Atualizando configuração existente...');
          config.credenciais = credenciaisFormatadas;
          config.ativo = dto.ativo !== undefined ? dto.ativo : true;
          await this.integracaoRepo.save(config);
          console.log('✅ [CanaisController] Configuração IA atualizada:', config.id);
        } else {
          // Criar nova
          console.log('➕ [CanaisController] Criando nova configuração...');
          config = this.integracaoRepo.create({
            empresaId,
            tipo,
            ativo: dto.ativo !== undefined ? dto.ativo : true,
            credenciais: credenciaisFormatadas,
          });
          await this.integracaoRepo.save(config);
          console.log('✅ [CanaisController] Nova configuração IA criada:', config.id);
        }

        console.log('✅ [CanaisController] Config final salva:', JSON.stringify(config, null, 2));

        return {
          success: true,
          message: `Configuração ${tipo.toUpperCase()} salva com sucesso!`,
          data: config,
        };
      } catch (error) {
        console.error('❌ [CanaisController] Erro ao salvar config IA:', error);
        console.error('❌ [CanaisController] Stack trace:', error.stack);
        return {
          success: false,
          message: `Erro ao salvar configuração: ${error.message}`,
        };
      }
    }

    // Caso contrário, criar canal normal
    console.log('📝 [CanaisController] Criando canal normal:', tipo);
    console.log(
      '📝 [CanaisController] Configuracao recebida:',
      JSON.stringify(dto.configuracao, null, 2),
    );

    // 🔧 Normalizar estrutura de configuração para WhatsApp
    let configuracaoFinal = dto.configuracao;

    if (tipo === 'whatsapp' || tipo?.toLowerCase() === 'whatsapp') {
      const credenciaisRecebidas = dto.configuracao?.credenciais || dto.configuracao || {};

      configuracaoFinal = {
        credenciais: {
          whatsapp_api_token: credenciaisRecebidas.whatsapp_api_token || credenciaisRecebidas.token,
          whatsapp_phone_number_id:
            credenciaisRecebidas.whatsapp_phone_number_id || credenciaisRecebidas.phone_number_id,
          whatsapp_business_account_id:
            credenciaisRecebidas.whatsapp_business_account_id ||
            credenciaisRecebidas.business_account_id,
          whatsapp_webhook_verify_token:
            credenciaisRecebidas.whatsapp_webhook_verify_token ||
            credenciaisRecebidas.webhook_verify_token ||
            'conectcrm_webhook_token_123',
        },
      };

      console.log(
        '✅ [CanaisController] WhatsApp - Configuração normalizada:',
        JSON.stringify(configuracaoFinal, null, 2),
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

    console.log('✅ [CanaisController] Canal salvo com ID:', canal.id);
    console.log(
      '✅ [CanaisController] Configuracao salva:',
      JSON.stringify(canal.configuracao, null, 2),
    );

    return {
      success: true,
      message: 'Canal criado com sucesso',
      data: canal,
    };
  }

  @Put(':id')
  async atualizar(@Req() req, @Param('id') id: string, @Body() dto: AtualizarCanalDto) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    console.log('🔍 [CanaisController] PUT /atendimento/canais/:id chamado');
    console.log('🔍 [CanaisController] ID:', id);
    console.log('🔍 [CanaisController] DTO:', JSON.stringify(dto, null, 2));

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
      console.log(
        '📝 [CanaisController] Atualizando configuracao:',
        JSON.stringify(dto.configuracao, null, 2),
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

        console.log(
          '🔄 [CanaisController] Merge WhatsApp - Credenciais antes:',
          JSON.stringify(credenciaisExistentes, null, 2),
        );
        console.log(
          '🔄 [CanaisController] Merge WhatsApp - Credenciais novas:',
          JSON.stringify(novasCredenciais, null, 2),
        );
        console.log(
          '✅ [CanaisController] Merge WhatsApp - Credenciais mescladas:',
          JSON.stringify(credenciaisMerged, null, 2),
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

    console.log('✅ [CanaisController] Canal atualizado');
    console.log(
      '✅ [CanaisController] Configuracao atualizada:',
      JSON.stringify(canal.configuracao, null, 2),
    );

    // 🔧 CRÍTICO: Se for WhatsApp, atualizar TAMBÉM atendimento_integracoes_config
    const tipoCanal = canal.tipo?.toString().toLowerCase();
    if (tipoCanal === 'whatsapp' || tipoCanal === 'whatsapp_business_api') {
      console.log(
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

        console.log(
          '📝 [CanaisController] Credenciais a salvar:',
          JSON.stringify(credenciais, null, 2),
        );

        if (integracao) {
          // Atualizar configuração existente
          console.log('🔄 [CanaisController] Atualizando integração existente:', integracao.id);

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
          console.log('✅ [CanaisController] Integração atualizada com sucesso!');
          console.log(
            '✅ [CanaisController] Credenciais JSONB:',
            JSON.stringify(integracao.credenciais, null, 2),
          );
          console.log(
            '✅ [CanaisController] Token coluna:',
            integracao.whatsappApiToken?.substring(0, 20) + '...',
          );
        } else {
          // Criar nova configuração
          console.log('➕ [CanaisController] Criando nova integração...');

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
          console.log('✅ [CanaisController] Nova integração criada:', integracao.id);
        }
      } catch (error) {
        console.error('❌ [CanaisController] Erro ao atualizar integração:', error.message);
        console.error(error.stack);
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
  async deletar(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

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
  async ativar(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

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
  async desativar(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

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
    console.log('🔍 [CanaisController] POST /atendimento/canais/validar chamado');
    console.log('🔍 [CanaisController] Tipo:', dto.tipo);

    try {
      const resultado = await this.validacaoService.validarIntegracao(dto.tipo, dto.credenciais);

      console.log('✅ [CanaisController] Validação concluída:', resultado.valido);

      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      console.error('❌ [CanaisController] Erro na validação:', error.message);

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
   * POST /atendimento/canais/testar-mensagem
   * Body: { tipo: 'whatsapp', numero: string, mensagem: string, credenciais: object }
   */
  @Post('testar-mensagem')
  async testarMensagem(
    @Body() dto: { tipo: string; numero: string; mensagem: string; credenciais: any },
  ) {
    console.log('🔍 [CanaisController] POST /atendimento/canais/testar-mensagem chamado');
    console.log('🔍 [CanaisController] Tipo:', dto.tipo);
    console.log('🔍 [CanaisController] Número:', dto.numero);

    try {
      const resultado = await this.validacaoService.testarEnvioMensagem(
        dto.tipo,
        dto.numero,
        dto.mensagem,
        dto.credenciais,
      );

      console.log('✅ [CanaisController] Mensagem enviada com sucesso!');

      return {
        success: true,
        message: 'Mensagem enviada com sucesso!',
        data: resultado,
      };
    } catch (error) {
      console.error('❌ [CanaisController] Erro ao enviar mensagem:', error.message);

      return {
        success: false,
        message: `Erro ao enviar mensagem: ${error.message}`,
      };
    }
  }
}
