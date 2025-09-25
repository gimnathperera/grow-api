import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Types } from 'mongoose';

export type KidDocument = Kid & Document;

@Schema({
  timestamps: true,
})
export class Kid {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  parentId: Types.ObjectId;

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

KidSchema.index({ parentId: 1, name: 1 });

KidSchema.virtual('parent', {
  ref: 'User',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true,
});

KidSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_: unknown, ret: any) => {
    if (ret._id) {
      ret._id = ret._id.toString();
    }
    if (ret.parentId) {
      ret.parentId = ret.parentId.toString();
    }
    if (ret.parent && ret.parent._id) {
      ret.parent._id = ret.parent._id.toString();
    }
    return ret;
  },
});
