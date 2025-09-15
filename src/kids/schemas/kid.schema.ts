import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Types } from 'mongoose';

export type KidDocument = Kid & Document;

@Schema({ timestamps: true })
export class Kid {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  parentId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['boy', 'girl'] })
  gender: 'boy' | 'girl';

  @Prop({ required: true })
  age: number;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  isInSports: boolean;

  @Prop({ required: true, enum: ['personal', 'group'] })
  preferredTrainingStyle: 'personal' | 'group';
}

export const KidSchema = SchemaFactory.createForClass(Kid);
