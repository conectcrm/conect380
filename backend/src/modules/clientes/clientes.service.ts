import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cliente, StatusCliente } from './cliente.entity';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces/common.interface';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async create(clienteData: Partial<Cliente>): Promise<Cliente> {
    const cliente = this.clienteRepository.create(clienteData);
    return this.clienteRepository.save(cliente);
  }

  async findAll(
    empresaId: string,
    params: PaginationParams,
  ): Promise<PaginatedResponse<Cliente>> {
    const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder = 'DESC' } = params;
    
    const queryBuilder = this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId })
      .andWhere('cliente.ativo = :ativo', { ativo: true });

    if (search) {
      queryBuilder.andWhere(
        '(cliente.nome ILIKE :search OR cliente.email ILIKE :search OR cliente.empresa ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy(`cliente.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [clientes, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data: clientes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, empresaId: string): Promise<Cliente | undefined> {
    return this.clienteRepository.findOne({
      where: { id, empresa_id: empresaId, ativo: true },
    });
  }

  async update(id: string, empresaId: string, updateData: Partial<Cliente>): Promise<Cliente> {
    await this.clienteRepository.update(
      { id, empresa_id: empresaId },
      updateData
    );
    return this.findById(id, empresaId);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    await this.clienteRepository.update(
      { id, empresa_id: empresaId },
      { ativo: false }
    );
  }

  async getByStatus(empresaId: string, status: StatusCliente): Promise<Cliente[]> {
    return this.clienteRepository.find({
      where: { empresa_id: empresaId, status, ativo: true },
      order: { updated_at: 'DESC' },
    });
  }

  async updateStatus(id: string, empresaId: string, status: StatusCliente): Promise<Cliente> {
    await this.clienteRepository.update(
      { id, empresa_id: empresaId },
      { status, ultimo_contato: new Date() }
    );
    return this.findById(id, empresaId);
  }

  async getClientesProximoContato(empresaId: string): Promise<Cliente[]> {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    return this.clienteRepository.find({
      where: { 
        empresa_id: empresaId, 
        ativo: true,
      },
      order: { proximo_contato: 'ASC' },
    });
  }

  async getEstatisticas(empresaId: string) {
    const totalClientes = await this.clienteRepository.count({
      where: { empresa_id: empresaId, ativo: true }
    });

    const clientesAtivos = await this.clienteRepository.count({
      where: { empresa_id: empresaId, ativo: true, status: StatusCliente.CLIENTE }
    });

    const leads = await this.clienteRepository.count({
      where: { empresa_id: empresaId, ativo: true, status: StatusCliente.LEAD }
    });

    const prospects = await this.clienteRepository.count({
      where: { empresa_id: empresaId, ativo: true, status: StatusCliente.PROSPECT }
    });

    const inativos = await this.clienteRepository.count({
      where: { empresa_id: empresaId, ativo: true, status: StatusCliente.INATIVO }
    });

    // Novos clientes no mês atual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const novosClientesMes = await this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId })
      .andWhere('cliente.ativo = :ativo', { ativo: true })
      .andWhere('cliente.created_at >= :inicioMes', { inicioMes })
      .getCount();

    return {
      totalClientes,
      clientesAtivos,
      leads,
      prospects,
      inativos,
      novosClientesMes
    };
  }
}
