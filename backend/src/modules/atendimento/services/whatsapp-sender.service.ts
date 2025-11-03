import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
// form-data não expõe default export sob CommonJS, por isso usamos require direto
import FormData = require('form-data');
import { createReadStream } from 'fs';
import { basename } from 'path';
import type { Express } from 'express';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';
import { TelefoneBrasilUtil } from '../utils/telefone-brasil.util';
import { TipoMensagem } from '../entities/mensagem.entity';

interface PrepararEnvioResult {
  whatsapp_api_token: string;
  whatsapp_phone_number_id: string;
  numeroParaEnviar: string;
}

/**
 * 📤 SERVIÇO DE ENVIO DE MENSAGENS WHATSAPP
 *
 * Responsável por entregar mensagens e mídias via WhatsApp Business API
 */
@Injectable()
export class WhatsAppSenderService {
  private readonly logger = new Logger(WhatsAppSenderService.name);

  constructor(
    @InjectRepository(IntegracoesConfig)
    private readonly integracaoRepo: Repository<IntegracoesConfig>,
  ) { }

  private async prepararEnvioWhatsApp(
    empresaId: string,
    para: string,
    descricaoEnvio: string,
  ): Promise<PrepararEnvioResult> {
    this.logger.log(`📤 Preparando envio WhatsApp (${descricaoEnvio})`);

    const config = await this.integracaoRepo.findOne({
      where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
    });

    if (!config) {
      throw new Error('Configuração WhatsApp não encontrada');
    }

    this.logger.log(`🔍 Configuração encontrada: ${config.id}`);
    this.logger.log(`🔍 Credenciais presentes? ${!!config.credenciais}`);

    const {
      whatsapp_api_token,
      whatsapp_phone_number_id,
    } = config.credenciais || {};

    if (!whatsapp_api_token || !whatsapp_phone_number_id) {
      this.logger.error('❌ Credenciais WhatsApp incompletas');
      this.logger.error(`   Token presente: ${!!whatsapp_api_token}`);
      this.logger.error(`   Phone ID presente: ${!!whatsapp_phone_number_id}`);
      throw new Error('Credenciais WhatsApp incompletas');
    }

    this.logger.log('📱 Normalizando número de telefone...');
    this.logger.log(`   Original: ${para}`);
    const resultado = TelefoneBrasilUtil.detectarECorrigir(para);
    this.logger.log(`   Limpo: ${resultado.original}`);
    this.logger.log(`   Corrigido: ${resultado.corrigido}`);
    this.logger.log(
      `   Foi corrigido? ${resultado.foiCorrigido ? '✅ SIM (adicionou dígito 9)' : '✅ NÃO (já estava correto)'
      }`,
    );
    this.logger.log(
      `   Validação: ${resultado.validacao.valido
        ? '✅ VÁLIDO'
        : `❌ INVÁLIDO - ${resultado.validacao.erro}`
      }`,
    );

    if (!resultado.validacao.valido) {
      this.logger.warn('⚠️ Número potencialmente inválido, enviando mesmo assim.');
    }

    const numeroParaEnviar = resultado.corrigido;
    this.logger.log(`📤 Enviando para: ${numeroParaEnviar}`);
    this.logger.log(`   Formatado: ${TelefoneBrasilUtil.formatarParaExibicao(numeroParaEnviar)}`);

    return {
      whatsapp_api_token,
      whatsapp_phone_number_id,
      numeroParaEnviar,
    };
  }

  private mapearTipoEnvio(
    mimeType?: string,
    tipoMensagem?: TipoMensagem,
  ): 'audio' | 'image' | 'video' | 'document' {
    const mimeBase = mimeType?.split(';')[0] || '';

    if (tipoMensagem === TipoMensagem.AUDIO) return 'audio';
    if (tipoMensagem === TipoMensagem.IMAGEM) return 'image';
    if (tipoMensagem === TipoMensagem.VIDEO) return 'video';
    if (tipoMensagem === TipoMensagem.DOCUMENTO) return 'document';

    if (mimeBase.startsWith('audio/')) return 'audio';
    if (mimeBase.startsWith('image/')) return 'image';
    if (mimeBase.startsWith('video/')) return 'video';

    return 'document';
  }

  private sugerirNomeArquivo(original?: string, mimeType?: string): string {
    if (original) {
      return original;
    }

    const mimeBase = mimeType?.split(';')[0] || '';

    if (mimeBase.startsWith('audio/')) return 'audio.mpeg';
    if (mimeBase.startsWith('image/')) return 'imagem.jpg';
    if (mimeBase.startsWith('video/')) return 'video.mp4';

    return 'documento.pdf';
  }

  async obterMidiaTemporaria(
    empresaId: string,
    mediaId: string,
  ): Promise<{
    id: string;
    url: string;
    mime_type?: string;
    sha256?: string;
    file_size?: number;
    token: string;
  } | null> {
    if (!mediaId) {
      this.logger.warn('⚠️ MediaId inválido ao tentar obter mídia temporária.');
      return null;
    }

    const config = await this.integracaoRepo.findOne({
      where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
    });

    if (!config?.credenciais?.whatsapp_api_token) {
      this.logger.warn('⚠️ Token WhatsApp não encontrado ao tentar obter mídia.');
      return null;
    }

    const token = config.credenciais.whatsapp_api_token;

    try {
      const response = await axios.get(`https://graph.facebook.com/v21.0/${mediaId}`, {
        params: {
          fields: 'id,url,mime_type,sha256,file_size',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      const { id, url, mime_type, sha256, file_size } = response.data || {};

      if (!url) {
        this.logger.warn(`⚠️ API retornou mídia sem URL para mediaId ${mediaId}`);
        return null;
      }

      return {
        id: id || mediaId,
        url,
        mime_type,
        sha256,
        file_size,
        token,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Erro ao obter mídia temporária ${mediaId}: ${error?.message || error}`,
      );

      if (error?.response) {
        this.logger.error(`🔍 Status: ${error.response.status}`);
        this.logger.error(JSON.stringify(error.response.data, null, 2));
      }

      return null;
    }
  }

  /**
   * Envia indicador de digitação (typing indicator)
   * Mostra "..." para o usuário por alguns segundos
   */
  async enviarIndicadorDigitacao(
    empresaId: string,
    para: string,
  ): Promise<boolean> {
    try {
      const {
        whatsapp_api_token,
        whatsapp_phone_number_id,
        numeroParaEnviar,
      } = await this.prepararEnvioWhatsApp(empresaId, para, '');

      await axios.post(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          to: numeroParaEnviar,
          type: 'reaction',
          reaction: {
            message_id: '',
            emoji: '⏳',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      return true;
    } catch (error: any) {
      // Falha silenciosa - indicador é opcional
      this.logger.debug(`⏳ Indicador de digitação não enviado: ${error.message}`);
      return false;
    }
  }

  /**
   * Envia mensagem de texto via WhatsApp
   */
  async enviarMensagem(
    empresaId: string,
    para: string,
    mensagem: string,
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string; detalhes?: any }> {
    try {
      const {
        whatsapp_api_token,
        whatsapp_phone_number_id,
        numeroParaEnviar,
      } = await this.prepararEnvioWhatsApp(empresaId, para, mensagem);

      this.logger.log(`📝 Corpo da mensagem: ${mensagem.substring(0, 50)}...`);

      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          to: numeroParaEnviar,
          type: 'text',
          text: {
            body: mensagem,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const messageId = response.data?.messages?.[0]?.id;
      if (messageId) {
        this.logger.log(`✅ Mensagem enviada com sucesso! ID: ${messageId}`);
      }

      return {
        sucesso: true,
        messageId,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao enviar mensagem: ${error.message}`);

      // ✅ Detectar erro específico de WhatsApp (whitelist, número inválido, etc.)
      let mensagemErro = error.message;
      let codigoErro: number | undefined;

      if (error.response) {
        this.logger.error(`🔍 Status: ${error.response.status}`);
        this.logger.error('🔍 Resposta WhatsApp API:');
        this.logger.error(JSON.stringify(error.response.data, null, 2));

        // Extrair código e mensagem específica do WhatsApp
        const whatsappError = error.response.data?.error;
        if (whatsappError) {
          codigoErro = whatsappError.code;

          // ⚠️ Erro 131030: Número não está na whitelist (modo desenvolvimento)
          if (codigoErro === 131030) {
            mensagemErro = '📋 Número não está na lista de permissão (whitelist). ' +
              'Modo desenvolvimento da Meta requer adicionar números manualmente. ' +
              'Acesse: https://business.facebook.com/settings/whatsapp-business-accounts > ' +
              'Números de telefone > Adicionar número de teste.';
            this.logger.warn('⚠️ WHITELIST: Adicione este número no painel da Meta para testar!');
          }
          // ⚠️ Erro 131026: Número inválido
          else if (codigoErro === 131026) {
            mensagemErro = '📱 Número de telefone inválido. Verifique o formato (ex: 5562999999999).';
          }
          // ⚠️ Outros erros do WhatsApp
          else if (whatsappError.message) {
            mensagemErro = `WhatsApp API: ${whatsappError.message}`;
          }
        }
      }

      this.logger.error(error.stack);

      return {
        sucesso: false,
        erro: mensagemErro,
        detalhes: error.response?.data || undefined,
      };
    }
  }

  async enviarMidia(params: {
    empresaId: string;
    para: string;
    arquivo: Express.Multer.File;
    tipoMensagem?: TipoMensagem;
    legenda?: string;
    duracaoAudio?: number;
  }): Promise<{ sucesso: boolean; messageId?: string; erro?: string; detalhes?: any }> {
    const { empresaId, para, arquivo, tipoMensagem, legenda } = params;

    try {
      const descricao = legenda
        ? `mídia com legenda: ${legenda}`
        : `mídia (${arquivo.mimetype || 'sem mimetype'})`;

      const {
        whatsapp_api_token,
        whatsapp_phone_number_id,
        numeroParaEnviar,
      } = await this.prepararEnvioWhatsApp(empresaId, para, descricao);

      const tipoEnvio = this.mapearTipoEnvio(arquivo.mimetype, tipoMensagem);
      const mimeBase = arquivo.mimetype?.split(';')[0] || arquivo.mimetype || '';
      const nomeArquivo = this.sugerirNomeArquivo(
        arquivo.originalname || basename(arquivo.path || ''),
        mimeBase,
      );

      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      if (mimeBase) {
        formData.append('type', mimeBase);
      }

      if (arquivo.buffer && arquivo.buffer.length > 0) {
        formData.append('file', arquivo.buffer, {
          filename: nomeArquivo,
          contentType: mimeBase || undefined,
        } as any);
      } else if (arquivo.path) {
        formData.append('file', createReadStream(arquivo.path), {
          filename: nomeArquivo,
          contentType: mimeBase || undefined,
        } as any);
      } else {
        throw new Error('Arquivo inválido: sem buffer ou caminho disponível para upload.');
      }

      const uploadResponse = await axios.post(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/media`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${whatsapp_api_token}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 60000,
        },
      );

      const mediaId: string | undefined = uploadResponse.data?.id;
      if (!mediaId) {
        throw new Error('WhatsApp API não retornou o mediaId após upload.');
      }

      const payload: Record<string, any> = {
        messaging_product: 'whatsapp',
        to: numeroParaEnviar,
        type: tipoEnvio,
      };

      switch (tipoEnvio) {
        case 'image':
          payload.image = {
            id: mediaId,
            ...(legenda ? { caption: legenda } : {}),
          };
          break;
        case 'video':
          payload.video = {
            id: mediaId,
            ...(legenda ? { caption: legenda } : {}),
          };
          break;
        case 'document':
          payload.document = {
            id: mediaId,
            filename: nomeArquivo,
            ...(legenda ? { caption: legenda } : {}),
          };
          break;
        case 'audio':
        default:
          payload.audio = {
            id: mediaId,
            voice: true,
          };
          break;
      }

      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const messageId = response.data?.messages?.[0]?.id;
      if (messageId) {
        this.logger.log(`✅ Mídia enviada com sucesso! ID: ${messageId}`);
      }

      return {
        sucesso: true,
        messageId,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao enviar mídia: ${error.message}`);

      // ✅ Detectar erro específico de WhatsApp (whitelist, número inválido, etc.)
      let mensagemErro = error.message;
      let codigoErro: number | undefined;

      if (error.response) {
        this.logger.error(`🔍 Status: ${error.response.status}`);
        this.logger.error('🔍 Resposta WhatsApp API:');
        this.logger.error(JSON.stringify(error.response.data, null, 2));

        // Extrair código e mensagem específica do WhatsApp
        const whatsappError = error.response.data?.error;
        if (whatsappError) {
          codigoErro = whatsappError.code;

          // ⚠️ Erro 131030: Número não está na whitelist (modo desenvolvimento)
          if (codigoErro === 131030) {
            mensagemErro = '📋 Número não está na lista de permissão (whitelist). ' +
              'Modo desenvolvimento da Meta requer adicionar números manualmente. ' +
              'Acesse: https://business.facebook.com/settings/whatsapp-business-accounts > ' +
              'Números de telefone > Adicionar número de teste.';
            this.logger.warn('⚠️ WHITELIST: Adicione este número no painel da Meta para testar!');
          }
          // ⚠️ Erro 131026: Número inválido
          else if (codigoErro === 131026) {
            mensagemErro = '📱 Número de telefone inválido. Verifique o formato (ex: 5562999999999).';
          }
          // ⚠️ Outros erros do WhatsApp
          else if (whatsappError.message) {
            mensagemErro = `WhatsApp API: ${whatsappError.message}`;
          }
        }
      }

      this.logger.error(error.stack);

      return {
        sucesso: false,
        erro: mensagemErro,
        detalhes: error.response?.data || undefined,
      };
    }
  }

  /**
   * Marca mensagem como lida
   */
  async marcarComoLida(
    empresaId: string,
    messageId: string,
  ): Promise<{ sucesso: boolean }> {
    try {
      const config = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
      });

      if (!config) {
        throw new Error('Configuração WhatsApp não encontrada');
      }

      const {
        whatsapp_api_token,
        whatsapp_phone_number_id,
      } = config.credenciais || {};

      await axios.post(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      this.logger.log(`✅ Mensagem marcada como lida: ${messageId}`);

      return { sucesso: true };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao marcar como lida: ${error.message}`);
      return { sucesso: false };
    }
  }

  /**
   * Busca a foto do perfil do contato no WhatsApp
   */
  async buscarFotoPerfilContato(
    empresaId: string,
    telefone: string,
  ): Promise<string | null> {
    try {
      this.logger.log(`🖼️ Buscando foto do perfil do contato: ${telefone}`);

      const config = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
      });

      if (!config) {
        this.logger.warn('⚠️ Configuração WhatsApp não encontrada');
        return null;
      }

      const {
        whatsapp_api_token,
        whatsapp_phone_number_id,
      } = config.credenciais || {};

      if (!whatsapp_api_token || !whatsapp_phone_number_id) {
        this.logger.warn('⚠️ Credenciais WhatsApp incompletas');
        return null;
      }

      const response = await axios.get(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/contacts`,
        {
          params: {
            wa_id: telefone,
          },
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const contacts = response.data?.contacts || [];
      if (contacts.length > 0) {
        const profilePicUrl =
          contacts[0]?.profile?.picture_url ||
          contacts[0]?.profile?.photo_url ||
          contacts[0]?.profile?.picture ||
          contacts[0]?.profile?.photo ||
          null;

        if (profilePicUrl) {
          this.logger.log(`✅ Foto do perfil encontrada: ${profilePicUrl}`);
          return profilePicUrl;
        }
      }

      this.logger.log(`ℹ️ Nenhuma foto de perfil encontrada para ${telefone}`);
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.log(`ℹ️ Contato não encontrado ou sem foto de perfil: ${telefone}`);
      } else {
        this.logger.warn(`⚠️ Erro ao buscar foto do perfil: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * 🔘 Envia mensagem com botões interativos (WhatsApp Interactive Buttons)
   * Máximo de 3 botões por mensagem
   */
  async enviarMensagemComBotoes(
    empresaId: string,
    para: string,
    mensagem: string,
    botoes: Array<{ id: string; title: string }>,
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string; detalhes?: any }> {
    try {
      if (!botoes || botoes.length === 0) {
        this.logger.warn('⚠️ Nenhum botão fornecido, enviando mensagem de texto simples');
        return this.enviarMensagem(empresaId, para, mensagem);
      }

      if (botoes.length > 3) {
        this.logger.warn(`⚠️ WhatsApp permite máximo 3 botões. Truncando ${botoes.length} para 3.`);
        botoes = botoes.slice(0, 3);
      }

      const {
        whatsapp_api_token,
        whatsapp_phone_number_id,
        numeroParaEnviar,
      } = await this.prepararEnvioWhatsApp(empresaId, para, `botões: ${mensagem.substring(0, 30)}`);

      this.logger.log(`🔘 Enviando mensagem com ${botoes.length} botões interativos`);
      this.logger.log(`   Botões: ${botoes.map(b => b.title).join(', ')}`);

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: numeroParaEnviar,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: mensagem,
          },
          action: {
            buttons: botoes.map((botao) => ({
              type: 'reply',
              reply: {
                id: botao.id,
                title: botao.title.substring(0, 20), // WhatsApp limita a 20 caracteres
              },
            })),
          },
        },
      };

      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const messageId = response.data?.messages?.[0]?.id;
      if (messageId) {
        this.logger.log(`✅ Mensagem com botões enviada com sucesso! ID: ${messageId}`);
      }

      return {
        sucesso: true,
        messageId,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao enviar mensagem com botões: ${error.message}`);

      let mensagemErro = error.message;
      let codigoErro: number | undefined;

      if (error.response) {
        this.logger.error(`🔍 Status: ${error.response.status}`);
        this.logger.error('🔍 Resposta WhatsApp API:');
        this.logger.error(JSON.stringify(error.response.data, null, 2));

        const whatsappError = error.response.data?.error;
        if (whatsappError) {
          codigoErro = whatsappError.code;

          if (codigoErro === 131030) {
            mensagemErro = '📋 Número não está na whitelist. Fallback para texto simples.';
            this.logger.warn('⚠️ Tentando enviar como texto simples...');
            return this.enviarMensagem(empresaId, para, mensagem);
          } else if (codigoErro === 131026) {
            mensagemErro = '📱 Número inválido';
          } else if (whatsappError.message) {
            mensagemErro = `WhatsApp API: ${whatsappError.message}`;
          }
        }
      }

      this.logger.error(error.stack);

      return {
        sucesso: false,
        erro: mensagemErro,
        detalhes: error.response?.data || undefined,
      };
    }
  }

  /**
   * 📋 Envia mensagem com lista (WhatsApp Interactive List)
   * Suporta até 10 itens
   */
  async enviarMensagemComLista(
    empresaId: string,
    para: string,
    mensagem: string,
    tituloLista: string,
    itens: Array<{ id: string; title: string; description?: string }>,
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string; detalhes?: any }> {
    try {
      if (!itens || itens.length === 0) {
        this.logger.warn('⚠️ Nenhum item fornecido, enviando mensagem de texto simples');
        return this.enviarMensagem(empresaId, para, mensagem);
      }

      if (itens.length > 10) {
        this.logger.warn(`⚠️ WhatsApp permite máximo 10 itens na lista. Truncando ${itens.length} para 10.`);
        itens = itens.slice(0, 10);
      }

      const {
        whatsapp_api_token,
        whatsapp_phone_number_id,
        numeroParaEnviar,
      } = await this.prepararEnvioWhatsApp(empresaId, para, `lista: ${mensagem.substring(0, 30)}`);

      this.logger.log(`📋 Enviando mensagem com lista de ${itens.length} itens`);

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: numeroParaEnviar,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: mensagem,
          },
          action: {
            button: tituloLista.substring(0, 20),
            sections: [
              {
                title: 'Opções',
                rows: itens.map((item) => ({
                  id: item.id,
                  title: item.title.substring(0, 24),
                  description: item.description?.substring(0, 72) || '',
                })),
              },
            ],
          },
        },
      };

      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const messageId = response.data?.messages?.[0]?.id;
      if (messageId) {
        this.logger.log(`✅ Mensagem com lista enviada com sucesso! ID: ${messageId}`);
      }

      return {
        sucesso: true,
        messageId,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao enviar mensagem com lista: ${error.message}`);

      let mensagemErro = error.message;

      if (error.response) {
        this.logger.error(`🔍 Status: ${error.response.status}`);
        this.logger.error(JSON.stringify(error.response.data, null, 2));

        const whatsappError = error.response.data?.error;
        if (whatsappError?.code === 131030) {
          mensagemErro = '📋 Número não está na whitelist. Fallback para texto simples.';
          this.logger.warn('⚠️ Tentando enviar como texto simples...');
          return this.enviarMensagem(empresaId, para, mensagem);
        }
      }

      return {
        sucesso: false,
        erro: mensagemErro,
        detalhes: error.response?.data || undefined,
      };
    }
  }
}

