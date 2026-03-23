import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ContaPagar } from '../entities/conta-pagar.entity';
import { CentroCusto } from '../entities/centro-custo.entity';
import {
  CreateCentroCustoDto,
  QueryCentrosCustoDto,
  UpdateCentroCustoDto,
} from '../dto/centro-custo.dto';

@Injectable()
export class CentroCustoService {
  constructor(
    @InjectRepository(CentroCusto)
    private readonly centroCustoRepository: Repository<CentroCusto>,
    @InjectRepository(ContaPagar)
    private readonly contaPagarRepository: Repository<ContaPagar>,
  ) {}

  async create(
    dto: CreateCentroCustoDto,
    empresaId: string,
    userId = 'sistema',
  ): Promise<CentroCusto> {
    const codigo = this.normalizarCodigo(dto.codigo);
    const nome = this.normalizarNome(dto.nome);
    const descricao = this.normalizarDescricao(dto.descricao);

    await this.validarDuplicidade({
      empresaId,
      codigo,
      nome,
    });

    const centroCusto = this.centroCustoRepository.create({
      codigo,
      nome,
      descricao,
      ativo: dto.ativo ?? true,
      empresaId,
      criadoPor: userId || 'sistema',
    });

    return this.centroCustoRepository.save(centroCusto);
  }

  async findAll(empresaId: string, filtros: QueryCentrosCustoDto = {}): Promise<CentroCusto[]> {
    const where: any = { empresaId };

    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    if (filtros.busca?.trim()) {
      const busca = `%${filtros.busca.trim()}%`;
      return this.centroCustoRepository.find({
        where: [
          { ...where, codigo: Like(busca) },
          { ...where, nome: Like(busca) },
          { ...where, descricao: Like(busca) },
        ],
        order: {
          ativo: 'DESC',
          nome: 'ASC',
        },
      });
    }

    return this.centroCustoRepository.find({
      where,
      order: {
        ativo: 'DESC',
        nome: 'ASC',
      },
    });
  }

  async findAtivos(empresaId: string): Promise<CentroCusto[]> {
    return this.findAll(empresaId, { ativo: true });
  }

  async findOne(id: string, empresaId: string): Promise<CentroCusto> {
    const centroCusto = await this.centroCustoRepository.findOne({
      where: { id, empresaId },
    });

    if (!centroCusto) {
      throw new NotFoundException('Centro de custo nao encontrado');
    }

    return centroCusto;
  }

  async update(
    id: string,
    dto: UpdateCentroCustoDto,
    empresaId: string,
    userId = 'sistema',
  ): Promise<CentroCusto> {
    const centroCusto = await this.findOne(id, empresaId);

    const codigo = dto.codigo !== undefined ? this.normalizarCodigo(dto.codigo) : centroCusto.codigo;
    const nome = dto.nome !== undefined ? this.normalizarNome(dto.nome) : centroCusto.nome;

    await this.validarDuplicidade({
      empresaId,
      codigo,
      nome,
      ignoreId: id,
    });

    Object.assign(centroCusto, {
      ...(dto.codigo !== undefined ? { codigo } : {}),
      ...(dto.nome !== undefined ? { nome } : {}),
      ...(dto.descricao !== undefined ? { descricao: this.normalizarDescricao(dto.descricao) } : {}),
      ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
      atualizadoPor: userId || 'sistema',
    });

    return this.centroCustoRepository.save(centroCusto);
  }

  async desativar(id: string, empresaId: string, userId = 'sistema'): Promise<CentroCusto> {
    const centroCusto = await this.findOne(id, empresaId);
    centroCusto.ativo = false;
    centroCusto.atualizadoPor = userId || 'sistema';
    return this.centroCustoRepository.save(centroCusto);
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const centroCusto = await this.findOne(id, empresaId);

    const contasVinculadas = await this.contaPagarRepository
      .createQueryBuilder('conta')
      .where('conta.empresaId = :empresaId', { empresaId })
      .andWhere('conta.centroCustoId = :centroCustoId', { centroCustoId: id })
      .getCount();

    if (contasVinculadas > 0) {
      throw new BadRequestException(
        'Nao e possivel excluir centro de custo com contas a pagar vinculadas. Desative o centro.',
      );
    }

    await this.centroCustoRepository.remove(centroCusto);
  }

  private async validarDuplicidade(params: {
    empresaId: string;
    codigo: string;
    nome: string;
    ignoreId?: string;
  }): Promise<void> {
    const codigoExistente = await this.centroCustoRepository
      .createQueryBuilder('centro')
      .where('centro.empresaId = :empresaId', { empresaId: params.empresaId })
      .andWhere('LOWER(centro.codigo) = LOWER(:codigo)', { codigo: params.codigo })
      .getOne();

    if (codigoExistente && codigoExistente.id !== params.ignoreId) {
      throw new ConflictException('Ja existe um centro de custo com este codigo');
    }

    const nomeExistente = await this.centroCustoRepository
      .createQueryBuilder('centro')
      .where('centro.empresaId = :empresaId', { empresaId: params.empresaId })
      .andWhere('LOWER(centro.nome) = LOWER(:nome)', { nome: params.nome })
      .getOne();

    if (nomeExistente && nomeExistente.id !== params.ignoreId) {
      throw new ConflictException('Ja existe um centro de custo com este nome');
    }
  }

  private normalizarCodigo(value: string): string {
    const codigo = String(value || '').trim();
    if (!codigo) {
      throw new BadRequestException('Codigo do centro de custo e obrigatorio');
    }
    return codigo.toUpperCase();
  }

  private normalizarNome(value: string): string {
    const nome = String(value || '').trim();
    if (!nome) {
      throw new BadRequestException('Nome do centro de custo e obrigatorio');
    }
    return nome;
  }

  private normalizarDescricao(value?: string | null): string | undefined {
    const descricao = String(value || '').trim();
    return descricao || undefined;
  }
}
