import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../../mail/mail.service';
import { securityLogger } from '../../config/logger.config';

const RESET_TOKEN_EXPIRATION_MINUTES = 60;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  private gerarTokenRecuperacao(): { token: string; hash: string } {
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.senha))) {
      // ✅ NOTA: Não bloquear login se ativo=false
      // Isso permite primeiro login com senha temporária
      // O método login() vai detectar e retornar ação de trocar senha

      const { senha, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User & { deve_trocar_senha?: boolean }) {
    // ✅ VERIFICAR SE É PRIMEIRO LOGIN (ativo = false)
    // Se ativo = false, usuário precisa trocar senha temporária
    if (!user.ativo || user.deve_trocar_senha) {
      return {
        success: false,
        action: 'TROCAR_SENHA',
        data: {
          userId: user.id,
          email: user.email,
          nome: user.nome,
        },
        message: 'Por segurança, é necessário cadastrar uma nova senha antes de continuar.',
      };
    }

    const payload = {
      email: user.email,
      sub: user.id,
      empresa_id: user.empresa_id,
      role: user.role,
    };

    // Atualizar último login
    await this.usersService.updateLastLogin(user.id);
    const normalizedPermissions = Array.isArray(user.permissoes) ? user.permissoes : [];

    return {
      success: true,
      data: {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          permissoes: normalizedPermissions,
          permissions: normalizedPermissions,
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
      role: user.role,
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
  async trocarSenha(userId: string, senhaAntiga: string, senhaNova: string): Promise<any> {
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

  async solicitarRecuperacaoSenha(
    email: string,
    metadata?: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const emailNormalizado = email?.trim().toLowerCase();

    if (!emailNormalizado) {
      return;
    }

    const user = await this.usersService.findByEmail(emailNormalizado);

    if (!user) {
      // Evitar enumeração de usuários - retorno silencioso
      return;
    }

    // Invalidar tokens anteriores não utilizados
    await this.passwordResetTokenRepository.update(
      { user_id: user.id, used_at: IsNull() },
      { used_at: new Date() },
    );

    const { token, hash } = this.gerarTokenRecuperacao();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000);

    const resetToken = this.passwordResetTokenRepository.create({
      user_id: user.id,
      token_hash: hash,
      expires_at: expiresAt,
      requested_ip: metadata?.ip?.slice(0, 45) ?? null,
      user_agent: metadata?.userAgent ?? null,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    const resetLink = `${frontendBaseUrl}/recuperar-senha?token=${token}`;

    const expiracaoHoras = Math.max(1, Math.ceil(RESET_TOKEN_EXPIRATION_MINUTES / 60));

    await this.mailService.enviarEmailRecuperacaoSenha({
      to: user.email,
      usuario: user.nome,
      empresa: user.empresa?.nome,
      resetLink,
      expiracaoHoras,
    });
  }

  async resetarSenhaComToken(token: string, senhaNova: string) {
    const tokenNormalizado = token?.trim();

    if (!tokenNormalizado) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const tokenHash = createHash('sha256').update(tokenNormalizado).digest('hex');

    const registro = await this.passwordResetTokenRepository.findOne({
      where: { token_hash: tokenHash },
    });

    if (!registro || registro.used_at || registro.expires_at.getTime() < Date.now()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const senhaNormalizada = senhaNova?.trim();

    if (!senhaNormalizada || senhaNormalizada.length < 6) {
      throw new BadRequestException('A nova senha deve ter pelo menos 6 caracteres');
    }

    const hashedPassword = await bcrypt.hash(senhaNormalizada, 10);

    await this.usersService.updatePassword(registro.user_id, hashedPassword, true);

    registro.used_at = new Date();
    await this.passwordResetTokenRepository.save(registro);

    return {
      success: true,
      message: 'Senha alterada com sucesso! Você já pode fazer login.',
    };
  }

  async createTestUser() {
    const email = 'cache.test@conectcrm.com';

    // Verificar se já existe
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      // Atualizar senha do usuário existente com hash correto
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      await this.usersService.updatePassword(existingUser.id, hashedPassword, true);

      return {
        success: true,
        message: 'Usuário de teste atualizado com senha correta',
        credentials: {
          email: 'cache.test@conectcrm.com',
          password: 'Test@123',
        },
      };
    }

    // Hash da senha Test@123 gerado dinamicamente
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    const userData = {
      nome: 'Cache Test User',
      email,
      senha: hashedPassword,
      empresa_id: null, // Será preenchido pela service
      ativo: true,
      role: UserRole.ADMIN,
    };

    try {
      const user = await this.usersService.createWithHash(userData);

      return {
        success: true,
        message: 'Usuário de teste criado com sucesso!',
        credentials: {
          email: 'cache.test@conectcrm.com',
          password: 'Test@123',
        },
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
        },
      };
    } catch (error) {
      throw new BadRequestException('Erro ao criar usuário de teste: ' + error.message);
    }
  }
}
