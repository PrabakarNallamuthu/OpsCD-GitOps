import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationService } from './notification.service.js';

interface SendNotificationDto {
  channel: 'slack' | 'email' | 'pagerduty' | 'webhook';
  recipients: string[];
  severity: 'info' | 'warning' | 'critical';
  subject: string;
  body: string;
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  send(@Body() dto: SendNotificationDto) {
    return this.notificationService.send(dto);
  }

  @Get('templates')
  getTemplates() {
    return this.notificationService.getTemplates();
  }
}
