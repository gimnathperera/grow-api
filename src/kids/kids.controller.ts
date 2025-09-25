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
  BadRequestException,
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
  getSchemaPath,
  ApiExtraModels,
} from "@nestjs/swagger";
import {
  KidBulkCreateSummary,
  KidView,
  KidsService,
} from "./kids.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CreateKidDto, UpdateKidDto } from "./dto/kids.dto";
import {
  KidResponseDto,
  KidsListResponseDto,
  KidDetailResponseDto,
  KidBulkCreateSummaryDto,
} from "./dto/kid-response.dto";
import { SuccessResponseDto } from "../common/dto/response.dto";
import { UserRole } from "../common/guards/roles.guard";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

@ApiTags("Kids")
@ApiExtraModels(
  CreateKidDto,
  KidResponseDto,
  KidBulkCreateSummaryDto,
  KidDetailResponseDto
)
@Controller("kids")
export class KidsController {
  constructor(private kidsService: KidsService) {}

  @Post()
  @ApiOperation({
    summary: "Add kid details",
    description:
      "Create new kid profiles by providing the parent user's identifier directly in the payload. This endpoint is public and does not require authentication.",
  })
  @ApiBody({
    description:
      "Kid profile information. Each kid entry must include the parentId to associate the child with a parent. Supports a single kid object (backward compatible) or up to 10 kids via array/payload.",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateKidDto) },
        {
          type: "array",
          items: { $ref: getSchemaPath(CreateKidDto) },
          minItems: 1,
          maxItems: 10,
        },
        {
          type: "object",
          properties: {
            parentId: {
              type: "string",
              description: "Unique identifier of the parent user applied to every kid in the request",
              example: "507f1f77bcf86cd799439012",
            },
            kids: {
              type: "array",
              items: { $ref: getSchemaPath(CreateKidDto) },
              minItems: 1,
              maxItems: 10,
            },
          },
          required: ["parentId", "kids"],
        },
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: "Kid profile created successfully",
    type: KidDetailResponseDto,
  })
  @ApiResponse({
    status: 201,
    description: "Kid profiles created successfully (bulk)",
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        data: { $ref: getSchemaPath(KidBulkCreateSummaryDto) },
        meta: {
          type: "object",
          properties: {
            traceId: { type: "string", example: "add-kids-bulk" },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00.000Z",
            },
          },
        },
      },
    },
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
  @ApiConsumes("application/json")
  @ApiProduces("application/json")
  async addKid(
    @Body() payload: any
  ): Promise<
    SuccessResponseDto<KidView | KidBulkCreateSummary>
  > {
    try {
      const { entries, isBulk } = await this.normalizeAndValidatePayload(payload);

      if (isBulk) {
        const summary = await this.kidsService.createMany(entries);
        return {
          ok: true,
          data: summary,
          meta: {
            traceId: "add-kids-bulk",
            timestamp: new Date().toISOString(),
          },
        };
      }

      const kid = await this.kidsService.create(entries[0]);
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  private async normalizeAndValidatePayload(payload: any): Promise<{
    entries: CreateKidDto[];
    isBulk: boolean;
  }> {
    const normalized = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.kids)
      ? payload.kids
      : payload;

    const wrapperParentId =
      !Array.isArray(payload) && typeof payload?.parentId === "string"
        ? payload.parentId.trim()
        : undefined;

    if (!normalized) {
      throw new BadRequestException("Kid payload is required");
    }

    const items = Array.isArray(normalized) ? normalized : [normalized];

    if (!items.length) {
      throw new BadRequestException("Kid payload cannot be empty");
    }

    const MAX_BULK_KIDS = 10;
    if (items.length > MAX_BULK_KIDS) {
      throw new BadRequestException(
        `You can create up to ${MAX_BULK_KIDS} kids in a single request`
      );
    }

    const validatedEntries: CreateKidDto[] = [];
    const parentIds = new Set<string>();

    for (let index = 0; index < items.length; index += 1) {
      const rawKid = items[index];
      if (
        wrapperParentId &&
        typeof rawKid?.parentId === "string" &&
        rawKid.parentId.trim() !== wrapperParentId
      ) {
        throw new BadRequestException(
          `parentId mismatch for kid at index ${index}`
        );
      }

      const kidSource =
        wrapperParentId &&
        (rawKid === null ||
          typeof rawKid !== "object" ||
          typeof rawKid?.parentId !== "string")
          ? {
              ...(typeof rawKid === "object" && rawKid !== null ? rawKid : {}),
              parentId: wrapperParentId,
            }
          : rawKid;

      const kidDto = plainToInstance(CreateKidDto, kidSource, {
        enableImplicitConversion: true,
      });
      const errors = await validate(kidDto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (errors.length) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints ?? {}))
          .flat();

        throw new BadRequestException({
          message: `Validation failed for kid at index ${index}`,
          errors: errorMessages,
        });
      }

      validatedEntries.push(kidDto);
      parentIds.add(kidDto.parentId);
    }

    if (parentIds.size !== 1) {
      throw new BadRequestException(
        "All kid entries must use the same parentId"
      );
    }

    return {
      entries: validatedEntries,
      isBulk: Array.isArray(normalized),
    };
  }
}
