// Exemplo de uso do guard de limites no controller de clientes
// Adicione essas importações no início do arquivo:

import { LimitesGuard, VerificarLimites } from '../common/limites.guard';

// E modifique o decorator @Post() assim:

@Post()
@UseGuards(LimitesGuard)
@VerificarLimites({ tipo: 'clientes', operacao: 'criar' })
@ApiOperation({ summary: 'Criar novo cliente' })
@ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
@ApiResponse({ status: 400, description: 'Dados inválidos' })
@ApiResponse({ status: 403, description: 'Limite de clientes atingido' })
async create(
  @CurrentUser() user: User,
  @Body() clienteData: Partial<Cliente>,
) {
  // O resto do código permanece igual
  const cliente = await this.clientesService.create({
    ...clienteData,
    empresa_id: user.empresa_id,
    responsavel_id: user.id,
  });

  // Após criar o cliente, atualizar contador na assinatura
  const assinaturasService = this.moduleRef.get(AssinaturasService);
  const totalClientes = await this.clientesService.count({ empresa_id: user.empresa_id });
  await assinaturasService.atualizarContadores(user.empresa_id, {
    clientesCadastrados: totalClientes
  });

  return {
    success: true,
    data: cliente,
    message: 'Cliente criado com sucesso',
  };
}
