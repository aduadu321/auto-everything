import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SmsModule } from './modules/sms/sms.module';
import { EmailModule } from './modules/email/email.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { AuthModule } from './modules/auth/auth.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { BillingModule } from './modules/billing/billing.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SmsModule,
    EmailModule,
    ClientsModule,
    VehiclesModule,
    DocumentsModule,
    NotificationsModule,
    AppointmentsModule,
    HolidaysModule,
    AuthModule,
    WaitlistModule,
    BillingModule,
    OnboardingModule,
    DashboardModule,
    MarketplaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
