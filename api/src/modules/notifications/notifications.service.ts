import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto, TEMPLATE_VARIABLES } from './dto/template.dto';
import { SmsService } from '../sms/sms.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  // ============================================
  // TEMPLATE MANAGEMENT
  // ============================================

  async createTemplate(dto: CreateTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        triggerDays: dto.triggerDays,
        smsEnabled: dto.smsEnabled ?? true,
        emailEnabled: dto.emailEnabled ?? false,
        smsContent: dto.smsContent,
        emailSubject: dto.emailSubject,
        emailContent: dto.emailContent,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async findAllTemplates(type?: string) {
    const where: any = {};
    if (type) {
      where.type = type;
    }

    return this.prisma.notificationTemplate.findMany({
      where,
      orderBy: [{ type: 'asc' }, { triggerDays: 'desc' }],
    });
  }

  async findTemplate(id: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template negăsit');
    }

    return template;
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template negăsit');
    }

    return this.prisma.notificationTemplate.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template negăsit');
    }

    await this.prisma.notificationTemplate.delete({ where: { id } });

    return { message: 'Template șters cu succes' };
  }

  getTemplateVariables() {
    return TEMPLATE_VARIABLES;
  }

  // ============================================
  // SEED DEFAULT TEMPLATES
  // ============================================

  async seedDefaultTemplates() {
    const defaults = [
      // ITP Templates
      {
        name: 'ITP - 30 zile înainte',
        type: 'ITP',
        triggerDays: 30,
        smsContent: 'Buna ziua {{client_name}}! Va reamintim ca ITP-ul pentru {{vehicle_make}} {{vehicle_model}} ({{vehicle_plate}}) expira pe {{expiry_date}}. Va asteptam la {{company_name}}! Tel: {{company_phone}}',
        emailSubject: 'Reamintire ITP - {{vehicle_plate}}',
        emailContent: '<p>Stimate {{client_name}},</p><p>Vă reamintim că ITP-ul pentru vehiculul dumneavoastră <strong>{{vehicle_make}} {{vehicle_model}}</strong> cu numărul de înmatriculare <strong>{{vehicle_plate}}</strong> expiră pe <strong>{{expiry_date}}</strong>.</p><p>Mai aveți {{days_remaining}} zile pentru a efectua inspecția tehnică periodică.</p><p>Cu stimă,<br>{{company_name}}<br>Tel: {{company_phone}}</p>',
      },
      {
        name: 'ITP - 7 zile înainte',
        type: 'ITP',
        triggerDays: 7,
        smsContent: 'URGENT! {{client_name}}, ITP-ul pentru {{vehicle_plate}} expira in {{days_remaining}} zile ({{expiry_date}}). Programeaza-te acum! {{company_phone}}',
        emailSubject: 'URGENT: ITP expiră în {{days_remaining}} zile - {{vehicle_plate}}',
        emailContent: '<p>Stimate {{client_name}},</p><p><strong>ATENȚIE!</strong> ITP-ul pentru vehiculul <strong>{{vehicle_plate}}</strong> expiră în <strong>{{days_remaining}} zile</strong> ({{expiry_date}}).</p><p>Vă rugăm să vă programați cât mai curând pentru inspecția tehnică periodică.</p><p>{{company_name}}<br>Tel: {{company_phone}}</p>',
      },
      // RCA Templates
      {
        name: 'RCA - 30 zile înainte',
        type: 'RCA',
        triggerDays: 30,
        smsContent: 'Buna ziua {{client_name}}! Asigurarea RCA pentru {{vehicle_plate}} expira pe {{expiry_date}}. Contactati-ne pentru reinnoire! {{company_phone}}',
        emailSubject: 'Reamintire RCA - {{vehicle_plate}}',
        emailContent: '<p>Stimate {{client_name}},</p><p>Vă informăm că polița RCA pentru vehiculul <strong>{{vehicle_plate}}</strong> expiră pe <strong>{{expiry_date}}</strong>.</p><p>Contactați-ne pentru a vă ajuta cu reînnoirea asigurării.</p><p>{{company_name}}<br>Tel: {{company_phone}}</p>',
      },
      {
        name: 'RCA - 7 zile înainte',
        type: 'RCA',
        triggerDays: 7,
        smsContent: 'ATENTIE {{client_name}}! RCA pentru {{vehicle_plate}} expira in {{days_remaining}} zile! Circulatia fara RCA valid este sanctionata. {{company_phone}}',
        emailSubject: 'URGENT: RCA expiră în {{days_remaining}} zile - {{vehicle_plate}}',
        emailContent: '<p>Stimate {{client_name}},</p><p><strong>IMPORTANT!</strong> Polița RCA pentru <strong>{{vehicle_plate}}</strong> expiră în <strong>{{days_remaining}} zile</strong>.</p><p>⚠️ Circulația pe drumurile publice fără asigurare RCA validă este contravenție și poate atrage amenzi substanțiale.</p><p>{{company_name}}<br>Tel: {{company_phone}}</p>',
      },
      // VIGNETTE Templates
      {
        name: 'Rovinietă - 7 zile înainte',
        type: 'VIGNETTE',
        triggerDays: 7,
        smsContent: '{{client_name}}, rovinieta pentru {{vehicle_plate}} expira pe {{expiry_date}}. Nu uitati sa o reinnoiti! {{company_name}}',
        emailSubject: 'Reamintire Rovinietă - {{vehicle_plate}}',
        emailContent: '<p>Stimate {{client_name}},</p><p>Vă reamintim că rovinieta pentru vehiculul <strong>{{vehicle_plate}}</strong> expiră pe <strong>{{expiry_date}}</strong>.</p><p>Puteți achiziționa o nouă rovinietă online sau de la punctele de vânzare autorizate.</p><p>{{company_name}}</p>',
      },
    ];

    for (const template of defaults) {
      const existing = await this.prisma.notificationTemplate.findFirst({
        where: {
          type: template.type as any,
          triggerDays: template.triggerDays,
          isDefault: true,
        },
      });

      if (!existing) {
        await this.prisma.notificationTemplate.create({
          data: {
            ...template,
            type: template.type as any,
            smsEnabled: true,
            emailEnabled: true,
            isDefault: true,
            isActive: true,
          },
        });
      }
    }

    return { message: 'Template-uri implicite create' };
  }

  // ============================================
  // SEND NOTIFICATIONS
  // ============================================

  async sendNotification(documentId: string, channel: 'SMS' | 'EMAIL', templateId?: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document negăsit');
    }

    const client = document.vehicle.client;
    const vehicle = document.vehicle;

    // Get template
    let template;
    if (templateId) {
      template = await this.prisma.notificationTemplate.findUnique({
        where: { id: templateId },
      });
    } else {
      // Find default template for this document type
      const daysRemaining = Math.ceil(
        (document.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      template = await this.prisma.notificationTemplate.findFirst({
        where: {
          type: document.type,
          triggerDays: { lte: daysRemaining + 5 },
          isActive: true,
        },
        orderBy: { triggerDays: 'desc' },
      });
    }

    if (!template) {
      throw new NotFoundException('Template negăsit pentru acest tip de document');
    }

    // Get company settings
    const companySettings = await this.prisma.setting.findUnique({
      where: { key: 'company' },
    });

    const companyName = (companySettings?.value as any)?.name || 'Auto Service';
    const companyPhone = (companySettings?.value as any)?.phone || '';

    // Calculate days remaining
    const daysRemaining = Math.ceil(
      (document.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Variable replacements
    const variables: Record<string, string> = {
      '{{client_name}}': `${client.firstName} ${client.lastName}`,
      '{{client_first_name}}': client.firstName,
      '{{client_last_name}}': client.lastName,
      '{{client_phone}}': client.phone,
      '{{vehicle_plate}}': vehicle.plateNumber,
      '{{vehicle_make}}': vehicle.make,
      '{{vehicle_model}}': vehicle.model,
      '{{vehicle_year}}': vehicle.year?.toString() || '',
      '{{document_type}}': this.getDocumentTypeName(document.type),
      '{{expiry_date}}': document.expiryDate.toLocaleDateString('ro-RO'),
      '{{days_remaining}}': daysRemaining.toString(),
      '{{company_name}}': companyName,
      '{{company_phone}}': companyPhone,
    };

    let result: any;
    let content: string;
    let subject: string | undefined;

    if (channel === 'SMS') {
      content = this.replaceVariables(template.smsContent || '', variables);
      result = await this.smsService.sendSms(client.phone, content);
    } else {
      subject = this.replaceVariables(template.emailSubject || '', variables);
      content = this.replaceVariables(template.emailContent || '', variables);

      if (!client.email) {
        throw new Error('Clientul nu are adresă de email');
      }

      result = await this.emailService.sendEmail(client.email, subject, content);
    }

    // Log notification
    const notification = await this.prisma.notificationLog.create({
      data: {
        channel,
        recipient: channel === 'SMS' ? client.phone : client.email!,
        subject,
        content,
        status: result.success ? 'SENT' : 'FAILED',
        providerRef: result.messageId,
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null,
        clientId: client.id,
        documentId: document.id,
        templateId: template.id,
      },
    });

    return {
      success: result.success,
      notificationId: notification.id,
      messageId: result.messageId,
      error: result.error,
    };
  }

  // ============================================
  // NOTIFICATION LOGS
  // ============================================

  async getNotificationLogs(query: { clientId?: string; documentId?: string; channel?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.clientId) where.clientId = query.clientId;
    if (query.documentId) where.documentId = query.documentId;
    if (query.channel) where.channel = query.channel;

    const [logs, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { firstName: true, lastName: true, phone: true },
          },
          document: {
            select: { type: true, expiryDate: true },
          },
          template: {
            select: { name: true },
          },
        },
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    return result;
  }

  private getDocumentTypeName(type: string): string {
    const names: Record<string, string> = {
      ITP: 'ITP',
      RCA: 'Asigurare RCA',
      CASCO: 'Asigurare CASCO',
      VIGNETTE: 'Rovinietă',
      OTHER: 'Document',
    };
    return names[type] || type;
  }
}
