import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FornecedorController } from './controllers/fornecedor.controller';
import { ContaPagarController } from './controllers/conta-pagar.controller';
import { ContaBancariaController } from './controllers/conta-bancaria.controller';
import { FornecedorService } from './services/fornecedor.service';
import { ContaPagarService } from './services/conta-pagar.service';
import { ContaBancariaService } from './services/conta-bancaria.service';
import { Fornecedor } from './entities/fornecedor.entity';
import { ContaPagar } from './entities/conta-pagar.entity';
import { ContaBancaria } from './entities/conta-bancaria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fornecedor, ContaPagar, ContaBancaria])],
  providers: [FornecedorService, ContaPagarService, ContaBancariaService],
  controllers: [FornecedorController, ContaPagarController, ContaBancariaController],
  exports: [FornecedorService, ContaPagarService, ContaBancariaService],
})
export class FinanceiroModule {}
