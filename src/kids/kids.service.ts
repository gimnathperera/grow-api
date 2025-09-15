import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateKidDto } from './dto/kids.dto';
import { UsersService } from '../users/users.service';
import { Kid, KidDocument } from './schemas/kid.schema';

@Injectable()
export class KidsService {
  constructor(
    @InjectModel(Kid.name) private kidModel: Model<KidDocument>,
    private usersService: UsersService,
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
}
