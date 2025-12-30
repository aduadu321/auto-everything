import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import {
  SearchStationsDto,
  CreateServiceRequestDto,
  CreateOfferDto,
  CreateReviewDto,
} from './dto/marketplace.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // Public endpoints - nu necesită autentificare

  @Get('stations')
  async searchStations(@Query() dto: SearchStationsDto) {
    return this.marketplaceService.searchStations(dto);
  }

  @Get('stations/:slug')
  async getStationBySlug(@Param('slug') slug: string) {
    const station = await this.marketplaceService.getStationBySlug(slug);
    if (!station) {
      return { error: 'Station not found', statusCode: 404 };
    }
    return station;
  }

  @Get('counties')
  async getCounties() {
    return this.marketplaceService.getCounties();
  }

  @Get('reviews/:tenantId')
  async getReviews(
    @Param('tenantId') tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.marketplaceService.getReviews(tenantId, page, limit);
  }

  // Public - oricine poate crea o cerere de serviciu
  @Post('requests')
  async createServiceRequest(@Body() dto: CreateServiceRequestDto) {
    return this.marketplaceService.createServiceRequest(dto);
  }

  // Public - oricine poate lăsa un review
  @Post('reviews')
  async createReview(@Body() dto: CreateReviewDto) {
    return this.marketplaceService.createReview(dto);
  }

  // Protected endpoints - necesită autentificare

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  async getServiceRequests(
    @Query('county') county?: string,
    @Query('serviceType') serviceType?: string,
  ) {
    return this.marketplaceService.getServiceRequests(county, serviceType);
  }

  @Post('offers')
  @UseGuards(JwtAuthGuard)
  async createOffer(
    @Body() dto: CreateOfferDto,
    // În producție ar lua tenantId din JWT token
    @Query('tenantId') tenantId: string,
  ) {
    return this.marketplaceService.createOffer(tenantId, dto);
  }
}
