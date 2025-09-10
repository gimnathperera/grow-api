import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    traceId: string;
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class SuccessResponseDto<T = any> {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiPropertyOptional()
  data?: T;

  @ApiProperty({ example: 'req-123456' })
  meta: {
    traceId: string;
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  ok: boolean;

  @ApiProperty({
    example: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: { field: 'email', message: 'Invalid email format' },
    },
  })
  error: {
    code: string;
    message: string;
    details?: any;
  };

  @ApiProperty({ example: 'req-123456' })
  meta: {
    traceId: string;
    timestamp: string;
  };
}
