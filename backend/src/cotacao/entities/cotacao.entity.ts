import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Cliente } from '../../modules/clientes/cliente.entity';
import { Fornecedor } from '../../modules/financeiro/entities/fornecedor.entity';
import { User } from '../../modules/users/user.entity';
import { ItemCotacao } from './item-cotacao.entity';
import { AnexoCotacao } from './anexo-cotacao.entity';

export enum StatusCotacao {
  RASCUNHO = 'rascunho',
  ENVIADA = 'enviada',
  PENDENTE = 'pendente', // Aguardando aprovação
  EM_ANALISE = 'em_analise',
  APROVADA = 'aprovada',
  REJEITADA = 'rejeitada',
  VENCIDA = 'vencida',
  CONVERTIDA = 'convertida',
  CANCELADA = 'cancelada',
}

export enum PrioridadeCotacao {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum OrigemCotacao {
  MANUAL = 'manual',
  WEBSITE = 'website',
  EMAIL = 'email',
  TELEFONE = 'telefone',
  WHATSAPP = 'whatsapp',
  INDICACAO = 'indicacao',
}

@Entity('cotacoes')
@Index(['numero'], { unique: true })
@Index(['fornecedorId'])
@Index(['responsavelId'])
@Index(['status'])
@Index(['prazoResposta'])
@Index(['dataCriacao'])
export class Cotacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  numero: string;

  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({
    type: 'enum',
    enum: StatusCotacao,
    default: StatusCotacao.RASCUNHO,
  })
  status: StatusCotacao;

  @Column({
    type: 'enum',
    enum: PrioridadeCotacao,
    default: PrioridadeCotacao.MEDIA,
  })
  prioridade: PrioridadeCotacao;

  @Column({
    type: 'enum',
    enum: OrigemCotacao,
    default: OrigemCotacao.MANUAL,
  })
  origem: OrigemCotacao;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  valorTotal: number;

  @Column({ type: 'date', nullable: true })
  prazoResposta: Date;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'text', nullable: true })
  condicoesPagamento: string;

  @Column({ length: 100, nullable: true })
  prazoEntrega: string;

  @Column({ length: 200, nullable: true })
  localEntrega: string;

  @Column({ type: 'int', nullable: true, default: 30 })
  validadeOrcamento: number; // dias

  // Relacionamentos
  @Column({ name: 'fornecedor_id' })
  fornecedorId: string;

  @ManyToOne(() => Fornecedor, { eager: false })
  @JoinColumn({ name: 'fornecedor_id' })
  fornecedor: Fornecedor;

  @Column({ name: 'responsavel_id' })
  responsavelId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel: User;

  @Column({ name: 'aprovador_id', nullable: true })
  aprovadorId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'aprovador_id' })
  aprovador: User;

  @Column({ name: 'data_aprovacao', type: 'timestamp', nullable: true })
  dataAprovacao: Date;

  @Column({ name: 'status_aprovacao', type: 'varchar', length: 20, nullable: true })
  statusAprovacao: string; // 'aprovado' | 'reprovado'

  @Column({ name: 'justificativa_aprovacao', type: 'text', nullable: true })
  justificativaAprovacao: string;

  @OneToMany(() => ItemCotacao, (item) => item.cotacao, { cascade: true })
  itens: ItemCotacao[];

  @OneToMany(() => AnexoCotacao, (anexo) => anexo.cotacao, { cascade: true })
  anexos: AnexoCotacao[];

  // Campos de controle
  @CreateDateColumn({ name: 'data_criacao' })
  dataCriacao: Date;

  @UpdateDateColumn({ name: 'data_atualizacao' })
  dataAtualizacao: Date;

  @DeleteDateColumn({ name: 'deletado_em', nullable: true })
  deletadoEm: Date;

  @Column({ name: 'criado_por' })
  criadoPor: string;

  @Column({ name: 'atualizado_por' })
  atualizadoPor: string;

  @Column({ name: 'deletado_por', nullable: true })
  deletadoPor: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'criado_por' })
  criadoPorUser: User;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'atualizado_por' })
  atualizadoPorUser: User;

  // Campos de status específicos
  @Column({ type: 'timestamp', nullable: true, name: 'data_envio' })
  dataEnvio: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'data_rejeicao' })
  dataRejeicao: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'data_conversao' })
  dataConversao: Date;

  // Campos adicionais
  @Column({ type: 'json', nullable: true })
  metadados: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  desconto: number; // percentual

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  valorDesconto: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  valorImposto: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  valorFrete: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  valorLiquido: number;

  @Column({ length: 100, nullable: true })
  moeda: string; // BRL, USD, EUR, etc.

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, default: 1 })
  taxaCambio: number;

  // Campos de rastreamento
  @Column({ type: 'int', default: 1 })
  versao: number;

  @Column({ type: 'timestamp', nullable: true, name: 'ultima_visualizacao' })
  ultimaVisualizacao: Date;

  @Column({ name: 'visualizado_por', nullable: true })
  visualizadoPor: string;

  // Campos de integração
  @Column({ length: 100, nullable: true, name: 'id_externo' })
  idExterno: string;

  @Column({ length: 100, nullable: true, name: 'sistema_origem' })
  sistemaOrigem: string;

  @Column({ type: 'json', nullable: true, name: 'dados_sincronizacao' })
  dadosSincronizacao: Record<string, any>;

  // Método para verificar se está vencida
  get isVencida(): boolean {
    return (
      this.prazoResposta < new Date() &&
      ![StatusCotacao.APROVADA, StatusCotacao.CONVERTIDA, StatusCotacao.CANCELADA].includes(
        this.status,
      )
    );
  }

  // Método para calcular dias restantes
  get diasRestantes(): number {
    const hoje = new Date();
    const vencimento = new Date(this.prazoResposta);
    const diffTime = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Método para verificar se pode ser editada
  get podeSerEditada(): boolean {
    return [StatusCotacao.RASCUNHO, StatusCotacao.ENVIADA].includes(this.status);
  }

  // Método para verificar se pode ser enviada
  get podeSerEnviada(): boolean {
    return this.status === StatusCotacao.RASCUNHO && this.itens && this.itens.length > 0;
  }

  // Método para verificar se pode ser aprovada
  get podeSerAprovada(): boolean {
    return [StatusCotacao.ENVIADA, StatusCotacao.EM_ANALISE].includes(this.status);
  }

  // Método para verificar se pode ser convertida
  get podeSerConvertida(): boolean {
    return this.status === StatusCotacao.APROVADA;
  }
}
