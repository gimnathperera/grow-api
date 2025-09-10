import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles, UserRole } from '../common/guards/roles.guard';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { SuccessResponseDto } from '../common/dto/response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({ summary: 'Get all users (Admin/Team only)' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query() query: PageQueryDto & { role?: UserRole; status?: string },
  ): Promise<SuccessResponseDto<{ users: UserProfileDto[]; total: number; pagination: any }>> {
    const { users, total } = await this.usersService.findAll({
      role: query.role,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    const userProfiles = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / (query.limit || 20));

    return {
      ok: true,
      data: {
        users: userProfiles,
        total,
        pagination: {
          page: query.page || 1,
          limit: query.limit || 20,
          total,
          totalPages,
        },
      },
      meta: {
        traceId: 'get-users',
        timestamp: new Date().toISOString(),
        pagination: {
          page: query.page || 1,
          limit: query.limit || 20,
          total,
          totalPages,
        },
      },
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({ summary: 'Get user by ID (Admin/Team only)' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('id') id: string): Promise<SuccessResponseDto<UserProfileDto>> {
    const user = await this.usersService.findById(id);
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
    };

    return {
      ok: true,
      data: profile,
      meta: {
        traceId: 'get-user',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({ summary: 'Update user (Admin/Team only)' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<UserProfileDto>,
  ): Promise<SuccessResponseDto<UserProfileDto>> {
    const user = await this.usersService.update(id, updateData);
    
    const profile = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return {
      ok: true,
      data: profile,
      meta: {
        traceId: 'update-user',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
