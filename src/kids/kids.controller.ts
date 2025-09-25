import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Param,
  Patch,
  Delete,
  HttpException,
  HttpStatus,
  Query,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiProduces,
  ApiQuery,
} from "@nestjs/swagger";
import { KidView, KidsService } from "./kids.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CreateKidDto, UpdateKidDto } from "./dto/kids.dto";
import {
  KidResponseDto,
  KidsListResponseDto,
  KidDetailResponseDto,
} from "./dto/kid-response.dto";
import { SuccessResponseDto } from "../common/dto/response.dto";
import { UserRole } from "../common/guards/roles.guard";

@ApiTags("Kids")
@Controller("kids")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KidsController {
  constructor(private kidsService: KidsService) {}

  @Post()
  @ApiOperation({
    summary: "Add kid details",
    description:
      "Create a new kid profile for the authenticated user. This endpoint allows parents to register their children for fitness programs.",
  })
  @ApiBody({
    type: CreateKidDto,
    description:
      "Kid profile information including name, gender, age, location, sports participation, and preferred training style.",
  })
  @ApiResponse({
    status: 201,
    description: "Kid profile created successfully",
    type: KidDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data",
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: false },
        message: { type: "string", example: "Validation failed" },
        errors: { type: "array", items: { type: "string" } },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiConsumes("application/json")
  @ApiProduces("application/json")
  async addKid(
    @Request() req,
    @Body() dto: CreateKidDto
  ): Promise<SuccessResponseDto<KidView>> {
    try {
      const kid = await this.kidsService.create(req.user.sub, dto);
      return {
        ok: true,
        data: kid,
        meta: { traceId: "add-kid", timestamp: new Date().toISOString() },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to create kid profile",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: "Get kids for logged-in user",
    description:
      "Retrieve all kid profiles associated with the authenticated user (parent). Returns an array of kid profiles with their details.",
  })
  @ApiResponse({
    status: 200,
    description: "Kids retrieved successfully",
    type: KidsListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiQuery({
    name: "parentId",
    required: false,
    description:
      "Optional parent identifier for admin or team members to fetch kids for a specific parent",
  })
  @ApiProduces("application/json")
  async getKids(
    @Request() req,
    @Query("parentId") parentId?: string
  ): Promise<SuccessResponseDto<KidView[]>> {
    try {
      const effectiveParentId = parentId ?? req.user.sub;

      if (
        effectiveParentId !== req.user.sub &&
        ![UserRole.ADMIN, UserRole.TEAM].includes(req.user.role)
      ) {
        throw new ForbiddenException("Access denied to requested parent");
      }

      const kids = await this.kidsService.findByParent(effectiveParentId);
      return {
        ok: true,
        data: kids,
        meta: { traceId: "get-kids", timestamp: new Date().toISOString() },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to retrieve kids",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get kid by ID",
    description:
      "Retrieve a specific kid profile by ID. Only accessible by the parent who owns the kid profile.",
  })
  @ApiParam({
    name: "id",
    description: "Unique identifier of the kid",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "Kid profile retrieved successfully",
    type: KidDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Kid not found",
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: false },
        message: { type: "string", example: "Kid not found" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Access denied to this kid profile",
  })
  async getKid(
    @Param("id") id: string,
    @Request() req
  ): Promise<SuccessResponseDto<KidView>> {
    try {
      const kid = await this.kidsService.findByIdAndParent(id, req.user.sub);
      return {
        ok: true,
        data: kid,
        meta: { traceId: "get-kid", timestamp: new Date().toISOString() },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException("Kid not found", HttpStatus.NOT_FOUND);
    }
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update kid profile",
    description:
      "Update an existing kid profile. Only the parent who owns the profile can update it.",
  })
  @ApiParam({
    name: "id",
    description: "Unique identifier of the kid to update",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiBody({
    type: UpdateKidDto,
    description:
      "Updated kid profile information. All fields are optional for partial updates.",
  })
  @ApiResponse({
    status: 200,
    description: "Kid profile updated successfully",
    type: KidDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Kid not found",
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: false },
        message: { type: "string", example: "Kid not found" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Access denied to this kid profile",
  })
  @ApiConsumes("application/json")
  @ApiProduces("application/json")
  async updateKid(
    @Param("id") id: string,
    @Body() dto: UpdateKidDto,
    @Request() req
  ): Promise<SuccessResponseDto<KidView>> {
    try {
      const kid = await this.kidsService.update(id, req.user.sub, dto);
      return {
        ok: true,
        data: kid,
        meta: { traceId: "update-kid", timestamp: new Date().toISOString() },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException("Kid not found", HttpStatus.NOT_FOUND);
    }
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete kid profile",
    description:
      "Permanently delete a kid profile. Only the parent who owns the profile can delete it.",
  })
  @ApiParam({
    name: "id",
    description: "Unique identifier of the kid to delete",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "Kid profile deleted successfully",
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        data: { type: "null", example: null },
        meta: {
          type: "object",
          properties: {
            traceId: { type: "string", example: "delete-kid" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Kid not found",
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: false },
        message: { type: "string", example: "Kid not found" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Access denied to this kid profile",
  })
  @ApiProduces("application/json")
  async deleteKid(
    @Param("id") id: string,
    @Request() req
  ): Promise<SuccessResponseDto<null>> {
    try {
      await this.kidsService.delete(id, req.user.sub);
      return {
        ok: true,
        data: null,
        meta: { traceId: "delete-kid", timestamp: new Date().toISOString() },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException("Kid not found", HttpStatus.NOT_FOUND);
    }
  }
}
