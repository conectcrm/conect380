import { readFileSync } from 'fs';
import { join } from 'path';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
import { ClientesService } from './clientes.service';

type ClientesContract = {
  create: {
    required: string[];
    optional: string[];
  };
  update: {
    partialOfCreate: boolean;
  };
  read: {
    required: string[];
    optional: string[];
  };
};

const contractPath = join(
  __dirname,
  '../../../../docs/features/contracts/clientes.contract.json',
);
const contract = JSON.parse(readFileSync(contractPath, 'utf-8')) as ClientesContract;

describe('Clientes Contract (Backend)', () => {
  const repoMock = {} as any;
  const service = new ClientesService(
    repoMock,
    repoMock,
    repoMock,
    repoMock,
    repoMock,
    repoMock,
  );

  it('deve validar payload de create conforme contrato oficial', async () => {
    const validCreatePayload = {
      nome: 'Cliente Contrato',
      email: 'cliente.contrato@empresa.com',
      tipo: 'pessoa_fisica',
      tags: ['vip'],
      origem: 'Indicacao',
      responsavel_id: '8fe2c8ad-2ba4-43ea-a32d-6f575f9f34e8',
    };

    const dto = plainToInstance(CreateClienteDto, validCreatePayload);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);

    for (const requiredField of contract.create.required) {
      expect(requiredField in validCreatePayload).toBe(true);
    }
  });

  it('deve reprovar create sem campos obrigatorios do contrato', async () => {
    const dto = plainToInstance(CreateClienteDto, {
      tipo: 'pessoa_fisica',
    });

    const errors = await validate(dto);
    const errorFields = errors.map((error) => error.property);

    expect(errorFields).toContain('nome');
    expect(errorFields).toContain('email');
  });

  it('deve aceitar update parcial do contrato de create', async () => {
    expect(contract.update.partialOfCreate).toBe(true);

    const dto = plainToInstance(UpdateClienteDto, {
      observacoes: 'Atualizado por teste de contrato',
      origem: 'Meta Ads',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('deve manter campos de read no CSV exportado', () => {
    const sample = {
      id: 'b7f8a91d-b3b9-4d57-b9fd-13f5d8d4bbaf',
      nome: 'Cliente Read',
      email: 'read@empresa.com',
      telefone: '+5511999999999',
      tipo: 'pessoa_fisica',
      status: 'lead',
      documento: '12345678900',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '01001000',
      endereco: 'Rua Teste, 123',
      observacoes: 'Contrato read',
      ativo: true,
      empresa_id: 'empresa-1',
      origem: 'WhatsApp',
      responsavel_id: 'f056b6ca-b5b6-4d79-bdd3-cf827dc31a1c',
      tags: ['vip', 'recorrente'],
      created_at: new Date('2026-03-10T10:00:00.000Z'),
      updated_at: new Date('2026-03-10T10:00:00.000Z'),
      ultimo_contato: new Date('2026-03-05T10:00:00.000Z'),
      proximo_contato: new Date('2026-03-20T10:00:00.000Z'),
    } as any;

    const csv = service.exportToCsv([sample]);
    const [headerLine] = csv.split('\n');
    const headers = headerLine.split(',');

    for (const requiredReadField of ['id', 'nome', 'email', 'tipo', 'status']) {
      expect(headers).toContain(requiredReadField);
    }

    expect(headers).toContain('ultimo_contato');
    expect(headers).toContain('proximo_contato');
    expect(headers).toContain('tags');
    expect(headers).toContain('origem');
    expect(headers).toContain('responsavel_id');
  });
});
