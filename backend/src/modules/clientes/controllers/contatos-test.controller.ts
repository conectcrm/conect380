import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ensureDevelopmentOnly } from '../../../common/utils/dev-only.util';
import { Contato } from '../contato.entity';

@Controller('api/test/contatos')
export class ContatosTestController {
  constructor(
    @InjectRepository(Contato)
    private contatoRepository: Repository<Contato>,
  ) {}

  private ensureDev(route: string): void {
    ensureDevelopmentOnly(route);
  }

  @Get('health')
  async health() {
    this.ensureDev('GET /api/test/contatos/health');

    return {
      status: 'ok',
      message: 'Controller esta funcionando',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('repository-check')
  async checkRepository() {
    this.ensureDev('GET /api/test/contatos/repository-check');

    try {
      const exists = this.contatoRepository !== undefined;
      return {
        status: 'ok',
        repositoryInjected: exists,
        repositoryType: typeof this.contatoRepository,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error?.message ?? 'Erro ao verificar repository',
      };
    }
  }

  @Get('count')
  async count() {
    this.ensureDev('GET /api/test/contatos/count');

    try {
      const count = await this.contatoRepository.count();
      return {
        status: 'ok',
        totalContatos: count,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error?.message ?? 'Erro ao contar contatos',
      };
    }
  }

  @Get('list')
  async list() {
    this.ensureDev('GET /api/test/contatos/list');

    try {
      const contatos = await this.contatoRepository.find({
        take: 10,
      });
      return {
        status: 'ok',
        count: contatos.length,
        contatos,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error?.message ?? 'Erro ao listar contatos',
      };
    }
  }

  @Get('by-cliente/:clienteId')
  async byCliente(@Param('clienteId') clienteId: string) {
    this.ensureDev('GET /api/test/contatos/by-cliente/:clienteId');

    try {
      const contatos = await this.contatoRepository.find({
        where: { clienteId },
      });
      return {
        status: 'ok',
        clienteId,
        count: contatos.length,
        contatos,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error?.message ?? 'Erro ao buscar contatos por cliente',
      };
    }
  }
}
