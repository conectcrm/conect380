import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
  ) {}

  private mapRawUser(raw: any): User {
    const permissoes =
      raw.permissoes && typeof raw.permissoes === 'string'
        ? raw.permissoes.split(',').filter(Boolean)
        : raw.permissoes ?? null;

    const empresa =
      raw.empresa_rel_id && raw.empresa_nome && raw.empresa_slug
        ? ({
            id: raw.empresa_rel_id,
            nome: raw.empresa_nome,
            slug: raw.empresa_slug,
            cnpj: raw.empresa_cnpj ?? null,
            plano: raw.empresa_plano ?? null,
            ativo: raw.empresa_ativo ?? null,
            subdominio: raw.empresa_subdominio ?? null,
          } as Empresa)
        : undefined;

    return this.userRepository.create({
      id: raw.id,
      nome: raw.nome,
      email: raw.email,
      senha: raw.senha,
      telefone: raw.telefone,
      role: raw.role,
      permissoes,
      empresa_id: raw.empresa_id,
      avatar_url: raw.avatar_url,
      idioma_preferido: raw.idioma_preferido,
      configuracoes: raw.configuracoes,
      ativo: raw.ativo,
      deve_trocar_senha: raw.deve_trocar_senha,
      status_atendente: raw.status_atendente,
      capacidade_maxima: raw.capacidade_maxima,
      tickets_ativos: raw.tickets_ativos,
      ultimo_login: raw.ultimo_login,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      empresa,
    } as Partial<User>);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const rows: any[] = await this.userRepository.query(
      `
        SELECT
          u.id,
          u.nome,
          u.email,
          u.senha,
          u.telefone,
          u.role,
          u.permissoes,
          u.empresa_id,
          u.avatar_url,
          u.idioma_preferido,
          u.configuracoes,
          u.ativo,
          u.deve_trocar_senha,
          u.status_atendente,
          u.capacidade_maxima,
          u.tickets_ativos,
          u.ultimo_login,
          u.created_at,
          u.updated_at,
          e.id AS empresa_rel_id,
          e.nome AS empresa_nome,
          e.slug AS empresa_slug,
          e.cnpj AS empresa_cnpj,
          e.plano AS empresa_plano,
          e.ativo AS empresa_ativo,
          e.subdominio AS empresa_subdominio
        FROM users u
        LEFT JOIN empresas e ON e.id = u.empresa_id
        WHERE u.email = $1
        LIMIT 1
      `,
      [email],
    );

    const raw = rows?.[0];
    if (!raw) {
      return undefined;
    }

    return this.mapRawUser(raw);
  }

  async findById(id: string): Promise<User | undefined> {
    const rows: any[] = await this.userRepository.query(
      `
        SELECT
          u.id,
          u.nome,
          u.email,
          u.senha,
          u.telefone,
          u.role,
          u.permissoes,
          u.empresa_id,
          u.avatar_url,
          u.idioma_preferido,
          u.configuracoes,
          u.ativo,
          u.deve_trocar_senha,
          u.status_atendente,
          u.capacidade_maxima,
          u.tickets_ativos,
          u.ultimo_login,
          u.created_at,
          u.updated_at,
          e.id AS empresa_rel_id,
          e.nome AS empresa_nome,
          e.slug AS empresa_slug,
          e.cnpj AS empresa_cnpj,
          e.plano AS empresa_plano,
          e.ativo AS empresa_ativo,
          e.subdominio AS empresa_subdominio
        FROM users u
        LEFT JOIN empresas e ON e.id = u.empresa_id
        WHERE u.id = $1
        LIMIT 1
      `,
      [id],
    );

    const raw = rows?.[0];
    if (!raw) {
      return undefined;
    }

    return this.mapRawUser(raw);
  }

  /**
   * Busca usuário por ID (inclui senha - para validação de senha antiga)
   * Diferente de findById que NÃO retorna senha
   */
  async findOne(id: string, empresaId?: string): Promise<User | undefined> {
    const where: FindOptionsWhere<User> = { id };
    if (empresaId) {
      where.empresa_id = empresaId;
    }

    return this.userRepository.findOne({
      where,
      select: [
        'id',
        'nome',
        'email',
        'senha',
        'role',
        'empresa_id',
        'ativo',
        'deve_trocar_senha',
        'ultimo_login',
        'created_at',
        'updated_at',
      ],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async createWithHash(userData: Partial<User>): Promise<User> {
    // Buscar primeira empresa ativa se não fornecida
    if (!userData.empresa_id) {
      const empresa = await this.empresaRepository.findOne({
        where: { ativo: true },
      });

      if (!empresa) {
        throw new Error('Nenhuma empresa ativa encontrada');
      }

      userData.empresa_id = empresa.id;
    }

    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, userData);
    return this.findById(id);
  }

  async findByEmpresa(empresaId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { empresa_id: empresaId },
      relations: ['empresa'],
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { ultimo_login: new Date() });
  }

  /**
   * Atualiza senha do usuário e marca como ativo (primeiro acesso concluído)
   * @param id ID do usuário
   * @param hashedPassword Senha já com hash bcrypt
   * @param ativar Se true, marca usuário como ativo (default: true)
   */
  async updatePassword(id: string, hashedPassword: string, ativar: boolean = true): Promise<void> {
    await this.userRepository.update(id, {
      senha: hashedPassword,
      ativo: ativar,
      deve_trocar_senha: false,
    });
  }

  async listarComFiltros(filtros: any): Promise<{ usuarios: User[]; total: number }> {
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .where('user.empresa_id = :empresa_id', { empresa_id: filtros.empresa_id });
      if (filtros.busca) {
        query.andWhere('(user.nome LIKE :busca OR user.email LIKE :busca)', {
          busca: `%${filtros.busca}%`,
        });
      }
      if (filtros.role) {
        query.andWhere('user.role = :role', { role: filtros.role });
      }
      if (typeof filtros.ativo === 'boolean') {
        query.andWhere('user.ativo = :ativo', { ativo: filtros.ativo });
      }
      const total = await query.getCount();

      // Garantir que a direção seja em maiúsculas para o TypeORM
      const direcaoUpper = (filtros.direcao || 'ASC').toUpperCase() as 'ASC' | 'DESC';
      query.orderBy(`user.${filtros.ordenacao || 'nome'}`, direcaoUpper);
      query.skip((filtros.pagina - 1) * filtros.limite).take(filtros.limite);
      const usuarios = await query.getMany();
      return { usuarios: usuarios || [], total: total || 0 };
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
      return { usuarios: [], total: 0 };
    }
  }

  async obterEstatisticas(empresa_id: string): Promise<any> {
    const total = await this.userRepository.count({ where: { empresa_id } });
    const ativos = await this.userRepository.count({ where: { empresa_id, ativo: true } });
    const inativos = await this.userRepository.count({ where: { empresa_id, ativo: false } });

    // Calcular distribuição por perfil
    const adminCount = await this.userRepository.count({
      where: { empresa_id, role: UserRole.ADMIN },
    });
    const managerCount = await this.userRepository.count({
      where: { empresa_id, role: UserRole.MANAGER },
    });
    const vendedorCount = await this.userRepository.count({
      where: { empresa_id, role: UserRole.VENDEDOR },
    });
    const userCount = await this.userRepository.count({
      where: { empresa_id, role: UserRole.USER },
    });

    return {
      total,
      ativos,
      inativos,
      por_perfil: {
        admin: adminCount,
        manager: managerCount,
        vendedor: vendedorCount,
        user: userCount,
      },
    };
  }

  async listarAtendentes(empresa_id: string): Promise<User[]> {
    return await this.userRepository
      .find({
        where: {
          empresa_id,
          ativo: true,
        },
        order: { nome: 'ASC' },
      })
      .then((users) =>
        users.filter(
          (user) =>
            user.permissoes &&
            (user.permissoes.includes('ATENDIMENTO') ||
              user.permissoes.some((p) => p === 'ATENDIMENTO')),
        ),
      );
  }

  async criar(userData: Partial<User>): Promise<User> {
    // Validação de campos obrigatórios
    if (!userData.nome || !userData.email || !userData.senha || !userData.empresa_id) {
      throw new Error('Campos obrigatórios ausentes: nome, email, senha, empresa_id');
    }

    // Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(userData.senha, 10);
    const userDataWithHashedPassword = {
      ...userData,
      senha: hashedPassword,
    };

    const user = this.userRepository.create(userDataWithHashedPassword);

    try {
      const savedUser = await this.userRepository.save(user);
      return savedUser;
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      if (err.code === '23505' && String(err.detail).includes('email')) {
        throw new Error('Já existe um usuário cadastrado com este e-mail.');
      }
      throw err;
    }
  }

  async atualizar(id: string, userData: Partial<User>, empresa_id: string): Promise<User> {
    await this.userRepository.update({ id, empresa_id }, userData);
    return this.userRepository.findOne({ where: { id, empresa_id } });
  }

  async excluir(id: string, empresa_id: string): Promise<void> {
    try {
      const resultado = await this.userRepository.delete({ id, empresa_id });

      if (!resultado.affected) {
        throw new NotFoundException('Usuário não encontrado');
      }
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError?.code === '23503' ||
          error.driverError?.code === 'ER_ROW_IS_REFERENCED_2')
      ) {
        throw new ConflictException(
          'Não é possível excluir este usuário porque existem registros relacionados em outros módulos. Reatribua ou conclua os vínculos antes de excluir.',
        );
      }

      throw error;
    }
  }

  async resetarSenha(id: string, empresa_id: string): Promise<string> {
    const usuario = await this.userRepository.findOne({ where: { id, empresa_id } });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const novaSenha = this.gerarSenhaTemporaria();
    const senhaHasheada = await bcrypt.hash(novaSenha, 10);

    await this.userRepository.update(
      { id, empresa_id },
      {
        senha: senhaHasheada,
        deve_trocar_senha: true,
      },
    );

    return novaSenha;
  }

  private gerarSenhaTemporaria(): string {
    const letrasMaiusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const letrasMinusculas = 'abcdefghijkmnpqrstuvwxyz';
    const numeros = '23456789';
    const simbolos = '@#$%&*?!';
    const conjuntoCompleto = `${letrasMaiusculas}${letrasMinusculas}${numeros}${simbolos}`;

    const gerarCaractere = (fonte: string) => fonte[Math.floor(Math.random() * fonte.length)];

    const base = [
      gerarCaractere(letrasMaiusculas),
      gerarCaractere(letrasMinusculas),
      gerarCaractere(numeros),
      gerarCaractere(simbolos),
    ];

    while (base.length < 12) {
      base.push(gerarCaractere(conjuntoCompleto));
    }

    for (let i = base.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }

    return base.join('');
  }

  async alterarStatus(id: string, ativo: boolean, empresa_id: string): Promise<User> {
    console.log(
      `🔧 UsersService.alterarStatus - ID: ${id}, Ativo: ${ativo}, Empresa: ${empresa_id}`,
    );

    // Verificar se o usuário existe e pertence à empresa
    const usuario = await this.userRepository.findOne({
      where: { id, empresa_id },
      relations: ['empresa'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Atualizar o status
    await this.userRepository.update({ id, empresa_id }, { ativo });

    // Buscar o usuário atualizado
    const usuarioAtualizado = await this.userRepository.findOne({
      where: { id, empresa_id },
      relations: ['empresa'],
    });

    console.log(`✅ Status do usuário ${id} alterado para: ${ativo ? 'ATIVO' : 'INATIVO'}`);

    return usuarioAtualizado;
  }

  async ativarEmMassa(ids: string[], empresa_id: string): Promise<void> {
    for (const id of ids) {
      await this.userRepository.update({ id, empresa_id }, { ativo: true });
    }
  }

  async desativarEmMassa(ids: string[], empresa_id: string): Promise<void> {
    for (const id of ids) {
      await this.userRepository.update({ id, empresa_id }, { ativo: false });
    }
  }
}
