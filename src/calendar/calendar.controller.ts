import {
  Controller,
  Get,
  Post,
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
import { SessionsService } from "../sessions/sessions.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard, Roles, UserRole } from "../common/guards/roles.guard";
import { SuccessResponseDto } from "../common/dto/response.dto";

@ApiTags("Calendar")
@Controller("calendar")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private sessionsService: SessionsService) {}

  @Post("connect")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH)
  @ApiOperation({ summary: "Connect Google Calendar" })
  @ApiResponse({
    status: 200,
    description: "Calendar connected successfully",
  })
  async connectCalendar(
    @Request() req,
    @Body() body: { code: string; provider?: string }
  ): Promise<SuccessResponseDto<any>> {
    // TODO: Implement OAuth flow with Google Calendar
    // For now, return a placeholder response
    const calendarAccount = await this.sessionsService.connectCalendar(
      req.user.sub,
      body.provider || "google",
      {
        access_token: "placeholder_token",
        refresh_token: "placeholder_refresh",
        expires_in: 3600,
        email: req.user.email,
        name: req.user.name,
      }
    );

    return {
      ok: true,
      data: calendarAccount,
      meta: {
        traceId: "connect-calendar",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("sync")
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({ summary: "Sync calendar events" })
  @ApiResponse({
    status: 200,
    description: "Calendar synced successfully",
  })
  @ApiQuery({ name: "userId", required: false })
  async syncCalendar(
    @Request() req,
    @Query("userId") userId?: string
  ): Promise<SuccessResponseDto<null>> {
    const targetUserId = userId || req.user.sub;
    await this.sessionsService.syncCalendar(targetUserId);

    return {
      ok: true,
      data: null,
      meta: {
        traceId: "sync-calendar",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get("auth-url")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH)
  @ApiOperation({ summary: "Get Google Calendar OAuth URL" })
  @ApiResponse({
    status: 200,
    description: "OAuth URL generated successfully",
  })
  async getAuthUrl(
    @Request() req
  ): Promise<SuccessResponseDto<{ url: string }>> {
    // TODO: Generate actual Google OAuth URL
    const authUrl = `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&scope=https://www.googleapis.com/auth/calendar&response_type=code&state=${req.user.sub}`;

    return {
      ok: true,
      data: { url: authUrl },
      meta: {
        traceId: "get-auth-url",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
