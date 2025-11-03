import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && await bcrypt.compare(password, user.senha)) {
      // ✅ NOTA: Não bloquear login se ativo=false
      // Isso permite primeiro login com senha temporária
      // O método login() vai detectar e retornar ação de trocar senha

      const { senha, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    // ✅ VERIFICAR SE É PRIMEIRO LOGIN (ativo = false)
    // Se ativo = false, usuário precisa trocar senha temporária
    if (!user.ativo) {
      return {
        success: false,
        action: 'TROCAR_SENHA',
        data: {
          userId: user.id,
          email: user.email,
          nome: user.nome,
        },
        message: 'Primeiro acesso detectado. Troque sua senha para continuar.',
      };
    }

    const payload = {
      email: user.email,
      sub: user.id,
      empresa_id: user.empresa_id,
      role: user.role
    };

    // Atualizar último login
    await this.usersService.updateLastLogin(user.id);

    return {
      success: true,
      data: {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          empresa: user.empresa,
        },
      },
      message: 'Login realizado com sucesso',
    };
  }

  async register(userData: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
    empresa_id: string;
  }) {
    // Verificar se email já existe
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new UnauthorizedException('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(userData.senha, 10);

    // Criar usuário
    const user = await this.usersService.create({
      ...userData,
      senha: hashedPassword,
    });

    const { senha, ...result } = user;
    return {
      success: true,
      data: result,
      message: 'Usuário criado com sucesso',
    };
  }

  async refreshToken(user: User) {
    const payload = {
      email: user.email,
      sub: user.id,
      empresa_id: user.empresa_id,
      role: user.role
    };

    return {
      success: true,
      data: {
        access_token: this.jwtService.sign(payload),
      },
    };
  }

  /**
   * Troca senha temporária (primeiro acesso)
   * Valida senha antiga, cria hash da nova, ativa usuário (ativo=true)
   */
  async trocarSenha(
    userId: string,
    senhaAntiga: string,
    senhaNova: string,
  ): Promise<any> {
    if (!userId) {
      throw new BadRequestException('Identificador do usuário é obrigatório');
    }

    if (!senhaAntiga || typeof senhaAntiga !== 'string') {
      throw new BadRequestException('Senha temporária é obrigatória');
    }

    if (!senhaNova || typeof senhaNova !== 'string') {
      throw new BadRequestException('Nova senha é obrigatória');
    }

    const senhaAntigaNormalizada = senhaAntiga.trim();
    const senhaNovaNormalizada = senhaNova.trim();

    if (senhaAntigaNormalizada.length === 0) {
      throw new BadRequestException('Senha temporária não pode ser vazia');
    }

    if (senhaNovaNormalizada.length < 6) {
      throw new BadRequestException('A nova senha deve ter pelo menos 6 caracteres');
    }

    // Buscar usuário completo (com senha)
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (!user.senha) {
      throw new BadRequestException('Usuário não possui senha cadastrada');
    }

    // Validar senha antiga
    const senhaValida = await bcrypt.compare(senhaAntigaNormalizada, user.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    // Hash da senha nova
    const hashedPassword = await bcrypt.hash(senhaNovaNormalizada, 10);

    // Atualizar senha E ativar usuário (primeiro acesso concluído)
    await this.usersService.updatePassword(userId, hashedPassword, true);

    return {
      success: true,
      message: 'Senha alterada com sucesso! Você já pode fazer login.',
    };
  }
}
