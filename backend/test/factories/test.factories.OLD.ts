import { Repository } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Empresa } from '../../src/empresas/entities/empresa.entity';
import { User } from '../../src/modules/users/user.entity';
import { Contato } from '../../src/modules/clientes/contato.entity';
import { Ticket } from '../../src/modules/atendimento/entities/ticket.entity';
import { Mensagem } from '../../src/modules/atendimento/entities/mensagem.entity';
import { Equipe } from '../../src/modules/triagem/entities/equipe.entity';
import { Atendente } from '../../src/modules/triagem/entities/atendente.entity';

/**
 * 🏭 Test Factories - Factory Pattern para Dados de Teste
 * 
 * Facilita criação de entidades de teste com dados realistas e reutilizáveis
 */

let empresaSeq = 1;
let usuarioSeq = 1;
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
  usuarioSeq = 1;
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
  const repo: Repository<Empresa> = app.get(getRepositoryToken(Empresa));
  
  const empresa = repo.create({
    nome: `Empresa Teste ${empresaSeq}`,
    slug: `empresa-teste-${empresaSeq}`,
    cnpj: `${String(empresaSeq).padStart(14, '0')}`,
    email: `empresa${empresaSeq}@teste.com`,
    telefone: `+551199999${String(empresaSeq).padStart(4, '0')}`,
    endereco: 'Rua Teste, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01000-000',
    subdominio: `empresa-teste-${empresaSeq}`,
    ativo: true,
    plano: 'professional',
    ...override,
  });
  
  empresaSeq++;
  return await repo.save(empresa);
}

/**
 * 👤 Criar Usuário de Teste
 */
export async function createTestUsuario(
  app: INestApplication,
  empresaId: string,
  override?: Partial<User>,
): Promise<User> {
  const repo: Repository<User> = app.get(getRepositoryToken(User));
  
  const usuario = repo.create({
    nome: `Usuário Teste ${usuarioSeq}`,
    email: `usuario${usuarioSeq}@teste.com`,
    senha: '$2b$10$hashedpassword', // Hash fictício
    empresaId,
    perfil: 'gerente',
    ativo: true,
    ...override,
  });
  
  usuarioSeq++;
  return await repo.save(usuario);
}

/**
 * 📱 Criar Contato de Teste (Cliente WhatsApp)
 */
export async function createTestContato(
  app: INestApplication,
  empresaId: string,
  override?: Partial<Contato>,
): Promise<Contato> {
  const repo: Repository<Contato> = app.get(getRepositoryToken(Contato));
  
  const contato = repo.create({
    nome: `Contato Teste ${contatoSeq}`,
    telefone: `+5511988${String(contatoSeq).padStart(6, '0')}`,
    empresaId,
    canal: 'whatsapp',
    ativo: true,
    ...override,
  });
  
  contatoSeq++;
  return await repo.save(contato);
}

/**
 * 🎫 Criar Ticket de Teste
 */
export async function createTestTicket(
  app: INestApplication,
  contatoId: string,
  empresaId: string,
  override?: Partial<Ticket>,
): Promise<Ticket> {
  const repo: Repository<Ticket> = app.get(getRepositoryToken(Ticket));
  
  const ticket = repo.create({
    contatoId,
    empresaId,
    status: 'aguardando_atendente',
    prioridade: 'media',
    canal: 'whatsapp',
    origem: 'atendimento',
    ...override,
  });
  
  ticketSeq++;
  return await repo.save(ticket);
}

/**
 * 💬 Criar Mensagem de Teste
 */
export async function createTestMensagem(
  app: INestApplication,
  ticketId: string,
  contatoId: string,
  override?: Partial<Mensagem>,
): Promise<Mensagem> {
  const repo: Repository<Mensagem> = app.get(getRepositoryToken(Mensagem));
  
  const mensagem = repo.create({
    ticketId,
    contatoId,
    tipo: 'texto',
    conteudo: `Mensagem de teste ${mensagemSeq}`,
    direcao: 'recebida',
    status: 'enviada',
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
  const repo: Repository<Equipe> = app.get(getRepositoryToken(Equipe));
  
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
  const repo: Repository<Atendente> = app.get(getRepositoryToken(Atendente));
  
  const atendente = repo.create({
    usuarioId,
    empresaId,
    status: 'disponivel',
    online: true,
    capacidadeMaxima: 5,
    atendimentosAtivos: 0,
    ...override,
  });
  
  atendenteSeq++;
  return await repo.save(atendente);
}

/**
 * 🎭 Criar Cenário Completo de Atendimento
 * 
 * Cria todos os dados necessários para testes E2E:
 * - Empresa
 * - Usuário
 * - Atendente
 * - Equipe
 * - Contato
 * - Ticket
 * 
 * @returns Objeto com todas as entidades criadas
 */
export async function createFullAtendimentoScenario(app: INestApplication) {
  const empresa = await createTestEmpresa(app);
  const usuario = await createTestUsuario(app, empresa.id);
  const atendente = await createTestAtendente(app, usuario.id, empresa.id);
  const equipe = await createTestEquipe(app, empresa.id);
  const contato = await createTestContato(app, empresa.id);
  const ticket = await createTestTicket(app, contato.id, empresa.id);
  
  return {
    empresa,
    usuario,
    atendente,
    equipe,
    contato,
    ticket,
  };
}
