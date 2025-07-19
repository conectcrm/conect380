import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Empresa } from './empresa.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
  ) {}

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
}
