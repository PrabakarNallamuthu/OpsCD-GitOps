import { Controller, Get, HttpCode } from '@nestjs/common';
import { HEALTH_ENDPOINT } from '@opsera/shared';
@Controller()
export class AppController {
  @Get(HEALTH_ENDPOINT)
  @HttpCode(200)
  health(): { status: string; service: string } {
    return { status: 'ok', service: 'verification-service' };
  }
}
