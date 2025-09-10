import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Coach, CoachDocument } from "./schemas/coach.schema";
import { CreateCoachDto, UpdateCoachDto } from "./dto/coach.dto";
import { ErrorCodes } from "../shared/error-codes";

@Injectable()
export class CoachesService {
  constructor(
    @InjectModel(Coach.name) private coachModel: Model<CoachDocument>
  ) {}

  async create(createCoachDto: CreateCoachDto): Promise<CoachDocument> {
    // Check if coach already exists for this user
    const existingCoach = await this.coachModel.findOne({
      userId: createCoachDto.userId,
    });

    if (existingCoach) {
      throw new ConflictException({
        errorCode: ErrorCodes.RESOURCE_ALREADY_EXISTS,
        message: "Coach profile already exists for this user",
      });
    }

    const coach = new this.coachModel(createCoachDto);
    return coach.save();
  }

  async findAll(
    filters: {
      specialties?: string[];
      status?: string;
      acceptingNewClients?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ coaches: CoachDocument[]; total: number }> {
    const {
      specialties,
      status,
      acceptingNewClients,
      page = 1,
      limit = 20,
    } = filters;

    const query: any = {};
    if (status) query.status = status;
    if (acceptingNewClients !== undefined)
      query.acceptingNewClients = acceptingNewClients;
    if (specialties && specialties.length > 0)
      query.specialties = { $in: specialties };

    const skip = (page - 1) * limit;

    const [coaches, total] = await Promise.all([
      this.coachModel
        .find(query)
        .populate("userId", "name email phone")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.coachModel.countDocuments(query),
    ]);

    return { coaches, total };
  }

  async findById(id: string): Promise<CoachDocument | null> {
    return this.coachModel.findById(id).populate("userId", "name email phone");
  }

  async findByUserId(userId: string): Promise<CoachDocument | null> {
    return this.coachModel
      .findOne({ userId })
      .populate("userId", "name email phone");
  }

  async update(
    id: string,
    updateCoachDto: UpdateCoachDto
  ): Promise<CoachDocument> {
    const coach = await this.coachModel
      .findByIdAndUpdate(id, updateCoachDto, { new: true, runValidators: true })
      .populate("userId", "name email phone");

    if (!coach) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Coach not found",
      });
    }

    return coach;
  }

  async updateKpisCache(
    coachId: string,
    kpisData: {
      totalSessions: number;
      totalClients: number;
      averageRating: number;
      totalEarnings: number;
    }
  ): Promise<CoachDocument> {
    const coach = await this.coachModel
      .findByIdAndUpdate(
        coachId,
        {
          kpisCache: {
            ...kpisData,
            lastUpdated: new Date(),
          },
        },
        { new: true, runValidators: true }
      )
      .populate("userId", "name email phone");

    if (!coach) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Coach not found",
      });
    }

    return coach;
  }

  async delete(id: string): Promise<void> {
    const result = await this.coachModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Coach not found",
      });
    }
  }

  async getAvailableCoaches(
    filters: {
      specialties?: string[];
      timeSlot?: string;
      date?: string;
    } = {}
  ): Promise<CoachDocument[]> {
    const { specialties } = filters;

    const query: any = {
      status: "active",
      acceptingNewClients: true,
    };

    if (specialties && specialties.length > 0) {
      query.specialties = { $in: specialties };
    }

    return this.coachModel
      .find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });
  }

  async getCoachStats(coachId: string): Promise<{
    totalClients: number;
    totalSessions: number;
    averageRating: number;
    totalEarnings: number;
    recentActivity: any[];
  }> {
    // This would typically aggregate data from sessions, feedback, etc.
    // For now, return cached data or basic stats
    const coach = await this.findById(coachId);
    if (!coach) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Coach not found",
      });
    }

    return {
      totalClients: coach.kpisCache?.totalClients || 0,
      totalSessions: coach.kpisCache?.totalSessions || 0,
      averageRating: coach.kpisCache?.averageRating || 0,
      totalEarnings: coach.kpisCache?.totalEarnings || 0,
      recentActivity: [], // Would be populated from actual session data
    };
  }
}
