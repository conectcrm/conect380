import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TemplateMensagemService } from '../services/template-mensagem.service';
import { CreateTemplateMensagemDto } from '../dto/create-template-mensagem.dto';
import { UpdateTemplateMensagemDto } from '../dto/update-template-mensagem.dto';

@Controller('atendimento/templates-mensagens')
@UseGuards(JwtAuthGuard)
export class TemplateMensagemController {
  constructor(private readonly templateService: TemplateMensagemService) { }

  @Post()
  async criar(@Body() dto: CreateTemplateMensagemDto) {
    return await this.templateService.criar(dto);
  }

  @Get()
  async listar(@Query('empresaId') empresaId: string) {
    if (!empresaId) {
      throw new Error('empresaId é obrigatório');
    }
    return await this.templateService.listar(empresaId);
  }

  @Get('todos')
  async listarTodos(@Query('empresaId') empresaId: string) {
    if (!empresaId) {
      throw new Error('empresaId é obrigatório');
    }
    return await this.templateService.listarTodos(empresaId);
  }

  @Get('buscar')
  async buscar(
    @Query('termo') termo: string,
    @Query('empresaId') empresaId: string,
  ) {
    if (!empresaId) {
      throw new Error('empresaId é obrigatório');
    }
    return await this.templateService.buscar(termo, empresaId);
  }

  @Get('atalho/:atalho')
  async buscarPorAtalho(
    @Param('atalho') atalho: string,
    @Query('empresaId') empresaId: string,
  ) {
    if (!empresaId) {
      throw new Error('empresaId é obrigatório');
    }
    return await this.templateService.buscarPorAtalho(atalho, empresaId);
  }

  @Get(':id')
  async buscarPorId(
    @Param('id') id: string,
    @Query('empresaId') empresaId: string,
  ) {
    if (!empresaId) {
      throw new Error('empresaId é obrigatório');
    }
    return await this.templateService.buscarPorId(id, empresaId);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Query('empresaId') empresaId: string,
    @Body() dto: UpdateTemplateMensagemDto,
  ) {
    if (!empresaId) {
      throw new Error('empresaId é obrigatório');
    }
    return await this.templateService.atualizar(id, empresaId, dto);
  }

  @Delete(':id')
  async deletar(
    @Param('id') id: string,
    @Query('empresaId') empresaId: string,
  ) {
    if (!empresaId) {
      throw new Error('empresaId é obrigatório');
    }
    await this.templateService.deletar(id, empresaId);
    return { message: 'Template deletado com sucesso' };
  }
}
