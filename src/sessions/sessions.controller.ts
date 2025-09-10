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
import { SessionsService } from "./sessions.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard, Roles, UserRole } from "../common/guards/roles.guard";
import { PageQueryDto } from "../common/dto/page-query.dto";
import {
  CreateSessionDto,
  UpdateSessionDto,
  CancelSessionDto,
  SessionFeedbackDto,
  CheckAvailabilityDto,
} from "./dto/session.dto";
import { SuccessResponseDto } from "../common/dto/response.dto";
import { SessionStatus } from "./schemas/session.schema";

@ApiTags("Sessions")
@Controller("sessions")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.CLIENT)
  @ApiOperation({ summary: "Create a new session" })
  @ApiResponse({
    status: 201,
    description: "Session created successfully",
  })
  async create(
    @Body() createSessionDto: CreateSessionDto
  ): Promise<SuccessResponseDto<any>> {
    const session = await this.sessionsService.create(createSessionDto);
    return {
      ok: true,
      data: session,
      meta: {
        traceId: "create-session",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH, UserRole.CLIENT)
  @ApiOperation({ summary: "Get all sessions" })
  @ApiResponse({
    status: 200,
    description: "Sessions retrieved successfully",
  })
  @ApiQuery({ name: "clientId", required: false })
  @ApiQuery({ name: "coachId", required: false })
  @ApiQuery({ name: "status", required: false, enum: SessionStatus })
  @ApiQuery({ name: "dateFrom", required: false })
  @ApiQuery({ name: "dateTo", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async findAll(
    @Query()
    query: PageQueryDto & {
      clientId?: string;
      coachId?: string;
      status?: SessionStatus;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<
    SuccessResponseDto<{ sessions: any[]; total: number; pagination: any }>
  > {
    const { sessions, total } = await this.sessionsService.findAll({
      clientId: query.clientId,
      coachId: query.coachId,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
    });

    const totalPages = Math.ceil(total / (query.limit || 20));

    return {
      ok: true,
      data: {
        sessions,
        total,
        pagination: {
          page: query.page || 1,
          limit: query.limit || 20,
          total,
          totalPages,
        },
      },
      meta: {
        traceId: "get-sessions",
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

  @Get("upcoming")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH, UserRole.CLIENT)
  @ApiOperation({ summary: "Get upcoming sessions" })
  @ApiResponse({
    status: 200,
    description: "Upcoming sessions retrieved successfully",
  })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getUpcomingSessions(
    @Request() req,
    @Query("limit") limit?: number
  ): Promise<SuccessResponseDto<any[]>> {
    const sessions = await this.sessionsService.getUpcomingSessions(
      req.user.sub,
      req.user.role,
      limit || 10
    );

    return {
      ok: true,
      data: sessions,
      meta: {
        traceId: "get-upcoming-sessions",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH)
  @ApiOperation({ summary: "Get session statistics" })
  @ApiResponse({
    status: 200,
    description: "Session statistics retrieved successfully",
  })
  @ApiQuery({ name: "coachId", required: false })
  @ApiQuery({
    name: "period",
    required: false,
    enum: ["week", "month", "year"],
  })
  async getSessionStats(
    @Request() req,
    @Query("coachId") coachId?: string,
    @Query("period") period: "week" | "month" | "year" = "month"
  ): Promise<SuccessResponseDto<any>> {
    // If coach is requesting their own stats, use their ID
    const targetCoachId =
      req.user.role === UserRole.COACH ? req.user.sub : coachId;

    if (!targetCoachId) {
      throw new Error("Coach ID is required");
    }

    const stats = await this.sessionsService.getSessionStats(
      targetCoachId,
      period
    );

    return {
      ok: true,
      data: stats,
      meta: {
        traceId: "get-session-stats",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("check-availability")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.CLIENT)
  @ApiOperation({ summary: "Check coach availability" })
  @ApiResponse({
    status: 200,
    description: "Availability checked successfully",
  })
  async checkAvailability(
    @Body() checkAvailabilityDto: CheckAvailabilityDto
  ): Promise<SuccessResponseDto<{ available: boolean }>> {
    const available = await this.sessionsService.checkAvailability(
      checkAvailabilityDto.coachId,
      checkAvailabilityDto.startsAt,
      checkAvailabilityDto.endsAt
    );

    return {
      ok: true,
      data: { available },
      meta: {
        traceId: "check-availability",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH, UserRole.CLIENT)
  @ApiOperation({ summary: "Get session by ID" })
  @ApiResponse({
    status: 200,
    description: "Session retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Session not found",
  })
  async findOne(@Param("id") id: string): Promise<SuccessResponseDto<any>> {
    const session = await this.sessionsService.findById(id);
    if (!session) {
      throw new Error("Session not found");
    }

    return {
      ok: true,
      data: session,
      meta: {
        traceId: "get-session",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH)
  @ApiOperation({ summary: "Update session" })
  @ApiResponse({
    status: 200,
    description: "Session updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Session not found",
  })
  async update(
    @Param("id") id: string,
    @Body() updateSessionDto: UpdateSessionDto
  ): Promise<SuccessResponseDto<any>> {
    const session = await this.sessionsService.update(id, updateSessionDto);
    return {
      ok: true,
      data: session,
      meta: {
        traceId: "update-session",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post(":id/cancel")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH, UserRole.CLIENT)
  @ApiOperation({ summary: "Cancel session" })
  @ApiResponse({
    status: 200,
    description: "Session canceled successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Session not found",
  })
  async cancel(
    @Param("id") id: string,
    @Body() cancelSessionDto: CancelSessionDto,
    @Request() req
  ): Promise<SuccessResponseDto<any>> {
    const session = await this.sessionsService.cancel(
      id,
      cancelSessionDto,
      req.user.sub
    );
    return {
      ok: true,
      data: session,
      meta: {
        traceId: "cancel-session",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post(":id/feedback")
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: "Add session feedback" })
  @ApiResponse({
    status: 200,
    description: "Feedback added successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Session not found",
  })
  async addFeedback(
    @Param("id") id: string,
    @Body() feedbackDto: SessionFeedbackDto
  ): Promise<SuccessResponseDto<any>> {
    const session = await this.sessionsService.addFeedback(id, feedbackDto);
    return {
      ok: true,
      data: session,
      meta: {
        traceId: "add-feedback",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
