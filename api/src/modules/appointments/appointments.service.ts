import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SmsService } from '../sms/sms.service';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
  WorkingHoursDto,
  CreateHolidayDto,
  AppointmentStatus,
  ItpResult
} from './dto/appointment.dto';

// Numărul de telefon al proprietarului pentru notificări SMS
const OWNER_PHONE = '0756596565';
// Email-ul pentru notificări de aprobare programări
const ADMIN_EMAIL = 'aduadu321@gmail.com';
// URL-ul de bază pentru link-urile de aprobare (se schimbă în producție)
const BASE_URL = process.env.APP_URL || 'https://misedainspectsrl.ro';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  // ==================== APPOINTMENTS ====================

  async create(dto: CreateAppointmentDto) {
    // Check if slot is available
    const isAvailable = await this.isSlotAvailable(
      dto.appointmentDate,
      dto.startTime,
      dto.duration || 60
    );

    if (!isAvailable) {
      throw new ConflictException('Acest interval orar nu este disponibil');
    }

    // Generate confirmation code and approval token
    const confirmationCode = this.generateConfirmationCode();
    const approvalToken = this.generateApprovalToken();

    // Calculate end time
    const endTime = dto.endTime || this.calculateEndTime(dto.startTime, dto.duration || 60);

    // Try to find existing client by phone
    let clientId = dto.clientId;
    if (!clientId) {
      const existingClient = await this.prisma.client.findUnique({
        where: { phone: dto.clientPhone },
      });
      if (existingClient) {
        clientId = existingClient.id;
      }
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        vehiclePlate: dto.vehiclePlate,
        vehicleMake: dto.vehicleMake,
        vehicleModel: dto.vehicleModel,
        vehicleYear: dto.vehicleYear,
        vehicleCategory: dto.vehicleCategory || 'AUTOTURISM',
        serviceType: dto.serviceType,
        serviceNotes: dto.serviceNotes,
        appointmentDate: new Date(dto.appointmentDate),
        startTime: dto.startTime,
        endTime,
        duration: dto.duration || 30, // Default 30 minutes for ITP
        confirmationCode,
        approvalToken,
        clientId,
      },
      include: {
        client: true,
      },
    });

    // Trimite Email notificare către admin cu link-uri Accept/Refuz
    try {
      await this.sendApprovalEmail(appointment, approvalToken);
      this.logger.log(`Email aprobare trimis pentru programare: ${confirmationCode}`);
    } catch (error) {
      // Nu blocăm crearea programării dacă email-ul eșuează
      this.logger.error(`Eroare la trimiterea email aprobare: ${error.message}`);
    }

    return appointment;
  }

  async findAll(query: AppointmentQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.startDate || query.endDate) {
      where.appointmentDate = {};
      if (query.startDate) {
        where.appointmentDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.appointmentDate.lte = new Date(query.endDate);
      }
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.search) {
      where.OR = [
        { clientName: { contains: query.search, mode: 'insensitive' } },
        { clientPhone: { contains: query.search } },
        { vehiclePlate: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { appointmentDate: 'asc' },
          { startTime: 'asc' },
        ],
        include: {
          client: true,
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            vehicles: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    return appointment;
  }

  async findByConfirmationCode(code: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { confirmationCode: code },
      include: {
        client: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    return appointment;
  }

  async findByPhone(phone: string) {
    // Normalize phone number - remove spaces and dashes
    const normalizedPhone = phone.replace(/[\s\-]/g, '');

    const appointments = await this.prisma.appointment.findMany({
      where: {
        clientPhone: {
          contains: normalizedPhone,
        },
      },
      orderBy: [
        { appointmentDate: 'desc' },
        { startTime: 'desc' },
      ],
      include: {
        client: true,
      },
    });

    return appointments;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    // If changing date/time, check availability
    if (dto.appointmentDate || dto.startTime || dto.duration) {
      const date = dto.appointmentDate || appointment.appointmentDate.toISOString().split('T')[0];
      const time = dto.startTime || appointment.startTime;
      const duration = dto.duration || appointment.duration;

      const isAvailable = await this.isSlotAvailable(date, time, duration, id);

      if (!isAvailable) {
        throw new ConflictException('Acest interval orar nu este disponibil');
      }
    }

    // Calculate new end time if needed
    let endTime = dto.endTime;
    if ((dto.startTime || dto.duration) && !endTime) {
      const startTime = dto.startTime || appointment.startTime;
      const duration = dto.duration || appointment.duration;
      endTime = this.calculateEndTime(startTime, duration);
    }

    return await this.prisma.appointment.update({
      where: { id },
      data: {
        ...dto,
        appointmentDate: dto.appointmentDate ? new Date(dto.appointmentDate) : undefined,
        endTime,
      },
      include: {
        client: true,
      },
    });
  }

  async confirm(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    if (appointment.status !== 'PENDING') {
      throw new BadRequestException('Doar programările în așteptare pot fi confirmate');
    }

    // 1. Creează sau actualizează clientul în baza de date
    const nameParts = appointment.clientName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

    let client = await this.prisma.client.findUnique({
      where: { phone: appointment.clientPhone },
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          firstName,
          lastName,
          phone: appointment.clientPhone,
          email: appointment.clientEmail,
          preferSms: true,
        },
      });
      this.logger.log(`Client nou creat: ${client.id} - ${appointment.clientName}`);
    }

    // 2. Creează sau actualizează vehiculul
    let vehicle = null;
    if (appointment.vehiclePlate) {
      vehicle = await this.prisma.vehicle.findUnique({
        where: { plateNumber: appointment.vehiclePlate },
      });

      if (!vehicle) {
        vehicle = await this.prisma.vehicle.create({
          data: {
            plateNumber: appointment.vehiclePlate,
            make: appointment.vehicleMake || 'Necunoscut',
            model: appointment.vehicleModel || 'Necunoscut',
            year: appointment.vehicleYear,
            clientId: client.id,
          },
        });
        this.logger.log(`Vehicul nou creat: ${vehicle.id} - ${appointment.vehiclePlate}`);
      } else {
        // Actualizează informațiile vehiculului dacă sunt noi
        if (appointment.vehicleMake || appointment.vehicleModel || appointment.vehicleYear) {
          vehicle = await this.prisma.vehicle.update({
            where: { id: vehicle.id },
            data: {
              make: appointment.vehicleMake || vehicle.make,
              model: appointment.vehicleModel || vehicle.model,
              year: appointment.vehicleYear || vehicle.year,
            },
          });
        }
      }
    }

    // 3. Actualizează programarea cu legătura la client
    const confirmedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        clientId: client.id,
      },
      include: {
        client: true,
      },
    });

    // 4. Trimite SMS de confirmare către client
    try {
      const appointmentDate = new Date(appointment.appointmentDate);
      const dateStr = appointmentDate.toLocaleDateString('ro-RO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      const smsMessage = `MISEDA ITP: Programarea dvs. este CONFIRMATA pentru ${dateStr}, ora ${appointment.startTime}. Va asteptam cu: CI/BI, talon, asigurare RCA valabila. Tel: 0756596565`;

      await this.smsService.sendSms(appointment.clientPhone, smsMessage);
      this.logger.log(`SMS confirmare trimis către client: ${appointment.clientPhone}`);
    } catch (error) {
      this.logger.error(`Eroare la trimiterea SMS confirmare: ${error.message}`);
    }

    return confirmedAppointment;
  }

  // ==================== QUICK ADMIS ====================
  // Marchează rapid o programare ca ADMIS și creează documentul ITP
  async quickAdmis(id: string, notes?: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      throw new BadRequestException('Această programare este deja finalizată sau anulată');
    }

    // 1. Creează sau actualizează clientul
    const nameParts = appointment.clientName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

    let client = await this.prisma.client.findUnique({
      where: { phone: appointment.clientPhone },
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          firstName,
          lastName,
          phone: appointment.clientPhone,
          email: appointment.clientEmail,
          preferSms: true,
        },
      });
      this.logger.log(`Client creat: ${client.id} - ${appointment.clientName}`);
    }

    // 2. Creează sau actualizează vehiculul
    let vehicle = null;
    if (appointment.vehiclePlate) {
      vehicle = await this.prisma.vehicle.findUnique({
        where: { plateNumber: appointment.vehiclePlate },
      });

      if (!vehicle) {
        vehicle = await this.prisma.vehicle.create({
          data: {
            plateNumber: appointment.vehiclePlate,
            make: appointment.vehicleMake || 'Necunoscut',
            model: appointment.vehicleModel || 'Necunoscut',
            year: appointment.vehicleYear,
            clientId: client.id,
          },
        });
        this.logger.log(`Vehicul creat: ${vehicle.id} - ${appointment.vehiclePlate}`);
      } else {
        // Actualizează dacă avem date noi
        vehicle = await this.prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            make: appointment.vehicleMake || vehicle.make,
            model: appointment.vehicleModel || vehicle.model,
            year: appointment.vehicleYear || vehicle.year,
            clientId: client.id,
          },
        });
      }

      // 3. Calculează valabilitatea și creează documentul ITP
      const validityMonths = this.calculateItpValidityMonths(
        appointment.vehicleCategory,
        appointment.vehicleYear || vehicle.year,
      );

      const issueDate = new Date(appointment.appointmentDate);
      const expiryDate = new Date(appointment.appointmentDate);
      expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

      // Marchează ITP-urile vechi ca RENEWED
      await this.prisma.document.updateMany({
        where: {
          vehicleId: vehicle.id,
          type: 'ITP',
          status: { in: ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] },
        },
        data: { status: 'RENEWED' },
      });

      // Creează documentul ITP nou
      const itpDocument = await this.prisma.document.create({
        data: {
          type: 'ITP',
          issueDate,
          expiryDate,
          issuedBy: 'MISEDA INSPECT SRL - Statie ITP Radauti',
          vehicleId: vehicle.id,
          status: 'ACTIVE',
          notes: `Valabilitate: ${validityMonths} luni (${validityMonths / 12} ani). Categorie: ${appointment.vehicleCategory}. ${notes || ''}`,
        },
      });

      this.logger.log(`ITP creat: ${itpDocument.id} - Expira: ${expiryDate.toLocaleDateString('ro-RO')}`);

      // 4. Trimite SMS către client
      try {
        const expiryStr = expiryDate.toLocaleDateString('ro-RO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const smsMessage = `MISEDA ITP: ${appointment.vehiclePlate} - ADMIS! Valabil pana la ${expiryStr}. Va multumim! Tel: 0756596565`;

        await this.smsService.sendSms(appointment.clientPhone, smsMessage);
        this.logger.log(`SMS ADMIS trimis: ${appointment.clientPhone}`);
      } catch (error) {
        this.logger.error(`Eroare SMS: ${error.message}`);
      }
    }

    // 5. Actualizează programarea
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        itpResult: 'ADMIS',
        itpNotes: notes,
        clientId: client.id,
        confirmedAt: appointment.confirmedAt || new Date(),
      },
      include: { client: true },
    });

    return updated;
  }

  // Calculează valabilitatea ITP în luni
  private calculateItpValidityMonths(
    category: string,
    vehicleYear?: number | null,
    isSpecialUse: boolean = false, // taxi, transport copii, școală auto
  ): number {
    const currentYear = new Date().getFullYear();
    const vehicleAge = vehicleYear ? currentYear - vehicleYear : 0;

    // Taxi M1, Transport alternativ, Transport copii M1/M2 - 6 luni
    if (isSpecialUse) {
      return 6;
    }

    // Autoutilitară N1 - 1 an
    if (category === 'AUTOUTILITARA') {
      return 12;
    }

    // Autoturism M1
    if (category === 'AUTOTURISM') {
      // Vehicule noi (primele 3 ani) - fără ITP obligatoriu, dar dacă fac = 2 ani
      // Vehicule 4-12 ani - 2 ani
      // Vehicule > 12 ani - 1 an
      if (vehicleAge <= 12) {
        return 24; // 2 ani
      } else {
        return 12; // 1 an
      }
    }

    // Motocicletă, ATV - 2 ani
    if (category === 'MOTOCICLETA' || category === 'ATV') {
      return 24;
    }

    // Remorcă - 2 ani
    if (category === 'REMORCA') {
      return 24;
    }

    // Default - 1 an
    return 12;
  }

  async cancel(id: string, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException('Nu se poate anula o programare finalizată');
    }

    return await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
      include: {
        client: true,
      },
    });
  }

  async complete(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    return await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
      include: {
        client: true,
      },
    });
  }

  async noShow(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    return await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'NO_SHOW',
      },
      include: {
        client: true,
      },
    });
  }

  // ==================== ITP SPECIFIC ====================

  async startInspection(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Doar programările confirmate pot fi începute');
    }

    return await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
      },
      include: {
        client: true,
      },
    });
  }

  async markRarBlocked(id: string, notes?: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    if (appointment.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Doar inspecțiile în desfășurare pot fi blocate RAR');
    }

    // Extend the end time by 45 minutes when blocked by RAR
    const newEndTime = this.calculateEndTime(appointment.startTime, appointment.duration + 45);

    return await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'RAR_BLOCKED',
        isRarBlocked: true,
        rarBlockedAt: new Date(),
        rarNotes: notes,
        endTime: newEndTime,
        duration: appointment.duration + 45,
      },
      include: {
        client: true,
      },
    });
  }

  async setItpResult(id: string, result: ItpResult, notes?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    if (!['IN_PROGRESS', 'RAR_BLOCKED'].includes(appointment.status)) {
      throw new BadRequestException('Doar inspecțiile în desfășurare pot primi rezultat');
    }

    // Dacă rezultatul este ADMIS sau ADMIS_OBS, creează documentul ITP
    if ((result === 'ADMIS' || result === 'ADMIS_OBS') && appointment.vehiclePlate) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { plateNumber: appointment.vehiclePlate },
      });

      if (vehicle) {
        // Calculează valabilitatea ITP
        const validityMonths = this.calculateItpValidityMonths(
          appointment.vehicleCategory,
          appointment.vehicleYear || vehicle.year,
        );

        const issueDate = new Date(appointment.appointmentDate);
        const expiryDate = new Date(appointment.appointmentDate);
        expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

        // Marchează documentele ITP vechi ca RENEWED
        await this.prisma.document.updateMany({
          where: {
            vehicleId: vehicle.id,
            type: 'ITP',
            status: { in: ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] },
          },
          data: {
            status: 'RENEWED',
          },
        });

        // Creează documentul ITP nou
        const itpDocument = await this.prisma.document.create({
          data: {
            type: 'ITP',
            issueDate,
            expiryDate,
            issuedBy: 'MISEDA INSPECT SRL - Statie ITP Radauti',
            vehicleId: vehicle.id,
            status: 'ACTIVE',
            notes: `Valabilitate: ${validityMonths} luni. Categorie: ${appointment.vehicleCategory}. ${notes || ''}`,
          },
        });

        this.logger.log(`Document ITP creat: ${itpDocument.id} - Valabil până la ${expiryDate.toLocaleDateString('ro-RO')}`);

        // Trimite SMS către client cu rezultatul și data expirării
        if (appointment.clientPhone) {
          try {
            const expiryStr = expiryDate.toLocaleDateString('ro-RO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            const resultText = result === 'ADMIS' ? 'ADMIS' : 'ADMIS cu observatii';
            const smsMessage = `MISEDA ITP: Vehicul ${appointment.vehiclePlate} - ${resultText}! ITP valabil pana la ${expiryStr}. Va multumim!`;

            await this.smsService.sendSms(appointment.clientPhone, smsMessage);
            this.logger.log(`SMS rezultat ITP trimis către: ${appointment.clientPhone}`);
          } catch (error) {
            this.logger.error(`Eroare la trimiterea SMS rezultat: ${error.message}`);
          }
        }
      }
    } else if (result === 'RESPINS' && appointment.clientPhone) {
      // Trimite SMS pentru respingere
      try {
        const smsMessage = `MISEDA ITP: Vehicul ${appointment.vehiclePlate || ''} - RESPINS. ${notes ? 'Motiv: ' + notes.substring(0, 80) : 'Contactati-ne pentru detalii.'} Tel: 0756596565`;
        await this.smsService.sendSms(appointment.clientPhone, smsMessage);
        this.logger.log(`SMS respingere trimis către: ${appointment.clientPhone}`);
      } catch (error) {
        this.logger.error(`Eroare la trimiterea SMS respingere: ${error.message}`);
      }
    }

    return await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        itpResult: result,
        itpNotes: notes,
      },
      include: {
        client: true,
      },
    });
  }

  async remove(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Programarea nu a fost găsită');
    }

    await this.prisma.appointment.delete({ where: { id } });

    return { message: 'Programare ștearsă cu succes' };
  }

  // ==================== SLOTS ====================

  async getAvailableSlots(date: string, duration: number = 30) {
    const dayDate = new Date(date);
    const dayOfWeek = dayDate.getDay();

    // Check if it's a holiday
    const holiday = await this.isHoliday(dayDate);
    if (holiday) {
      return { available: false, reason: `Sărbătoare: ${holiday.name}`, slots: [] };
    }

    // Get working hours for this day
    const workingHours = await this.prisma.workingHours.findUnique({
      where: { dayOfWeek },
    });

    if (!workingHours || !workingHours.isOpen) {
      return { available: false, reason: 'Închis în această zi', slots: [] };
    }

    // Generate all possible slots
    const slots = this.generateTimeSlots(
      workingHours.openTime!,
      workingHours.closeTime!,
      workingHours.slotDuration,
      workingHours.breakStart,
      workingHours.breakEnd
    );

    // Get existing appointments for this date
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
        status: { notIn: ['CANCELLED'] },
      },
    });

    // Mark slots as available or not
    const slotsWithAvailability = slots.map((slot) => {
      const overlapping = existingAppointments.filter((apt) => {
        return this.timesOverlap(
          slot.time,
          this.calculateEndTime(slot.time, duration),
          apt.startTime,
          apt.endTime
        );
      });

      return {
        ...slot,
        available: overlapping.length < workingHours.maxAppointments,
        appointmentsCount: overlapping.length,
        maxAppointments: workingHours.maxAppointments,
      };
    });

    return {
      available: true,
      workingHours: {
        open: workingHours.openTime,
        close: workingHours.closeTime,
        breakStart: workingHours.breakStart,
        breakEnd: workingHours.breakEnd,
      },
      slots: slotsWithAvailability,
    };
  }

  async isSlotAvailable(date: string, time: string, duration: number, excludeAppointmentId?: string): Promise<boolean> {
    const dayDate = new Date(date);
    const dayOfWeek = dayDate.getDay();

    // Check holiday
    const holiday = await this.isHoliday(dayDate);
    if (holiday) return false;

    // Check working hours
    const workingHours = await this.prisma.workingHours.findUnique({
      where: { dayOfWeek },
    });

    if (!workingHours || !workingHours.isOpen) return false;

    // Check if time is within working hours
    if (time < workingHours.openTime! || this.calculateEndTime(time, duration) > workingHours.closeTime!) {
      return false;
    }

    // Check if time is during break
    if (workingHours.breakStart && workingHours.breakEnd) {
      if (this.timesOverlap(time, this.calculateEndTime(time, duration), workingHours.breakStart, workingHours.breakEnd)) {
        return false;
      }
    }

    // Check existing appointments
    const where: any = {
      appointmentDate: {
        gte: new Date(`${date}T00:00:00`),
        lt: new Date(`${date}T23:59:59`),
      },
      status: { notIn: ['CANCELLED'] },
    };

    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }

    const existingAppointments = await this.prisma.appointment.findMany({ where });

    const endTime = this.calculateEndTime(time, duration);
    const overlapping = existingAppointments.filter((apt) => {
      return this.timesOverlap(time, endTime, apt.startTime, apt.endTime);
    });

    return overlapping.length < workingHours.maxAppointments;
  }

  // ==================== WORKING HOURS ====================

  async getWorkingHours() {
    let workingHours = await this.prisma.workingHours.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });

    // If no working hours exist, create defaults
    if (workingHours.length === 0) {
      await this.seedDefaultWorkingHours();
      workingHours = await this.prisma.workingHours.findMany({
        orderBy: { dayOfWeek: 'asc' },
      });
    }

    return workingHours;
  }

  async updateWorkingHours(dto: WorkingHoursDto) {
    return await this.prisma.workingHours.upsert({
      where: { dayOfWeek: dto.dayOfWeek },
      update: {
        isOpen: dto.isOpen,
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        breakStart: dto.breakStart,
        breakEnd: dto.breakEnd,
        slotDuration: dto.slotDuration,
        maxAppointments: dto.maxAppointments,
      },
      create: {
        dayOfWeek: dto.dayOfWeek,
        isOpen: dto.isOpen,
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        breakStart: dto.breakStart,
        breakEnd: dto.breakEnd,
        slotDuration: dto.slotDuration || 60,
        maxAppointments: dto.maxAppointments || 1,
      },
    });
  }

  async updateAllWorkingHours(dtos: WorkingHoursDto[]) {
    const results = [];
    for (const dto of dtos) {
      const result = await this.updateWorkingHours(dto);
      results.push(result);
    }
    return results;
  }

  async seedDefaultWorkingHours() {
    const defaults = [
      { dayOfWeek: 0, isOpen: false }, // Duminica - inchis
      { dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
      { dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
      { dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
      { dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
      { dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
      { dayOfWeek: 6, isOpen: true, openTime: '08:00', closeTime: '13:00' }, // Sambata - jumatate de zi
    ];

    for (const day of defaults) {
      await this.prisma.workingHours.upsert({
        where: { dayOfWeek: day.dayOfWeek },
        update: {},
        create: {
          dayOfWeek: day.dayOfWeek,
          isOpen: day.isOpen,
          openTime: day.openTime,
          closeTime: day.closeTime,
          breakStart: day.breakStart,
          breakEnd: day.breakEnd,
          slotDuration: 30, // 30 minute pentru ITP
          maxAppointments: 1, // 1 programare la 30 minute - Inspector AVRAM ADRIAN
        },
      });
    }

    return { message: 'Program implicit creat pentru stație ITP' };
  }

  // ==================== HOLIDAYS ====================

  async getHolidays(year?: number) {
    const targetYear = year || new Date().getFullYear();

    const holidays = await this.prisma.holiday.findMany({
      where: {
        OR: [
          { isRecurring: true },
          {
            date: {
              gte: new Date(`${targetYear}-01-01`),
              lte: new Date(`${targetYear}-12-31`),
            },
          },
        ],
      },
      orderBy: { date: 'asc' },
    });

    return holidays;
  }

  async createHoliday(dto: CreateHolidayDto) {
    return await this.prisma.holiday.create({
      data: {
        name: dto.name,
        date: new Date(dto.date),
        isRecurring: dto.isRecurring ?? false,
        isOrthodox: dto.isOrthodox ?? false,
      },
    });
  }

  async deleteHoliday(id: string) {
    await this.prisma.holiday.delete({ where: { id } });
    return { message: 'Sărbătoare ștearsă' };
  }

  async seedRomanianHolidays(year: number) {
    const holidays = [
      { name: 'Anul Nou', date: `${year}-01-01`, isRecurring: true },
      { name: 'A doua zi de Anul Nou', date: `${year}-01-02`, isRecurring: true },
      { name: 'Ziua Unirii Principatelor', date: `${year}-01-24`, isRecurring: true },
      { name: 'Ziua Muncii', date: `${year}-05-01`, isRecurring: true },
      { name: 'Ziua Copilului', date: `${year}-06-01`, isRecurring: true },
      { name: 'Adormirea Maicii Domnului', date: `${year}-08-15`, isRecurring: true, isOrthodox: true },
      { name: 'Sfântul Andrei', date: `${year}-11-30`, isRecurring: true, isOrthodox: true },
      { name: 'Ziua Națională', date: `${year}-12-01`, isRecurring: true },
      { name: 'Crăciunul (prima zi)', date: `${year}-12-25`, isRecurring: true, isOrthodox: true },
      { name: 'Crăciunul (a doua zi)', date: `${year}-12-26`, isRecurring: true, isOrthodox: true },
    ];

    for (const holiday of holidays) {
      try {
        await this.prisma.holiday.upsert({
          where: { date: new Date(holiday.date) },
          update: {},
          create: {
            name: holiday.name,
            date: new Date(holiday.date),
            isRecurring: holiday.isRecurring,
            isOrthodox: holiday.isOrthodox || false,
          },
        });
      } catch (e) {
        // Ignore duplicate errors
      }
    }

    return { message: `Sărbătorile românești pentru ${year} au fost adăugate` };
  }

  // ==================== STATS ====================

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [
      todayAppointments,
      weekAppointments,
      pendingAppointments,
      totalThisMonth,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          appointmentDate: { gte: today, lt: tomorrow },
          status: { notIn: ['CANCELLED'] },
        },
      }),
      this.prisma.appointment.count({
        where: {
          appointmentDate: { gte: today, lt: weekEnd },
          status: { notIn: ['CANCELLED'] },
        },
      }),
      this.prisma.appointment.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.appointment.count({
        where: {
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      todayAppointments,
      weekAppointments,
      pendingAppointments,
      totalThisMonth,
    };
  }

  async getCalendarData(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' },
      ],
      include: {
        client: true,
      },
    });

    // Group by date
    const byDate: Record<string, typeof appointments> = {};
    for (const apt of appointments) {
      const dateKey = apt.appointmentDate.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(apt);
    }

    return {
      month,
      year,
      appointments: byDate,
    };
  }

  // ==================== HELPERS ====================

  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  private generateTimeSlots(
    openTime: string,
    closeTime: string,
    slotDuration: number,
    breakStart?: string | null,
    breakEnd?: string | null
  ): Array<{ time: string; isBreak: boolean }> {
    const slots: Array<{ time: string; isBreak: boolean }> = [];

    let currentTime = openTime;

    while (currentTime < closeTime) {
      const isBreak = breakStart && breakEnd
        ? currentTime >= breakStart && currentTime < breakEnd
        : false;

      if (!isBreak) {
        slots.push({ time: currentTime, isBreak: false });
      }

      currentTime = this.calculateEndTime(currentTime, slotDuration);
    }

    return slots;
  }

  private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  private async isHoliday(date: Date): Promise<{ name: string } | null> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const nextDay = new Date(dateOnly);
    nextDay.setDate(nextDay.getDate() + 1);

    const holiday = await this.prisma.holiday.findFirst({
      where: {
        date: {
          gte: dateOnly,
          lt: nextDay,
        },
      },
    });

    return holiday;
  }

  // ==================== APPROVAL SYSTEM ====================

  private generateApprovalToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async sendApprovalEmail(appointment: any, approvalToken: string) {
    const appointmentDate = new Date(appointment.appointmentDate);
    const dateStr = appointmentDate.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const approveUrl = `${BASE_URL}/api/appointments/approve/${approvalToken}`;
    const rejectUrl = `${BASE_URL}/api/appointments/reject/${approvalToken}`;

    const subject = `🚗 Programare ITP: ${appointment.clientName} - ${dateStr} ora ${appointment.startTime}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .info-row { display: flex; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
    .info-label { font-weight: bold; width: 150px; color: #64748b; }
    .info-value { flex: 1; }
    .buttons { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; padding: 15px 40px; margin: 10px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; }
    .btn-accept { background: #16a34a; color: white; }
    .btn-reject { background: #dc2626; color: white; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚗 Nouă Programare ITP</h1>
  </div>
  <div class="content">
    <h2>Detalii programare:</h2>

    <div class="info-row">
      <div class="info-label">📅 Data:</div>
      <div class="info-value"><strong>${dateStr}</strong></div>
    </div>

    <div class="info-row">
      <div class="info-label">⏰ Ora:</div>
      <div class="info-value"><strong>${appointment.startTime}</strong></div>
    </div>

    <div class="info-row">
      <div class="info-label">👤 Client:</div>
      <div class="info-value">${appointment.clientName}</div>
    </div>

    <div class="info-row">
      <div class="info-label">📞 Telefon:</div>
      <div class="info-value"><a href="tel:${appointment.clientPhone}">${appointment.clientPhone}</a></div>
    </div>

    <div class="info-row">
      <div class="info-label">🚙 Număr:</div>
      <div class="info-value">${appointment.vehiclePlate || 'Nespecificat'}</div>
    </div>

    <div class="info-row">
      <div class="info-label">🏭 Marcă/Model:</div>
      <div class="info-value">${appointment.vehicleMake || ''} ${appointment.vehicleModel || ''} ${appointment.vehicleYear ? `(${appointment.vehicleYear})` : ''}</div>
    </div>

    <div class="info-row">
      <div class="info-label">📋 Categorie:</div>
      <div class="info-value">${appointment.vehicleCategory}</div>
    </div>

    <div class="info-row">
      <div class="info-label">🔧 Serviciu:</div>
      <div class="info-value">${appointment.serviceType}</div>
    </div>

    <div class="buttons">
      <a href="${approveUrl}" class="btn btn-accept">✅ ACCEPTĂ</a>
      <a href="${rejectUrl}" class="btn btn-reject">❌ REFUZĂ</a>
    </div>

    <p style="text-align: center; color: #64748b;">
      Apasă unul din butoanele de mai sus pentru a confirma sau refuza programarea.<br>
      Clientul va primi automat un SMS cu decizia ta.
    </p>
  </div>
  <div class="footer">
    <p>MISEDA INSPECT SRL - Stație ITP Autorizată RAR</p>
    <p>Strada Izvoarelor 5, Rădăuți 725400, Suceava</p>
  </div>
</body>
</html>
    `;

    const textContent = `
Nouă Programare ITP

Data: ${dateStr}
Ora: ${appointment.startTime}
Client: ${appointment.clientName}
Telefon: ${appointment.clientPhone}
Număr: ${appointment.vehiclePlate || 'Nespecificat'}
Marcă/Model: ${appointment.vehicleMake || ''} ${appointment.vehicleModel || ''}
Categorie: ${appointment.vehicleCategory}
Serviciu: ${appointment.serviceType}

Pentru a ACCEPTA programarea, accesează:
${approveUrl}

Pentru a REFUZA programarea, accesează:
${rejectUrl}

---
MISEDA INSPECT SRL - Stație ITP Autorizată RAR
    `;

    await this.emailService.sendEmail(ADMIN_EMAIL, subject, textContent, htmlContent);
  }

  async approveByToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { approvalToken: token },
    });

    if (!appointment) {
      throw new NotFoundException('Link-ul de aprobare nu este valid sau a expirat');
    }

    if (appointment.status !== 'PENDING') {
      return {
        alreadyProcessed: true,
        status: appointment.status,
        message: `Această programare a fost deja ${appointment.status === 'CONFIRMED' ? 'acceptată' : 'procesată'}.`,
      };
    }

    // Confirmă programarea
    const confirmed = await this.confirm(appointment.id);

    return {
      success: true,
      appointment: confirmed,
      message: 'Programarea a fost acceptată. Clientul a primit SMS de confirmare.',
    };
  }

  async rejectByToken(token: string, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { approvalToken: token },
    });

    if (!appointment) {
      throw new NotFoundException('Link-ul de refuz nu este valid sau a expirat');
    }

    if (appointment.status !== 'PENDING') {
      return {
        alreadyProcessed: true,
        status: appointment.status,
        message: `Această programare a fost deja ${appointment.status === 'CANCELLED' ? 'refuzată' : 'procesată'}.`,
      };
    }

    // Anulează programarea
    const cancelled = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason || 'Refuzat de administrator',
      },
    });

    // Trimite SMS către client
    try {
      const appointmentDate = new Date(appointment.appointmentDate);
      const dateStr = appointmentDate.toLocaleDateString('ro-RO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      const smsMessage = `MISEDA ITP: Ne pare rău, programarea dvs. pentru ${dateStr} ora ${appointment.startTime} nu a putut fi confirmată. Vă rugăm să ne contactați la 0756596565 pentru o reprogramare.`;

      await this.smsService.sendSms(appointment.clientPhone, smsMessage);
      this.logger.log(`SMS refuz trimis către client: ${appointment.clientPhone}`);
    } catch (error) {
      this.logger.error(`Eroare la trimiterea SMS refuz: ${error.message}`);
    }

    return {
      success: true,
      appointment: cancelled,
      message: 'Programarea a fost refuzată. Clientul a primit SMS de notificare.',
    };
  }

  // ==================== SEARCH BY PLATE ====================

  async findByPlate(plate: string) {
    // Normalize plate number - remove spaces and dashes, uppercase
    const normalizedPlate = plate.replace(/[\s\-]/g, "").toUpperCase();

    const appointments = await this.prisma.appointment.findMany({
      where: {
        vehiclePlate: {
          contains: normalizedPlate,
          mode: "insensitive",
        },
      },
      orderBy: [
        { appointmentDate: "desc" },
        { startTime: "desc" },
      ],
      include: {
        client: true,
      },
    });

    // Add estimated ITP expiry for each appointment
    return appointments.map((apt) => ({
      ...apt,
      estimatedItpExpiry: this.calculateEstimatedItpExpiry(
        apt.appointmentDate,
        apt.vehicleCategory,
        apt.vehicleYear,
      ),
    }));
  }

  async searchUnified(query: string) {
    // Unified search - works with phone OR plate number
    const normalizedQuery = query.replace(/[\s\-]/g, "");

    const appointments = await this.prisma.appointment.findMany({
      where: {
        OR: [
          { clientPhone: { contains: normalizedQuery } },
          { vehiclePlate: { contains: normalizedQuery.toUpperCase(), mode: "insensitive" } },
          { clientName: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [
        { appointmentDate: "desc" },
        { startTime: "desc" },
      ],
      include: {
        client: true,
      },
    });

    // Add estimated ITP expiry for each appointment
    return appointments.map((apt) => ({
      ...apt,
      estimatedItpExpiry: this.calculateEstimatedItpExpiry(
        apt.appointmentDate,
        apt.vehicleCategory,
        apt.vehicleYear,
      ),
    }));
  }

  // Calculate estimated ITP expiry based on appointment date and vehicle info
  private calculateEstimatedItpExpiry(
    appointmentDate: Date,
    category: string,
    vehicleYear?: number | null,
  ): string {
    const validityMonths = this.calculateItpValidityMonths(category, vehicleYear);
    const expiryDate = new Date(appointmentDate);
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
    return expiryDate.toISOString();
  }
  // ==================== ITP EXPIRY CHECK ====================

  async checkItpExpiry(plate: string) {
    const normalizedPlate = plate.replace(/[\s\-]/g, "").toUpperCase();

    // 1. Check for existing ITP document
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        plateNumber: { contains: normalizedPlate, mode: "insensitive" },
      },
      include: {
        documents: {
          where: { type: "ITP" },
          orderBy: { expiryDate: "desc" },
          take: 1,
        },
        client: true,
      },
    });

    // 2. Check last completed appointment with ADMIS result
    const lastAdmisAppointment = await this.prisma.appointment.findFirst({
      where: {
        vehiclePlate: { contains: normalizedPlate, mode: "insensitive" },
        itpResult: { in: ["ADMIS", "ADMIS_OBS"] },
        status: "COMPLETED",
      },
      orderBy: { appointmentDate: "desc" },
      include: { client: true },
    });

    if (!vehicle && !lastAdmisAppointment) {
      return {
        found: false,
        plate: normalizedPlate,
        message: "Nu am găsit informații ITP pentru acest număr de înmatriculare",
      };
    }

    const now = new Date();
    let itpInfo: any = { plate: normalizedPlate, found: true };

    // From ITP document
    if (vehicle?.documents?.[0]) {
      const doc = vehicle.documents[0];
      const expiryDate = doc.expiryDate;
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      itpInfo.fromDocument = {
        issueDate: doc.issueDate,
        expiryDate: doc.expiryDate,
        status: doc.status,
        daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
      };
    }

    // From last ADMIS appointment (estimated)
    if (lastAdmisAppointment) {
      const validityMonths = this.calculateItpValidityMonths(
        lastAdmisAppointment.vehicleCategory,
        lastAdmisAppointment.vehicleYear,
      );
      const estimatedExpiry = new Date(lastAdmisAppointment.appointmentDate);
      estimatedExpiry.setMonth(estimatedExpiry.getMonth() + validityMonths);
      const daysUntilExpiry = Math.ceil((estimatedExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      itpInfo.fromAppointment = {
        appointmentDate: lastAdmisAppointment.appointmentDate,
        vehicleCategory: lastAdmisAppointment.vehicleCategory,
        vehicleYear: lastAdmisAppointment.vehicleYear,
        validityMonths,
        estimatedExpiry: estimatedExpiry.toISOString(),
        daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
        result: lastAdmisAppointment.itpResult,
      };
    }

    // Vehicle info
    if (vehicle) {
      itpInfo.vehicle = {
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        owner: vehicle.client ? `${vehicle.client.firstName} ${vehicle.client.lastName}` : null,
        phone: vehicle.client?.phone,
      };
    }

    return itpInfo;
  }

  async getAllItpStatus() {
    // Get all vehicles with their ITP documents
    const vehicles = await this.prisma.vehicle.findMany({
      include: {
        client: true,
        documents: {
          where: { type: 'ITP' },
          orderBy: { expiryDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { plateNumber: 'asc' },
    });

    // Also get ITP info from appointments for vehicles without documents
    const appointmentsWithItp = await this.prisma.appointment.findMany({
      where: {
        itpResult: { in: ['ADMIS', 'ADMIS_OBS'] },
        status: 'COMPLETED',
      },
      orderBy: { appointmentDate: 'desc' },
      include: { client: true },
      distinct: ['vehiclePlate'],
    });

    const now = new Date();
    const results: any[] = [];
    const processedPlates = new Set<string>();

    // Process vehicles with documents
    for (const vehicle of vehicles) {
      processedPlates.add(vehicle.plateNumber.toUpperCase());
      const doc = vehicle.documents[0];
      
      let expiryDate: Date | null = null;
      let issueDate: Date | null = null;
      let source = 'unknown';

      if (doc) {
        expiryDate = doc.expiryDate;
        issueDate = doc.issueDate;
        source = 'document';
      }

      const daysUntilExpiry = expiryDate 
        ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      results.push({
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        owner: vehicle.client ? `${vehicle.client.firstName} ${vehicle.client.lastName}` : null,
        phone: vehicle.client?.phone,
        itpIssueDate: issueDate?.toISOString() || null,
        itpExpiryDate: expiryDate?.toISOString() || null,
        daysUntilExpiry,
        isExpired: daysUntilExpiry !== null && daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
        source,
      });
    }

    // Add appointments that don't have a vehicle record yet
    for (const apt of appointmentsWithItp) {
      if (!apt.vehiclePlate) continue;
      const normalizedPlate = apt.vehiclePlate.replace(/[\s\-]/g, '').toUpperCase();
      if (!processedPlates.has(normalizedPlate)) {
        processedPlates.add(normalizedPlate);
        
        const validityMonths = this.calculateItpValidityMonths(apt.vehicleCategory, apt.vehicleYear);
        const expiryDate = new Date(apt.appointmentDate);
        expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
        
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        results.push({
          plateNumber: apt.vehiclePlate,
          make: apt.vehicleMake || 'N/A',
          model: apt.vehicleModel || 'N/A',
          year: apt.vehicleYear,
          owner: apt.clientName,
          phone: apt.clientPhone,
          itpIssueDate: apt.appointmentDate,
          itpExpiryDate: expiryDate.toISOString(),
          daysUntilExpiry,
          isExpired: daysUntilExpiry < 0,
          isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
          source: 'appointment',
        });
      }
    }

    // Sort by expiry date (soonest first, then expired)
    results.sort((a, b) => {
      if (a.daysUntilExpiry === null) return 1;
      if (b.daysUntilExpiry === null) return -1;
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    return {
      total: results.length,
      expired: results.filter(r => r.isExpired).length,
      expiringSoon: results.filter(r => r.isExpiringSoon).length,
      valid: results.filter(r => !r.isExpired && !r.isExpiringSoon && r.daysUntilExpiry !== null).length,
      vehicles: results,
    };
  }
}
