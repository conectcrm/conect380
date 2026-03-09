import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssinaturaEmpresa,
  AssinaturaStatus,
  CanonicalAssinaturaStatus,
  getAssinaturaStatusAliases,
  toCanonicalAssinaturaStatus,
} from './entities/assinatura-empresa.entity';
import { Plano } from './entities/plano.entity';
import { CriarAssinaturaDto } from './dto/criar-assinatura.dto';
import { canTransitionSubscriptionStatus, hasSubscriptionAccess } from './subscription-state-machine';

type TransitionOptions = {
  dataFim?: Date | null;
  proximoVencimento?: Date;
  renovacaoAutomatica?: boolean;
  observacao?: string;
};

@Injectable()
export class AssinaturasService {
  constructor(
    @InjectRepository(AssinaturaEmpresa)
    private assinaturaRepository: Repository<AssinaturaEmpresa>,

    @InjectRepository(Plano)
    private planoRepository: Repository<Plano>,
  ) {}

  private statusAliasesFromCanonical(
    statuses: readonly CanonicalAssinaturaStatus[],
  ): AssinaturaStatus[] {
    const aliases = statuses.flatMap((status) => getAssinaturaStatusAliases(status));
    return Array.from(new Set(aliases));
  }

  private appendTransitionLog(
    assinatura: AssinaturaEmpresa,
    from: CanonicalAssinaturaStatus,
    to: CanonicalAssinaturaStatus,
    observacao?: string,
  ) {
    const nowIso = new Date().toISOString();
    const noteBase = `State transition ${from} -> ${to} at ${nowIso}`;
    const note = observacao ? `${noteBase} (${observacao})` : noteBase;

    assinatura.observacoes = assinatura.observacoes
      ? `${assinatura.observacoes}\n${note}`
      : note;
  }

  private async buscarAssinaturaMaisRecente(
    empresaId: string,
    options?: {
      includePlano?: boolean;
      canonicalStatuses?: readonly CanonicalAssinaturaStatus[];
    },
  ): Promise<AssinaturaEmpresa | null> {
    const relations = options?.includePlano
      ? ['plano', 'plano.modulosInclusos', 'plano.modulosInclusos.modulo']
      : [];

    if (options?.canonicalStatuses?.length) {
      const statuses = this.statusAliasesFromCanonical(options.canonicalStatuses);
      return this.assinaturaRepository.findOne({
        where: statuses.map((status) => ({ empresaId, status })),
        relations,
        order: { criadoEm: 'DESC' },
      });
    }

    return this.assinaturaRepository.findOne({
      where: { empresaId },
      relations,
      order: { criadoEm: 'DESC' },
    });
  }

  private async buscarAssinaturaObrigatoria(
    empresaId: string,
    options?: {
      includePlano?: boolean;
      canonicalStatuses?: readonly CanonicalAssinaturaStatus[];
    },
  ): Promise<AssinaturaEmpresa> {
    const assinatura = await this.buscarAssinaturaMaisRecente(empresaId, options);

    if (!assinatura) {
      throw new NotFoundException(`Assinatura para empresa ${empresaId} nao encontrada`);
    }

    return assinatura;
  }

  private validarTransicao(
    assinatura: AssinaturaEmpresa,
    toStatus: CanonicalAssinaturaStatus,
  ): CanonicalAssinaturaStatus {
    const fromStatus = toCanonicalAssinaturaStatus(assinatura.status);
    const allowed = canTransitionSubscriptionStatus(fromStatus, toStatus);

    if (!allowed) {
      throw new BadRequestException(
        `Transicao de assinatura invalida: ${fromStatus} -> ${toStatus}`,
      );
    }

    return fromStatus;
  }

  private async transicionarAssinatura(
    assinatura: AssinaturaEmpresa,
    toStatus: CanonicalAssinaturaStatus,
    options?: TransitionOptions,
  ): Promise<AssinaturaEmpresa> {
    const fromStatus = this.validarTransicao(assinatura, toStatus);

    if (fromStatus !== toStatus) {
      assinatura.status = toStatus;
      this.appendTransitionLog(assinatura, fromStatus, toStatus, options?.observacao);
    } else if (options?.observacao) {
      assinatura.observacoes = assinatura.observacoes
        ? `${assinatura.observacoes}\n${options.observacao}`
        : options.observacao;
    }

    if (options?.dataFim !== undefined) {
      assinatura.dataFim = options.dataFim;
    }

    if (options?.proximoVencimento) {
      assinatura.proximoVencimento = options.proximoVencimento;
    }

    if (options?.renovacaoAutomatica !== undefined) {
      assinatura.renovacaoAutomatica = options.renovacaoAutomatica;
    }

    return this.assinaturaRepository.save(assinatura);
  }

  async buscarPorEmpresa(empresaId: string): Promise<AssinaturaEmpresa | null> {
    return this.buscarAssinaturaMaisRecente(empresaId, { includePlano: true });
  }

  async listarTodas(status?: AssinaturaStatus): Promise<AssinaturaEmpresa[]> {
    if (status) {
      const canonical = toCanonicalAssinaturaStatus(status);
      const statuses = this.statusAliasesFromCanonical([canonical]);

      return this.assinaturaRepository.find({
        where: statuses.map((itemStatus) => ({ status: itemStatus })),
        relations: ['plano'],
        order: { criadoEm: 'DESC' },
      });
    }

    return this.assinaturaRepository.find({
      relations: ['plano'],
      order: { criadoEm: 'DESC' },
    });
  }

  async criar(dados: CriarAssinaturaDto): Promise<AssinaturaEmpresa> {
    const assinaturaExistente = await this.buscarAssinaturaMaisRecente(dados.empresaId);
    if (assinaturaExistente) {
      const currentStatus = toCanonicalAssinaturaStatus(assinaturaExistente.status);
      if (currentStatus !== 'canceled') {
        throw new ConflictException(
          `Empresa ${dados.empresaId} ja possui assinatura em estado ${currentStatus}`,
        );
      }
    }

    const plano = await this.planoRepository.findOne({
      where: { id: dados.planoId },
    });

    if (!plano) {
      throw new NotFoundException(`Plano com ID ${dados.planoId} nao encontrado`);
    }

    const initialStatus = toCanonicalAssinaturaStatus(dados.status || 'active');
    const assinatura = this.assinaturaRepository.create({
      empresaId: dados.empresaId,
      plano,
      status: initialStatus,
      dataInicio: new Date(dados.dataInicio),
      dataFim: dados.dataFim ? new Date(dados.dataFim) : null,
      proximoVencimento: new Date(dados.proximoVencimento),
      valorMensal: dados.valorMensal,
      renovacaoAutomatica: dados.renovacaoAutomatica !== false,
      observacoes: dados.observacoes,
    });

    return this.assinaturaRepository.save(assinatura);
  }

  async criarAssinaturaPendenteParaCheckout(
    empresaId: string,
    planoId: string,
  ): Promise<AssinaturaEmpresa> {
    const plano = await this.planoRepository.findOne({ where: { id: planoId } });
    if (!plano) {
      throw new NotFoundException(`Plano com ID ${planoId} nao encontrado`);
    }

    const assinaturaAtual = await this.buscarAssinaturaMaisRecente(empresaId, { includePlano: true });

    const hoje = new Date();
    const proximoVencimento = new Date(hoje);
    proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);

    if (assinaturaAtual) {
      const statusAtual = toCanonicalAssinaturaStatus(assinaturaAtual.status);

      if (statusAtual === 'active' || statusAtual === 'past_due' || statusAtual === 'suspended') {
        throw new ConflictException(`Empresa ja possui assinatura em estado ${statusAtual}`);
      }

      if (statusAtual === 'trial') {
        assinaturaAtual.plano = plano;
        assinaturaAtual.status = 'trial';
        assinaturaAtual.valorMensal = plano.preco;
        assinaturaAtual.dataInicio = hoje;
        assinaturaAtual.dataFim = null;
        assinaturaAtual.proximoVencimento = proximoVencimento;
        assinaturaAtual.renovacaoAutomatica = true;
        assinaturaAtual.observacoes = assinaturaAtual.observacoes
          ? `${assinaturaAtual.observacoes}\nCheckout reiniciado em ${hoje.toISOString()}`
          : `Checkout reiniciado em ${hoje.toISOString()}`;
        return this.assinaturaRepository.save(assinaturaAtual);
      }
    }

    const assinatura = this.assinaturaRepository.create({
      empresaId,
      plano,
      status: 'trial',
      dataInicio: hoje,
      dataFim: null,
      proximoVencimento,
      valorMensal: plano.preco,
      renovacaoAutomatica: true,
      observacoes: 'Checkout iniciado via Mercado Pago',
    });

    return this.assinaturaRepository.save(assinatura);
  }

  async alterarPlano(empresaId: string, novoPlanoId: string): Promise<AssinaturaEmpresa> {
    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });
    const assinaturaStatus = toCanonicalAssinaturaStatus(assinatura.status);

    if (assinaturaStatus === 'canceled') {
      throw new BadRequestException('Nao e possivel alterar plano de assinatura cancelada');
    }

    const novoPlano = await this.planoRepository.findOne({
      where: { id: novoPlanoId },
    });

    if (!novoPlano) {
      throw new NotFoundException(`Plano com ID ${novoPlanoId} nao encontrado`);
    }

    assinatura.plano = novoPlano;
    assinatura.valorMensal = novoPlano.preco;

    return this.assinaturaRepository.save(assinatura);
  }

  async cancelar(empresaId: string, dataFim?: Date): Promise<AssinaturaEmpresa> {
    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });
    const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);

    if (currentStatus === 'canceled') {
      assinatura.dataFim = dataFim || assinatura.dataFim || new Date();
      assinatura.renovacaoAutomatica = false;
      return this.assinaturaRepository.save(assinatura);
    }

    return this.transicionarAssinatura(assinatura, 'canceled', {
      dataFim: dataFim || new Date(),
      renovacaoAutomatica: false,
      observacao: 'Cancelamento solicitado',
    });
  }

  async suspender(empresaId: string): Promise<AssinaturaEmpresa> {
    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });

    return this.transicionarAssinatura(assinatura, 'suspended', {
      observacao: 'Suspensao aplicada',
    });
  }

  async reativar(empresaId: string): Promise<AssinaturaEmpresa> {
    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });

    return this.transicionarAssinatura(assinatura, 'active', {
      dataFim: null,
      renovacaoAutomatica: true,
      observacao: 'Reativacao aplicada',
    });
  }

  async marcarPastDue(empresaId: string): Promise<AssinaturaEmpresa> {
    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });

    return this.transicionarAssinatura(assinatura, 'past_due', {
      observacao: 'Marcada como inadimplente',
    });
  }

  async registrarPagamentoConfirmado(empresaId: string): Promise<AssinaturaEmpresa> {
    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });

    return this.transicionarAssinatura(assinatura, 'active', {
      dataFim: null,
      renovacaoAutomatica: true,
      observacao: 'Pagamento confirmado',
    });
  }

  async verificarLimites(empresaId: string): Promise<{
    usuariosAtivos: number;
    limiteUsuarios: number;
    clientesCadastrados: number;
    limiteClientes: number;
    storageUtilizado: number;
    limiteStorage: number;
    podeAdicionarUsuario: boolean;
    podeAdicionarCliente: boolean;
    storageDisponivel: number;
  }> {
    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });
    const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);
    if (currentStatus === 'canceled') {
      throw new NotFoundException(`Assinatura ativa para empresa ${empresaId} nao encontrada`);
    }

    const storageDisponivel = assinatura.plano.limiteStorage - assinatura.storageUtilizado;

    return {
      usuariosAtivos: assinatura.usuariosAtivos,
      limiteUsuarios: assinatura.plano.limiteUsuarios,
      clientesCadastrados: assinatura.clientesCadastrados,
      limiteClientes: assinatura.plano.limiteClientes,
      storageUtilizado: assinatura.storageUtilizado,
      limiteStorage: assinatura.plano.limiteStorage,
      podeAdicionarUsuario: assinatura.usuariosAtivos < assinatura.plano.limiteUsuarios,
      podeAdicionarCliente: assinatura.clientesCadastrados < assinatura.plano.limiteClientes,
      storageDisponivel: Math.max(0, storageDisponivel),
    };
  }

  async atualizarContadores(
    empresaId: string,
    dados: {
      usuariosAtivos?: number;
      clientesCadastrados?: number;
      storageUtilizado?: number;
    },
  ): Promise<AssinaturaEmpresa> {
    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });
    const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);

    if (!hasSubscriptionAccess(currentStatus)) {
      throw new BadRequestException(
        `Nao e possivel atualizar contadores para assinatura em estado ${currentStatus}`,
      );
    }

    if (dados.usuariosAtivos !== undefined) {
      assinatura.usuariosAtivos = dados.usuariosAtivos;
    }

    if (dados.clientesCadastrados !== undefined) {
      assinatura.clientesCadastrados = dados.clientesCadastrados;
    }

    if (dados.storageUtilizado !== undefined) {
      assinatura.storageUtilizado = dados.storageUtilizado;
    }

    return this.assinaturaRepository.save(assinatura);
  }

  async registrarChamadaApi(empresaId: string): Promise<boolean> {
    const assinatura = await this.buscarAssinaturaMaisRecente(empresaId, { includePlano: true });

    if (!assinatura) {
      return false;
    }

    const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);
    if (!hasSubscriptionAccess(currentStatus)) {
      return false;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const ultimaContabilizacao = assinatura.ultimaContabilizacaoApi.toISOString().split('T')[0];

    if (hoje !== ultimaContabilizacao) {
      assinatura.apiCallsHoje = 1;
      assinatura.ultimaContabilizacaoApi = new Date();
    } else {
      assinatura.apiCallsHoje++;
    }

    await this.assinaturaRepository.save(assinatura);

    return assinatura.apiCallsHoje <= assinatura.plano.limiteApiCalls;
  }
}
