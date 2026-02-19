import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AssinaturasService } from './assinaturas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CriarAssinaturaDto } from './dto/criar-assinatura.dto';
import { CriarCheckoutDto } from './dto/criar-checkout.dto';
import { MercadoPagoService } from '../mercado-pago/mercado-pago.service';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { UserRole } from '../users/user.entity';
import type { Request } from 'express';

@Controller('assinaturas')
@UseGuards(JwtAuthGuard, EmpresaGuard, RolesGuard)
export class AssinaturasController {
  constructor(
    private readonly assinaturasService: AssinaturasService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  @Get()
  async listar(
    @EmpresaId() empresaId: string,
    @Query('status') status?: 'ativa' | 'cancelada' | 'suspensa' | 'pendente',
  ) {
    const assinatura = await this.assinaturasService.buscarPorEmpresa(empresaId);
    if (!assinatura) {
      return [];
    }
    if (status && assinatura.status !== status) {
      return [];
    }
    return [assinatura];
  }

  @Get('empresa/:empresaId')
  async buscarPorEmpresa(
    @EmpresaId() empresaId: string,
    @Param('empresaId') _empresaIdIgnorado: string,
  ) {
    return this.assinaturasService.buscarPorEmpresa(empresaId);
  }

  @Get('empresa/:empresaId/limites')
  async verificarLimites(
    @EmpresaId() empresaId: string,
    @Param('empresaId') _empresaIdIgnorado: string,
  ) {
    return this.assinaturasService.verificarLimites(empresaId);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async criar(@EmpresaId() empresaId: string, @Body() dados: CriarAssinaturaDto) {
    return this.assinaturasService.criar({
      ...dados,
      empresaId,
    });
  }

  @Post('checkout')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async criarCheckout(
    @EmpresaId() empresaId: string,
    @Body() dados: CriarCheckoutDto,
    @Req() req: Request,
  ) {
    const assinatura = await this.assinaturasService.criarAssinaturaPendenteParaCheckout(
      empresaId,
      dados.planoId,
    );

    const originHeader = req.headers.origin;
    const frontendBaseUrl =
      typeof originHeader === 'string' && originHeader.trim()
        ? originHeader.trim()
        : `${req.protocol}://${req.get('host')}`;

    const backendBaseUrl = `${req.protocol}://${req.get('host')}`;

    const externalReference = `conectcrm:empresa:${empresaId}:assinatura:${assinatura.id}`;
    const preference = await this.mercadoPagoService.createPreference({
      items: [
        {
          id: assinatura.id,
          title: `Assinatura ${assinatura.plano?.nome ?? 'ConectCRM'}`,
          currency_id: 'BRL',
          quantity: 1,
          unit_price: Number(assinatura.valorMensal),
        },
      ],
      payer: {
        name: '',
        surname: '',
        email: (req as any)?.user?.email || '',
      },
      back_urls: {
        success: `${frontendBaseUrl}/billing?status=success`,
        failure: `${frontendBaseUrl}/billing?status=error`,
        pending: `${frontendBaseUrl}/billing?status=pending`,
      },
      auto_return: 'approved',
      payment_methods: {},
      notification_url: `${backendBaseUrl}/mercadopago/webhooks`,
      statement_descriptor: 'ConectCRM',
      external_reference: externalReference,
      expires: false,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return {
      assinaturaId: assinatura.id,
      externalReference,
      preferenceId: preference?.id,
      initPoint: preference?.init_point,
      sandboxInitPoint: preference?.sandbox_init_point,
    };
  }

  @Patch('empresa/:empresaId/plano')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async alterarPlano(
    @EmpresaId() empresaId: string,
    @Param('empresaId') _empresaIdIgnorado: string,
    @Body('novoPlanoId') novoPlanoId: string,
  ) {
    return this.assinaturasService.alterarPlano(empresaId, novoPlanoId);
  }

  @Patch('empresa/:empresaId/cancelar')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async cancelar(
    @EmpresaId() empresaId: string,
    @Param('empresaId') _empresaIdIgnorado: string,
    @Body('dataFim') dataFim?: string,
  ) {
    const dataFimParsed = dataFim ? new Date(dataFim) : undefined;
    return this.assinaturasService.cancelar(empresaId, dataFimParsed);
  }

  @Patch('empresa/:empresaId/suspender')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async suspender(@EmpresaId() empresaId: string, @Param('empresaId') _empresaIdIgnorado: string) {
    return this.assinaturasService.suspender(empresaId);
  }

  @Patch('empresa/:empresaId/reativar')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async reativar(@EmpresaId() empresaId: string, @Param('empresaId') _empresaIdIgnorado: string) {
    return this.assinaturasService.reativar(empresaId);
  }

  @Patch('empresa/:empresaId/contadores')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async atualizarContadores(
    @EmpresaId() empresaId: string,
    @Param('empresaId') _empresaIdIgnorado: string,
    @Body()
    dados: {
      usuariosAtivos?: number;
      clientesCadastrados?: number;
      storageUtilizado?: number;
    },
  ) {
    return this.assinaturasService.atualizarContadores(empresaId, dados);
  }

  @Post('empresa/:empresaId/api-call')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async registrarChamadaApi(
    @EmpresaId() empresaId: string,
    @Param('empresaId') _empresaIdIgnorado: string,
  ) {
    const permiteCall = await this.assinaturasService.registrarChamadaApi(empresaId);

    return {
      success: true,
      permiteCall,
      message: permiteCall ? 'Chamada API registrada' : 'Limite de chamadas API excedido',
    };
  }
}
