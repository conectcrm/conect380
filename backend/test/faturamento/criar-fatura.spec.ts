import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fatura } from '../../src/modules/faturamento/entities/fatura.entity';
import { ItemFatura } from '../../src/modules/faturamento/entities/item-fatura.entity';
import { FaturamentoService } from '../../src/modules/faturamento/services/faturamento.service';
import { CreateFaturaDto } from '../../src/modules/faturamento/dto/fatura.dto';
import { ConfigModule } from '@nestjs/config';
import { Contrato } from '../../src/modules/contratos/entities/contrato.entity';
import { EmailIntegradoService } from '../../src/modules/propostas/email-integrado.service';
import { User } from '../../src/modules/users/user.entity';
import { Proposta } from '../../src/modules/propostas/proposta.entity';

class EmailMock { async enviarEmailGenerico() { return true; } }

describe('FaturamentoService - criar fatura', () => {
  let service: FaturamentoService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          // Incluir entidades referenciadas nas relações carregadas pelo serviço
          entities: [Fatura, ItemFatura, Contrato, User, Proposta],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Fatura, ItemFatura, Contrato]),
      ],
      providers: [
        FaturamentoService,
        { provide: EmailIntegradoService, useClass: EmailMock },
      ],
    }).compile();

    service = moduleRef.get(FaturamentoService);
  });

  it('deve criar fatura com item calculando valorTotal corretamente', async () => {
    const dto: CreateFaturaDto = {
      clienteId: '11870d4f-0059-4466-a546-1c878d1330a2',
      usuarioResponsavelId: 'a47ac10b-58cc-4372-a567-0e02b2c3d480',
      tipo: 'unica' as any,
      descricao: 'Teste Fatura',
      dataVencimento: new Date().toISOString().split('T')[0],
      itens: [
        { descricao: 'Item Teste', quantidade: 2, valorUnitario: 50, valorDesconto: 10 },
      ],
      valorDesconto: 0,
    };

    const fatura = await service.criarFatura(dto);
    expect(fatura.id).toBeDefined();
    expect(fatura.itens.length).toBe(1);
    const item = fatura.itens[0];
    expect(Number(item.valorTotal)).toBe(90); // 2 * 50 - 10
  });
});
