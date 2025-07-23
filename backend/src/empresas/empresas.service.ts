import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { User, UserRole } from '../modules/users/user.entity';
import { CreateEmpresaDto } from './dto/empresas.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailService: MailService,
  ) {}

  async registrarEmpresa(createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
    const { empresa, usuario, plano, aceitarTermos } = createEmpresaDto;

    if (!aceitarTermos) {
      throw new HttpException(
        'É necessário aceitar os termos de uso',
        HttpStatus.BAD_REQUEST
      );
    }

    // Verificar se CNPJ já existe
    const cnpjExiste = await this.empresaRepository.findOne({
      where: { cnpj: empresa.cnpj.replace(/\D/g, '') }
    });

    if (cnpjExiste) {
      throw new HttpException(
        'CNPJ já cadastrado',
        HttpStatus.CONFLICT
      );
    }

    // Verificar se email da empresa já existe
    const emailEmpresaExiste = await this.empresaRepository.findOne({
      where: { email: empresa.email }
    });

    if (emailEmpresaExiste) {
      throw new HttpException(
        'Email da empresa já cadastrado',
        HttpStatus.CONFLICT
      );
    }

    // Verificar se email do usuário já existe
    const emailUsuarioExiste = await this.userRepository.findOne({
      where: { email: usuario.email }
    });

    if (emailUsuarioExiste) {
      throw new HttpException(
        'Email do usuário já cadastrado',
        HttpStatus.CONFLICT
      );
    }

    try {
      // Gerar subdomínio único
      const subdominio = await this.gerarSubdominioUnico(empresa.nome);

      // Criar empresa
      const novaEmpresa = this.empresaRepository.create({
        nome: empresa.nome,
        slug: this.gerarSlug(empresa.nome),
        cnpj: empresa.cnpj.replace(/\D/g, ''),
        email: empresa.email,
        telefone: empresa.telefone.replace(/\D/g, ''),
        endereco: empresa.endereco,
        cidade: empresa.cidade,
        estado: empresa.estado,
        cep: empresa.cep.replace(/\D/g, ''),
        plano: plano,
        subdominio: subdominio,
        ativo: true, // Empresa ativa por padrão
        data_expiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias de trial
        email_verificado: false,
        token_verificacao: crypto.randomBytes(32).toString('hex'),
      });

      const empresaSalva = await this.empresaRepository.save(novaEmpresa);

      // Hash da senha
      const saltRounds = 10;
      const senhaHash = await bcrypt.hash(usuario.senha, saltRounds);

      // Criar usuário administrador
      const novoUsuario = this.userRepository.create({
        nome: usuario.nome,
        email: usuario.email,
        senha: senhaHash,
        telefone: usuario.telefone.replace(/\D/g, ''),
        role: UserRole.ADMIN,
        empresa_id: empresaSalva.id,
        ativo: false, // Usuário fica inativo até verificar email
      });

      await this.userRepository.save(novoUsuario);

      // Enviar email de verificação
      await this.enviarEmailVerificacao(empresaSalva, novoUsuario);

      return empresaSalva;
    } catch (error) {
      console.error('Erro ao registrar empresa:', error);
      throw new HttpException(
        'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async verificarCNPJDisponivel(cnpj: string): Promise<boolean> {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    const empresa = await this.empresaRepository.findOne({
      where: { cnpj: cnpjLimpo }
    });
    return !empresa;
  }

  async verificarEmailDisponivel(email: string): Promise<boolean> {
    const [empresaExiste, usuarioExiste] = await Promise.all([
      this.empresaRepository.findOne({ where: { email } }),
      this.userRepository.findOne({ where: { email } })
    ]);
    return !empresaExiste && !usuarioExiste;
  }

  async verificarEmailAtivacao(token: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { token_verificacao: token },
      relations: ['usuarios']
    });

    if (!empresa) {
      throw new HttpException(
        'Token inválido',
        HttpStatus.BAD_REQUEST
      );
    }

    // Verificar se token não expirou (24 horas)
    const tokenCreatedAt = empresa.created_at;
    const now = new Date();
    const diffHours = (now.getTime() - tokenCreatedAt.getTime()) / (1000 * 60 * 60);

    if (diffHours > 24) {
      throw new HttpException(
        'Token expirado',
        HttpStatus.BAD_REQUEST
      );
    }

    // Ativar empresa e usuário
    empresa.email_verificado = true;
    empresa.token_verificacao = null;
    await this.empresaRepository.save(empresa);

    // Ativar usuário administrador
    const adminUser = empresa.usuarios.find(u => u.role === 'admin');
    if (adminUser) {
      adminUser.ativo = true;
      await this.userRepository.save(adminUser);
    }

    return empresa;
  }

  async reenviarEmailAtivacao(email: string): Promise<void> {
    const empresa = await this.empresaRepository.findOne({
      where: { email },
      relations: ['usuarios']
    });

    if (!empresa) {
      throw new HttpException(
        'Empresa não encontrada',
        HttpStatus.NOT_FOUND
      );
    }

    if (empresa.email_verificado) {
      throw new HttpException(
        'Email já verificado',
        HttpStatus.BAD_REQUEST
      );
    }

    // Gerar novo token
    empresa.token_verificacao = crypto.randomBytes(32).toString('hex');
    await this.empresaRepository.save(empresa);

    // Buscar usuário admin
    const adminUser = empresa.usuarios.find(u => u.role === 'admin');
    if (!adminUser) {
      throw new HttpException(
        'Usuário administrador não encontrado',
        HttpStatus.NOT_FOUND
      );
    }

    // Reenviar email
    await this.enviarEmailVerificacao(empresa, adminUser);
  }

  async obterPorSubdominio(subdominio: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { subdominio }
    });

    if (!empresa) {
      throw new HttpException(
        'Empresa não encontrada',
        HttpStatus.NOT_FOUND
      );
    }

    return empresa;
  }

  async listarPlanos(): Promise<any[]> {
    // Por enquanto, retornar planos estáticos
    // Futuramente, isso pode vir de uma tabela no banco
    return [
      {
        id: 'starter',
        nome: 'Starter',
        preco: 99,
        descricao: 'Ideal para pequenas empresas',
        recursos: [
          'Até 3 usuários',
          'Até 1.000 clientes',
          'Módulos básicos',
          '5GB de armazenamento',
          'Suporte por email'
        ],
        limites: {
          usuarios: 3,
          clientes: 1000,
          armazenamento: '5GB'
        }
      },
      {
        id: 'professional',
        nome: 'Professional',
        preco: 299,
        descricao: 'Para empresas em crescimento',
        recursos: [
          'Até 10 usuários',
          'Até 10.000 clientes',
          'Todos os módulos',
          '50GB de armazenamento',
          'White label básico',
          'Suporte prioritário'
        ],
        limites: {
          usuarios: 10,
          clientes: 10000,
          armazenamento: '50GB'
        }
      },
      {
        id: 'enterprise',
        nome: 'Enterprise',
        preco: 899,
        descricao: 'Para grandes operações',
        recursos: [
          'Usuários ilimitados',
          'Clientes ilimitados',
          'API completa',
          '500GB de armazenamento',
          'White label completo',
          'Suporte dedicado'
        ],
        limites: {
          usuarios: -1,
          clientes: -1,
          armazenamento: '500GB'
        }
      }
    ];
  }

  async verificarStatusEmpresa(empresaId: string): Promise<any> {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId }
    });

    if (!empresa) {
      throw new HttpException(
        'Empresa não encontrada',
        HttpStatus.NOT_FOUND
      );
    }

    const agora = new Date();
    const expirada = empresa.data_expiracao && empresa.data_expiracao < agora;

    return {
      id: empresa.id,
      nome: empresa.nome,
      ativo: empresa.ativo,
      plano: empresa.plano,
      email_verificado: empresa.email_verificado,
      data_expiracao: empresa.data_expiracao,
      expirada,
      dias_restantes: empresa.data_expiracao 
        ? Math.ceil((empresa.data_expiracao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
        : null
    };
  }

  private async gerarSubdominioUnico(nomeEmpresa: string): Promise<string> {
    // Limpar nome da empresa para criar subdomínio
    let baseSubdominio = nomeEmpresa
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
      .substring(0, 20); // Máximo 20 caracteres

    let subdominio = baseSubdominio;
    let contador = 1;

    // Verificar se subdomínio já existe
    while (await this.empresaRepository.findOne({ where: { subdominio } })) {
      subdominio = `${baseSubdominio}${contador}`;
      contador++;
    }

    return subdominio;
  }

  private async enviarEmailVerificacao(empresa: Empresa, usuario: User): Promise<void> {
    try {
      const verificacaoUrl = `${process.env.FRONTEND_URL}/verificar-email?token=${empresa.token_verificacao}&email=${empresa.email}`;

      await this.mailService.enviarEmailVerificacao({
        to: usuario.email,
        empresa: empresa.nome,
        usuario: usuario.nome,
        url: verificacaoUrl
      });
    } catch (error) {
      console.error('Erro ao enviar email de verificação:', error);
      // Não interromper o processo se o email falhar
    }
  }

  private gerarSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .slice(0, 100); // Limita a 100 caracteres
  }
}
