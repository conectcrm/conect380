import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && await bcrypt.compare(password, user.senha)) {
      if (!user.ativo) {
        throw new UnauthorizedException('Usuário inativo');
      }
      
      const { senha, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
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
}
