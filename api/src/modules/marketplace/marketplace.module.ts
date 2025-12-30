import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { PrismaMasterService } from '../../database/prisma-master.service';

@Module({
  controllers: [MarketplaceController],
  providers: [MarketplaceService, PrismaMasterService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
