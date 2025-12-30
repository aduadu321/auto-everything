import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { SendGridService } from '../../providers/sendgrid/sendgrid.service';

@Module({
  imports: [ConfigModule],
  controllers: [EmailController],
  providers: [EmailService, SendGridService],
  exports: [EmailService],
})
export class EmailModule {}
