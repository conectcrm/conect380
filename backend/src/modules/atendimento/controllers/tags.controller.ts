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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TagsService } from '../services/tags.service';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { Tag } from '../entities/tag.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';

@ApiTags('Tags')
@Controller('tags')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.ATENDIMENTO_CHATS_READ)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @Permissions(Permission.ATENDIMENTO_CHATS_REPLY)
  @ApiOperation({ summary: 'Criar nova tag' })
  @ApiResponse({ status: 201, description: 'Tag criada com sucesso', type: Tag })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou tag duplicada' })
  async criar(@EmpresaId() empresaId: string, @Body() createTagDto: CreateTagDto) {
    const tag = await this.tagsService.criar(createTagDto, empresaId);
    return {
      success: true,
      message: 'Tag criada com sucesso',
      data: tag,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as tags' })
  @ApiQuery({
    name: 'apenasAtivas',
    required: false,
    type: Boolean,
    description: 'Retornar apenas tags ativas',
  })
  @ApiQuery({
    name: 'comContagem',
    required: false,
    type: Boolean,
    description: 'Incluir contagem de uso (quantos tickets usam a tag)',
  })
  @ApiResponse({ status: 200, description: 'Lista de tags', type: [Tag] })
  async listar(
    @EmpresaId() empresaId: string,
    @Query('apenasAtivas') apenasAtivas?: string,
    @Query('comContagem') comContagem?: string,
  ) {
    const somenteAtivas = apenasAtivas === 'true';
    const incluirContagem = comContagem === 'true';

    let tags;
    if (incluirContagem) {
      tags = await this.tagsService.listarComContagem(empresaId, somenteAtivas);
    } else {
      tags = await this.tagsService.listar(empresaId, somenteAtivas);
    }

    return {
      success: true,
      message: 'Tags listadas com sucesso',
      data: tags,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tag por ID' })
  @ApiResponse({ status: 200, description: 'Tag encontrada', type: Tag })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  async buscarPorId(@EmpresaId() empresaId: string, @Param('id') id: string) {
    const tag = await this.tagsService.buscarPorId(id, empresaId);
    return {
      success: true,
      message: 'Tag encontrada',
      data: tag,
    };
  }

  @Put(':id')
  @Permissions(Permission.ATENDIMENTO_CHATS_REPLY)
  @ApiOperation({ summary: 'Atualizar tag' })
  @ApiResponse({ status: 200, description: 'Tag atualizada com sucesso', type: Tag })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async atualizar(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    const tag = await this.tagsService.atualizar(id, updateTagDto, empresaId);
    return {
      success: true,
      message: 'Tag atualizada com sucesso',
      data: tag,
    };
  }

  @Delete(':id')
  @Permissions(Permission.ATENDIMENTO_CHATS_REPLY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deletar tag (soft delete)' })
  @ApiResponse({ status: 200, description: 'Tag deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  async deletar(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.tagsService.deletar(id, empresaId);
    return {
      success: true,
      message: 'Tag deletada com sucesso',
    };
  }
}
