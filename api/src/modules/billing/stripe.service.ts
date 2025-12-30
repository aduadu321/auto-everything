import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface CreateCheckoutSessionParams {
  customerId?: string;
  customerEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  // Stripe Price IDs (configure in Stripe Dashboard)
  public readonly PRICES = {
    STARTER_MONTHLY: 'price_starter_monthly',
    STARTER_YEARLY: 'price_starter_yearly',
    PROFESSIONAL_MONTHLY: 'price_professional_monthly',
    PROFESSIONAL_YEARLY: 'price_professional_yearly',
    ENTERPRISE_MONTHLY: 'price_enterprise_monthly',
    ENTERPRISE_YEARLY: 'price_enterprise_yearly',
  };

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured - billing disabled');
      return;
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });

    this.logger.log('Stripe initialized successfully');
  }

  /**
   * Create a new Stripe customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    return this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });
  }

  /**
   * Get or create a Stripe customer by email
   */
  async getOrCreateCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    // Search for existing customer
    const customers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    return this.createCustomer({ email, name });
  }

  /**
   * Create a Checkout Session for subscription
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      subscription_data: {
        metadata: params.metadata,
      },
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else {
      sessionParams.customer_email = params.customerEmail;
    }

    return this.stripe.checkout.sessions.create(sessionParams);
  }

  /**
   * Create a Billing Portal session for subscription management
   */
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    if (immediately) {
      return this.stripe.subscriptions.cancel(subscriptionId);
    }
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  /**
   * Construct and verify webhook event
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Get all products with prices
   */
  async getProductsWithPrices(): Promise<Stripe.Product[]> {
    const products = await this.stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });
    return products.data;
  }
}
