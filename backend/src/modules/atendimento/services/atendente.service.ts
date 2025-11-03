import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Atendente, StatusAtendente } from '../entities/atendente.entity';
import { User, UserRole } from '../../users/user.entity';
import { CriarAtendenteDto, AtualizarAtendenteDto } from '../dto/atendente.dto';

@Injectable()
export class AtendenteService {
  constructor(
    @InjectRepository(Atendente)
    private atendenteRepo: Repository<Atendente>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  /**
   * Gera senha temporária aleatória
   * Formato: Temp + Ano + 3 letras aleatórias
   * Exemplo: "Temp2025abc"
   */
  private gerarSenhaTemporaria(): string {
    const ano = new Date().getFullYear();
    const letras = Math.random().toString(36).substring(2, 5);
    return `Temp${ano}${letras}`;
  }

  /**
   * Criar atendente + user automaticamente
   */
  async criar(dto: CriarAtendenteDto, empresaId: string) {
    // 1. Verificar se email já existe (atendente)
    const atendenteExistente = await this.atendenteRepo.findOne({
      where: { email: dto.email, empresaId },
    });

    if (atendenteExistente) {
      throw new BadRequestException('Email já cadastrado como atendente');
    }

    // 2. Verificar se User já existe
    let user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    let senhaTemporaria: string | null = null;

    if (!user) {
      // 3. Criar User automaticamente
      senhaTemporaria = this.gerarSenhaTemporaria();
      const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

      user = this.userRepo.create({
        nome: dto.nome,
        email: dto.email,
        senha: senhaHash,
        telefone: dto.telefone || null,
        empresa_id: empresaId,
        role: UserRole.USER,
        ativo: false,  // ⚡ Força troca de senha no primeiro login
      });

      await this.userRepo.save(user);
    }

    // 4. Criar Atendente vinculado ao User
    const atendente = this.atendenteRepo.create({
      nome: dto.nome,
      email: dto.email,
      empresaId,
      usuarioId: user.id,
      status: StatusAtendente.OFFLINE,
      capacidadeMaxima: 5,
      ticketsAtivos: 0,
    });

    await this.atendenteRepo.save(atendente);

    // 5. Retornar com senha temporária (se gerou)
    return {
      atendente,
      senhaTemporaria,
      usuarioCriado: !!senhaTemporaria,
    };
  }

  /**
   * Listar todos os atendentes da empresa
   */
  async listar(empresaId: string) {
    const atendentes = await this.atendenteRepo.find({
      where: { empresaId },
      order: { createdAt: 'DESC' },
    });

    return atendentes;
  }

  /**
   * Buscar atendente por ID
   */
  async buscarPorId(id: string, empresaId: string) {
    const atendente = await this.atendenteRepo.findOne({
      where: { id, empresaId },
    });

    if (!atendente) {
      throw new NotFoundException('Atendente não encontrado');
    }

    return atendente;
  }

  /**
   * Atualizar atendente
   */
  async atualizar(id: string, dto: AtualizarAtendenteDto, empresaId: string) {
    const atendente = await this.buscarPorId(id, empresaId);

    Object.assign(atendente, dto);
    await this.atendenteRepo.save(atendente);

    return atendente;
  }

  /**
   * Atualizar status do atendente
   */
  async atualizarStatus(id: string, status: string, empresaId: string) {
    const atendente = await this.buscarPorId(id, empresaId);

    atendente.status = status;
    await this.atendenteRepo.save(atendente);

    return atendente;
  }

  /**
   * Deletar atendente
   */
  async deletar(id: string, empresaId: string) {
    const atendente = await this.buscarPorId(id, empresaId);
    await this.atendenteRepo.remove(atendente);

    return { message: 'Atendente deletado com sucesso' };
  }
}
