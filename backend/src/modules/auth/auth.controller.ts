import { Logger, Controller, Post, UseGuards, Request, Body, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { securityLogger } from '../../config/logger.config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';

class LoginDto {
  @ApiProperty({ description: 'E-mail do usuário', example: 'usuario@empresa.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(255, { message: 'E-mail muito longo (máximo 255 caracteres)' })
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'SenhaSegura123' })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'Senha muito longa (máximo 100 caracteres)' })
  senha: string;
}

class RegisterDto {
  @ApiProperty({ description: 'Nome completo do usuário', example: 'João Silva' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'Nome muito longo (máximo 255 caracteres)' })
  nome: string;

  @ApiProperty({ description: 'E-mail do usuário', example: 'usuario@empresa.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(255, { message: 'E-mail muito longo (máximo 255 caracteres)' })
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'SenhaSegura123' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'Senha muito longa (máximo 100 caracteres)' })
  senha: string;

  @ApiProperty({
    description: 'Telefone do usuário (opcional)',
    example: '11999999999',
    required: false,
  })
  @IsString({ message: 'Telefone deve ser uma string' })
  @MaxLength(20, { message: 'Telefone muito longo (máximo 20 caracteres)' })
  @Matches(/^[0-9+\-() ]+$/, { message: 'Telefone inválido (apenas números e símbolos)' })
  telefone?: string;

  @ApiProperty({
    description: 'ID da empresa (ignorado; o contexto vem do usuário autenticado)',
    example: 'f9e51bf4-930c-4964-bba7-6f538ea10bc5',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID da empresa inválido' })
  empresa_id?: string;
}

class TrocarSenhaDto {
  @ApiProperty({
    description: 'Identificador do usuário que está trocando a senha',
    example: 'f9e51bf4-930c-4964-bba7-6f538ea10bc5',
  })
  @IsUUID('4', { message: 'Identificador do usuário inválido' })
  userId: string;

  @ApiProperty({
    description: 'Senha temporária fornecida no primeiro acesso',
    example: 'Temp2025qcy',
  })
  @IsString({ message: 'Senha temporária deve ser uma string' })
  @IsNotEmpty({ message: 'Senha temporária é obrigatória' })
  @MinLength(6, { message: 'Senha temporária deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'Senha temporária muito longa (máximo 100 caracteres)' })
  senhaAntiga: string;

  @ApiProperty({
    description: 'Nova senha definitiva escolhida pelo usuário',
    example: 'NovaSenha123',
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'Nova senha muito longa (máximo 100 caracteres)' })
  senhaNova: string;
}

class ForgotPasswordDto {
  @ApiProperty({ description: 'E-mail cadastrado do usuário', example: 'usuario@empresa.com' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @MaxLength(255, { message: 'E-mail muito longo (máximo 255 caracteres)' })
  email: string;
}

class ResetPasswordDto {
  @ApiProperty({ description: 'Token recebido por e-mail', example: '1f2a6d4c3b...' })
  @IsString({ message: 'Token inválido' })
  @IsNotEmpty({ message: 'Token é obrigatório' })
  @MinLength(32, { message: 'Token inválido (muito curto)' })
  @MaxLength(500, { message: 'Token inválido (muito longo)' })
  token: string;

  @ApiProperty({ description: 'Nova senha escolhida', example: 'NovaSenha123' })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'Nova senha muito longa (máximo 100 caracteres)' })
  senhaNova: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 🛡️ 5 tentativas/minuto (proteção contra força bruta)
  @ApiOperation({ summary: 'Fazer login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas - aguarde 1 minuto' })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(req.user);

      // 📊 Log de login bem-sucedido
      if (result.success) {
        // Login normal (não primeiro acesso)
        this.logger.log(`✅ Login bem-sucedido: ${req.user.email}`);
      }

      return result;
    } catch (error) {
      // 🚨 Log de falha de login
      const ip = req.ip || req.connection.remoteAddress;
      securityLogger.loginFailed(loginDto.email, ip, error.message);
      throw error;
    }
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, EmpresaGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
  @Permissions(Permission.USERS_CREATE)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 🛡️ 3 cadastros/hora (previne spam)
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Sem permissão para criar usuários' })
  @ApiResponse({ status: 429, description: 'Limite de cadastros atingido - aguarde 1 hora' })
  async register(@Request() req, @Body() registerDto: RegisterDto) {
    return this.authService.register({
      ...registerDto,
      empresa_id: req.user?.empresa_id,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar token' })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso' })
  async refresh(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @Post('trocar-senha')
  @ApiOperation({ summary: 'Trocar senha (primeiro acesso)' })
  @ApiBody({ type: TrocarSenhaDto })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 401, description: 'Senha atual incorreta' })
  async trocarSenha(@Body() trocarSenhaDto: TrocarSenhaDto) {
    return this.authService.trocarSenha(
      trocarSenhaDto.userId,
      trocarSenhaDto.senhaAntiga,
      trocarSenhaDto.senhaNova,
    );
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 🛡️ 3 tentativas/5min (previne abuso)
  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Solicitação de recuperação processada' })
  @ApiResponse({ status: 429, description: 'Muitas solicitações - aguarde 5 minutos' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto, @Req() req) {
    await this.authService.solicitarRecuperacaoSenha(forgotPasswordDto.email, {
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    return {
      success: true,
      message:
        'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação em instantes.',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefinir senha a partir de um token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetarSenhaComToken(
      resetPasswordDto.token,
      resetPasswordDto.senhaNova,
    );
  }
}
