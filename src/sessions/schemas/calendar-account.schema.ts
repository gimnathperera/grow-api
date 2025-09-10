import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type CalendarAccountDocument = CalendarAccount &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class CalendarAccount {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true, default: "google" })
  provider: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop()
  refreshToken?: string;

  @Prop()
  tokenExpiresAt?: Date;

  @Prop()
  calendarId?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  syncState?: {
    lastSyncAt?: Date;
    syncEnabled?: boolean;
    twoWaySync?: boolean;
  };

  @Prop()
  email?: string;

  @Prop()
  name?: string;
}

export const CalendarAccountSchema =
  SchemaFactory.createForClass(CalendarAccount);

// Indexes
CalendarAccountSchema.index({ userId: 1, provider: 1 }, { unique: true });
CalendarAccountSchema.index({ isActive: 1 });
