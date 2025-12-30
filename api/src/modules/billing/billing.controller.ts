import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { IsString, IsOptional } from 'class-validator';

class CreateCheckoutDto {
  @IsString()
  tenantId: string;

  @IsString()
  priceId: string;

  @IsString()
  successUrl: string;

  @IsString()
  cancelUrl: string;
}

class CreatePortalDto {
  @IsString()
  tenantId: string;

  @IsString()
  returnUrl: string;
}

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe Checkout session' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(
      dto.tenantId,
      dto.priceId,
      dto.successUrl,
      dto.cancelUrl,
    );
  }

  @Post('portal')
  @ApiOperation({ summary: 'Create Stripe Billing Portal session' })
  @ApiResponse({ status: 200, description: 'Portal session created' })
  async createPortal(@Body() dto: CreatePortalDto) {
    return this.billingService.createBillingPortalSession(
      dto.tenantId,
      dto.returnUrl,
    );
  }

  @Get('products')
  @ApiOperation({ summary: 'Get available subscription products' })
  async getProducts() {
    return this.stripeService.getProductsWithPrices();
  }

  @Get('subscription/:tenantId')
  @ApiOperation({ summary: 'Get tenant subscription info' })
  async getSubscription(@Req() req: Request) {
    const tenantId = req.params.tenantId;
    return this.billingService.getSubscriptionInfo(tenantId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Res() res: Response,
  ) {
    try {
      const event = this.stripeService.constructWebhookEvent(
        req.rawBody,
        signature,
      );

      await this.billingService.handleWebhookEvent(event);

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  }
}
