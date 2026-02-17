import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplate } from '../entities/message-template.entity';
import { CriarTemplateDto, AtualizarTemplateDto } from '../dto/template-tag.dto';

@Injectable()
export class MessageTemplateService {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly templateRepository: Repository<MessageTemplate>,
  ) {}

  /**
   * Criar novo template
   */
  async criar(createDto: CriarTemplateDto, empresaId: string): Promise<MessageTemplate> {
    // Validar se já existe template com o mesmo nome
    const existente = await this.templateRepository.findOne({
      where: {
        nome: createDto.nome,
        empresaId,
      },
    });

    if (existente) {
      throw new BadRequestException(`Já existe um template com o nome "${createDto.nome}"`);
    }

    // Validar atalho único (se fornecido)
    if (createDto.atalho) {
      const atalhoExistente = await this.templateRepository.findOne({
        where: {
          atalho: createDto.atalho,
          empresaId,
        },
      });

      if (atalhoExistente) {
        throw new BadRequestException(`Já existe um template com o atalho "${createDto.atalho}"`);
      }
    }

    // Extrair variáveis automaticamente do conteúdo
    const variaveisDetectadas = this.extrairVariaveis(createDto.conteudo);

    const template = this.templateRepository.create({
      ...createDto,
      empresaId,
      variaveis: createDto.variaveis || variaveisDetectadas,
      ativo: true,
    });

    return await this.templateRepository.save(template);
  }

  /**
   * Listar todos os templates
   */
  async listar(empresaId: string, apenasAtivos: boolean = false): Promise<MessageTemplate[]> {
    const where: any = { empresaId };

    if (apenasAtivos) {
      where.ativo = true;
    }

    return await this.templateRepository.find({
      where,
      order: { categoria: 'ASC', nome: 'ASC' },
    });
  }

  /**
   * Buscar template por ID
   */
  async buscarPorId(id: string, empresaId: string): Promise<MessageTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, empresaId },
    });

    if (!template) {
      throw new NotFoundException(`Template com ID "${id}" não encontrado`);
    }

    return template;
  }

  /**
   * Buscar template por atalho
   */
  async buscarPorAtalho(atalho: string, empresaId: string): Promise<MessageTemplate> {
    const template = await this.templateRepository.findOne({
      where: { atalho, empresaId, ativo: true },
    });

    if (!template) {
      throw new NotFoundException(`Template com atalho "${atalho}" não encontrado`);
    }

    return template;
  }

  /**
   * Atualizar template
   */
  async atualizar(
    id: string,
    updateDto: AtualizarTemplateDto,
    empresaId: string,
  ): Promise<MessageTemplate> {
    const template = await this.buscarPorId(id, empresaId);

    // Validar nome único (se mudou)
    if (updateDto.nome && updateDto.nome !== template.nome) {
      const existente = await this.templateRepository.findOne({
        where: { nome: updateDto.nome, empresaId },
      });

      if (existente && existente.id !== id) {
        throw new BadRequestException(`Já existe um template com o nome "${updateDto.nome}"`);
      }
    }

    // Validar atalho único (se mudou)
    if (updateDto.atalho && updateDto.atalho !== template.atalho) {
      const existente = await this.templateRepository.findOne({
        where: { atalho: updateDto.atalho, empresaId },
      });

      if (existente && existente.id !== id) {
        throw new BadRequestException(`Já existe um template com o atalho "${updateDto.atalho}"`);
      }
    }

    // Atualizar variáveis se o conteúdo mudou
    if (updateDto.conteudo && updateDto.conteudo !== template.conteudo) {
      const variaveisDetectadas = this.extrairVariaveis(updateDto.conteudo);
      updateDto.variaveis = updateDto.variaveis || variaveisDetectadas;
    }

    Object.assign(template, updateDto);
    return await this.templateRepository.save(template);
  }

  /**
   * Deletar template
   */
  async deletar(id: string, empresaId: string): Promise<void> {
    const template = await this.buscarPorId(id, empresaId);
    await this.templateRepository.remove(template);
  }

  /**
   * Substituir variáveis no template
   * @param conteudo - Conteúdo do template com variáveis {{variavel}}
   * @param dados - Objeto com valores para substituir
   * @example
   * substituirVariaveis('Olá {{nome}}, seu ticket {{ticket}} foi criado!', { nome: 'João', ticket: '#123' })
   * // Retorna: 'Olá João, seu ticket #123 foi criado!'
   */
  substituirVariaveis(conteudo: string, dados: Record<string, any>): string {
    let resultado = conteudo;

    // Substituir cada variável encontrada
    Object.keys(dados).forEach((chave) => {
      const regex = new RegExp(`{{\\s*${chave}\\s*}}`, 'gi');
      resultado = resultado.replace(regex, String(dados[chave] || ''));
    });

    return resultado;
  }

  /**
   * Extrair variáveis do conteúdo (formato {{variavel}})
   * @param conteudo - Texto com variáveis
   * @returns Array de variáveis únicas encontradas
   * @example
   * extrairVariaveis('Olá {{nome}}, ticket {{ticket}}!')
   * // Retorna: ['{{nome}}', '{{ticket}}']
   */
  private extrairVariaveis(conteudo: string): string[] {
    const regex = /{{[^}]+}}/g;
    const matches = conteudo.match(regex);

    if (!matches) {
      return [];
    }

    // Remover duplicatas
    return Array.from(new Set(matches));
  }

  /**
   * Processar template (buscar e substituir variáveis)
   */
  async processarTemplate(
    idOuAtalho: string,
    dados: Record<string, any>,
    empresaId: string,
  ): Promise<string> {
    let template: MessageTemplate;

    // Tentar buscar por ID primeiro
    try {
      template = await this.buscarPorId(idOuAtalho, empresaId);
    } catch {
      // Se não encontrar por ID, buscar por atalho
      template = await this.buscarPorAtalho(idOuAtalho, empresaId);
    }

    return this.substituirVariaveis(template.conteudo, dados);
  }

  /**
   * Listar variáveis disponíveis no sistema
   */
  listarVariaveisDisponiveis(): Record<string, string> {
    return {
      '{{nome}}': 'Nome do cliente',
      '{{email}}': 'Email do cliente',
      '{{telefone}}': 'Telefone do cliente',
      '{{ticket}}': 'Número do ticket',
      '{{atendente}}': 'Nome do atendente',
      '{{empresa}}': 'Nome da empresa',
      '{{data}}': 'Data atual',
      '{{hora}}': 'Hora atual',
      '{{protocolo}}': 'Número de protocolo',
      '{{assunto}}': 'Assunto do ticket',
      '{{prioridade}}': 'Prioridade do ticket',
      '{{status}}': 'Status do ticket',
      '{{fila}}': 'Nome da fila',
      '{{departamento}}': 'Nome do departamento',
    };
  }
}
