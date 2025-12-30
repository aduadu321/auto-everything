import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantDatabaseService } from '../../database/tenant.service';

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    slug: string;
    name: string;
    databaseUrl: string;
    plan: string;
    smsCredits: number;
  };
  tenantDb?: any; // Tenant Prisma client
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantDbService: TenantDatabaseService) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    // For single-tenant mode, always use the default tenant
    req.tenant = {
      id: 'default',
      slug: 'miseda',
      name: 'MISEDA INSPECT SRL',
      databaseUrl: process.env.TENANT_DATABASE_URL || process.env.DATABASE_URL || '',
      plan: 'PROFESSIONAL',
      smsCredits: 1000,
    };

    // Get tenant database connection
    req.tenantDb = await this.tenantDbService.getConnection();

    next();
  }
}
