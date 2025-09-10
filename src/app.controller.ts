import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { SuccessResponseDto } from './common/dto/response.dto';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: SuccessResponseDto,
  })
  getHealth(): SuccessResponseDto<{ status: string; timestamp: string }> {
    return {
      ok: true,
      data: this.appService.getHealth(),
      meta: {
        traceId: 'health-check',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
