import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';

export interface SubscriptionInfo {
  status: string;
  plan: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  /**
   * Create checkout session for a tenant
   */
  async createCheckoutSession(
    tenantId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const tenant = await this.prisma.master.tenant.findUnique({
      where: { id: tenantId },
      include: { owner: true },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get or create Stripe customer
    let stripeCustomerId = tenant.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripeService.getOrCreateCustomer(
        tenant.owner.email,
        tenant.name,
      );
      stripeCustomerId = customer.id;

      // Save customer ID to tenant
      await this.prisma.master.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId },
      });
    }

    // Create checkout session
    const session = await this.stripeService.createCheckoutSession({
      customerId: stripeCustomerId,
      customerEmail: tenant.owner.email,
      priceId,
      successUrl,
      cancelUrl,
      metadata: {
        tenantId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(tenantId: string, returnUrl: string) {
    const tenant = await this.prisma.master.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant?.stripeCustomerId) {
      throw new Error('No billing account found');
    }

    const session = await this.stripeService.createBillingPortalSession(
      tenant.stripeCustomerId,
      returnUrl,
    );

    return { url: session.url };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenantId;
    if (!tenantId) return;

    this.logger.log(`Checkout completed for tenant: ${tenantId}`);

    // Update tenant with subscription info
    await this.prisma.master.tenant.update({
      where: { id: tenantId },
      data: {
        stripeSubscriptionId: session.subscription as string,
        plan: this.getPlanFromPriceId(session.line_items?.data[0]?.price?.id),
      },
    });
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    const plan = this.getPlanFromPriceId(subscription.items.data[0]?.price?.id);

    await this.prisma.master.tenant.update({
      where: { id: tenantId },
      data: {
        stripeSubscriptionId: subscription.id,
        plan,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    this.logger.log(`Subscription updated for tenant ${tenantId}: ${subscription.status}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await this.prisma.master.tenant.update({
      where: { id: tenantId },
      data: {
        plan: 'FREE',
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
      },
    });

    this.logger.log(`Subscription canceled for tenant: ${tenantId}`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    this.logger.log(`Payment succeeded for invoice: ${invoice.id}`);
    // Could send confirmation email, add SMS credits, etc.
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.warn(`Payment failed for invoice: ${invoice.id}`);
    // Could send payment reminder email
  }

  private getPlanFromPriceId(priceId: string | undefined): string {
    if (!priceId) return 'FREE';

    if (priceId.includes('starter')) return 'STARTER';
    if (priceId.includes('professional')) return 'PROFESSIONAL';
    if (priceId.includes('enterprise')) return 'ENTERPRISE';

    return 'FREE';
  }

  /**
   * Get subscription info for a tenant
   */
  async getSubscriptionInfo(tenantId: string): Promise<SubscriptionInfo | null> {
    const tenant = await this.prisma.master.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant?.stripeSubscriptionId) {
      return null;
    }

    const subscription = await this.stripeService.getSubscription(tenant.stripeSubscriptionId);

    return {
      status: subscription.status,
      plan: tenant.plan,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }
}
