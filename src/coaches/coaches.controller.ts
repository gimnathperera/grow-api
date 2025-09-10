import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { CoachesService } from "./coaches.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard, Roles, UserRole } from "../common/guards/roles.guard";
import { PageQueryDto } from "../common/dto/page-query.dto";
import { CreateCoachDto, UpdateCoachDto } from "./dto/coach.dto";
import { SuccessResponseDto } from "../common/dto/response.dto";

@ApiTags("Coaches")
@Controller("coaches")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CoachesController {
  constructor(private coachesService: CoachesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({ summary: "Create a new coach profile" })
  @ApiResponse({
    status: 201,
    description: "Coach created successfully",
  })
  async create(
    @Body() createCoachDto: CreateCoachDto
  ): Promise<SuccessResponseDto<any>> {
    const coach = await this.coachesService.create(createCoachDto);
    return {
      ok: true,
      data: coach,
      meta: {
        traceId: "create-coach",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.CLIENT)
  @ApiOperation({ summary: "Get all coaches" })
  @ApiResponse({
    status: 200,
    description: "Coaches retrieved successfully",
  })
  @ApiQuery({ name: "specialties", required: false, type: [String] })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "acceptingNewClients", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async findAll(
    @Query()
    query: PageQueryDto & {
      specialties?: string[];
      status?: string;
      acceptingNewClients?: boolean;
    }
  ): Promise<
    SuccessResponseDto<{ coaches: any[]; total: number; pagination: any }>
  > {
    const { coaches, total } = await this.coachesService.findAll({
      specialties: query.specialties,
      status: query.status,
      acceptingNewClients: query.acceptingNewClients,
      page: query.page,
      limit: query.limit,
    });

    const totalPages = Math.ceil(total / (query.limit || 20));

    return {
      ok: true,
      data: {
        coaches,
        total,
        pagination: {
          page: query.page || 1,
          limit: query.limit || 20,
          total,
          totalPages,
        },
      },
      meta: {
        traceId: "get-coaches",
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

  @Get("available")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.CLIENT)
  @ApiOperation({ summary: "Get available coaches" })
  @ApiResponse({
    status: 200,
    description: "Available coaches retrieved successfully",
  })
  @ApiQuery({ name: "specialties", required: false, type: [String] })
  @ApiQuery({ name: "timeSlot", required: false })
  @ApiQuery({ name: "date", required: false })
  async getAvailableCoaches(
    @Query() query: { specialties?: string[]; timeSlot?: string; date?: string }
  ): Promise<SuccessResponseDto<any[]>> {
    const coaches = await this.coachesService.getAvailableCoaches({
      specialties: query.specialties,
      timeSlot: query.timeSlot,
      date: query.date,
    });

    return {
      ok: true,
      data: coaches,
      meta: {
        traceId: "get-available-coaches",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get("my-profile")
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: "Get current coach profile" })
  @ApiResponse({
    status: 200,
    description: "Coach profile retrieved successfully",
  })
  async getMyProfile(@Request() req): Promise<SuccessResponseDto<any>> {
    const coach = await this.coachesService.findByUserId(req.user.sub);
    if (!coach) {
      throw new Error("Coach profile not found");
    }

    return {
      ok: true,
      data: coach,
      meta: {
        traceId: "get-my-profile",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH, UserRole.CLIENT)
  @ApiOperation({ summary: "Get coach by ID" })
  @ApiResponse({
    status: 200,
    description: "Coach retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Coach not found",
  })
  async findOne(
    @Param("id") id: string,
    @Request() req
  ): Promise<SuccessResponseDto<any>> {
    // Check if coach is accessing their own profile or has permission
    if (req.user.role === UserRole.COACH) {
      const coach = await this.coachesService.findByUserId(req.user.sub);
      if (!coach || coach._id.toString() !== id) {
        throw new Error("Access denied");
      }
    }

    const coach = await this.coachesService.findById(id);
    if (!coach) {
      throw new Error("Coach not found");
    }

    return {
      ok: true,
      data: coach,
      meta: {
        traceId: "get-coach",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(":id/stats")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH)
  @ApiOperation({ summary: "Get coach statistics" })
  @ApiResponse({
    status: 200,
    description: "Coach statistics retrieved successfully",
  })
  async getCoachStats(
    @Param("id") id: string,
    @Request() req
  ): Promise<SuccessResponseDto<any>> {
    // Check if coach is accessing their own stats or has permission
    if (req.user.role === UserRole.COACH) {
      const coach = await this.coachesService.findByUserId(req.user.sub);
      if (!coach || coach._id.toString() !== id) {
        throw new Error("Access denied");
      }
    }

    const stats = await this.coachesService.getCoachStats(id);
    return {
      ok: true,
      data: stats,
      meta: {
        traceId: "get-coach-stats",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH)
  @ApiOperation({ summary: "Update coach" })
  @ApiResponse({
    status: 200,
    description: "Coach updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Coach not found",
  })
  async update(
    @Param("id") id: string,
    @Body() updateCoachDto: UpdateCoachDto,
    @Request() req
  ): Promise<SuccessResponseDto<any>> {
    // Check if coach is updating their own profile or has permission
    if (req.user.role === UserRole.COACH) {
      const coach = await this.coachesService.findByUserId(req.user.sub);
      if (!coach || coach._id.toString() !== id) {
        throw new Error("Access denied");
      }
    }

    const coach = await this.coachesService.update(id, updateCoachDto);
    return {
      ok: true,
      data: coach,
      meta: {
        traceId: "update-coach",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({ summary: "Delete coach" })
  @ApiResponse({
    status: 200,
    description: "Coach deleted successfully",
  })
  async remove(@Param("id") id: string): Promise<SuccessResponseDto<null>> {
    await this.coachesService.delete(id);
    return {
      ok: true,
      data: null,
      meta: {
        traceId: "delete-coach",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
