import { Controller, Get } from '@nestjs/common';
import { Public } from '../../infrastructure/auth/decorators.js';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
