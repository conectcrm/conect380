import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FornecedorController } from './controllers/fornecedor.controller';
import { ContaPagarController } from './controllers/conta-pagar.controller';
import { FornecedorService } from './services/fornecedor.service';
import { ContaPagarService } from './services/conta-pagar.service';
import { Fornecedor } from './entities/fornecedor.entity';
import { ContaPagar } from './entities/conta-pagar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fornecedor, ContaPagar])],
  providers: [FornecedorService, ContaPagarService],
  controllers: [FornecedorController, ContaPagarController],
  exports: [FornecedorService, ContaPagarService],
})
export class FinanceiroModule {}
