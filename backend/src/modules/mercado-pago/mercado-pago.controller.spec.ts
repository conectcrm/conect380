import { HttpException, HttpStatus } from '@nestjs/common';
import { MercadoPagoController } from './mercado-pago.controller';
import { MercadoPagoService } from './mercado-pago.service';

describe('MercadoPagoController', () => {
  let controller: MercadoPagoController;
  let mercadoPagoService: jest.Mocked<Pick<MercadoPagoService, 'getInstallments'>>;

  beforeEach(() => {
    mercadoPagoService = {
      getInstallments: jest.fn(),
    };

    controller = new MercadoPagoController(mercadoPagoService as unknown as MercadoPagoService);
  });

  it('deve buscar parcelas quando amount e paymentMethodId forem validos', async () => {
    mercadoPagoService.getInstallments.mockResolvedValueOnce({
      installments: [{ installments: 1, installment_amount: 100 }],
    } as any);

    const result = await controller.getInstallments('100', 'visa');

    expect(mercadoPagoService.getInstallments).toHaveBeenCalledWith(100, 'visa');
    expect(result).toEqual({
      installments: [{ installments: 1, installment_amount: 100 }],
    });
  });

  it('deve rejeitar amount invalido', async () => {
    await expect(controller.getInstallments('0', 'visa')).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      message: 'amount deve ser um numero maior que zero',
    });

    await expect(controller.getInstallments('abc', 'visa')).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      message: 'amount deve ser um numero maior que zero',
    });

    expect(mercadoPagoService.getInstallments).not.toHaveBeenCalled();
  });

  it('deve rejeitar paymentMethodId ausente', async () => {
    await expect(controller.getInstallments('100', '')).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      message: 'paymentMethodId e obrigatorio',
    });

    await expect(controller.getInstallments('100', '   ')).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      message: 'paymentMethodId e obrigatorio',
    });

    expect(mercadoPagoService.getInstallments).not.toHaveBeenCalled();
  });

  it('deve preservar HttpException do service', async () => {
    mercadoPagoService.getInstallments.mockRejectedValueOnce(
      new HttpException('falha de validacao externa', HttpStatus.BAD_REQUEST),
    );

    await expect(controller.getInstallments('100', 'visa')).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      message: 'falha de validacao externa',
    });
  });

  it('deve mapear erro inesperado para 500', async () => {
    mercadoPagoService.getInstallments.mockRejectedValueOnce(new Error('unexpected'));

    await expect(controller.getInstallments('100', 'visa')).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'unexpected',
    });
  });
});
