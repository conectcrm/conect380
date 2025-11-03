import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) { }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['empresa'],
    });
  }

  async findById(id: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['empresa'],
    });
  }

  /**
   * Busca usuário por ID (inclui senha - para validação de senha antiga)
   * Diferente de findById que NÃO retorna senha
   */
  async findOne(id: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'nome', 'email', 'senha', 'role', 'empresa_id', 'ativo', 'ultimo_login', 'created_at', 'updated_at'],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
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
    });
  }

  async listarComFiltros(filtros: any): Promise<{ usuarios: User[], total: number }> {
    try {
      console.log('Service - Filtros recebidos:', filtros);
      const query = this.userRepository.createQueryBuilder('user')
        .where('user.empresa_id = :empresa_id', { empresa_id: filtros.empresa_id });
      if (filtros.busca) {
        query.andWhere('(user.nome LIKE :busca OR user.email LIKE :busca)', { busca: `%${filtros.busca}%` });
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
      console.log('Service - Usuários encontrados:', usuarios.length);
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
      where: { empresa_id, role: UserRole.ADMIN }
    });
    const managerCount = await this.userRepository.count({
      where: { empresa_id, role: UserRole.MANAGER }
    });
    const vendedorCount = await this.userRepository.count({
      where: { empresa_id, role: UserRole.VENDEDOR }
    });
    const userCount = await this.userRepository.count({
      where: { empresa_id, role: UserRole.USER }
    });

    return {
      total,
      ativos,
      inativos,
      por_perfil: {
        admin: adminCount,
        manager: managerCount,
        vendedor: vendedorCount,
        user: userCount
      }
    };
  }

  async listarAtendentes(empresa_id: string): Promise<User[]> {
    return await this.userRepository.find({
      where: { 
        empresa_id,
        ativo: true
      },
      order: { nome: 'ASC' }
    }).then(users => 
      users.filter(user => 
        user.permissoes && 
        (
          user.permissoes.includes('ATENDIMENTO') ||
          user.permissoes.some(p => p === 'ATENDIMENTO')
        )
      )
    );
  }

  async criar(userData: Partial<User>): Promise<User> {
    console.log('🚀 UsersService.criar - Recebendo dados:', userData);

    // Validação de campos obrigatórios
    if (!userData.nome || !userData.email || !userData.senha || !userData.empresa_id) {
      console.error('❌ Campos obrigatórios ausentes:', { nome: !!userData.nome, email: !!userData.email, senha: !!userData.senha, empresa_id: !!userData.empresa_id });
      throw new Error('Campos obrigatórios ausentes: nome, email, senha, empresa_id');
    }

    // Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(userData.senha, 10);
    const userDataWithHashedPassword = {
      ...userData,
      senha: hashedPassword
    };

    const user = this.userRepository.create(userDataWithHashedPassword);
    console.log('📝 Usuário criado em memória:', user);

    try {
      const savedUser = await this.userRepository.save(user);
      console.log('✅ Usuário salvo no banco:', savedUser);
      return savedUser;
    } catch (err: any) {
      console.error('❌ Erro ao salvar usuário:', err);
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
    await this.userRepository.delete({ id, empresa_id });
  }

  async resetarSenha(id: string, empresa_id: string): Promise<string> {
    const novaSenha = Math.random().toString(36).slice(-8);
    await this.userRepository.update({ id, empresa_id }, { senha: novaSenha });
    return novaSenha;
  }

  async alterarStatus(id: string, ativo: boolean, empresa_id: string): Promise<User> {
    console.log(`🔧 UsersService.alterarStatus - ID: ${id}, Ativo: ${ativo}, Empresa: ${empresa_id}`);

    // Verificar se o usuário existe e pertence à empresa
    const usuario = await this.userRepository.findOne({
      where: { id, empresa_id },
      relations: ['empresa']
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Atualizar o status
    await this.userRepository.update({ id, empresa_id }, { ativo });

    // Buscar o usuário atualizado
    const usuarioAtualizado = await this.userRepository.findOne({
      where: { id, empresa_id },
      relations: ['empresa']
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
