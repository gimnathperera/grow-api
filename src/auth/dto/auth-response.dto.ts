import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/guards/roles.guard';

export class AuthTokensDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
  expiresAt: string;
}

export class UserProfileDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: '+1234567890' })
  phone: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT })
  role: UserRole;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
  updatedAt: string;

  @ApiProperty({ example: false, description: 'Indicates whether user has completed kids data step' })
  kidsDataCompleted: boolean;
}

export class LoginResponseDto {
  @ApiProperty()
  tokens: AuthTokensDto;

  @ApiProperty()
  user: UserProfileDto;
}
