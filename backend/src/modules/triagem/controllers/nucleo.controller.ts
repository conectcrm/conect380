import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { CreateNucleoDto, FilterNucleoDto, UpdateNucleoDto } from '../dto';
import { NucleoService } from '../services/nucleo.service';

@Controller('nucleos')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class NucleoController {
  constructor(private readonly nucleoService: NucleoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@EmpresaId() empresaId: string, @Body() createNucleoDto: CreateNucleoDto) {
    return this.nucleoService.create(empresaId, createNucleoDto);
  }

  @Get()
  async findAll(@EmpresaId() empresaId: string, @Query() filters: FilterNucleoDto) {
    return this.nucleoService.findAll(empresaId, filters);
  }

  @Get('canal/:canal')
  async findByCanal(@EmpresaId() empresaId: string, @Param('canal') canal: string) {
    return this.nucleoService.findByCanal(empresaId, canal);
  }

  @Get(':id')
  async findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.nucleoService.findOne(empresaId, id);
  }

  @Put(':id')
  async update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() updateNucleoDto: UpdateNucleoDto,
  ) {
    return this.nucleoService.update(empresaId, id, updateNucleoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.nucleoService.remove(empresaId, id);
  }

  @Post(':id/incrementar-tickets')
  async incrementarTickets(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.nucleoService.incrementarTicketsAbertos(empresaId, id);
    return { message: 'Contador incrementado' };
  }

  @Post(':id/decrementar-tickets')
  async decrementarTickets(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.nucleoService.decrementarTicketsAbertos(empresaId, id);
    return { message: 'Contador decrementado' };
  }

  @Get('disponivel/:canal')
  async findDisponivel(@EmpresaId() empresaId: string, @Param('canal') canal: string) {
    const nucleo = await this.nucleoService.findNucleoComMenorCarga(empresaId, canal);

    if (!nucleo) {
      return {
        message: 'Nenhum nucleo disponivel no momento',
        disponivel: false,
      };
    }

    return {
      disponivel: true,
      nucleo,
    };
  }

  @Get('bot/opcoes')
  async getBotOptions(@EmpresaId() empresaId: string) {
    return this.nucleoService.findOpcoesParaBot(empresaId);
  }
}
