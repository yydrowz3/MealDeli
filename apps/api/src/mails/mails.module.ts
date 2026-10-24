import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailsService } from './mails.service';

@Module({
  imports: [ConfigModule],
  providers: [MailsService],
  exports: [MailsService],
})
export class MailsModule {}
