import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from '../auth/dto/auth.dto';
import { UserRole } from '../common/guards/roles.guard';
import { ErrorCodes } from '../shared/error-codes';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: RegisterDto): Promise<UserDocument> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ 
      email: createUserDto.email.toLowerCase() 
    });
    
    if (existingUser) {
      throw new ConflictException({
        errorCode: ErrorCodes.RESOURCE_ALREADY_EXISTS,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user
    const user = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      passwordHash,
      role: createUserDto.role || UserRole.CLIENT,
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findAll(filters: {
    role?: UserRole;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ users: UserDocument[]; total: number }> {
    const { role, status, page = 1, limit = 20 } = filters;
    
    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      this.userModel.countDocuments(query),
    ]);

    return { users, total };
  }

  async update(id: string, updateData: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: 'User not found',
      });
    }

    return user;
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await this.userModel.findByIdAndUpdate(id, { passwordHash });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async incrementFailedLoginAttempts(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) return;

    const failedAttempts = user.failedLoginAttempts + 1;
    const maxAttempts = 5;
    const lockTime = 30 * 60 * 1000; // 30 minutes

    const updateData: any = { failedLoginAttempts: failedAttempts };
    
    if (failedAttempts >= maxAttempts) {
      updateData.lockedUntil = new Date(Date.now() + lockTime);
    }

    await this.userModel.findByIdAndUpdate(user._id, updateData);
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      lastLoginAt: new Date(),
    });
  }

  async isAccountLocked(user: UserDocument): Promise<boolean> {
    return user.lockedUntil && user.lockedUntil > new Date();
  }

  async updateKidsDataStatus(userId: string, completed: boolean): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { kidsDataCompleted: completed },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
