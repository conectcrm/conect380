import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusCustomizado } from '../entities/status-customizado.entity';
import { CreateStatusCustomizadoDto } from '../dto/create-status-customizado.dto';
import { UpdateStatusCustomizadoDto } from '../dto/update-status-customizado.dto';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class StatusCustomizadosService {
  private readonly logger = new Logger(StatusCustomizadosService.name);

  constructor(
    @InjectRepository(StatusCustomizado)
    private readonly statusRepository: Repository<StatusCustomizado>,
    @Inject(REQUEST) private readonly request: any,
  ) { }

  private getEmpresaId(): string {
    const empresaId = this.request.user?.empresa_id;
    if (!empresaId) {
      throw new BadRequestException('Empresa ID não encontrado no contexto da requisição');
    }
    return empresaId;
  }

  async listarTodos(): Promise<StatusCustomizado[]> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📋 Listando todos os status customizados da empresa ${empresaId}`);

    return await this.statusRepository.find({
      where: { empresaId },
      relations: ['nivel'],
      order: {
        nivel: { ordem: 'ASC' },
        ordem: 'ASC',
      },
    });
  }

  async listarAtivos(): Promise<StatusCustomizado[]> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📋 Listando status customizados ativos da empresa ${empresaId}`);

    return await this.statusRepository.find({
      where: { empresaId, ativo: true },
      relations: ['nivel'],
      order: {
        nivel: { ordem: 'ASC' },
        ordem: 'ASC',
      },
    });
  }

  async listarPorNivel(nivelId: string): Promise<StatusCustomizado[]> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📋 Listando status do nível ${nivelId} da empresa ${empresaId}`);

    return await this.statusRepository.find({
      where: { empresaId, nivelId },
      relations: ['nivel'],
      order: { ordem: 'ASC' },
    });
  }

  async listarAtivosPorNivel(nivelId: string): Promise<StatusCustomizado[]> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📋 Listando status ativos do nível ${nivelId} da empresa ${empresaId}`);

    return await this.statusRepository.find({
      where: { empresaId, nivelId, ativo: true },
      relations: ['nivel'],
      order: { ordem: 'ASC' },
    });
  }

  async buscarPorId(id: string): Promise<StatusCustomizado> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`🔍 Buscando status customizado ${id} da empresa ${empresaId}`);

    const status = await this.statusRepository.findOne({
      where: { id, empresaId },
      relations: ['nivel'],
    });

    if (!status) {
      throw new NotFoundException(`Status customizado com ID ${id} não encontrado`);
    }

    return status;
  }

  async criar(dto: CreateStatusCustomizadoDto): Promise<StatusCustomizado> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`➕ Criando novo status customizado: ${dto.nome} para empresa ${empresaId}`);

    const status = this.statusRepository.create({
      ...dto,
      empresaId,
    });

    const salvo = await this.statusRepository.save(status);
    this.logger.log(`✅ Status customizado criado com sucesso: ${salvo.id}`);

    // Retornar com relação carregada
    return await this.buscarPorId(salvo.id);
  }

  async atualizar(id: string, dto: UpdateStatusCustomizadoDto): Promise<StatusCustomizado> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📝 Atualizando status customizado ${id} da empresa ${empresaId}`);

    const status = await this.buscarPorId(id);
    Object.assign(status, dto);

    const atualizado = await this.statusRepository.save(status);
    this.logger.log(`✅ Status customizado atualizado com sucesso: ${atualizado.id}`);

    return await this.buscarPorId(atualizado.id);
  }

  async deletar(id: string): Promise<void> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`🗑️ Deletando status customizado ${id} da empresa ${empresaId}`);

    const status = await this.buscarPorId(id);
    await this.statusRepository.remove(status);

    this.logger.log(`✅ Status customizado deletado com sucesso: ${id}`);
  }

  async inativar(id: string): Promise<StatusCustomizado> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`❌ Inativando status customizado ${id} da empresa ${empresaId}`);

    const status = await this.buscarPorId(id);
    status.ativo = false;

    const atualizado = await this.statusRepository.save(status);
    this.logger.log(`✅ Status customizado inativado com sucesso: ${id}`);

    return await this.buscarPorId(atualizado.id);
  }

  async ativar(id: string): Promise<StatusCustomizado> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`✅ Ativando status customizado ${id} da empresa ${empresaId}`);

    const status = await this.buscarPorId(id);
    status.ativo = true;

    const atualizado = await this.statusRepository.save(status);
    this.logger.log(`✅ Status customizado ativado com sucesso: ${id}`);

    return await this.buscarPorId(atualizado.id);
  }
}
