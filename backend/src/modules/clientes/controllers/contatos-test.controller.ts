import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contato } from '../contato.entity';

/**
 * Controller de teste para debug
 * Remove guards e validações para isolar o problema
 */
@Controller('api/test/contatos')
export class ContatosTestController {
  constructor(
    @InjectRepository(Contato)
    private contatoRepository: Repository<Contato>,
  ) { }

  @Get('health')
  async health() {
    return {
      status: 'ok',
      message: 'Controller está funcionando',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('repository-check')
  async checkRepository() {
    try {
      const exists = this.contatoRepository !== undefined;
      return {
        status: 'ok',
        repositoryInjected: exists,
        repositoryType: typeof this.contatoRepository,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  @Get('count')
  async count() {
    try {
      const count = await this.contatoRepository.count();
      return {
        status: 'ok',
        totalContatos: count,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        stack: error.stack,
      };
    }
  }

  @Get('list')
  async list() {
    try {
      const contatos = await this.contatoRepository.find({
        take: 10,
      });
      return {
        status: 'ok',
        count: contatos.length,
        contatos,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        stack: error.stack,
      };
    }
  }

  @Get('by-cliente/:clienteId')
  async byCliente(@Param('clienteId') clienteId: string) {
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
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        stack: error.stack,
      };
    }
  }
}
