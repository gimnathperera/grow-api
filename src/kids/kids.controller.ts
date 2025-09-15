import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KidsService } from './kids.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateKidDto } from './dto/kids.dto';
import { SuccessResponseDto } from '../common/dto/response.dto';

@ApiTags('Kids')
@Controller('kids')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KidsController {
  constructor(private kidsService: KidsService) {}

  @Post()
  @ApiOperation({ summary: 'Add kid details' })
  async addKid(
    @Request() req,
    @Body() dto: CreateKidDto,
  ): Promise<SuccessResponseDto<any>> {
    const kid = await this.kidsService.create(req.user.sub, dto);
    return {
      ok: true,
      data: kid,
      meta: { traceId: 'add-kid', timestamp: new Date().toISOString() },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get kids for logged-in user' })
  async getKids(@Request() req): Promise<SuccessResponseDto<any[]>> {
    const kids = await this.kidsService.findByParent(req.user.sub);
    return {
      ok: true,
      data: kids,
      meta: { traceId: 'get-kids', timestamp: new Date().toISOString() },
    };
  }
}
