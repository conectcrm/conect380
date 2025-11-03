import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  email: string;
  senha: string;
}

class RegisterDto {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  empresa_id: string;
}

class TrocarSenhaDto {
  @ApiProperty({ description: 'Identificador do usuário que está trocando a senha', example: 'f9e51bf4-930c-4964-bba7-6f538ea10bc5' })
  @IsUUID('4', { message: 'Identificador do usuário inválido' })
  userId: string;

  @ApiProperty({ description: 'Senha temporária fornecida no primeiro acesso', example: 'Temp2025qcy' })
  @IsString({ message: 'Senha temporária deve ser uma string' })
  @IsNotEmpty({ message: 'Senha temporária é obrigatória' })
  senhaAntiga: string;

  @ApiProperty({ description: 'Nova senha definitiva escolhida pelo usuário', example: 'NovaSenha123' })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' })
  senhaNova: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Fazer login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
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
}
