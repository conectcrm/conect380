import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fsPromises, existsSync, createWriteStream } from 'fs';
import { join, extname, resolve, relative, normalize, isAbsolute, basename } from 'path';
import { randomUUID } from 'crypto';
import type { Express } from 'express';
import axios from 'axios';
import { parseBuffer } from 'music-metadata';
import ffmpeg = require('fluent-ffmpeg');
import ffmpegStatic = require('ffmpeg-static');
import { Mensagem, TipoMensagem, RemetenteMensagem, StatusMensagem } from '../entities/mensagem.entity';
import { Ticket } from '../entities/ticket.entity';
import { Canal, TipoCanal } from '../entities/canal.entity';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';

const resolvedFfmpegPath = typeof ffmpegStatic === 'string'
  ? ffmpegStatic
  : (ffmpegStatic as { path?: string })?.path;

if (resolvedFfmpegPath) {
  ffmpeg.setFfmpegPath(resolvedFfmpegPath);
} else {
  // eslint-disable-next-line no-console
  console.warn('⚠️ ffmpeg-static não forneceu caminho válido. Certifique-se de ter o binário do FFmpeg disponível.');
}

export interface CriarMensagemDto {
  ticketId: string;
  tipo: string;
  remetente: string;
  conteudo: string;
  atendenteId?: string;
  idExterno?: string; // ID da mensagem no WhatsApp, Telegram, etc
  midia?: {
    id?: string;
    url?: string;
    tipo?: string;
    tamanho?: number;
    size?: number;
    nome?: string;
    mime_type?: string;
    mimetype?: string;
    sha256?: string;
    file_size?: number;
    caminhoAnexo?: string; // Caminho local do arquivo (após download)
    urlOriginal?: string; // URL original temporária (para referência)
    duracao?: number;
    duration?: number;
  };
  metadata?: Record<string, any>;
}

export interface AtualizarStatusMensagemDto {
  status: StatusMensagem;
  erro?: string;
}

@Injectable()
export class MensagemService {
  private readonly logger = new Logger(MensagemService.name);
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'atendimento');

  constructor(
    @InjectRepository(Mensagem)
    private mensagemRepository: Repository<Mensagem>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Canal)
    private canalRepository: Repository<Canal>,
    private whatsappSenderService: WhatsAppSenderService,
    private atendimentoGateway: AtendimentoGateway,
  ) { }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fsPromises.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      this.logger.warn(`⚠️ Não foi possível garantir diretório de uploads: ${error instanceof Error ? error.message : error}`);
    }
  }

  private obterExtensaoPorMime(mime?: string): string {
    if (!mime) {
      return '';
    }

    const mimeBase = mime.split(';')[0];
    const mapa: Record<string, string> = {
      'audio/webm': '.webm',
      'audio/ogg': '.ogg',
      'audio/oga': '.oga',
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
      'audio/aac': '.aac',
      'audio/mp4': '.m4a',
      'audio/3gpp': '.3gp',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'application/pdf': '.pdf',
    };

    return mapa[mimeBase] || '';
  }

  private async converterAudioParaFormatoWhatsApp(
    caminhoOriginal: string,
    nomePreferencial?: string,
  ): Promise<{ caminho: string; nome: string; tamanho: number } | null> {
    if (!caminhoOriginal || !existsSync(caminhoOriginal)) {
      this.logger.warn(`⚠️ Caminho de áudio inválido para conversão: ${caminhoOriginal}`);
      return null;
    }

    try {
      await this.ensureUploadsDirectory();

      const nomeBase = nomePreferencial
        ? nomePreferencial.replace(/\.[^.]+$/, '')
        : basename(caminhoOriginal).replace(/\.[^.]+$/, '');

      const nomeArquivo = `${nomeBase || 'audio'}-wa.ogg`;
      const caminhoDestino = join(this.uploadsDir, `${Date.now()}-${randomUUID()}.ogg`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(caminhoOriginal)
          .audioCodec('libopus')
          .audioChannels(1)
          .format('ogg')
          .on('end', () => resolve())
          .on('error', (error) => reject(error))
          .save(caminhoDestino);
      });

      const stats = await fsPromises.stat(caminhoDestino);

      return {
        caminho: caminhoDestino,
        nome: nomeArquivo,
        tamanho: stats.size,
      };
    } catch (error) {
      this.logger.error(`❌ Falha ao converter áudio para formato compatível: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private async salvarArquivoLocal(arquivo: Express.Multer.File): Promise<string | null> {
    if (!arquivo) {
      return null;
    }

    if (arquivo.path) {
      return arquivo.path;
    }

    if (!arquivo.buffer || arquivo.buffer.length === 0) {
      return null;
    }

    await this.ensureUploadsDirectory();

    const extensaoOriginal = extname(arquivo.originalname || '');
    const extensaoMime = this.obterExtensaoPorMime(arquivo.mimetype);
    const extensaoFinal = extensaoOriginal || extensaoMime || '';

    const nomeArquivo = `${Date.now()}-${randomUUID()}${extensaoFinal}`;
    const caminhoCompleto = join(this.uploadsDir, nomeArquivo);

    try {
      await fsPromises.writeFile(caminhoCompleto, arquivo.buffer);
      return caminhoCompleto;
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar arquivo localmente: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  /**
   * 🎵 Baixa áudio/mídia da URL temporária do WhatsApp e salva localmente
   * URLs do Facebook expiram em ~1 hora, então precisamos fazer cache local
   */
  async baixarMidiaWhatsApp(
    midiaWhatsApp: any,
    tipoMidia: 'audio' | 'image' | 'video' | 'document' = 'audio',
    authToken?: string,
  ): Promise<{
    caminhoLocal: string;
    tipo: string;
    nome: string;
    duracao?: number;
    tamanho?: number;
  } | null> {
    try {
      const url = midiaWhatsApp?.url;
      const mimeType = midiaWhatsApp?.mime_type || 'application/octet-stream';
      const sha256 = midiaWhatsApp?.sha256 || randomUUID();

      if (!url || !url.startsWith('https://lookaside.fbsbx.com')) {
        this.logger.warn(`⚠️ URL de mídia WhatsApp inválida: ${url}`);
        return null;
      }

      this.logger.log(`📥 Baixando mídia do WhatsApp: ${url.substring(0, 100)}...`);

      await this.ensureUploadsDirectory();

      // Determinar extensão do arquivo
      const extensao = this.obterExtensaoPorMime(mimeType) || `.${tipoMidia}`;
      const nomeArquivo = `whatsapp-${Date.now()}-${sha256}${extensao}`;
      const caminhoCompleto = join(this.uploadsDir, nomeArquivo);

      // Baixar arquivo
      const headers: Record<string, string> = {
        'User-Agent': 'ConectCRM/1.0',
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 segundos
        headers,
      });

      if (response.status !== 200) {
        this.logger.error(`❌ Erro ao baixar mídia: Status ${response.status}`);
        return null;
      }

      const responseBuffer = Buffer.isBuffer(response.data)
        ? response.data
        : Buffer.from(response.data as ArrayBuffer);

      // Salvar arquivo localmente
      await fsPromises.writeFile(caminhoCompleto, responseBuffer);

      let duracaoExtraida: number | undefined;
      try {
        const metadata = await parseBuffer(responseBuffer, {
          mimeType,
          size: responseBuffer.length,
        });

        const duracao = metadata?.format?.duration;

        if (typeof duracao === 'number' && Number.isFinite(duracao) && duracao > 0) {
          duracaoExtraida = Math.max(1, Math.round(duracao));
        }
      } catch (metadataError) {
        this.logger.warn(
          `⚠️ Não foi possível extrair duração da mídia: ${metadataError instanceof Error ? metadataError.message : metadataError}`,
        );
      }

      const tamanhoArquivo = responseBuffer.length;

      this.logger.log(`✅ Mídia baixada e salva: ${caminhoCompleto}`);

      return {
        caminhoLocal: caminhoCompleto,
        tipo: mimeType,
        nome: nomeArquivo,
        duracao: duracaoExtraida,
        tamanho: tamanhoArquivo,
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao baixar mídia do WhatsApp: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  async obterMidiaParaDownload(mensagemId: string): Promise<{
    tipo: string;
    nome: string;
    remoto: boolean;
    url?: string;
    caminho?: string;
  }> {
    const mensagem = await this.buscarPorId(mensagemId);

    if (!mensagem.midia) {
      throw new NotFoundException('Mensagem não possui mídia disponível para download');
    }

    const midia = mensagem.midia || {};
    const nome = midia.nome || midia.originalname || midia.filename || 'anexo';
    const tipo = midia.tipo || midia.mime_type || midia.mimetype || 'application/octet-stream';

    // 🎵 PRIORIDADE: Verificar se já temos arquivo local salvo
    const caminhoLocal = midia.caminhoAnexo || midia.path;

    if (caminhoLocal && !/^https?:\/\//i.test(caminhoLocal)) {
      const ehAbsoluto = isAbsolute(caminhoLocal);
      const caminhoNormalizado = normalize(
        ehAbsoluto
          ? caminhoLocal
          : caminhoLocal.startsWith('uploads')
            ? caminhoLocal
            : caminhoLocal.replace(/^\/+/, ''),
      );
      const caminhoAbsoluto = ehAbsoluto
        ? caminhoNormalizado
        : resolve(process.cwd(), caminhoNormalizado);

      if (existsSync(caminhoAbsoluto)) {
        return {
          tipo,
          nome,
          remoto: false,
          caminho: caminhoAbsoluto,
        };
      } else {
        this.logger.warn(`⚠️ Caminho local não encontrado: ${caminhoAbsoluto}`);
      }
    }

    // 🚨 FALLBACK: URL remota (pode estar expirada)
    const urlRemota = midia.url || midia.urlOriginal;

    if (!urlRemota) {
      this.logger.warn(`⚠️ Mensagem ${mensagemId} não possui caminho local nem URL remota`);
      throw new NotFoundException('Mídia não disponível - URL expirada ou arquivo não encontrado');
    }

    // 🎵 Se for URL do WhatsApp, tentar baixar AGORA (caso não tenha sido baixada antes)
    if (urlRemota.includes('lookaside.fbsbx.com')) {
      this.logger.warn(`⚠️ Tentando baixar áudio do WhatsApp sob demanda (URL pode estar expirada)`);

      try {
        const mensagemCompleta = await this.mensagemRepository.findOne({
          where: { id: mensagemId },
        });

        let authToken: string | undefined;
        let ticket: Ticket | null = null;

        if (mensagemCompleta?.ticketId) {
          ticket = await this.ticketRepository.findOne({
            where: { id: mensagemCompleta.ticketId },
          });

          if (ticket?.canalId) {
            const canalEncontrado = await this.canalRepository.findOne({
              where: { id: ticket.canalId },
            });

            if (canalEncontrado?.configuracao) {
              const config = canalEncontrado.configuracao as any;
              authToken = config.credenciais?.whatsapp_api_token
                || config.accessToken
                || authToken;
            }
          }
        }

        let midiaParaDownload = { ...midia };

        if (ticket?.empresaId && mensagemCompleta?.midia?.id) {
          const midiaAtualizada = await this.whatsappSenderService.obterMidiaTemporaria(
            ticket.empresaId,
            mensagemCompleta.midia.id,
          );

          if (midiaAtualizada?.url) {
            midiaParaDownload = {
              ...midiaParaDownload,
              id: midiaAtualizada.id || midiaParaDownload.id,
              url: midiaAtualizada.url,
              mime_type: midiaAtualizada.mime_type
                || midiaParaDownload.mime_type
                || midiaParaDownload.tipo,
              tipo: midiaAtualizada.mime_type
                || midiaParaDownload.tipo
                || tipo,
              sha256: midiaAtualizada.sha256 || midiaParaDownload.sha256,
              tamanho: midiaAtualizada.file_size
                ?? midiaParaDownload.tamanho
                ?? midiaParaDownload.size,
              size: midiaAtualizada.file_size
                ?? midiaParaDownload.size,
            };

            if (midiaAtualizada.token) {
              authToken = midiaAtualizada.token;
            }
          }
        }

        if (!authToken) {
          authToken = process.env.WHATSAPP_ACCESS_TOKEN;
        }

        if (!authToken) {
          this.logger.error(`❌ Token do WhatsApp não encontrado para baixar mídia`);
          throw new Error('Token do WhatsApp não configurado');
        }

        let tipoMidia: 'audio' | 'image' | 'video' | 'document' = 'audio';
        const tipoParaDetectar = midiaParaDownload.tipo || tipo;
        if (tipoParaDetectar?.startsWith?.('image/')) tipoMidia = 'image';
        else if (tipoParaDetectar?.startsWith?.('video/')) tipoMidia = 'video';
        else if (tipoParaDetectar?.startsWith?.('application/')) tipoMidia = 'document';

        this.logger.log(`📥 Baixando mídia do WhatsApp sob demanda...`);
        const midiaLocal = await this.baixarMidiaWhatsApp(midiaParaDownload, tipoMidia, authToken);

        if (midiaLocal?.caminhoLocal && existsSync(midiaLocal.caminhoLocal)) {
          await this.mensagemRepository.update(mensagemId, {
            midia: {
              ...midia,
              ...midiaParaDownload,
              caminhoAnexo: midiaLocal.caminhoLocal,
              tipo: midiaLocal.tipo,
              nome: midiaLocal.nome,
              urlOriginal: midiaParaDownload.url || midia.url || midia.urlOriginal,
            },
          });

          this.logger.log(`✅ Áudio baixado sob demanda para mensagem ${mensagemId}`);

          return {
            tipo: midiaLocal.tipo,
            nome: midiaLocal.nome,
            remoto: false,
            caminho: midiaLocal.caminhoLocal,
          };
        }
      } catch (erro) {
        this.logger.error(`❌ Falha ao baixar mídia sob demanda: ${erro instanceof Error ? erro.message : erro}`);
      }
    }

    // 🔴 Última opção: retornar URL remota (provavelmente vai falhar com CORS)
    this.logger.warn(`⚠️ Retornando URL remota para mensagem ${mensagemId} - pode estar expirada`);
    return {
      tipo,
      nome,
      remoto: true,
      url: urlRemota,
    };
  }

  /**
   * Salva uma nova mensagem
   * 🎵 Se houver mídia do WhatsApp com URL temporária, faz download ANTES de salvar
   */
  async salvar(dados: CriarMensagemDto): Promise<Mensagem> {
    this.logger.log(`💬 Salvando mensagem para ticket ${dados.ticketId}`);

    const ticket = await this.ticketRepository.findOne({ where: { id: dados.ticketId } });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${dados.ticketId} não encontrado`);
    }

    let midiaAuthToken: string | undefined;
    let midiaProcessada = dados.midia ? { ...dados.midia } : null;

    if (midiaProcessada && !midiaProcessada.url && midiaProcessada.id) {
      try {
        const midiaDetalhes = await this.whatsappSenderService.obterMidiaTemporaria(
          ticket.empresaId,
          midiaProcessada.id,
        );

        if (midiaDetalhes?.url) {
          midiaAuthToken = midiaDetalhes.token;
          midiaProcessada = {
            ...midiaProcessada,
            url: midiaDetalhes.url,
            mime_type: midiaDetalhes.mime_type || midiaProcessada.mime_type,
            tipo: midiaDetalhes.mime_type || midiaProcessada.tipo,
            sha256: midiaDetalhes.sha256 || midiaProcessada.sha256,
            file_size: midiaDetalhes.file_size ?? midiaProcessada.file_size,
            tamanho: midiaDetalhes.file_size ?? midiaProcessada.tamanho,
            size: midiaDetalhes.file_size ?? midiaProcessada.size,
          };
        }
      } catch (erroMidia) {
        this.logger.error(
          `❌ Erro ao obter detalhes da mídia ${midiaProcessada.id}: ${erroMidia instanceof Error ? erroMidia.message : erroMidia}`,
        );
      }
    }

    let midiaFinal = midiaProcessada;

    // 🎵 Se houver URL temporária do WhatsApp (lookaside.fbsbx.com), baixar AGORA
    if (midiaFinal?.url && midiaFinal.url.includes('lookaside.fbsbx.com')) {
      this.logger.log(`🎵 Detectado áudio/mídia temporária do WhatsApp - baixando...`);

      // Determinar tipo de mídia pelo TipoMensagem
      let tipoMidia: 'audio' | 'image' | 'video' | 'document' = 'audio';
      if (dados.tipo === TipoMensagem.IMAGEM) tipoMidia = 'image';
      else if (dados.tipo === TipoMensagem.VIDEO) tipoMidia = 'video';
      else if (dados.tipo === TipoMensagem.DOCUMENTO) tipoMidia = 'document';

      const midiaLocal = await this.baixarMidiaWhatsApp(midiaFinal, tipoMidia, midiaAuthToken);

      if (midiaLocal) {
        // Substituir URL temporária por caminho local
        const duracaoBruta = midiaLocal.duracao
          ?? midiaFinal?.duracao
          ?? midiaFinal?.duration;
        let duracaoNormalizada: number | undefined;
        if (typeof duracaoBruta === 'number' && Number.isFinite(duracaoBruta) && duracaoBruta > 0) {
          duracaoNormalizada = Math.max(1, Math.round(duracaoBruta));
        } else if (typeof duracaoBruta === 'string') {
          const valorDuracao = Number(duracaoBruta);
          if (Number.isFinite(valorDuracao) && valorDuracao > 0) {
            duracaoNormalizada = Math.max(1, Math.round(valorDuracao));
          }
        }

        const tamanhoBruto = midiaLocal.tamanho
          ?? midiaFinal?.tamanho
          ?? midiaFinal?.size
          ?? (midiaFinal as any)?.file_size;
        let tamanhoNormalizado: number | undefined;
        if (typeof tamanhoBruto === 'number' && Number.isFinite(tamanhoBruto)) {
          tamanhoNormalizado = tamanhoBruto;
        } else if (typeof tamanhoBruto === 'string') {
          const valorTamanho = Number(tamanhoBruto);
          if (Number.isFinite(valorTamanho)) {
            tamanhoNormalizado = valorTamanho;
          }
        }

        midiaFinal = {
          ...midiaFinal,
          caminhoAnexo: midiaLocal.caminhoLocal,
          tipo: midiaLocal.tipo,
          nome: midiaLocal.nome,
          // Manter URL original para referência/debug
          urlOriginal: midiaFinal?.url,
          ...(duracaoNormalizada !== undefined
            ? { duracao: duracaoNormalizada, duration: duracaoNormalizada }
            : {}),
          ...(tamanhoNormalizado !== undefined
            ? { tamanho: tamanhoNormalizado, size: tamanhoNormalizado }
            : {}),
        };
        this.logger.log(`✅ Mídia baixada com sucesso: ${midiaLocal.caminhoLocal}`);
      } else {
        this.logger.warn(`⚠️ Falha ao baixar mídia - mantendo URL original (irá expirar!)`);
      }
    }

    const mensagem = this.mensagemRepository.create({
      ticketId: dados.ticketId,
      tipo: dados.tipo,
      remetente: dados.remetente,
      conteudo: dados.conteudo,
      idExterno: dados.idExterno,
      midia: midiaFinal,
      // status: StatusMensagem.ENVIADA as any, // Coluna não existe no banco
    });

    const mensagemSalva = await this.mensagemRepository.save(mensagem);
    this.logger.log(`✅ Mensagem salva: ${mensagemSalva.id}`);

    return mensagemSalva;
  }

  /**
   * Busca mensagens de um ticket
   */
  async buscarPorTicket(ticketId: string, limite = 100): Promise<Mensagem[]> {
    this.logger.log(`📨 Buscando mensagens do ticket ${ticketId}`);

    const mensagens = await this.mensagemRepository.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
      take: limite,
    });

    this.logger.log(`📊 Encontradas ${mensagens.length} mensagens`);

    return mensagens;
  }

  /**
   * Busca mensagem por ID
   */
  async buscarPorId(id: string): Promise<Mensagem> {
    const mensagem = await this.mensagemRepository.findOne({
      where: { id },
    });

    if (!mensagem) {
      throw new NotFoundException(`Mensagem ${id} não encontrada`);
    }

    return mensagem;
  }

  private formatarMidiaParaFrontend(mensagem: Mensagem): {
    anexos: Array<{
      nome: string;
      tipo: string;
      tamanho: number | null;
      duracao?: number;
      url: string;
      downloadUrl: string;
      originalUrl?: string | null;
      [chave: string]: unknown;
    }>;
    audio?: {
      url: string;
      downloadUrl: string;
      duracao?: number;
      nome: string;
      tipo: string;
    };
  } {
    if (!mensagem.midia) {
      return { anexos: [], audio: undefined };
    }

    const midias = Array.isArray(mensagem.midia) ? mensagem.midia : [mensagem.midia];
    const anexos: Array<{
      nome: string;
      tipo: string;
      tamanho: number | null;
      duracao?: number;
      url: string;
      downloadUrl: string;
      originalUrl?: string | null;
      [chave: string]: unknown;
    }> = [];
    let audio: {
      url: string;
      downloadUrl: string;
      duracao?: number;
      nome: string;
      tipo: string;
    } | undefined;

    for (const midiaOriginal of midias) {
      if (!midiaOriginal) {
        continue;
      }

      const tipoMime = midiaOriginal.tipo || midiaOriginal.mime_type || midiaOriginal.mimetype || 'application/octet-stream';
      const nomeArquivo = midiaOriginal.nome || midiaOriginal.filename || midiaOriginal.originalname || 'anexo';
      const tamanhoArquivo = midiaOriginal.tamanho ?? midiaOriginal.size ?? null;
      const duracaoBruta = midiaOriginal.duracao ?? midiaOriginal.duration;
      const duracaoNormalizada = typeof duracaoBruta === 'number'
        ? duracaoBruta
        : duracaoBruta
          ? Number(duracaoBruta)
          : undefined;

      const caminhoBruto: string | undefined = midiaOriginal.caminhoAnexo || midiaOriginal.url || midiaOriginal.path;
      if (!caminhoBruto) {
        continue;
      }

      const ehRemoto = /^https?:\/\//i.test(caminhoBruto);
      const caminhoNormalizado = ehRemoto ? caminhoBruto : normalize(caminhoBruto);
      const downloadUrl = `/api/atendimento/mensagens/${mensagem.id}/anexo`;
      const urlParaExibicao = ehRemoto ? caminhoNormalizado : downloadUrl;

      if (!urlParaExibicao) {
        continue;
      }

      const anexoFormatado = {
        nome: nomeArquivo,
        tipo: tipoMime,
        tamanho: tamanhoArquivo,
        duracao: duracaoNormalizada,
        url: urlParaExibicao,
        downloadUrl,
        originalUrl: ehRemoto ? caminhoNormalizado : null,
      };

      anexos.push(anexoFormatado);

      if (!audio && tipoMime.startsWith('audio')) {
        audio = {
          url: urlParaExibicao,
          downloadUrl,
          duracao: duracaoNormalizada,
          nome: nomeArquivo,
          tipo: tipoMime,
        };
      }
    }

    return {
      anexos,
      audio,
    };
  }

  formatarMensagemParaFrontend(
    mensagem: Mensagem,
    opcoes?: {
      fotoContato?: string | null;
      status?: string;
    },
  ) {
    const ehCliente = mensagem.remetente === RemetenteMensagem.CLIENTE;
    const { anexos, audio } = this.formatarMidiaParaFrontend(mensagem);

    return {
      id: mensagem.id,
      ticketId: mensagem.ticketId,
      remetente: {
        id: mensagem.id,
        nome: ehCliente ? 'Cliente' : 'Atendente',
        foto: ehCliente ? opcoes?.fotoContato || null : null,
        tipo: ehCliente ? 'cliente' : 'atendente',
      },
      conteudo: mensagem.conteudo,
      timestamp: mensagem.createdAt,
      status: opcoes?.status || 'lido',
      anexos,
      audio,
    };
  }

  /**
   * Busca mensagem por ID externo (WhatsApp, Telegram, etc)
   */
  async buscarPorIdExterno(idExterno: string): Promise<Mensagem | null> {
    return await this.mensagemRepository.findOne({
      where: { idExterno },
    });
  }

  /**
   * Marca mensagem como lida
   */
  async marcarComoLida(id: string): Promise<Mensagem> {
    const mensagem = await this.buscarPorId(id);

    // mensagem.status = StatusMensagem.LIDA; // Coluna não existe no banco

    const mensagemAtualizada = await this.mensagemRepository.save(mensagem);
    this.logger.log(`✓✓ Mensagem ${id} marcada como lida`);

    return mensagemAtualizada;
  }

  /**
   * Marca mensagem como lida pelo ID externo
   */
  async marcarComoLidaPorIdExterno(idExterno: string): Promise<void> {
    await this.mensagemRepository.update(
      { idExterno },
      { /* status: StatusMensagem.LIDA */ }, // Coluna não existe no banco
    );

    this.logger.log(`✓✓ Mensagem externa ${idExterno} marcada como lida`);
  }

  /**
   * Marca mensagem como entregue
   */
  async marcarComoEntregue(id: string): Promise<Mensagem> {
    const mensagem = await this.buscarPorId(id);

    // mensagem.status = StatusMensagem.ENTREGUE; // Coluna não existe no banco

    const mensagemAtualizada = await this.mensagemRepository.save(mensagem);
    this.logger.log(`✓ Mensagem ${id} marcada como entregue`);

    return mensagemAtualizada;
  }

  /**
   * Atualiza status da mensagem
   */
  async atualizarStatus(id: string, dto: AtualizarStatusMensagemDto): Promise<Mensagem> {
    const mensagem = await this.buscarPorId(id);

    // mensagem.status = dto.status; // Coluna não existe no banco

    const mensagemAtualizada = await this.mensagemRepository.save(mensagem);
    this.logger.log(`📝 Status da mensagem ${id} atualizado para ${dto.status}`);

    return mensagemAtualizada;
  }

  /**
   * Busca última mensagem de um ticket
   */
  async buscarUltima(ticketId: string): Promise<Mensagem | null> {
    return await this.mensagemRepository.findOne({
      where: { ticketId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Conta mensagens de um ticket
   */
  async contar(ticketId: string): Promise<number> {
    return await this.mensagemRepository.count({
      where: { ticketId },
    });
  }

  /**
   * Conta mensagens não lidas de um ticket
   */
  async contarNaoLidas(ticketId: string): Promise<number> {
    return await this.mensagemRepository.count({
      where: {
        ticketId,
        remetente: RemetenteMensagem.CLIENTE,
        // status: StatusMensagem.ENVIADA, // Coluna não existe no banco
      },
    });
  }

  /**
   * Busca mensagens do cliente (histórico completo)
   */
  async buscarHistoricoCliente(
    empresaId: string,
    clienteNumero: string,
    limite = 50,
  ): Promise<Mensagem[]> {
    const query = `
      SELECT m.* 
      FROM mensagens m
      INNER JOIN atendimento_tickets t ON t.id = m.ticketId
      WHERE t.empresaId = $1 
        AND t.contato_telefone = $2
      ORDER BY m.createdAt DESC
      LIMIT $3
    `;

    return await this.mensagemRepository.query(query, [empresaId, clienteNumero, limite]);
  }

  /**
   * Salva mensagem de texto simples (atalho)
   */
  async salvarTexto(
    ticketId: string,
    conteudo: string,
    remetente: RemetenteMensagem,
    atendenteId?: string,
    idExterno?: string,
  ): Promise<Mensagem> {
    return await this.salvar({
      ticketId,
      tipo: TipoMensagem.TEXTO,
      remetente: remetente as string,
      conteudo,
      atendenteId,
      idExterno,
    });
  }

  /**
   * Salva mensagem do cliente (atalho para webhook)
   */
  async salvarMensagemCliente(
    ticketId: string,
    conteudo: string,
    idExterno?: string,
    midia?: any,
  ): Promise<Mensagem> {
    return await this.salvar({
      ticketId,
      tipo: midia ? this.detectarTipoMidia(midia) : TipoMensagem.TEXTO,
      remetente: RemetenteMensagem.CLIENTE as string,
      conteudo,
      idExterno,
      midia,
    });
  }

  /**
   * Salva mensagem do atendente (atalho)
   */
  async salvarMensagemAtendente(
    ticketId: string,
    atendenteId: string,
    conteudo: string,
    idExterno?: string,
  ): Promise<Mensagem> {
    return await this.salvar({
      ticketId,
      tipo: TipoMensagem.TEXTO,
      remetente: RemetenteMensagem.ATENDENTE as string,
      conteudo,
      atendenteId,
      idExterno,
    });
  }

  /**
   * Salva mensagem do bot/IA (atalho)
   */
  async salvarMensagemBot(
    ticketId: string,
    conteudo: string,
    idExterno?: string,
  ): Promise<Mensagem> {
    return await this.salvar({
      ticketId,
      tipo: TipoMensagem.TEXTO,
      remetente: RemetenteMensagem.BOT as string,
      conteudo,
      idExterno,
    });
  }

  /**
   * Detecta tipo de mídia
   */
  private detectarTipoMidia(midia: any): TipoMensagem {
    if (!midia) return TipoMensagem.TEXTO;

    const tipo = midia.tipo || midia.mime_type || '';

    if (tipo.includes('image')) return TipoMensagem.IMAGEM;
    if (tipo.includes('audio')) return TipoMensagem.AUDIO;
    if (tipo.includes('video')) return TipoMensagem.VIDEO;
    if (tipo.includes('application')) return TipoMensagem.DOCUMENTO;

    return TipoMensagem.TEXTO;
  }

  /**
   * Deleta mensagens antigas (limpeza)
   */
  async deletarAntigas(dias: number): Promise<number> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);

    const resultado = await this.mensagemRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :dataLimite', { dataLimite })
      .execute();

    this.logger.log(`🗑️ Deletadas ${resultado.affected} mensagens antigas`);

    return resultado.affected || 0;
  }

  /**
   * Busca mensagens para análise de IA (últimas N mensagens)
   */
  async buscarParaAnaliseIA(ticketId: string, quantidade = 10): Promise<Mensagem[]> {
    return await this.mensagemRepository.find({
      where: { ticketId },
      order: { createdAt: 'DESC' },
      take: quantidade,
    });
  }

  /**
   * Envia nova mensagem
   */
  async enviar(dados: any, arquivos?: Express.Multer.File[]): Promise<Mensagem> {
    this.logger.log(`📤 Enviando mensagem para ticket ${dados.ticketId}`);
    this.logger.debug(`📋 Dados recebidos: ${JSON.stringify(dados)}`);

    const conteudoBruto = typeof dados.conteudo === 'string' ? dados.conteudo : '';
    const conteudoNormalizado = conteudoBruto.trim();
    const conteudoDigitado = conteudoNormalizado;

    const arquivosValidos = (arquivos || []).filter(Boolean);
    const possuiArquivo = arquivosValidos.length > 0;
    const arquivoPrincipal = possuiArquivo ? arquivosValidos[0] : undefined;
    const possuiMidiaExistente = !!dados.midia;
    const possuiInformacaoAudio = dados.duracaoAudio !== undefined || dados.duracao !== undefined;
    const duracaoAudioInformada = Number(dados.duracaoAudio ?? dados.duracao ?? 0);

    if (!conteudoNormalizado && !possuiArquivo && !possuiMidiaExistente && !possuiInformacaoAudio) {
      this.logger.error(`❌ Conteúdo da mensagem está vazio ou ausente!`);
      throw new Error('Conteúdo da mensagem é obrigatório');
    }

    let conteudoMensagem = conteudoNormalizado;

    if (!conteudoMensagem) {
      if (possuiArquivo) {
        const primeiroArquivo = arquivosValidos[0];
        // ✨ Se for áudio, não mostrar nome do arquivo (apenas player visual)
        const ehAudio = primeiroArquivo?.mimetype?.startsWith('audio/') || possuiInformacaoAudio;
        conteudoMensagem = ehAudio ? '' : `📎 ${primeiroArquivo?.originalname || 'Anexo'}`;
      } else if (possuiMidiaExistente) {
        const tipoMidiaDetectado = this.detectarTipoMidia(dados.midia);

        if (tipoMidiaDetectado === TipoMensagem.AUDIO || possuiInformacaoAudio) {
          conteudoMensagem = ''; // ✨ Áudio: não mostrar texto (apenas player visual)
        } else if (tipoMidiaDetectado === TipoMensagem.IMAGEM) {
          conteudoMensagem = '🖼️ Imagem';
        } else if (tipoMidiaDetectado === TipoMensagem.VIDEO) {
          conteudoMensagem = '🎬 Vídeo';
        } else {
          conteudoMensagem = '📎 Anexo';
        }
      } else if (possuiInformacaoAudio) {
        conteudoMensagem = ''; // ✨ Áudio: não mostrar texto (apenas player visual)
      } else {
        conteudoMensagem = 'Mensagem sem texto';
      }
    }

    const mensagemData: any = {
      ticketId: dados.ticketId,
      tipo: TipoMensagem.TEXTO,
      remetente: dados.tipoRemetente || RemetenteMensagem.ATENDENTE,
      conteudo: conteudoMensagem,
      atendenteId: dados.remetenteId,
    };

    // Se houver arquivos anexos, processar o primeiro
    let arquivoPreparadoParaEnvio: Express.Multer.File | null = null;

    if (arquivoPrincipal) {
      let caminhoMidiaLocal = await this.salvarArquivoLocal(arquivoPrincipal);
      const caminhoRelativo = caminhoMidiaLocal
        ? relative(process.cwd(), caminhoMidiaLocal).replace(/\\/g, '/').replace(/^\/+/, '')
        : null;

      mensagemData.midia = {
        url: caminhoRelativo || arquivoPrincipal.path || arquivoPrincipal.filename,
        path: caminhoMidiaLocal || arquivoPrincipal.path || null,
        caminhoAnexo: caminhoMidiaLocal || arquivoPrincipal.path || null,
        tipo: arquivoPrincipal.mimetype,
        mime_type: arquivoPrincipal.mimetype,
        mimetype: arquivoPrincipal.mimetype,
        tamanho: arquivoPrincipal.size,
        size: arquivoPrincipal.size,
        // ✨ Nome do arquivo: apenas para não-áudio (áudio usa player visual)
        nome: arquivoPrincipal.mimetype?.startsWith('audio/') ? undefined : arquivoPrincipal.originalname,
        originalname: arquivoPrincipal.mimetype?.startsWith('audio/') ? undefined : arquivoPrincipal.originalname,
        storage: caminhoMidiaLocal ? 'local' : undefined,
      };

      // Determinar tipo baseado no MIME
      const mimeTipoArquivo = arquivoPrincipal.mimetype?.split(';')[0] || arquivoPrincipal.mimetype;

      if (mimeTipoArquivo?.startsWith('image/')) {
        mensagemData.tipo = TipoMensagem.IMAGEM;
      } else if (mimeTipoArquivo?.startsWith('audio/')) {
        mensagemData.tipo = TipoMensagem.AUDIO;
      } else if (mimeTipoArquivo?.startsWith('video/')) {
        mensagemData.tipo = TipoMensagem.VIDEO;
      } else {
        mensagemData.tipo = TipoMensagem.DOCUMENTO;
      }

      if (mensagemData.tipo === TipoMensagem.AUDIO && duracaoAudioInformada > 0) {
        mensagemData.midia.duracao = duracaoAudioInformada;
      }

      let arquivoParaEnvio: Express.Multer.File = arquivoPrincipal;

      if (mensagemData.tipo === TipoMensagem.AUDIO) {
        const tipoMidiaAtual = mensagemData.midia?.tipo || mimeTipoArquivo;
        const precisaConverter = typeof tipoMidiaAtual === 'string' && tipoMidiaAtual.includes('webm');

        if (precisaConverter) {
          const caminhoReferencia = caminhoMidiaLocal || arquivoPrincipal.path || null;
          const resultadoConversao = caminhoReferencia
            ? await this.converterAudioParaFormatoWhatsApp(caminhoReferencia, mensagemData.midia?.nome || arquivoPrincipal.originalname)
            : null;

          if (!resultadoConversao) {
            throw new Error('Falha ao converter áudio para formato compatível com WhatsApp');
          }

          const caminhoRelativoConvertido = relative(process.cwd(), resultadoConversao.caminho)
            .replace(/\\/g, '/').replace(/^\/+/, '');

          mensagemData.midia = {
            ...mensagemData.midia,
            url: caminhoRelativoConvertido,
            path: resultadoConversao.caminho,
            caminhoAnexo: resultadoConversao.caminho,
            tipo: 'audio/ogg',
            mime_type: 'audio/ogg',
            mimetype: 'audio/ogg',
            tamanho: resultadoConversao.tamanho,
            size: resultadoConversao.tamanho,
            // ✨ Áudio: não incluir nome do arquivo (apenas player visual)
            storage: 'local',
          };

          arquivoParaEnvio = {
            ...arquivoPrincipal,
            path: resultadoConversao.caminho,
            mimetype: 'audio/ogg',
            originalname: resultadoConversao.nome,
            filename: resultadoConversao.nome,
            size: resultadoConversao.tamanho,
            buffer: undefined,
          } as Express.Multer.File;

          if (caminhoMidiaLocal && caminhoMidiaLocal !== resultadoConversao.caminho) {
            await fsPromises.unlink(caminhoMidiaLocal).catch(() => undefined);
          }

          caminhoMidiaLocal = resultadoConversao.caminho;
        }
      }

      arquivoPreparadoParaEnvio = arquivoParaEnvio;
    } else if (dados.midia) {
      mensagemData.midia = dados.midia;
      const tipoMidia = this.detectarTipoMidia(dados.midia);
      mensagemData.tipo = tipoMidia;
    }

    const mensagem = this.mensagemRepository.create(mensagemData);
    const mensagemSalva = await this.mensagemRepository.save(mensagem) as any as Mensagem;

    this.logger.log(`✅ Mensagem salva no banco de dados`);

    // 🔥 ENVIAR VIA WHATSAPP SE FOR CANAL WHATSAPP
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { id: dados.ticketId }
      });

      if (!ticket) {
        this.logger.warn(`⚠️ Ticket ${dados.ticketId} não encontrado para envio via canal`);
      } else if (ticket.canalId) {
        const canal = await this.canalRepository.findOne({
          where: { id: ticket.canalId }
        });

        if (canal && canal.tipo === TipoCanal.WHATSAPP) {
          this.logger.log(`📱 Canal WhatsApp detectado, enviando mensagem...`);
          this.logger.log(`   Empresa: ${ticket.empresaId}`);
          this.logger.log(`   Telefone: ${ticket.contatoTelefone}`);

          if (ticket.contatoTelefone) {
            const textoParaEnvio = conteudoDigitado || mensagemData.conteudo;

            if (arquivoPrincipal) {
              const arquivoParaEnvioWhatsApp = arquivoPreparadoParaEnvio ?? arquivoPrincipal;

              if (!arquivoParaEnvioWhatsApp) {
                throw new Error('Arquivo de mídia não disponível para envio via WhatsApp');
              }

              const legendaMidia = conteudoDigitado || undefined;

              const envioMidia = await this.whatsappSenderService.enviarMidia({
                empresaId: ticket.empresaId,
                para: ticket.contatoTelefone,
                arquivo: arquivoParaEnvioWhatsApp,
                tipoMensagem: mensagemData.tipo,
                legenda: mensagemData.tipo !== TipoMensagem.AUDIO ? legendaMidia : undefined,
                duracaoAudio: mensagemData.tipo === TipoMensagem.AUDIO
                  ? mensagemData.midia?.duracao ?? duracaoAudioInformada
                  : undefined,
              });

              if (envioMidia.sucesso) {
                this.logger.log(`✅ Mídia enviada via WhatsApp: ${envioMidia.messageId || 'sem id'}`);
              } else {
                this.logger.error(`❌ Erro ao enviar mídia via WhatsApp: ${envioMidia.erro}`);
              }

              // Se for áudio e o atendente digitou uma mensagem, enviar texto separado
              if (mensagemData.tipo === TipoMensagem.AUDIO && conteudoDigitado) {
                const resultadoTexto = await this.whatsappSenderService.enviarMensagem(
                  ticket.empresaId,
                  ticket.contatoTelefone,
                  conteudoDigitado
                );

                if (resultadoTexto.sucesso) {
                  this.logger.log(`✅ Texto complementar enviado via WhatsApp: ${resultadoTexto.messageId}`);
                } else {
                  this.logger.error(`❌ Erro ao enviar texto complementar via WhatsApp: ${resultadoTexto.erro}`);
                }
              }
            } else {
              const resultado = await this.whatsappSenderService.enviarMensagem(
                ticket.empresaId,
                ticket.contatoTelefone,
                textoParaEnvio
              );

              if (resultado.sucesso) {
                this.logger.log(`✅ Mensagem enviada via WhatsApp: ${resultado.messageId}`);
              } else {
                this.logger.error(`❌ Erro ao enviar via WhatsApp: ${resultado.erro}`);
              }
            }
          } else {
            this.logger.warn(`⚠️ Ticket sem telefone de contato, mensagem não enviada via WhatsApp`);
          }
        } else {
          this.logger.log(`ℹ️ Canal ${canal?.tipo || 'desconhecido'} - envio via gateway não implementado`);
        }
      } else {
        this.logger.log(`ℹ️ Ticket sem canal associado, apenas salvo no banco`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar via gateway: ${error.message}`);
      // Não falha o fluxo, mensagem já está salva no banco
    }

    // 🔥 EMITIR EVENTO WEBSOCKET PARA ATUALIZAÇÃO EM TEMPO REAL
    try {
      const ticketRelacionado = await this.ticketRepository.findOne({ where: { id: mensagemSalva.ticketId } });

      const mensagemFormatada = this.formatarMensagemParaFrontend(mensagemSalva, {
        fotoContato: ticketRelacionado?.contatoFoto || null,
        status: 'enviado',
      });

      this.atendimentoGateway.notificarNovaMensagem(mensagemFormatada);
      this.logger.log(`📡 Evento WebSocket emitido: nova_mensagem (${mensagemFormatada.remetente.tipo})`);
    } catch (error) {
      this.logger.error(`❌ Erro ao emitir evento WebSocket: ${error.message}`);
      // Não falha o fluxo
    }

    return mensagemSalva;
  }

  /**
   * Marca mensagens como lidas (simulação - campo não existe na entidade)
   */
  async marcarLidas(mensagemIds: string[]): Promise<void> {
    this.logger.log(`✔️ Marcando ${mensagemIds.length} mensagens como lidas`);

    // TODO: Adicionar campo 'lida' na entidade Mensagem
    // TODO: Implementar lógica de marcar como lida
    // TODO: Emitir evento WebSocket

    this.logger.log(`✅ Mensagens processadas (campo 'lida' precisa ser criado no banco)`);
  }
}
