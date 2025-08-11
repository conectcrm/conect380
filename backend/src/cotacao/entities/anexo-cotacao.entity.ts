import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Cotacao } from './cotacao.entity';
import { User } from '../../users/entities/user.entity';

@Entity('anexos_cotacao')
@Index(['cotacaoId'])
@Index(['tipo'])
export class AnexoCotacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cotacao_id' })
  cotacaoId: string;

  @ManyToOne(() => Cotacao, cotacao => cotacao.anexos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cotacao_id' })
  cotacao: Cotacao;

  @Column({ length: 255 })
  nome: string;

  @Column({ length: 100 })
  tipo: string; // PDF, DOC, XLS, IMG, etc.

  @Column({ length: 500 })
  url: string;

  @Column({ type: 'bigint' })
  tamanho: number; // em bytes

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ length: 100, nullable: true })
  mimeType: string;

  @Column({ length: 10, nullable: true })
  extensao: string;

  // Campos de controle
  @CreateDateColumn({ name: 'data_criacao' })
  dataCriacao: Date;

  @Column({ name: 'criado_por' })
  criadoPor: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'criado_por' })
  criadoPorUser: User;

  // Campos adicionais
  @Column({ type: 'json', nullable: true })
  metadados: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'int', nullable: true })
  downloads: number;

  @Column({ type: 'timestamp', nullable: true, name: 'ultimo_download' })
  ultimoDownload: Date;

  @Column({ length: 64, nullable: true })
  hash: string; // Para verificação de integridade

  @Column({ type: 'boolean', default: false, name: 'publico' })
  publico: boolean; // Se pode ser acessado sem autenticação

  @Column({ type: 'timestamp', nullable: true, name: 'data_expiracao' })
  dataExpiracao: Date;

  // Método para verificar se o anexo expirou
  get isExpirado(): boolean {
    return this.dataExpiracao ? this.dataExpiracao < new Date() : false;
  }

  // Método para obter tamanho formatado
  get tamanhoFormatado(): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (this.tamanho === 0) return '0 Bytes';
    const i = Math.floor(Math.log(this.tamanho) / Math.log(1024));
    return Math.round(this.tamanho / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Método para verificar se é imagem
  get isImagem(): boolean {
    const tiposImagem = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    return tiposImagem.includes(this.extensao?.toLowerCase() || '');
  }

  // Método para verificar se é documento
  get isDocumento(): boolean {
    const tiposDocumento = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    return tiposDocumento.includes(this.extensao?.toLowerCase() || '');
  }
}
