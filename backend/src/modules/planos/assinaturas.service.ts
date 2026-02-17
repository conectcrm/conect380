import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssinaturaEmpresa } from './entities/assinatura-empresa.entity';
import { Plano } from './entities/plano.entity';
import { CriarAssinaturaDto } from './dto/criar-assinatura.dto';

@Injectable()
export class AssinaturasService {
  constructor(
    @InjectRepository(AssinaturaEmpresa)
    private assinaturaRepository: Repository<AssinaturaEmpresa>,

    @InjectRepository(Plano)
    private planoRepository: Repository<Plano>,
  ) {}

  async buscarPorEmpresa(empresaId: string): Promise<AssinaturaEmpresa | null> {
    return this.assinaturaRepository.findOne({
      where: {
        empresaId,
        status: 'ativa',
      },
      relations: ['plano', 'plano.modulosInclusos', 'plano.modulosInclusos.modulo'],
    });
  }

  async listarTodas(
    status?: 'ativa' | 'cancelada' | 'suspensa' | 'pendente',
  ): Promise<AssinaturaEmpresa[]> {
    const where = status ? { status } : {};

    return this.assinaturaRepository.find({
      where,
      relations: ['plano'],
      order: { criadoEm: 'DESC' },
    });
  }

  async criar(dados: CriarAssinaturaDto): Promise<AssinaturaEmpresa> {
    // Verificar se empresa já tem assinatura ativa
    const assinaturaExistente = await this.assinaturaRepository.findOne({
      where: {
        empresaId: dados.empresaId,
        status: 'ativa',
      },
    });

    if (assinaturaExistente) {
      throw new ConflictException(`Empresa ${dados.empresaId} já possui assinatura ativa`);
    }

    // Verificar se plano existe
    const plano = await this.planoRepository.findOne({
      where: { id: dados.planoId },
    });

    if (!plano) {
      throw new NotFoundException(`Plano com ID ${dados.planoId} não encontrado`);
    }

    const assinatura = this.assinaturaRepository.create({
      empresaId: dados.empresaId,
      plano,
      status: dados.status || 'ativa',
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
    const assinaturaAtiva = await this.assinaturaRepository.findOne({
      where: { empresaId, status: 'ativa' },
      relations: ['plano'],
    });

    if (assinaturaAtiva) {
      throw new ConflictException('Empresa já possui assinatura ativa');
    }

    const plano = await this.planoRepository.findOne({ where: { id: planoId } });

    if (!plano) {
      throw new NotFoundException(`Plano com ID ${planoId} não encontrado`);
    }

    const pendenteExistente = await this.assinaturaRepository.findOne({
      where: { empresaId, status: 'pendente' },
      relations: ['plano'],
      order: { criadoEm: 'DESC' },
    });

    const hoje = new Date();
    const proximoVencimento = new Date(hoje);
    proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);

    if (pendenteExistente) {
      pendenteExistente.plano = plano;
      pendenteExistente.valorMensal = plano.preco;
      pendenteExistente.dataInicio = hoje;
      pendenteExistente.proximoVencimento = proximoVencimento;
      pendenteExistente.renovacaoAutomatica = true;
      return this.assinaturaRepository.save(pendenteExistente);
    }

    const assinatura = this.assinaturaRepository.create({
      empresaId,
      plano,
      status: 'pendente',
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
    const assinatura = await this.buscarPorEmpresa(empresaId);

    if (!assinatura) {
      throw new NotFoundException(`Assinatura ativa para empresa ${empresaId} não encontrada`);
    }

    const novoPlano = await this.planoRepository.findOne({
      where: { id: novoPlanoId },
    });

    if (!novoPlano) {
      throw new NotFoundException(`Plano com ID ${novoPlanoId} não encontrado`);
    }

    assinatura.plano = novoPlano;
    assinatura.valorMensal = novoPlano.preco;

    return this.assinaturaRepository.save(assinatura);
  }

  async cancelar(empresaId: string, dataFim?: Date): Promise<AssinaturaEmpresa> {
    const assinatura = await this.buscarPorEmpresa(empresaId);

    if (!assinatura) {
      throw new NotFoundException(`Assinatura ativa para empresa ${empresaId} não encontrada`);
    }

    assinatura.status = 'cancelada';
    assinatura.dataFim = dataFim || new Date();
    assinatura.renovacaoAutomatica = false;

    return this.assinaturaRepository.save(assinatura);
  }

  async suspender(empresaId: string): Promise<AssinaturaEmpresa> {
    const assinatura = await this.buscarPorEmpresa(empresaId);

    if (!assinatura) {
      throw new NotFoundException(`Assinatura ativa para empresa ${empresaId} não encontrada`);
    }

    assinatura.status = 'suspensa';

    return this.assinaturaRepository.save(assinatura);
  }

  async reativar(empresaId: string): Promise<AssinaturaEmpresa> {
    const assinatura = await this.assinaturaRepository.findOne({
      where: {
        empresaId,
        status: 'suspensa',
      },
      relations: ['plano'],
    });

    if (!assinatura) {
      throw new NotFoundException(`Assinatura suspensa para empresa ${empresaId} não encontrada`);
    }

    assinatura.status = 'ativa';

    return this.assinaturaRepository.save(assinatura);
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
    const assinatura = await this.buscarPorEmpresa(empresaId);

    if (!assinatura) {
      throw new NotFoundException(`Assinatura ativa para empresa ${empresaId} não encontrada`);
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
    const assinatura = await this.buscarPorEmpresa(empresaId);

    if (!assinatura) {
      throw new NotFoundException(`Assinatura ativa para empresa ${empresaId} não encontrada`);
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
    const assinatura = await this.buscarPorEmpresa(empresaId);

    if (!assinatura) {
      return false;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const ultimaContabilizacao = assinatura.ultimaContabilizacaoApi.toISOString().split('T')[0];

    // Se mudou de dia, resetar contador
    if (hoje !== ultimaContabilizacao) {
      assinatura.apiCallsHoje = 1;
      assinatura.ultimaContabilizacaoApi = new Date();
    } else {
      assinatura.apiCallsHoje++;
    }

    await this.assinaturaRepository.save(assinatura);

    // Retornar se ainda está dentro do limite
    return assinatura.apiCallsHoje <= assinatura.plano.limiteApiCalls;
  }
}
