import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Fila } from '../entities/fila.entity';
import {
  CriarFilaDto,
  AtualizarFilaDto,
  AtribuirAtendenteFilaDto,
} from '../dto';

@Controller('atendimento/filas')
@UseGuards(JwtAuthGuard)
export class FilasController {
  constructor(
    @InjectRepository(Fila)
    private filaRepo: Repository<Fila>,
  ) {
    console.log('✅ FilasController inicializado');
  }

  @Get()
  async listar(@Req() req) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const filas = await this.filaRepo.find({
      where: { empresaId },
      // relations: ['atendentes'], // TODO: adicionar quando AtendenteFila estiver disponível
      order: { ordem: 'ASC' },
    });

    return {
      success: true,
      data: filas,
      total: filas.length,
    };
  }

  @Get(':id')
  async buscarPorId(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const fila = await this.filaRepo.findOne({
      where: { id, empresaId },
      relations: ['atendentes', 'canais'],
    });

    if (!fila) {
      return {
        success: false,
        message: 'Fila não encontrada',
      };
    }

    return {
      success: true,
      data: fila,
    };
  }

  @Post()
  async criar(@Req() req, @Body() dto: CriarFilaDto) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const fila = this.filaRepo.create({
      ...dto,
      empresaId,
    });

    await this.filaRepo.save(fila);

    return {
      success: true,
      message: 'Fila criada com sucesso',
      data: fila,
    };
  }

  @Put(':id')
  async atualizar(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AtualizarFilaDto,
  ) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const fila = await this.filaRepo.findOne({
      where: { id, empresaId },
    });

    if (!fila) {
      return {
        success: false,
        message: 'Fila não encontrada',
      };
    }

    Object.assign(fila, dto);
    await this.filaRepo.save(fila);

    return {
      success: true,
      message: 'Fila atualizada com sucesso',
      data: fila,
    };
  }

  @Delete(':id')
  async deletar(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const fila = await this.filaRepo.findOne({
      where: { id, empresaId },
    });

    if (!fila) {
      return {
        success: false,
        message: 'Fila não encontrada',
      };
    }

    await this.filaRepo.softDelete(id);

    return {
      success: true,
      message: 'Fila excluída com sucesso',
    };
  }

  @Post(':id/atendentes')
  async atribuirAtendente(
    @Req() req,
    @Param('id') filaId: string,
    @Body() dto: AtribuirAtendenteFilaDto,
  ) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const fila = await this.filaRepo.findOne({
      where: { id: filaId, empresaId },
    });

    if (!fila) {
      return {
        success: false,
        message: 'Fila não encontrada',
      };
    }

    return {
      success: true,
      message: 'Funcionalidade de atribuir atendente em desenvolvimento',
      data: null,
    };

    // TODO: Reabilitar quando AtendenteFila estiver disponível
    // const existente = await this.atendenteFilaRepo.findOne({
    //   where: { filaId, atendenteId: dto.atendenteId },
    // });
    // if (existente) {
    //   return { success: false, message: 'Atendente já está nesta fila' };
    // }
    // const atendenteFila = this.atendenteFilaRepo.create({
    //   filaId, atendenteId: dto.atendenteId, ativo: true,
    // });
    // await this.atendenteFilaRepo.save(atendenteFila);
    // return { success: true, message: 'Atendente adicionado à fila', data: atendenteFila };
  }

  // TODO: Reabilitar quando AtendenteFila estiver disponível
  /*
  @Delete(':filaId/atendentes/:atendenteId')
  async removerAtendente(
    @Req() req,
    @Param('filaId') filaId: string,
    @Param('atendenteId') atendenteId: string,
  ) {
    const atendenteFila = await this.atendenteFilaRepo.findOne({
      where: { filaId, atendenteId },
    });

    if (!atendenteFila) {
      return {
        success: false,
        message: 'Atendente não encontrado nesta fila',
      };
    }

    await this.atendenteFilaRepo.delete({ filaId, atendenteId });

    return {
      success: true,
      message: 'Atendente removido da fila',
    };
  }
  */
}
