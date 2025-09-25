import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateKidDto, UpdateKidDto } from "./dto/kids.dto";
import { UsersService } from "../users/users.service";
import { Kid, KidDocument } from "./schemas/kid.schema";

type KidWithParent = Kid & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  parent?: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
    kidsDataCompleted?: boolean;
  };
};

export interface KidParentSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  kidsDataCompleted?: boolean;
}

export interface KidView {
  _id: string;
  parentId: string;
  name: string;
  gender: "boy" | "girl";
  age: number;
  location: string;
  isInSports: boolean;
  preferredTrainingStyle: "personal" | "group";
  createdAt: string;
  updatedAt: string;
  parent?: KidParentSummary;
}

export interface KidBulkCreateSummary {
  created: number;
  kids: KidView[];
  kidIds: string[];
}

@Injectable()
export class KidsService {
  constructor(
    @InjectModel(Kid.name) private kidModel: Model<KidDocument>,
    private usersService: UsersService
  ) {}

  async create(parentId: string, dto: CreateKidDto): Promise<KidView> {
    const kid = await this.kidModel.create({ ...dto, parentId });

    await this.usersService.linkKidToParent(parentId, kid._id as Types.ObjectId);

    // Mark parent's kidsDataCompleted = true
    await this.usersService.updateKidsDataStatus(parentId, true);

    await kid.populate({
      path: "parent",
      select: "name email phone kidsDataCompleted",
    });

    return this.mapKidResponse(kid);
  }

  async createMany(
    parentId: string,
    dtos: CreateKidDto[]
  ): Promise<KidBulkCreateSummary> {
    const docs = dtos.map((dto) => ({ ...dto, parentId }));

    const createdKids = await this.kidModel.insertMany(docs, {
      ordered: true,
    });

    const kidIds = createdKids.map((kid) => kid._id as Types.ObjectId);

    await this.usersService.linkKidsToParent(parentId, kidIds);
    await this.usersService.updateKidsDataStatus(parentId, true);

    const populatedKids = await this.kidModel
      .find({ _id: { $in: kidIds } })
      .populate({
        path: "parent",
        select: "name email phone kidsDataCompleted",
      })
      .exec();

    const kidViews = populatedKids.map((kid) => this.mapKidResponse(kid));

    return {
      created: kidViews.length,
      kids: kidViews,
      kidIds: kidViews.map((kid) => kid._id),
    };
  }

  async findByParent(parentId: string): Promise<KidView[]> {
    const kids = await this.kidModel
      .find({ parentId })
      .populate({
        path: "parent",
        select: "name email phone kidsDataCompleted",
      })
      .exec();

    return kids.map((kid) => this.mapKidResponse(kid));
  }

  async findByIdAndParent(id: string, parentId: string): Promise<KidView> {
    const kid = await this.kidModel
      .findOne({ _id: id, parentId })
      .populate({
        path: "parent",
        select: "name email phone kidsDataCompleted",
      })
      .exec();
    if (!kid) {
      throw new NotFoundException("Kid not found");
    }
    return this.mapKidResponse(kid);
  }

  async update(id: string, parentId: string, dto: UpdateKidDto): Promise<KidView> {
    const kid = await this.kidModel
      .findOneAndUpdate({ _id: id, parentId }, { ...dto }, { new: true })
      .populate({
        path: "parent",
        select: "name email phone kidsDataCompleted",
      })
      .exec();

    if (!kid) {
      throw new NotFoundException("Kid not found");
    }

    return this.mapKidResponse(kid);
  }

  async delete(id: string, parentId: string): Promise<void> {
    const result = await this.kidModel
      .findOneAndDelete({ _id: id, parentId })
      .exec();

    if (!result) {
      throw new NotFoundException("Kid not found");
    }

    await this.usersService.unlinkKidFromParent(
      parentId,
      result._id as Types.ObjectId
    );
  }

  private mapKidResponse(kid: KidDocument | KidWithParent): KidView {
    const source: KidWithParent =
      typeof (kid as any).toObject === "function"
        ? ((kid as any).toObject({ getters: false, virtuals: true }) as KidWithParent)
        : (kid as KidWithParent);

    const parent = source.parent
      ? {
          id: source.parent._id.toString(),
          name: source.parent.name,
          email: source.parent.email,
          phone: source.parent.phone,
          kidsDataCompleted: source.parent.kidsDataCompleted,
        }
      : undefined;

    return {
      _id: source._id.toString(),
      parentId: source.parentId?.toString() as string,
      name: source.name,
      gender: source.gender,
      age: source.age,
      location: source.location,
      isInSports: source.isInSports,
      preferredTrainingStyle: source.preferredTrainingStyle,
      createdAt: source.createdAt instanceof Date
        ? source.createdAt.toISOString()
        : new Date(source.createdAt).toISOString(),
      updatedAt: source.updatedAt instanceof Date
        ? source.updatedAt.toISOString()
        : new Date(source.updatedAt).toISOString(),
      ...(parent ? { parent } : {}),
    };
  }
}
