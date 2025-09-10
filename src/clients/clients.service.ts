import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Client, ClientDocument } from "./schemas/client.schema";
import { CreateClientDto, UpdateClientDto } from "./dto/client.dto";
import { ErrorCodes } from "../shared/error-codes";

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>
  ) {}

  async create(createClientDto: CreateClientDto): Promise<ClientDocument> {
    // Check if client already exists for this user
    const existingClient = await this.clientModel.findOne({
      userId: createClientDto.userId,
    });

    if (existingClient) {
      throw new ConflictException({
        errorCode: ErrorCodes.RESOURCE_ALREADY_EXISTS,
        message: "Client profile already exists for this user",
      });
    }

    const client = new this.clientModel(createClientDto);
    return client.save();
  }

  async findAll(
    filters: {
      assignedCoachId?: string;
      tags?: string[];
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ clients: ClientDocument[]; total: number }> {
    const { assignedCoachId, tags, status, page = 1, limit = 20 } = filters;

    const query: any = {};
    if (assignedCoachId) query.assignedCoachId = assignedCoachId;
    if (status) query.status = status;
    if (tags && tags.length > 0) query.tags = { $in: tags };

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.clientModel
        .find(query)
        .populate("userId", "name email phone")
        .populate("assignedCoachId", "userId specialties")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.clientModel.countDocuments(query),
    ]);

    return { clients, total };
  }

  async findById(id: string): Promise<ClientDocument | null> {
    return this.clientModel
      .findById(id)
      .populate("userId", "name email phone")
      .populate("assignedCoachId", "userId specialties");
  }

  async findByUserId(userId: string): Promise<ClientDocument | null> {
    return this.clientModel
      .findOne({ userId })
      .populate("userId", "name email phone")
      .populate("assignedCoachId", "userId specialties");
  }

  async update(
    id: string,
    updateClientDto: UpdateClientDto
  ): Promise<ClientDocument> {
    const client = await this.clientModel
      .findByIdAndUpdate(id, updateClientDto, {
        new: true,
        runValidators: true,
      })
      .populate("userId", "name email phone")
      .populate("assignedCoachId", "userId specialties");

    if (!client) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Client not found",
      });
    }

    return client;
  }

  async assignCoach(
    clientId: string,
    coachId: string
  ): Promise<ClientDocument> {
    const client = await this.clientModel
      .findByIdAndUpdate(
        clientId,
        { assignedCoachId: coachId },
        { new: true, runValidators: true }
      )
      .populate("userId", "name email phone")
      .populate("assignedCoachId", "userId specialties");

    if (!client) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Client not found",
      });
    }

    return client;
  }

  async removeCoach(clientId: string): Promise<ClientDocument> {
    const client = await this.clientModel
      .findByIdAndUpdate(
        clientId,
        { $unset: { assignedCoachId: 1 } },
        { new: true, runValidators: true }
      )
      .populate("userId", "name email phone")
      .populate("assignedCoachId", "userId specialties");

    if (!client) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Client not found",
      });
    }

    return client;
  }

  async delete(id: string): Promise<void> {
    const result = await this.clientModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException({
        errorCode: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Client not found",
      });
    }
  }

  async getClientsByCoach(
    coachId: string,
    page = 1,
    limit = 20
  ): Promise<{ clients: ClientDocument[]; total: number }> {
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.clientModel
        .find({ assignedCoachId: coachId })
        .populate("userId", "name email phone")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.clientModel.countDocuments({ assignedCoachId: coachId }),
    ]);

    return { clients, total };
  }
}
