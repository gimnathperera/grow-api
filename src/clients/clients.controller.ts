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
import { ClientsService } from "./clients.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard, Roles, UserRole } from "../common/guards/roles.guard";
import { PageQueryDto } from "../common/dto/page-query.dto";
import {
  CreateClientDto,
  UpdateClientDto,
  AssignCoachDto,
} from "./dto/client.dto";
import { SuccessResponseDto } from "../common/dto/response.dto";

@ApiTags("Clients")
@Controller("clients")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({ summary: "Create a new client profile" })
  @ApiResponse({
    status: 201,
    description: "Client created successfully",
  })
  async create(
    @Body() createClientDto: CreateClientDto
  ): Promise<SuccessResponseDto<any>> {
    const client = await this.clientsService.create(createClientDto);
    return {
      ok: true,
      data: client,
      meta: {
        traceId: "create-client",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH)
  @ApiOperation({ summary: "Get all clients" })
  @ApiResponse({
    status: 200,
    description: "Clients retrieved successfully",
  })
  @ApiQuery({ name: "assignedCoachId", required: false })
  @ApiQuery({ name: "tags", required: false, type: [String] })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async findAll(
    @Query()
    query: PageQueryDto & {
      assignedCoachId?: string;
      tags?: string[];
      status?: string;
    }
  ): Promise<
    SuccessResponseDto<{ clients: any[]; total: number; pagination: any }>
  > {
    const { clients, total } = await this.clientsService.findAll({
      assignedCoachId: query.assignedCoachId,
      tags: query.tags,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    const totalPages = Math.ceil(total / (query.limit || 20));

    return {
      ok: true,
      data: {
        clients,
        total,
        pagination: {
          page: query.page || 1,
          limit: query.limit || 20,
          total,
          totalPages,
        },
      },
      meta: {
        traceId: "get-clients",
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

  @Get("my-profile")
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: "Get current client profile" })
  @ApiResponse({
    status: 200,
    description: "Client profile retrieved successfully",
  })
  async getMyProfile(@Request() req): Promise<SuccessResponseDto<any>> {
    const client = await this.clientsService.findByUserId(req.user.sub);
    if (!client) {
      throw new Error("Client profile not found");
    }

    return {
      ok: true,
      data: client,
      meta: {
        traceId: "get-my-profile",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.COACH, UserRole.CLIENT)
  @ApiOperation({ summary: "Get client by ID" })
  @ApiResponse({
    status: 200,
    description: "Client retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Client not found",
  })
  async findOne(
    @Param("id") id: string,
    @Request() req
  ): Promise<SuccessResponseDto<any>> {
    // Check if client is accessing their own profile or has permission
    if (req.user.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      if (!client || client._id.toString() !== id) {
        throw new Error("Access denied");
      }
    }

    const client = await this.clientsService.findById(id);
    if (!client) {
      throw new Error("Client not found");
    }

    return {
      ok: true,
      data: client,
      meta: {
        traceId: "get-client",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.TEAM, UserRole.CLIENT)
  @ApiOperation({ summary: "Update client" })
  @ApiResponse({
    status: 200,
    description: "Client updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Client not found",
  })
  async update(
    @Param("id") id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req
  ): Promise<SuccessResponseDto<any>> {
    // Check if client is updating their own profile or has permission
    if (req.user.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      if (!client || client._id.toString() !== id) {
        throw new Error("Access denied");
      }
    }

    const client = await this.clientsService.update(id, updateClientDto);
    return {
      ok: true,
      data: client,
      meta: {
        traceId: "update-client",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("assign-coach")
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({ summary: "Assign coach to client" })
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
        traceId: "assign-coach",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({ summary: "Delete client" })
  @ApiResponse({
    status: 200,
    description: "Client deleted successfully",
  })
  async remove(@Param("id") id: string): Promise<SuccessResponseDto<null>> {
    await this.clientsService.delete(id);
    return {
      ok: true,
      data: null,
      meta: {
        traceId: "delete-client",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
