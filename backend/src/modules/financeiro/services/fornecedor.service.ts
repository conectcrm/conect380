import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { CreateFornecedorDto, UpdateFornecedorDto } from '../dto/fornecedor.dto';
import { Fornecedor } from '../entities/fornecedor.entity';
import { ContaPagar } from '../entities/conta-pagar.entity';

@Injectable()
export class FornecedorService {
  constructor(
    @InjectRepository(Fornecedor)
    private fornecedorRepository: Repository<Fornecedor>,
    @InjectRepository(ContaPagar)
    private contaPagarRepository: Repository<ContaPagar>,
  ) {}

  async create(createFornecedorDto: CreateFornecedorDto, empresaId: string): Promise<Fornecedor> {
    // Verificar se já existe fornecedor com este CNPJ/CPF na empresa
    const fornecedorExistente = await this.fornecedorRepository.findOne({
      where: {
        cnpjCpf: createFornecedorDto.cnpjCpf,
        empresaId: empresaId,
      },
    });

    if (fornecedorExistente) {
      throw new ConflictException('Já existe um fornecedor com este CNPJ/CPF cadastrado.');
    }

    const fornecedor = this.fornecedorRepository.create({
      ...createFornecedorDto,
      empresaId,
      ativo: createFornecedorDto.ativo ?? true,
    });

    return await this.fornecedorRepository.save(fornecedor);
  }

  async findAll(
    empresaId: string,
    filtros?: { busca?: string; ativo?: boolean },
  ): Promise<Fornecedor[]> {
    const where: any = { empresaId };

    if (filtros?.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    if (filtros?.busca) {
      const busca = `%${filtros.busca}%`;
      return await this.fornecedorRepository.find({
        where: [
          { ...where, nome: Like(busca) },
          { ...where, cnpjCpf: Like(busca) },
          { ...where, email: Like(busca) },
          { ...where, contato: Like(busca) },
          { ...where, cidade: Like(busca) },
        ],
        order: {
          nome: 'ASC',
        },
      });
    }

    return await this.fornecedorRepository.find({
      where,
      order: {
        nome: 'ASC',
      },
    });
  }

  async findAtivos(empresaId: string): Promise<Fornecedor[]> {
    return await this.fornecedorRepository.find({
      where: {
        empresaId,
        ativo: true,
      },
      order: {
        nome: 'ASC',
      },
    });
  }

  async findOne(id: string, empresaId: string): Promise<Fornecedor> {
    const fornecedor = await this.fornecedorRepository.findOne({
      where: {
        id,
        empresaId,
      },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado.');
    }

    return fornecedor;
  }

  async update(
    id: string,
    updateFornecedorDto: UpdateFornecedorDto,
    empresaId: string,
  ): Promise<Fornecedor> {
    const fornecedor = await this.findOne(id, empresaId);

    // Se estiver atualizando CNPJ/CPF, verificar se não existe outro com o mesmo
    if (updateFornecedorDto.cnpjCpf && updateFornecedorDto.cnpjCpf !== fornecedor.cnpjCpf) {
      const fornecedorExistente = await this.fornecedorRepository.findOne({
        where: {
          cnpjCpf: updateFornecedorDto.cnpjCpf,
          empresaId: empresaId,
        },
      });

      if (fornecedorExistente) {
        throw new ConflictException('Já existe um fornecedor com este CNPJ/CPF cadastrado.');
      }
    }

    Object.assign(fornecedor, updateFornecedorDto);
    return await this.fornecedorRepository.save(fornecedor);
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const fornecedor = await this.findOne(id, empresaId);

    try {
      // Verificar se o fornecedor pode ser removido (não possui dependências)
      await this.verificarDependencias(id);

      // Se chegou até aqui, pode remover
      await this.fornecedorRepository.remove(fornecedor);
    } catch (error) {
      // Tratar especificamente erro de integridade referencial
      if (error.code === '23503' || error.message.includes('foreign key constraint')) {
        throw new BadRequestException(
          'Não é possível excluir este fornecedor pois ele possui contas a pagar vinculadas. ' +
            'Para excluir o fornecedor, primeiro quite ou remova todas as contas a pagar relacionadas.',
        );
      }

      // Re-lançar outros erros
      throw error;
    }
  }

  /**
   * Verifica se o fornecedor possui dependências que impedem a exclusão
   */
  private async verificarDependencias(fornecedorId: string): Promise<void> {
    try {
      // Buscar contas a pagar do fornecedor
      const contasPagar = await this.contaPagarRepository.find({
        where: { fornecedorId },
        select: ['id', 'descricao', 'valor', 'status', 'dataVencimento'],
      });

      if (contasPagar.length > 0) {
        // Separar contas por status
        const contasAbertas = contasPagar.filter(
          (c) => c.status !== 'paga' && c.status !== 'cancelada',
        );
        const contasPagas = contasPagar.filter((c) => c.status === 'paga');

        const valorEmAberto = contasAbertas.reduce((acc, conta) => acc + Number(conta.valor), 0);
        const valorPago = contasPagas.reduce((acc, conta) => acc + Number(conta.valor), 0);

        let mensagem = `❌ **Não é possível excluir este fornecedor**\n\n`;
        mensagem += `📊 **Resumo das contas vinculadas:**\n`;
        mensagem += `• Total de contas: **${contasPagar.length}**\n`;

        if (contasAbertas.length > 0) {
          mensagem += `• Contas em aberto: **${contasAbertas.length}**\n`;
          mensagem += `• Valor em aberto: **R$ ${valorEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n`;
        }

        if (contasPagas.length > 0) {
          mensagem += `• Contas pagas: **${contasPagas.length}**\n`;
          mensagem += `• Valor pago: **R$ ${valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n`;
        }

        mensagem += `\n💡 **Soluções disponíveis:**\n`;
        mensagem += `1. **Quite/Cancele** todas as contas em aberto primeiro\n`;
        mensagem += `2. **Desative** o fornecedor para mantê-lo inativo\n`;
        mensagem += `3. **Mantenha** o fornecedor para preservar o histórico financeiro`;

        throw new BadRequestException({
          message: mensagem,
          details: {
            totalContas: contasPagar.length,
            contasAbertas: contasAbertas.length,
            contasPagas: contasPagas.length,
            valorEmAberto,
            valorPago,
            contasDetalhes: contasAbertas.slice(0, 5).map((c) => ({
              descricao: c.descricao,
              valor: c.valor,
              status: c.status,
              vencimento: c.dataVencimento,
            })),
          },
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Fallback para verificação direta no banco se a entidade não estiver configurada
      try {
        const contasPagar = await this.fornecedorRepository.query(
          'SELECT COUNT(*) as total FROM contas_pagar WHERE fornecedor_id = $1 AND status NOT IN ($2, $3)',
          [fornecedorId, 'paga', 'cancelada'],
        );

        const totalContas = parseInt(contasPagar[0]?.total || '0');

        if (totalContas > 0) {
          throw new BadRequestException({
            message:
              `❌ **Não é possível excluir este fornecedor**\n\n` +
              `Este fornecedor possui **${totalContas} conta(s) a pagar em aberto**.\n\n` +
              `💡 **Para excluir o fornecedor:**\n` +
              `1. **Quite ou cancele** todas as contas em aberto primeiro\n` +
              `2. **Ou use a opção "Desativar"** para mantê-lo inativo`,
            details: { totalContas },
          });
        }
      } catch (queryError) {
        // Se não conseguir verificar, permitir a exclusão mas avisar
        console.warn('Não foi possível verificar dependências do fornecedor:', queryError);
      }
    }
  }

  /**
   * Desativa o fornecedor em vez de excluir (alternativa segura)
   */
  async desativar(id: string, empresaId: string): Promise<Fornecedor> {
    const fornecedor = await this.findOne(id, empresaId);
    fornecedor.ativo = false;
    return await this.fornecedorRepository.save(fornecedor);
  }

  /**
   * Remove contas pagas para permitir exclusão do fornecedor
   * ATENÇÃO: Esta operação remove dados históricos permanentemente
   */
  async limparContasPagas(id: string, empresaId: number) {
    const fornecedor = await this.fornecedorRepository.findOne({
      where: { id: id, empresaId: empresaId.toString() },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // Remove apenas contas com status 'PAGO' ou 'FINALIZADO'
    const contasRemovidasResult = await this.contaPagarRepository.delete({
      fornecedor: { id: id },
      status: In(['PAGO', 'FINALIZADO', 'QUITADO']),
    });

    return {
      fornecedor,
      contasRemovidasCount: contasRemovidasResult.affected || 0,
      message: `${contasRemovidasResult.affected || 0} conta(s) paga(s) removida(s) do histórico`,
    };
  }
}
