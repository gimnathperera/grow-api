import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles, UserRole } from '../common/guards/roles.guard';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import {
  LoginResponseDto,
  AuthTokensDto,
  UserProfileDto,
} from './dto/auth-response.dto';
import { SuccessResponseDto } from '../common/dto/response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
  })
  async register(@Body() registerDto: RegisterDto): Promise<SuccessResponseDto<LoginResponseDto>> {
    const result = await this.authService.register(registerDto);
    return {
      ok: true,
      data: result,
      meta: {
        traceId: 'register',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<SuccessResponseDto<LoginResponseDto>> {
    const result = await this.authService.login(loginDto);
    return {
      ok: true,
      data: result,
      meta: {
        traceId: 'login',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthTokensDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<SuccessResponseDto<AuthTokensDto>> {
    const result = await this.authService.refreshTokens(refreshTokenDto);
    return {
      ok: true,
      data: result,
      meta: {
        traceId: 'refresh',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout(@Body() body: { refreshToken?: string }): Promise<SuccessResponseDto<null>> {
    await this.authService.logout(body.refreshToken);
    return {
      ok: true,
      data: null,
      meta: {
        traceId: 'logout',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  async getProfile(@Request() req): Promise<SuccessResponseDto<UserProfileDto>> {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) {
      throw new Error('User not found');
    }

    const profile = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      kidsDataCompleted: user.kidsDataCompleted ?? false,
    };

    return {
      ok: true,
      data: profile,
      meta: {
        traceId: 'get-profile',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<SuccessResponseDto<null>> {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await this.usersService.validatePassword(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    await this.usersService.updatePassword(user._id.toString(), changePasswordDto.newPassword);

    return {
      ok: true,
      data: null,
      meta: {
        traceId: 'change-password',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<SuccessResponseDto<null>> {
    // TODO: Implement password reset email sending
    // For now, just return success
    return {
      ok: true,
      data: null,
      meta: {
        traceId: 'forgot-password',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<SuccessResponseDto<null>> {
    // TODO: Implement password reset with token validation
    // For now, just return success
    return {
      ok: true,
      data: null,
      meta: {
        traceId: 'reset-password',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
