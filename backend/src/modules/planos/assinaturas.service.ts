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
import { User } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';
import { TenantBillingPolicy, TenantBillingPolicyService } from './tenant-billing-policy.service';
import { EmpresaModuloService } from '../empresas/services/empresa-modulo.service';

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

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    private readonly tenantBillingPolicyService: TenantBillingPolicyService,
    private readonly empresaModuloService: EmpresaModuloService,
  ) {}

  private isUnlimitedLimit(limit: number): boolean {
    return Number(limit) < 0;
  }

  async obterPoliticaTenant(empresaId: string): Promise<TenantBillingPolicy> {
    return this.tenantBillingPolicyService.resolveForEmpresa(empresaId);
  }

  private applyTenantBillingPolicy(
    assinatura: AssinaturaEmpresa | null,
    policy: TenantBillingPolicy,
  ): AssinaturaEmpresa | null {
    if (!assinatura) {
      return assinatura;
    }

    const assinaturaWithPolicy = assinatura as AssinaturaEmpresa & {
      billingPolicy?: TenantBillingPolicy;
    };
    assinaturaWithPolicy.billingPolicy = policy;
    return assinaturaWithPolicy;
  }

  private ensureCheckoutAllowed(policy: TenantBillingPolicy): void {
    if (policy.allowCheckout) {
      return;
    }

    throw new BadRequestException(
      'Checkout indisponivel para tenant proprietario com politica interna de cobranca.',
    );
  }

  private ensurePlanMutationAllowed(policy: TenantBillingPolicy): void {
    if (policy.allowPlanMutation) {
      return;
    }

    throw new BadRequestException(
      'Alteracao de plano indisponivel para tenant proprietario com politica interna.',
    );
  }

  private ensureLifecycleTransitionAllowed(policy: TenantBillingPolicy): void {
    if (policy.enforceLifecycleTransitions) {
      return;
    }

    throw new BadRequestException(
      'Transicao de status de assinatura bloqueada para tenant proprietario.',
    );
  }

  private async sincronizarContadoresOperacionais(
    empresaId: string,
    assinatura: AssinaturaEmpresa,
  ): Promise<void> {
    const [usuariosAtivos, clientesCadastrados] = await Promise.all([
      this.userRepository.count({
        where: {
          empresa_id: empresaId,
          ativo: true,
        },
      }),
      this.clienteRepository.count({
        where: {
          empresaId,
          ativo: true,
        },
      }),
    ]);

    const usuariosAjustados = Math.max(0, usuariosAtivos);
    const clientesAjustados = Math.max(0, clientesCadastrados);

    if (
      assinatura.usuariosAtivos === usuariosAjustados &&
      assinatura.clientesCadastrados === clientesAjustados
    ) {
      return;
    }

    assinatura.usuariosAtivos = usuariosAjustados;
    assinatura.clientesCadastrados = clientesAjustados;
    await this.assinaturaRepository.save(assinatura);
  }

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

  private extractPlanoModuleCodes(plano: Plano): string[] {
    return (plano.modulosInclusos || [])
      .map((item) => String(item?.modulo?.codigo || '').trim())
      .filter(Boolean);
  }

  private async buscarPlanoAtivoPorId(
    planoId: string,
    options?: { includeModules?: boolean },
  ): Promise<Plano> {
    const relations = options?.includeModules ? ['modulosInclusos', 'modulosInclusos.modulo'] : [];
    const plano = await this.planoRepository.findOne({
      where: { id: planoId, ativo: true },
      relations,
    });

    if (!plano) {
      throw new NotFoundException(`Plano com ID ${planoId} nao encontrado ou desativado`);
    }

    return plano;
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
    const assinatura = await this.buscarAssinaturaMaisRecente(empresaId, { includePlano: true });
    if (!assinatura) {
      return null;
    }

    const policy = await this.obterPoliticaTenant(empresaId);
    return this.applyTenantBillingPolicy(assinatura, policy);
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
    const policy = await this.obterPoliticaTenant(dados.empresaId);
    const assinaturaExistente = await this.buscarAssinaturaMaisRecente(dados.empresaId);
    if (assinaturaExistente) {
      const currentStatus = toCanonicalAssinaturaStatus(assinaturaExistente.status);
      if (currentStatus !== 'canceled') {
        throw new ConflictException(
          `Empresa ${dados.empresaId} ja possui assinatura em estado ${currentStatus}`,
        );
      }
    }

    const plano = await this.buscarPlanoAtivoPorId(dados.planoId);

    const initialStatus = policy.isPlatformOwner
      ? 'active'
      : toCanonicalAssinaturaStatus(dados.status || 'active');
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

    const savedAssinatura = await this.assinaturaRepository.save(assinatura);
    return this.applyTenantBillingPolicy(savedAssinatura, policy) as AssinaturaEmpresa;
  }

  async criarAssinaturaPendenteParaCheckout(
    empresaId: string,
    planoId: string,
  ): Promise<AssinaturaEmpresa> {
    const policy = await this.obterPoliticaTenant(empresaId);
    this.ensureCheckoutAllowed(policy);

    const plano = await this.buscarPlanoAtivoPorId(planoId);

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
    const policy = await this.obterPoliticaTenant(empresaId);
    this.ensurePlanMutationAllowed(policy);

    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });
    const assinaturaStatus = toCanonicalAssinaturaStatus(assinatura.status);

    if (assinaturaStatus === 'canceled') {
      throw new BadRequestException('Nao e possivel alterar plano de assinatura cancelada');
    }

    const novoPlano = await this.buscarPlanoAtivoPorId(novoPlanoId, { includeModules: true });

    assinatura.plano = novoPlano;
    assinatura.valorMensal = novoPlano.preco;

    const modulosNovoPlano = this.extractPlanoModuleCodes(novoPlano);
    if (modulosNovoPlano.length === 0) {
      throw new BadRequestException(
        `Plano ${novoPlano.codigo || novoPlano.id} sem modulos vinculados no catalogo`,
      );
    }

    const assinaturaAtualizada = await this.assinaturaRepository.save(assinatura);
    await this.empresaModuloService.sincronizarModulosPlano(
      empresaId,
      modulosNovoPlano,
      novoPlano.codigo,
    );
    return this.applyTenantBillingPolicy(assinaturaAtualizada, policy) as AssinaturaEmpresa;
  }

  async cancelar(empresaId: string, dataFim?: Date): Promise<AssinaturaEmpresa> {
    const policy = await this.obterPoliticaTenant(empresaId);
    this.ensureLifecycleTransitionAllowed(policy);

    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });
    const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);

    if (currentStatus === 'canceled') {
      assinatura.dataFim = dataFim || assinatura.dataFim || new Date();
      assinatura.renovacaoAutomatica = false;
      const assinaturaAtualizada = await this.assinaturaRepository.save(assinatura);
      return this.applyTenantBillingPolicy(assinaturaAtualizada, policy) as AssinaturaEmpresa;
    }

    const assinaturaAtualizada = await this.transicionarAssinatura(assinatura, 'canceled', {
      dataFim: dataFim || new Date(),
      renovacaoAutomatica: false,
      observacao: 'Cancelamento solicitado',
    });
    return this.applyTenantBillingPolicy(assinaturaAtualizada, policy) as AssinaturaEmpresa;
  }

  async suspender(empresaId: string): Promise<AssinaturaEmpresa> {
    const policy = await this.obterPoliticaTenant(empresaId);
    this.ensureLifecycleTransitionAllowed(policy);

    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });

    const assinaturaAtualizada = await this.transicionarAssinatura(assinatura, 'suspended', {
      observacao: 'Suspensao aplicada',
    });
    return this.applyTenantBillingPolicy(assinaturaAtualizada, policy) as AssinaturaEmpresa;
  }

  async reativar(empresaId: string): Promise<AssinaturaEmpresa> {
    const policy = await this.obterPoliticaTenant(empresaId);
    this.ensureLifecycleTransitionAllowed(policy);

    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });

    const assinaturaAtualizada = await this.transicionarAssinatura(assinatura, 'active', {
      dataFim: null,
      renovacaoAutomatica: true,
      observacao: 'Reativacao aplicada',
    });
    return this.applyTenantBillingPolicy(assinaturaAtualizada, policy) as AssinaturaEmpresa;
  }

  async marcarPastDue(empresaId: string): Promise<AssinaturaEmpresa> {
    const policy = await this.obterPoliticaTenant(empresaId);
    this.ensureLifecycleTransitionAllowed(policy);

    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });

    const assinaturaAtualizada = await this.transicionarAssinatura(assinatura, 'past_due', {
      observacao: 'Marcada como inadimplente',
    });
    return this.applyTenantBillingPolicy(assinaturaAtualizada, policy) as AssinaturaEmpresa;
  }

  async registrarPagamentoConfirmado(empresaId: string): Promise<AssinaturaEmpresa> {
    const policy = await this.obterPoliticaTenant(empresaId);
    if (!policy.enforceLifecycleTransitions) {
      const assinaturaAtual = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });
      return this.applyTenantBillingPolicy(assinaturaAtual, policy) as AssinaturaEmpresa;
    }

    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });

    const assinaturaAtualizada = await this.transicionarAssinatura(assinatura, 'active', {
      dataFim: null,
      renovacaoAutomatica: true,
      observacao: 'Pagamento confirmado',
    });
    return this.applyTenantBillingPolicy(assinaturaAtualizada, policy) as AssinaturaEmpresa;
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
    const policy = await this.obterPoliticaTenant(empresaId);
    const assinatura = await this.buscarAssinaturaMaisRecente(empresaId, { includePlano: true });
    if (!assinatura) {
      if (!policy.billingExempt) {
        throw new NotFoundException(`Assinatura para empresa ${empresaId} nao encontrada`);
      }

      const [usuariosAtivos, clientesCadastrados] = await Promise.all([
        this.userRepository.count({
          where: {
            empresa_id: empresaId,
            ativo: true,
          },
        }),
        this.clienteRepository.count({
          where: {
            empresaId,
            ativo: true,
          },
        }),
      ]);

      return {
        usuariosAtivos,
        limiteUsuarios: -1,
        clientesCadastrados,
        limiteClientes: -1,
        storageUtilizado: 0,
        limiteStorage: -1,
        podeAdicionarUsuario: true,
        podeAdicionarCliente: true,
        storageDisponivel: -1,
      };
    }

    const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);
    if (!policy.billingExempt && currentStatus === 'canceled') {
      throw new NotFoundException(`Assinatura ativa para empresa ${empresaId} nao encontrada`);
    }

    await this.sincronizarContadoresOperacionais(empresaId, assinatura);

    if (policy.monitorOnlyLimits) {
      return {
        usuariosAtivos: assinatura.usuariosAtivos,
        limiteUsuarios: -1,
        clientesCadastrados: assinatura.clientesCadastrados,
        limiteClientes: -1,
        storageUtilizado: assinatura.storageUtilizado,
        limiteStorage: -1,
        podeAdicionarUsuario: true,
        podeAdicionarCliente: true,
        storageDisponivel: -1,
      };
    }

    const limiteUsuarios = assinatura.plano.limiteUsuarios;
    const limiteClientes = assinatura.plano.limiteClientes;
    const limiteStorage = assinatura.plano.limiteStorage;

    const storageDisponivel = this.isUnlimitedLimit(limiteStorage)
      ? -1
      : Math.max(0, limiteStorage - assinatura.storageUtilizado);

    return {
      usuariosAtivos: assinatura.usuariosAtivos,
      limiteUsuarios,
      clientesCadastrados: assinatura.clientesCadastrados,
      limiteClientes,
      storageUtilizado: assinatura.storageUtilizado,
      limiteStorage,
      podeAdicionarUsuario:
        this.isUnlimitedLimit(limiteUsuarios) || assinatura.usuariosAtivos < limiteUsuarios,
      podeAdicionarCliente:
        this.isUnlimitedLimit(limiteClientes) || assinatura.clientesCadastrados < limiteClientes,
      storageDisponivel,
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
    const policy = await this.obterPoliticaTenant(empresaId);
    const assinatura = await this.buscarAssinaturaObrigatoria(empresaId, { includePlano: true });
    const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);

    if (!policy.billingExempt && !hasSubscriptionAccess(currentStatus)) {
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

    const assinaturaAtualizada = await this.assinaturaRepository.save(assinatura);
    return this.applyTenantBillingPolicy(assinaturaAtualizada, policy) as AssinaturaEmpresa;
  }

  async registrarChamadaApi(empresaId: string): Promise<boolean> {
    const policy = await this.obterPoliticaTenant(empresaId);
    const assinatura = await this.buscarAssinaturaMaisRecente(empresaId, { includePlano: true });

    if (!assinatura) {
      return policy.billingExempt;
    }

    const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);
    if (!policy.billingExempt && !hasSubscriptionAccess(currentStatus)) {
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

    if (policy.monitorOnlyLimits) {
      return true;
    }

    if (this.isUnlimitedLimit(assinatura.plano.limiteApiCalls)) {
      return true;
    }

    return assinatura.apiCallsHoje <= assinatura.plano.limiteApiCalls;
  }
}
