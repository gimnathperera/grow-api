import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type SessionDocument = Session &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

export enum SessionStatus {
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELED = "canceled",
  NO_SHOW = "no_show",
  IN_PROGRESS = "in_progress",
}

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true, type: Types.ObjectId, ref: "Client" })
  clientId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Coach" })
  coachId: Types.ObjectId;

  @Prop({ required: true })
  startsAt: Date;

  @Prop({ required: true })
  endsAt: Date;

  @Prop({
    required: true,
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  status: SessionStatus;

  @Prop()
  location?: string;

  @Prop()
  notes?: string;

  @Prop()
  sessionType?: string;

  @Prop()
  price?: number;

  @Prop()
  paymentStatus?: string;

  @Prop({ type: Object })
  googleEventId?: string;

  @Prop()
  reminderSent?: boolean;

  @Prop()
  canceledAt?: Date;

  @Prop()
  canceledBy?: Types.ObjectId;

  @Prop()
  cancelReason?: string;

  @Prop({ type: Object })
  feedback?: {
    rating?: number;
    comments?: string;
    submittedAt?: Date;
  };

  @Prop({ type: [String] })
  tags?: string[];
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Indexes
SessionSchema.index({ clientId: 1, startsAt: 1 });
SessionSchema.index({ coachId: 1, startsAt: 1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ startsAt: 1, endsAt: 1 });
SessionSchema.index({ createdAt: -1 });
