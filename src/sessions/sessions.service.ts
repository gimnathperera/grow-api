import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Session,
  SessionDocument,
  SessionStatus,
} from "./schemas/session.schema";
import {
  CalendarAccount,
  CalendarAccountDocument,
} from "./schemas/calendar-account.schema";
import {
  CalendarEvent,
  CalendarEventDocument,
} from "./schemas/calendar-event.schema";
import {
  CreateSessionDto,
  UpdateSessionDto,
  CancelSessionDto,
  SessionFeedbackDto,
} from "./dto/session.dto";
import { ErrorCodes } from "../shared/error-codes";
import { ClientsService } from "../clients/clients.service";

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(CalendarAccount.name)
    private calendarAccountModel: Model<CalendarAccountDocument>,
    @InjectModel(CalendarEvent.name)
    private calendarEventModel: Model<CalendarEventDocument>,
    private clientsService: ClientsService
  ) {}

  async create(createSessionDto: CreateSessionDto): Promise<SessionDocument> {
    const { startsAt, endsAt, coachId } = createSessionDto;

    // Check for overlapping sessions
    const overlappingSession = await this.sessionModel.findOne({
      coachId,
      status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] },
      $or: [
        {
          startsAt: { $lt: new Date(endsAt) },
          endsAt: { $gt: new Date(startsAt) },
        },
      ],
    });

    if (overlappingSession) {
      throw new ConflictException({
        errorCode: ErrorCodes.SESS_OVERLAP,
        message: "Session time overlaps with existing session",
      });
    }

    // TODO: Check coach availability rules
    // This would validate against coach's working hours, days, etc.

    const session = new this.sessionModel(createSessionDto);
    const savedSession = await session.save();

    // TODO: Create Google Calendar event if coach has calendar connected
    // await this.createCalendarEvent(savedSession);

    return savedSession;
  }

  async findAll(
    filters: {
      clientId?: string;
      coachId?: string;
      status?: SessionStatus;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ sessions: SessionDocument[]; total: number }> {
    const {
      clientId,
      coachId,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters;

    const query: any = {};
    if (clientId) query.clientId = clientId;
    if (coachId) query.coachId = coachId;
    if (status) query.status = status;

    if (dateFrom || dateTo) {
      query.startsAt = {};
      if (dateFrom) query.startsAt.$gte = new Date(dateFrom);
      if (dateTo) query.startsAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.sessionModel
        .find(query)
        .populate("clientId", "userId goals fitnessLevel")
        .populate("coachId", "userId specialties hourlyRate")
        .skip(skip)
        .limit(limit)
        .sort({ startsAt: 1 }),
      this.sessionModel.countDocuments(query),
    ]);

    return { sessions, total };
  }

  async findById(id: string): Promise<SessionDocument | null> {
    return this.sessionModel
      .findById(id)
      .populate("clientId", "userId goals fitnessLevel")
      .populate("coachId", "userId specialties hourlyRate");
  }

  async update(
    id: string,
    updateSessionDto: UpdateSessionDto
  ): Promise<SessionDocument> {
    const session = await this.sessionModel
      .findByIdAndUpdate(id, updateSessionDto, {
        new: true,
        runValidators: true,
      })
      .populate("clientId", "userId goals fitnessLevel")
      .populate("coachId", "userId specialties hourlyRate");

    if (!session) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Session not found",
      });
    }

    // TODO: Update Google Calendar event if exists
    // await this.updateCalendarEvent(session);

    return session;
  }

  async cancel(
    id: string,
    cancelSessionDto: CancelSessionDto,
    canceledBy: string
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id);
    if (!session) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Session not found",
      });
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException({
        errorCode: ErrorCodes.SESS_CANNOT_CANCEL,
        message: "Cannot cancel a completed session",
      });
    }

    session.status = SessionStatus.CANCELED;
    session.canceledAt = new Date();
    session.canceledBy = new Types.ObjectId(canceledBy);
    session.cancelReason = cancelSessionDto.reason;

    const updatedSession = await session.save();

    // TODO: Cancel Google Calendar event if exists
    // await this.cancelCalendarEvent(updatedSession);

    return updatedSession;
  }

  async addFeedback(
    id: string,
    feedbackDto: SessionFeedbackDto
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id);
    if (!session) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Session not found",
      });
    }

    if (session.status !== SessionStatus.COMPLETED) {
      throw new BadRequestException({
        errorCode: ErrorCodes.VALIDATION_ERROR,
        message: "Can only add feedback to completed sessions",
      });
    }

    session.feedback = {
      rating: feedbackDto.rating,
      comments: feedbackDto.comments,
      submittedAt: new Date(),
    };

    return session.save();
  }

  async checkAvailability(
    coachId: string,
    startsAt: string,
    endsAt: string
  ): Promise<boolean> {
    const overlappingSession = await this.sessionModel.findOne({
      coachId,
      status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] },
      $or: [
        {
          startsAt: { $lt: new Date(endsAt) },
          endsAt: { $gt: new Date(startsAt) },
        },
      ],
    });

    return !overlappingSession;
  }

  async getUpcomingSessions(
    userId: string,
    userRole: string,
    limit = 10
  ): Promise<SessionDocument[]> {
    const query: any = {
      startsAt: { $gte: new Date() },
      status: SessionStatus.SCHEDULED,
    };

    if (userRole === "client") {
      // Find the client profile for this user
      const client = await this.clientsService.findByUserId(userId);
      if (!client) {
        return [];
      }
      query.clientId = client._id;
    } else if (userRole === "coach") {
      query.coachId = userId;
    }

    return this.sessionModel
      .find(query)
      .populate("clientId", "userId")
      .populate("coachId", "userId")
      .sort({ startsAt: 1 })
      .limit(limit);
  }

  async getSessionStats(
    coachId: string,
    period: "week" | "month" | "year" = "month"
  ): Promise<{
    total: number;
    completed: number;
    canceled: number;
    noShow: number;
    revenue: number;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const sessions = await this.sessionModel.find({
      coachId,
      startsAt: { $gte: startDate },
    });

    const stats = {
      total: sessions.length,
      completed: sessions.filter((s) => s.status === SessionStatus.COMPLETED)
        .length,
      canceled: sessions.filter((s) => s.status === SessionStatus.CANCELED)
        .length,
      noShow: sessions.filter((s) => s.status === SessionStatus.NO_SHOW).length,
      revenue: sessions
        .filter((s) => s.status === SessionStatus.COMPLETED)
        .reduce((sum, s) => sum + (s.price || 0), 0),
    };

    return stats;
  }

  // Calendar integration methods (placeholder implementations)
  async connectCalendar(
    userId: string,
    provider: string,
    tokens: any
  ): Promise<CalendarAccountDocument> {
    const calendarAccount = new this.calendarAccountModel({
      userId,
      provider,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      email: tokens.email,
      name: tokens.name,
    });

    return calendarAccount.save();
  }

  async syncCalendar(userId: string): Promise<void> {
    // TODO: Implement calendar synchronization
    console.log(`Syncing calendar for user ${userId}`);
  }
}
