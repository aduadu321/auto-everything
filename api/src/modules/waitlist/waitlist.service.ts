import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface WaitlistEntry {
  id: string;
  email: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
  source?: string;
  createdAt: Date;
}

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(private prisma: PrismaService) {}

  async addToWaitlist(data: {
    email: string;
    phone?: string;
    businessName?: string;
    businessType?: string;
    source?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Check if email already exists
      const existing = await this.prisma.master.waitlistEntry.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        return {
          success: true,
          message: 'Already on waitlist',
        };
      }

      // Add to waitlist
      await this.prisma.master.waitlistEntry.create({
        data: {
          email: data.email,
          phone: data.phone,
          businessName: data.businessName,
          businessType: data.businessType,
          source: data.source || 'landing_page',
        },
      });

      this.logger.log(`New waitlist signup: ${data.email}`);

      return {
        success: true,
        message: 'Successfully added to waitlist',
      };
    } catch (error) {
      this.logger.error(`Failed to add to waitlist: ${error.message}`);
      throw error;
    }
  }

  async getWaitlistCount(): Promise<number> {
    return this.prisma.master.waitlistEntry.count();
  }

  async getAllEntries(): Promise<WaitlistEntry[]> {
    return this.prisma.master.waitlistEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
