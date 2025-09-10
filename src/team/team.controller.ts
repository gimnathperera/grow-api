import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ClientsService } from "../clients/clients.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard, Roles, UserRole } from "../common/guards/roles.guard";
import { AssignCoachDto } from "../clients/dto/client.dto";
import { SuccessResponseDto } from "../common/dto/response.dto";

@ApiTags("Team")
@Controller("team")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private clientsService: ClientsService) {}

  @Post("assign-coach")
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({ summary: "Assign coach to client (Team only)" })
  @ApiResponse({
    status: 200,
    description: "Coach assigned successfully",
  })
  async assignCoach(
    @Body() assignCoachDto: AssignCoachDto
  ): Promise<SuccessResponseDto<any>> {
    const client = await this.clientsService.assignCoach(
      assignCoachDto.clientId,
      assignCoachDto.coachId
    );
    return {
      ok: true,
      data: client,
      meta: {
        traceId: "team-assign-coach",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
