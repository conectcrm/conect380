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
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AssinaturasService } from './assinaturas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions/permissions.constants';
import { CriarAssinaturaDto } from './dto/criar-assinatura.dto';
import { CriarCheckoutDto } from './dto/criar-checkout.dto';
import { MercadoPagoService } from '../mercado-pago/mercado-pago.service';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { UserRole } from '../users/user.entity';
import type { Request } from 'express';
import { AssinaturaStatus, toCanonicalAssinaturaStatus } from './entities/assinatura-empresa.entity';
import { AssinaturaDueDateSchedulerService } from './assinatura-due-date-scheduler.service';
import { LegacyAdminTransitionGuard } from '../admin/guards/legacy-admin-transition.guard';
import { GatewayProvider } from '../pagamentos/entities/configuracao-gateway.entity';
import { assertGatewayProviderEnabled } from '../pagamentos/services/gateway-provider-support.util';

@Controller('assinaturas')
@UseGuards(JwtAuthGuard, EmpresaGuard, RolesGuard, PermissionsGuard)
@Permissions(Permission.PLANOS_MANAGE)
export class AssinaturasController {
  private readonly logger = new Logger(AssinaturasController.name);

  constructor(
    private readonly assinaturasService: AssinaturasService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly assinaturaDueDateSchedulerService: AssinaturaDueDateSchedulerService,
  ) {}

  private isTruthy(value?: string | null): boolean {
    return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
  }

  private normalizeBaseUrl(value?: string | null): string | null {
    const raw = String(value || '').trim();
    if (!raw) {
      return null;
    }

    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }

      return parsed.toString().replace(/\/+$/, '');
    } catch {
      return null;
    }
  }

  private isLocalOrPrivateUrl(value?: string | null): boolean {
    const normalized = this.normalizeBaseUrl(value);
    if (!normalized) {
      return false;
    }

    try {
      const parsed = new URL(normalized);
      const host = parsed.hostname.toLowerCase();

      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host.endsWith('.local')
      ) {
        return true;
      }

      if (host.startsWith('10.') || host.startsWith('192.168.')) {
        return true;
      }

      const is172Private = /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
      if (is172Private) {
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  @Get()
  async listar(
    @EmpresaId() empresaId: string,
    @Query('status') status?: AssinaturaStatus,
  ) {
    const assinatura = await this.assinaturasService.buscarPorEmpresa(empresaId);
    if (!assinatura) {
      return [];
    }
    if (
      status &&
      toCanonicalAssinaturaStatus(assinatura.status) !== toCanonicalAssinaturaStatus(status)
    ) {
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
  @UseGuards(LegacyAdminTransitionGuard)
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
    assertGatewayProviderEnabled(GatewayProvider.MERCADO_PAGO);
    this.mercadoPagoService.assertCheckoutReady();

    const originHeader = req.headers.origin;
    const originCandidate = typeof originHeader === 'string' ? originHeader.trim() : '';
    const requestBaseCandidate = this.normalizeBaseUrl(`${req.protocol}://${req.get('host')}`);
    const frontendBaseUrl =
      this.normalizeBaseUrl(process.env.FRONTEND_URL) ||
      this.normalizeBaseUrl(originCandidate) ||
      requestBaseCandidate;
    const backendBaseUrl =
      this.normalizeBaseUrl(process.env.WEBHOOK_BASE_URL) || requestBaseCandidate;
    const mockEnabled = this.isTruthy(process.env.MERCADO_PAGO_MOCK);

    if (!frontendBaseUrl) {
      throw new BadRequestException(
        'Nao foi possivel resolver FRONTEND_URL para checkout. Configure FRONTEND_URL no backend.',
      );
    }

    if (!mockEnabled && this.isLocalOrPrivateUrl(frontendBaseUrl)) {
      throw new BadRequestException(
        'Checkout Mercado Pago exige URL publica no retorno. Configure FRONTEND_URL com dominio HTTPS publico (ex.: ngrok ou dominio oficial).',
      );
    }

    if (!backendBaseUrl) {
      throw new BadRequestException(
        'Nao foi possivel resolver WEBHOOK_BASE_URL para notificacoes do Mercado Pago.',
      );
    }

    if (!mockEnabled && this.isLocalOrPrivateUrl(backendBaseUrl)) {
      this.logger.warn(
        `WEBHOOK_BASE_URL local/privado (${backendBaseUrl}) pode impedir callbacks do Mercado Pago. Configure WEBHOOK_BASE_URL publico.`,
      );
    }

    const assinatura = await this.assinaturasService.criarAssinaturaPendenteParaCheckout(
      empresaId,
      dados.planoId,
    );

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
  @UseGuards(LegacyAdminTransitionGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async suspender(@EmpresaId() empresaId: string, @Param('empresaId') _empresaIdIgnorado: string) {
    return this.assinaturasService.suspender(empresaId);
  }

  @Patch('empresa/:empresaId/reativar')
  @UseGuards(LegacyAdminTransitionGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async reativar(@EmpresaId() empresaId: string, @Param('empresaId') _empresaIdIgnorado: string) {
    return this.assinaturasService.reativar(empresaId);
  }

  @Patch('empresa/:empresaId/contadores')
  @UseGuards(LegacyAdminTransitionGuard)
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
  @UseGuards(LegacyAdminTransitionGuard)
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

  @Post('jobs/vencimento/executar')
  @UseGuards(LegacyAdminTransitionGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async executarJobVencimento() {
    return this.assinaturaDueDateSchedulerService.runDueDateStatusCycle();
  }
}
