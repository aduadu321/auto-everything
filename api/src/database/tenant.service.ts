import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as TenantPrismaClient } from '.prisma/tenant';

@Injectable()
export class TenantDatabaseService implements OnModuleDestroy {
  private client: TenantPrismaClient;

  constructor() {
    this.client = new TenantPrismaClient({
      datasources: {
        db: { url: process.env.TENANT_DATABASE_URL || process.env.DATABASE_URL },
      },
    });
  }

  /**
   * Get the single tenant Prisma client
   */
  async getConnection(_databaseUrl?: string): Promise<TenantPrismaClient> {
    return this.client;
  }

  /**
   * Get the client directly (for single-tenant mode)
   */
  getClient(): TenantPrismaClient {
    return this.client;
  }

  /**
   * Clean up connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
