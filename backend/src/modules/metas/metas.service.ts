import { Injectable } from '@nestjs/common';

export interface Meta {
  id?: string;
  tipo: 'mensal' | 'trimestral' | 'anual';
  periodo: string;
  vendedorId?: number;
  regiao?: string;
  valor: number;
  descricao?: string;
  ativa: boolean;
  criadaEm: Date;
  atualizadaEm: Date;
}

export interface CreateMetaDto {
  tipo: 'mensal' | 'trimestral' | 'anual';
  periodo: string;
  vendedorId?: number;
  regiao?: string;
  valor: number;
  descricao?: string;
}

export interface UpdateMetaDto extends Partial<CreateMetaDto> {
  ativa?: boolean;
}

@Injectable()
export class MetasService {
  // Por enquanto, sem injeção de repositório até criarmos a entidade Meta

  async findAll(): Promise<Meta[]> {
    try {
      // Por enquanto, retorna dados mockados
      return [
        {
          id: '1',
          tipo: 'mensal',
          periodo: '2025-01',
          vendedorId: null,
          regiao: null,
          valor: 450000,
          descricao: 'Meta geral mensal para toda equipe',
          ativa: true,
          criadaEm: new Date('2025-01-01'),
          atualizadaEm: new Date('2025-01-01'),
        },
        {
          id: '2',
          tipo: 'trimestral',
          periodo: '2025-Q1',
          vendedorId: 1,
          regiao: 'São Paulo',
          valor: 300000,
          descricao: 'Meta específica para região SP',
          ativa: true,
          criadaEm: new Date('2025-01-01'),
          atualizadaEm: new Date('2025-01-01'),
        },
      ];
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  async findOne(id: string): Promise<Meta> {
    try {
      const metas = await this.findAll();
      const meta = metas.find((m) => m.id === id);

      if (!meta) {
        throw new Error('Meta não encontrada');
      }

      return meta;
    } catch (error) {
      console.error('Erro ao buscar meta:', error);
      throw new Error('Meta não encontrada');
    }
  }

  async create(createMetaDto: CreateMetaDto): Promise<Meta> {
    try {
      const agora = new Date();
      const novaMeta: Meta = {
        id: Date.now().toString(), // Temporário, será substituído pela DB
        ...createMetaDto,
        ativa: true,
        criadaEm: agora,
        atualizadaEm: agora,
      };

      // Aqui seria a lógica para salvar no banco
      // return this.metasRepository.save(novaMeta);

      return novaMeta;
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      throw new Error('Erro ao criar meta');
    }
  }

  async update(id: string, updateMetaDto: UpdateMetaDto): Promise<Meta> {
    try {
      const meta = await this.findOne(id);

      const metaAtualizada: Meta = {
        ...meta,
        ...updateMetaDto,
        atualizadaEm: new Date(),
      };

      // Aqui seria a lógica para atualizar no banco
      // return this.metasRepository.save(metaAtualizada);

      return metaAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      throw new Error('Erro ao atualizar meta');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const meta = await this.findOne(id);

      // Aqui seria a lógica para remover do banco
      // await this.metasRepository.remove(meta);

      console.log(`Meta ${id} removida com sucesso`);
    } catch (error) {
      console.error('Erro ao remover meta:', error);
      throw new Error('Erro ao remover meta');
    }
  }

  async findByPeriodo(tipo: string, periodo: string): Promise<Meta[]> {
    try {
      const metas = await this.findAll();
      return metas.filter((meta) => meta.tipo === tipo && meta.periodo === periodo && meta.ativa);
    } catch (error) {
      console.error('Erro ao buscar metas por período:', error);
      throw new Error('Erro ao buscar metas');
    }
  }

  async findByVendedor(vendedorId: number): Promise<Meta[]> {
    try {
      const metas = await this.findAll();
      return metas.filter((meta) => meta.vendedorId === vendedorId && meta.ativa);
    } catch (error) {
      console.error('Erro ao buscar metas por vendedor:', error);
      throw new Error('Erro ao buscar metas');
    }
  }

  async getMetaAtual(vendedorId?: number, regiao?: string): Promise<Meta | null> {
    try {
      const agora = new Date();
      const anoAtual = agora.getFullYear();
      const mesAtual = agora.getMonth() + 1;
      const periodoMensal = `${anoAtual}-${mesAtual.toString().padStart(2, '0')}`;

      const metas = await this.findAll();

      // Busca por meta específica (vendedor + região)
      if (vendedorId && regiao) {
        const meta = metas.find(
          (m) =>
            m.vendedorId === vendedorId &&
            m.regiao === regiao &&
            m.periodo === periodoMensal &&
            m.ativa,
        );
        if (meta) return meta;
      }

      // Busca por meta específica do vendedor
      if (vendedorId) {
        const meta = metas.find(
          (m) => m.vendedorId === vendedorId && !m.regiao && m.periodo === periodoMensal && m.ativa,
        );
        if (meta) return meta;
      }

      // Busca por meta específica da região
      if (regiao) {
        const meta = metas.find(
          (m) => !m.vendedorId && m.regiao === regiao && m.periodo === periodoMensal && m.ativa,
        );
        if (meta) return meta;
      }

      // Busca por meta geral
      const metaGeral = metas.find(
        (m) => !m.vendedorId && !m.regiao && m.periodo === periodoMensal && m.ativa,
      );

      return metaGeral || null;
    } catch (error) {
      console.error('Erro ao buscar meta atual:', error);
      return null;
    }
  }
}
