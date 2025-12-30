import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaMasterService } from '../../database/prisma-master.service';
import {
  SearchStationsDto,
  CreateServiceRequestDto,
  CreateOfferDto,
  CreateReviewDto,
  StationListItem,
  ServiceRequestResponse,
} from './dto/marketplace.dto';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prismaMaster: PrismaMasterService) {}

  async searchStations(dto: SearchStationsDto): Promise<{
    stations: StationListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = dto.page || 1;
    const limit = dto.limit || 10;

    // Mock data pentru stații - în producție ar fi query real la DB
    const mockStations: StationListItem[] = [
      {
        id: '1',
        name: 'MISEDA INSPECT SRL',
        slug: 'miseda-inspect-srl',
        businessType: 'ITP_STATION',
        phone: '0745123456',
        address: 'Strada Principală 123',
        city: 'Suceava',
        county: 'Suceava',
        isVerified: true,
        rating: 4.8,
        reviewCount: 156,
      },
      {
        id: '2',
        name: 'AUTO SERVICE PRIMA',
        slug: 'auto-service-prima',
        businessType: 'AUTO_SERVICE',
        phone: '0745234567',
        address: 'Bulevardul Unirii 45',
        city: 'Suceava',
        county: 'Suceava',
        isVerified: true,
        rating: 4.5,
        reviewCount: 89,
      },
      {
        id: '3',
        name: 'ITP RĂDĂUȚI NORD',
        slug: 'itp-radauti-nord',
        businessType: 'ITP_STATION',
        phone: '0745345678',
        address: 'Strada Sucevei 78',
        city: 'Rădăuți',
        county: 'Suceava',
        isVerified: false,
        rating: 4.2,
        reviewCount: 45,
      },
      {
        id: '4',
        name: 'EURO SERVICE AUTO',
        slug: 'euro-service-auto',
        businessType: 'MULTI_SERVICE',
        phone: '0745456789',
        address: 'Calea Obcinilor 156',
        city: 'Suceava',
        county: 'Suceava',
        isVerified: true,
        rating: 4.7,
        reviewCount: 234,
      },
      {
        id: '5',
        name: 'VULCANIZARE RAPID',
        slug: 'vulcanizare-rapid',
        businessType: 'TIRE_SHOP',
        phone: '0745567890',
        address: 'Strada Industriei 23',
        city: 'Fălticeni',
        county: 'Suceava',
        isVerified: false,
        rating: 4.0,
        reviewCount: 28,
      },
    ];

    // Filtrare după query
    let filtered = mockStations;
    if (dto.query) {
      const query = dto.query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.address?.toLowerCase().includes(query) ||
          s.city?.toLowerCase().includes(query)
      );
    }

    // Filtrare după businessType
    if (dto.businessType) {
      filtered = filtered.filter((s) => s.businessType === dto.businessType);
    }

    // Filtrare după county
    if (dto.county) {
      filtered = filtered.filter((s) => s.county === dto.county);
    }

    // Filtrare după city
    if (dto.city) {
      filtered = filtered.filter((s) => s.city === dto.city);
    }

    // Paginare
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedStations = filtered.slice(startIndex, startIndex + limit);

    return {
      stations: paginatedStations,
      total,
      page,
      limit,
    };

    // TODO: Real implementation with Prisma when DB is ready
    /*
    const where: any = {
      isListed: true,
      isActive: true,
    };

    if (dto.query) {
      where.OR = [
        { name: { contains: dto.query, mode: 'insensitive' } },
        { address: { contains: dto.query, mode: 'insensitive' } },
        { city: { contains: dto.query, mode: 'insensitive' } },
      ];
    }

    if (dto.businessType) {
      where.businessType = dto.businessType;
    }

    if (dto.county) {
      where.county = dto.county;
    }

    const [stations, total] = await Promise.all([
      this.prismaMaster.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }],
      }),
      this.prismaMaster.tenant.count({ where }),
    ]);

    return {
      stations: stations.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        businessType: s.businessType,
        phone: s.phone,
        address: s.address,
        city: s.city,
        county: s.county,
        isVerified: s.isVerified,
        rating: s.rating,
        reviewCount: s.reviewCount,
      })),
      total,
      page,
      limit,
    };
    */
  }

  async getStationBySlug(slug: string): Promise<StationListItem | null> {
    // Mock data
    const mockStations: StationListItem[] = [
      {
        id: '1',
        name: 'MISEDA INSPECT SRL',
        slug: 'miseda-inspect-srl',
        businessType: 'ITP_STATION',
        phone: '0745123456',
        address: 'Strada Principală 123',
        city: 'Suceava',
        county: 'Suceava',
        isVerified: true,
        rating: 4.8,
        reviewCount: 156,
      },
    ];

    return mockStations.find((s) => s.slug === slug) || null;
  }

  async createServiceRequest(dto: CreateServiceRequestDto): Promise<ServiceRequestResponse> {
    // Mock response - în producție ar crea în DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
      id: 'req_' + Math.random().toString(36).substr(2, 9),
      clientPhone: dto.clientPhone,
      vehiclePlate: dto.vehiclePlate,
      serviceType: dto.serviceType,
      status: 'OPEN',
      offersCount: 0,
      createdAt: new Date(),
      expiresAt,
    };

    // TODO: Real implementation
    /*
    const request = await this.prismaMaster.serviceRequest.create({
      data: {
        clientPhone: dto.clientPhone,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        vehiclePlate: dto.vehiclePlate,
        vehicleMake: dto.vehicleMake,
        vehicleModel: dto.vehicleModel,
        vehicleYear: dto.vehicleYear,
        serviceType: dto.serviceType as any,
        preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
        county: dto.county,
        location: dto.location,
        maxDistance: dto.maxDistance,
        notes: dto.notes,
        expiresAt: expiresAt,
      },
    });

    return {
      id: request.id,
      clientPhone: request.clientPhone,
      vehiclePlate: request.vehiclePlate,
      serviceType: request.serviceType,
      status: request.status,
      offersCount: 0,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
    };
    */
  }

  async getServiceRequests(county?: string, serviceType?: string): Promise<ServiceRequestResponse[]> {
    // Mock data
    return [
      {
        id: 'req_abc123',
        clientPhone: '0745***789',
        vehiclePlate: 'SV 01 ***',
        serviceType: 'ITP',
        status: 'OPEN',
        offersCount: 3,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'req_def456',
        clientPhone: '0722***123',
        vehiclePlate: 'B 123 ***',
        serviceType: 'SERVICE',
        status: 'OPEN',
        offersCount: 1,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  async createOffer(tenantId: string, dto: CreateOfferDto): Promise<{ id: string; status: string }> {
    // Mock response
    return {
      id: 'offer_' + Math.random().toString(36).substr(2, 9),
      status: 'PENDING',
    };
  }

  async createReview(dto: CreateReviewDto): Promise<{ id: string; status: string }> {
    // Mock response
    return {
      id: 'review_' + Math.random().toString(36).substr(2, 9),
      status: 'published',
    };
  }

  async getReviews(tenantId: string, page = 1, limit = 10): Promise<{
    reviews: any[];
    total: number;
    averageRating: number;
  }> {
    // Mock data
    return {
      reviews: [
        {
          id: '1',
          clientName: 'Ion P.',
          rating: 5,
          comment: 'Servicii excelente, recomand!',
          serviceType: 'ITP',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isVerified: true,
        },
        {
          id: '2',
          clientName: 'Maria I.',
          rating: 4,
          comment: 'Rapid și profesionist',
          serviceType: 'ITP',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          isVerified: true,
        },
      ],
      total: 156,
      averageRating: 4.8,
    };
  }

  async getCounties(): Promise<string[]> {
    return [
      'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani',
      'Brașov', 'Brăila', 'București', 'Buzău', 'Caraș-Severin', 'Călărași',
      'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu',
      'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș',
      'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Satu Mare', 'Sălaj',
      'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea',
    ];
  }
}
