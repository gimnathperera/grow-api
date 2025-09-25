import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateKidDto, UpdateKidDto } from "./dto/kids.dto";
import { UsersService } from "../users/users.service";
import { Kid, KidDocument } from "./schemas/kid.schema";

@Injectable()
export class KidsService {
  constructor(
    @InjectModel(Kid.name) private kidModel: Model<KidDocument>,
    private usersService: UsersService
  ) {}

  async create(parentId: string, dto: CreateKidDto): Promise<Kid> {
    const kid = await this.kidModel.create({ ...dto, parentId });

    // Mark parent's kidsDataCompleted = true
    await this.usersService.updateKidsDataStatus(parentId, true);

    return kid;
  }

  async findByParent(parentId: string): Promise<Kid[]> {
    return this.kidModel.find({ parentId }).exec();
  }

  async findByIdAndParent(id: string, parentId: string): Promise<Kid> {
    const kid = await this.kidModel.findOne({ _id: id, parentId }).exec();
    if (!kid) {
      throw new NotFoundException("Kid not found");
    }
    return kid;
  }

  async update(id: string, parentId: string, dto: UpdateKidDto): Promise<Kid> {
    const kid = await this.kidModel
      .findOneAndUpdate({ _id: id, parentId }, { ...dto }, { new: true })
      .exec();

    if (!kid) {
      throw new NotFoundException("Kid not found");
    }

    return kid;
  }

  async delete(id: string, parentId: string): Promise<void> {
    const result = await this.kidModel
      .findOneAndDelete({ _id: id, parentId })
      .exec();

    if (!result) {
      throw new NotFoundException("Kid not found");
    }
  }
}
