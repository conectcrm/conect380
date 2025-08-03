import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FornecedorController } from './controllers/fornecedor.controller';
import { FornecedorService } from './services/fornecedor.service';
import { Fornecedor } from './entities/fornecedor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fornecedor])],
  providers: [FornecedorService],
  controllers: [FornecedorController],
  exports: [FornecedorService],
})
export class FinanceiroModule {}
