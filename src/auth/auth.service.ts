import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { LoginResponseDto, AuthTokensDto, UserProfileDto } from './dto/auth-response.dto';
import { ErrorCodes } from '../shared/error-codes';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const user = await this.usersService.create(registerDto);
    const tokens = await this.generateTokens(user);
    
    return {
      tokens,
      user: this.mapUserToProfile(user),
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException({
        errorCode: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    // Check if account is locked
    if (await this.usersService.isAccountLocked(user)) {
      throw new UnauthorizedException({
        errorCode: ErrorCodes.AUTH_ACCOUNT_LOCKED,
        message: 'Account is locked due to multiple failed login attempts',
      });
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await this.usersService.incrementFailedLoginAttempts(loginDto.email);
      throw new UnauthorizedException({
        errorCode: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    // Reset failed login attempts on successful login
    await this.usersService.resetFailedLoginAttempts(user._id.toString());

    const tokens = await this.generateTokens(user);
    
    return {
      tokens,
      user: this.mapUserToProfile(user),
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokensDto> {
    const refreshToken = await this.refreshTokenModel.findOne({
      tokenHash: this.hashToken(refreshTokenDto.refreshToken),
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).populate('userId');

    if (!refreshToken) {
      throw new UnauthorizedException({
        errorCode: ErrorCodes.AUTH_TOKEN_INVALID,
        message: 'Invalid or expired refresh token',
      });
    }

    const user = await this.usersService.findById(refreshToken.userId.toString());
    if (!user) {
      throw new UnauthorizedException({
        errorCode: ErrorCodes.AUTH_ACCOUNT_NOT_FOUND,
        message: 'User not found',
      });
    }

    // If kids data not completed, block refresh as well
    if (!user.kidsDataCompleted) {
      throw new UnauthorizedException({
        errorCode: ErrorCodes.AUTH_KIDS_DATA_REQUIRED,
        message: 'You must complete kids data before logging in.',
      });
    }

    // Revoke the used refresh token
    await this.refreshTokenModel.findByIdAndUpdate(refreshToken._id, {
      isRevoked: true,
      revokedAt: new Date(),
    });

    // Generate new tokens
    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await this.refreshTokenModel.findOneAndUpdate(
        { tokenHash: this.hashToken(refreshToken) },
        { isRevoked: true, revokedAt: new Date() },
      );
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  private async generateTokens(user: any): Promise<AuthTokensDto> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Store refresh token
    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private mapUserToProfile(user: any): UserProfileDto {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      kidsDataCompleted: user.kidsDataCompleted,
    }as any;
  }
}
