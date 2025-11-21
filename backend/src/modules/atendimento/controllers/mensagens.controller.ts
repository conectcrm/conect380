import { Controller, Get, Post, Body, Query, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Mensagem, TipoMensagem, StatusMensagem } from '../entities/mensagem.entity';
import { Ticket } from '../entities/ticket.entity';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';
import { CriarMensagemDto, BuscarMensagensDto } from '../dto';

const UPLOAD_DIR = 'uploads/mensagens';

// Garantir que diretório existe
const ensureUploadDir = () => {
  const uploadPath = path.resolve(__dirname, '../../../', UPLOAD_DIR);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log('[Upload] Diretório criado:', uploadPath);
  }
  return uploadPath;
};

@Controller('atendimento/mensagens')
@UseGuards(JwtAuthGuard)
export class MensagensController {
  constructor(
    @InjectRepository(Mensagem)
    private mensagemRepo: Repository<Mensagem>,

    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,

    private atendimentoGateway: AtendimentoGateway,
  ) { }

  @Get()
  async listar(@Req() req, @Query() query: BuscarMensagensDto) {
    const empresaId = req.user.empresa_id || req.user.empresaId;
    const limit = parseInt(query.limit || '50');
    const offset = parseInt(query.offset || '0');

    // Verificar se o ticket pertence à empresa
    const ticket = await this.ticketRepo.findOne({
      where: { id: query.ticketId, empresaId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    const [mensagens, total] = await this.mensagemRepo.findAndCount({
      where: { ticketId: query.ticketId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });

    return {
      success: true,
      data: mensagens,
      total,
      limit,
      offset,
    };
  }

  @Post()
  async criar(@Req() req, @Body() dto: CriarMensagemDto) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    // Buscar ticket
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId, empresaId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    // Criar mensagem
    const mensagem = this.mensagemRepo.create({
      ticketId: dto.ticketId,
      tipo: dto.tipo,
      conteudo: dto.conteudo,
      remetente: dto.remetente,
      // status: StatusMensagem.ENVIADA, // Coluna não existe no banco
      midia: dto.midia || null,
    });

    await this.mensagemRepo.save(mensagem);

    // Atualizar última mensagem do ticket
    ticket.ultima_mensagem_em = new Date();
    await this.ticketRepo.save(ticket);

    // 🔥 EMITIR EVENTO WEBSOCKET - Nova mensagem em tempo real
    this.atendimentoGateway.notificarNovaMensagem({
      ...mensagem,
      ticketNumero: ticket.numero,
      atendenteId: ticket.atendenteId,
    });

    return {
      success: true,
      message: 'Mensagem criada com sucesso',
      data: mensagem,
    };
  }

  @Post('arquivo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = ensureUploadDir();
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const basename = path.basename(file.originalname, ext);
          cb(null, `${basename}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadArquivo(@Req() req, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    if (!file) {
      return {
        success: false,
        message: 'Nenhum arquivo enviado',
      };
    }

    const empresaId = req.user.empresa_id || req.user.empresaId;
    const ticketId = body.ticketId;

    if (!ticketId) {
      // Remover arquivo se não tiver ticketId
      fs.unlinkSync(file.path);
      return {
        success: false,
        message: 'ticketId é obrigatório',
      };
    }

    // Buscar ticket
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId, empresaId },
    });

    if (!ticket) {
      // Remover arquivo se ticket não encontrado
      fs.unlinkSync(file.path);
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    // Determinar tipo de mensagem baseado no mimetype
    let tipoMensagem: TipoMensagem = TipoMensagem.DOCUMENTO;
    if (file.mimetype.startsWith('image/')) {
      tipoMensagem = TipoMensagem.IMAGEM;
    } else if (file.mimetype.startsWith('video/')) {
      tipoMensagem = TipoMensagem.VIDEO;
    } else if (file.mimetype.startsWith('audio/')) {
      tipoMensagem = TipoMensagem.AUDIO;
    }

    // Criar URL do arquivo
    const fileUrl = `/${UPLOAD_DIR}/${file.filename}`;

    // Criar mensagem com arquivo
    const mensagem = this.mensagemRepo.create({
      ticketId,
      tipo: tipoMensagem,
      conteudo: file.originalname, // Nome do arquivo como conteúdo
      remetente: 'ATENDENTE',
      midia: {
        url: fileUrl,
        nome: file.originalname,
        tipo: file.mimetype,
        tamanho: file.size,
      },
    });

    await this.mensagemRepo.save(mensagem);

    // Atualizar última mensagem do ticket
    ticket.ultima_mensagem_em = new Date();
    await this.ticketRepo.save(ticket);

    // 🔥 EMITIR EVENTO WEBSOCKET
    this.atendimentoGateway.notificarNovaMensagem({
      ...mensagem,
      ticketNumero: ticket.numero,
      atendenteId: ticket.atendenteId,
    });

    return {
      success: true,
      message: 'Arquivo enviado com sucesso',
      data: {
        id: mensagem.id,
        nome: file.originalname,
        tipo: file.mimetype,
        tamanho: file.size,
        url: fileUrl,
      },
    };
  }
}
