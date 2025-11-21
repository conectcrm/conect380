import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessageTemplateService } from '../services/message-template.service';
import { CriarTemplateDto, AtualizarTemplateDto } from '../dto/template-tag.dto';
import { MessageTemplate } from '../entities/message-template.entity';

/**
 * Controller REST para gestão de templates de mensagem
 * 🔐 SEGURANÇA: empresa_id extraído do JWT (não aceita do query)
 */
@ApiTags('Message Templates')
@Controller('atendimento/templates')
@UseGuards(AuthGuard('jwt'))  // 🔐 Proteção global - requer autenticação JWT
export class MessageTemplateController {
  constructor(private readonly templateService: MessageTemplateService) { }

  @Post()
  @ApiOperation({ summary: 'Criar novo template de mensagem' })
  @ApiResponse({ status: 201, description: 'Template criado com sucesso', type: MessageTemplate })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou template duplicado' })
  async criar(
    @Request() req,
    @Body() createDto: CriarTemplateDto,
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT
    const empresaId = req.user.empresa_id;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }

    const template = await this.templateService.criar(createDto, empresaId);
    return {
      success: true,
      message: 'Template criado com sucesso',
      data: template,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os templates' })
  @ApiQuery({
    name: 'apenasAtivos',
    required: false,
    type: Boolean,
    description: 'Retornar apenas templates ativos',
  })
  @ApiResponse({ status: 200, description: 'Lista de templates', type: [MessageTemplate] })
  async listar(
    @Request() req,
    @Query('apenasAtivos') apenasAtivos?: string,
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT
    const empresaId = req.user.empresa_id;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }

    const somenteAtivos = apenasAtivos === 'true';
    const templates = await this.templateService.listar(empresaId, somenteAtivos);

    return {
      success: true,
      message: 'Templates listados com sucesso',
      data: templates,
    };
  }

  @Get('variaveis')
  @ApiOperation({ summary: 'Listar variáveis disponíveis para templates' })
  @ApiResponse({ status: 200, description: 'Lista de variáveis disponíveis' })
  async listarVariaveis() {
    const variaveis = this.templateService.listarVariaveisDisponiveis();
    return {
      success: true,
      message: 'Variáveis listadas com sucesso',
      data: variaveis,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar template por ID' })
  @ApiResponse({ status: 200, description: 'Template encontrado', type: MessageTemplate })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async buscarPorId(
    @Request() req,
    @Param('id') id: string,
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT
    const empresaId = req.user.empresa_id;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }

    const template = await this.templateService.buscarPorId(id, empresaId);
    return {
      success: true,
      message: 'Template encontrado',
      data: template,
    };
  }

  @Post('processar/:idOuAtalho')
  @ApiOperation({ summary: 'Processar template (substituir variáveis)' })
  @ApiResponse({ status: 200, description: 'Template processado com sucesso' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async processar(
    @Request() req,
    @Param('idOuAtalho') idOuAtalho: string,
    @Body() dados: Record<string, any>,
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT
    const empresaId = req.user.empresa_id;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }

    const mensagem = await this.templateService.processarTemplate(idOuAtalho, dados, empresaId);
    return {
      success: true,
      message: 'Template processado com sucesso',
      data: { mensagem },
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar template' })
  @ApiResponse({ status: 200, description: 'Template atualizado com sucesso', type: MessageTemplate })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async atualizar(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: AtualizarTemplateDto,
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT
    const empresaId = req.user.empresa_id;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }

    const template = await this.templateService.atualizar(id, updateDto, empresaId);
    return {
      success: true,
      message: 'Template atualizado com sucesso',
      data: template,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar template' })
  @ApiResponse({ status: 204, description: 'Template deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async deletar(
    @Request() req,
    @Param('id') id: string,
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT
    const empresaId = req.user.empresa_id;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }

    await this.templateService.deletar(id, empresaId);
  }
}
