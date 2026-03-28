import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEmpresaDto } from './empresas.dto';

const createValidPayload = (plano = 'starter') => ({
  empresa: {
    nome: 'Empresa Teste LTDA',
    cnpj: '12.345.678/0001-95',
    email: 'contato@empresa.com',
    telefone: '(11) 99999-9999',
    endereco: 'Rua Teste, 100',
    cidade: 'Sao Paulo',
    estado: 'SP',
    cep: '01001-000',
  },
  usuario: {
    nome: 'Admin Empresa',
    email: 'admin@empresa.com',
    senha: 'Senha123',
    telefone: '(11) 98888-7777',
  },
  plano,
  aceitarTermos: true,
});

describe('CreateEmpresaDto', () => {
  it('aceita codigo de plano customizado do catalogo', async () => {
    const dto = plainToInstance(CreateEmpresaDto, createValidPayload('plano-de-teste'));
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejeita codigo de plano invalido', async () => {
    const dto = plainToInstance(CreateEmpresaDto, createValidPayload('Plano de Teste'));
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const planoError = errors.find((error) => error.property === 'plano');
    expect(planoError).toBeDefined();
  });
});
