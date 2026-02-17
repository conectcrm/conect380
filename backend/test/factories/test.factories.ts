import { Repository, DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Empresa } from '../../src/empresas/entities/empresa.entity';
import { User, UserRole } from '../../src/modules/users/user.entity';
import { Cliente } from '../../src/modules/clientes/cliente.entity';
import { Contato } from '../../src/modules/clientes/contato.entity';
import { Ticket } from '../../src/modules/atendimento/entities/ticket.entity';
import { Mensagem } from '../../src/modules/atendimento/entities/mensagem.entity';
import { Equipe } from '../../src/modules/triagem/entities/equipe.entity';
import { Atendente } from '../../src/modules/atendimento/entities/atendente.entity';

/**
 * 🏭 Test Factories - Factory Pattern para Dados de Teste E2E
 *
 * ⚠️ IMPORTANTE: Estrutura simplificada para testes E2E
 * Não cria relações complexas, apenas entidades mínimas funcionais
 */

let empresaSeq = 1;
let canalSeq = 1;
let usuarioSeq = 1;
let clienteSeq = 1;
let contatoSeq = 1;
let ticketSeq = 1;
let mensagemSeq = 1;
let equipeSeq = 1;
let atendenteSeq = 1;

/**
 * Reset de contadores (útil entre testes)
 */
export function resetFactorySequences() {
  empresaSeq = 1;
  canalSeq = 1;
  usuarioSeq = 1;
  clienteSeq = 1;
  contatoSeq = 1;
  ticketSeq = 1;
  mensagemSeq = 1;
  equipeSeq = 1;
  atendenteSeq = 1;
}

/**
 * 🏢 Criar Empresa de Teste
 */
export async function createTestEmpresa(
  app: INestApplication,
  override?: Partial<Empresa>,
): Promise<Empresa> {
  const ds = app.get(DataSource);
  const repo = ds.getRepository(Empresa);

  // Usar timestamp + sequence para garantir unicidade absoluta
  const uniqueId = `${Date.now()}-${empresaSeq}`;
  const cnpjNumber = (Date.now() % 100000000000000).toString().padStart(14, '0'); // 14 dígitos únicos baseados em timestamp

  const empresa = repo.create({
    nome: `Empresa Teste ${uniqueId}`,
    slug: `empresa-teste-${uniqueId}`,
    cnpj: cnpjNumber,
    email: `empresa${uniqueId}@teste.com`,
    telefone: `+551199999${String(empresaSeq).padStart(4, '0')}`,
    endereco: 'Rua Teste, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01000-000',
    subdominio: `empresa-teste-${uniqueId}`,
    ativo: true,
    plano: 'professional',
    ...override,
  });

  empresaSeq++;
  return await repo.save(empresa);
}

/**
 * 📡 Criar Canal de Teste (WhatsApp)
 */
export async function createTestCanal(
  app: INestApplication,
  empresaId: string,
  override?: Partial<any>,
): Promise<any> {
  const ds = app.get(DataSource);
  const repo = ds.getRepository('Canal');

  const canal = repo.create({
    empresaId,
    nome: `WhatsApp ${canalSeq}`,
    tipo: 'whatsapp',
    provider: 'whatsapp_business_api',
    ativo: true,
    configuracao: {
      accountSid: 'test-sid',
      authToken: 'test-token',
      numero: `+5511999${String(canalSeq).padStart(6, '0')}`,
    },
    ...override,
  });

  canalSeq++;
  return await repo.save(canal);
}

/**
 * 👤 Criar Usuário de Teste
 */
export async function createTestUsuario(
  app: INestApplication,
  empresaId: string,
  override?: Partial<User>,
): Promise<User> {
  const ds = app.get(DataSource);
  const repo = ds.getRepository(User);
  const uniqueId = `${Date.now()}-${usuarioSeq}-${Math.floor(Math.random() * 10000)}`;

  const usuario = repo.create({
    nome: `Usuário Teste ${uniqueId}`,
    email: `usuario-${uniqueId}@teste.com`,
    senha: '$2b$10$hashedpassword', // Hash fictício BCrypt
    empresa_id: empresaId, // ⚠️ Campo é empresa_id (snake_case)
    role: UserRole.USER, // ⚠️ Usar enum
    ativo: true,
    ...override,
  });

  usuarioSeq++;
  return await repo.save(usuario);
}

/**
 * 🏢 Criar Cliente de Teste (Empresa Cliente)
 */
export async function createTestCliente(
  app: INestApplication,
  empresaId: string,
  override?: Partial<Cliente>,
): Promise<Cliente> {
  const ds = app.get(DataSource);
  const repo = ds.getRepository(Cliente);
  const uniqueId = `${Date.now()}-${clienteSeq}-${Math.floor(Math.random() * 10000)}`;

  // Usar save() com casting explícito
  const clienteData = {
    nome: `Cliente Teste ${uniqueId}`,
    tipo: 'pessoa_juridica' as any,
    documento: `${String(clienteSeq + 10000).padStart(14, '0')}`,
    email: `cliente-${uniqueId}@teste.com`,
    telefone: `+5511${String(clienteSeq + 900000000)}`,
    empresaId,
    status: 'cliente' as any,
    ativo: true,
    ...override,
  };

  clienteSeq++;
  return await repo.save(clienteData as any);
}

/**
 * 📱 Criar Contato de Teste (Contato vinculado a Cliente)
 */
export async function createTestContato(
  app: INestApplication,
  clienteId: string,
  override?: Partial<Contato>,
): Promise<Contato> {
  const ds = app.get(DataSource);
  const repo = ds.getRepository(Contato);
  const clienteRepo = ds.getRepository(Cliente);

  const cliente = await clienteRepo.findOne({
    where: { id: clienteId },
    select: ['id', 'empresaId'],
  });

  if (!cliente) {
    throw new Error(`Cliente ${clienteId} não encontrado para criação de contato`);
  }

  const contato = repo.create({
    empresaId: cliente.empresaId,
    nome: `Contato Teste ${contatoSeq}`,
    telefone: `+5511${String(contatoSeq + 988000000)}`,
    email: `contato${contatoSeq}@teste.com`,
    clienteId, // ⚠️ Contato pertence a Cliente, NÃO a Empresa
    cargo: 'Gerente',
    ativo: true,
    principal: contatoSeq === 1, // Primeiro contato é principal
    ...override,
  });

  contatoSeq++;
  return await repo.save(contato);
}

/**
 * 🎫 Criar Ticket de Teste
 *
 * ⚠️ IMPORTANTE: Ticket NÃO usa contatoId diretamente
 * Usa contatoTelefone para identificar cliente
 */
export async function createTestTicket(
  app: INestApplication,
  empresaId: string,
  contatoTelefone: string,
  override?: Partial<Ticket>,
): Promise<Ticket> {
  const ds = app.get(DataSource);
  const repo = ds.getRepository(Ticket);

  const ticketData = {
    empresaId,
    contatoTelefone, // ⚠️ Usa telefone, não ID
    status: 'aguardando_atendente',
    prioridade: 'media',
    assunto: `Ticket de teste ${ticketSeq}`,
    ...override,
  };

  ticketSeq++;
  return await repo.save(ticketData as any);
}

/**
 * 💬 Criar Mensagem de Teste
 *
 * ⚠️ IMPORTANTE: Mensagem também NÃO usa contatoId
 */
export async function createTestMensagem(
  app: INestApplication,
  ticketId: string,
  override?: Partial<Mensagem>,
): Promise<Mensagem> {
  const ds = app.get(DataSource);
  const repo = ds.getRepository(Mensagem);

  const mensagem = repo.create({
    ticketId,
    tipo: 'texto',
    conteudo: `Mensagem de teste ${mensagemSeq}`,
    remetente: 'cliente',
    ...override,
  });

  mensagemSeq++;
  return await repo.save(mensagem);
}

/**
 * 👥 Criar Equipe de Teste
 */
export async function createTestEquipe(
  app: INestApplication,
  empresaId: string,
  override?: Partial<Equipe>,
): Promise<Equipe> {
  const ds = app.get(DataSource);
  const repo = ds.getRepository(Equipe);

  const equipe = repo.create({
    nome: `Equipe Teste ${equipeSeq}`,
    descricao: `Equipe de testes ${equipeSeq}`,
    empresaId,
    ativo: true,
    ...override,
  });

  equipeSeq++;
  return await repo.save(equipe);
}

/**
 * 🧑‍💼 Criar Atendente de Teste
 */
export async function createTestAtendente(
  app: INestApplication,
  usuarioId: string,
  empresaId: string,
  override?: Partial<Atendente>,
): Promise<Atendente> {
  const ds = app.get(DataSource);
  const repo = ds.getRepository(Atendente);
  const uniqueId = `${Date.now()}-${atendenteSeq}-${Math.floor(Math.random() * 10000)}`;

  // Usar save() com casting explícito
  const atendenteData = {
    nome: `Atendente ${atendenteSeq}`,
    email: `atendente-${uniqueId}@teste.com`,
    usuarioId,
    empresaId,
    status: 'DISPONIVEL',
    capacidadeMaxima: 5,
    ticketsAtivos: 0,
    ...override,
  };

  atendenteSeq++;
  return await repo.save(atendenteData as any);
}

/**
 * 🎭 Criar Cenário Completo de Atendimento
 *
 * Cria TODA a cadeia de entidades necessárias:
 * Empresa → Usuario → Atendente → Equipe
 * Empresa → Cliente → Contato
 * Empresa + Contato → Ticket
 *
 * @returns Objeto com todas as entidades criadas
 */
export async function createFullAtendimentoScenario(app: INestApplication) {
  // 1. Criar Empresa
  const empresa = await createTestEmpresa(app);

  // 2. Criar Usuário (pertence à Empresa)
  const usuario = await createTestUsuario(app, empresa.id);

  // 3. Criar Atendente (vinculado ao Usuário)
  const atendente = await createTestAtendente(app, usuario.id, empresa.id);

  // 4. Criar Equipe
  const equipe = await createTestEquipe(app, empresa.id);

  // 5. Criar Cliente (empresa cliente)
  const cliente = await createTestCliente(app, empresa.id);

  // 6. Criar Contato (vinculado ao Cliente)
  const contato = await createTestContato(app, cliente.id);

  // 7. Criar Ticket (usa telefone do contato)
  const ticket = await createTestTicket(app, empresa.id, contato.telefone);

  return {
    empresa,
    usuario,
    atendente,
    equipe,
    cliente,
    contato,
    ticket,
  };
}
