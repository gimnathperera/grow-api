import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type CalendarEventDocument = CalendarEvent &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class CalendarEvent {
  @Prop({ required: true, type: Types.ObjectId, ref: "Session" })
  sessionId: Types.ObjectId;

  @Prop({ required: true })
  providerEventId: string;

  @Prop({ required: true, default: "google" })
  provider: string;

  @Prop()
  lastSyncedAt?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  syncMetadata?: {
    createdInProvider?: boolean;
    updatedInProvider?: boolean;
    deletedInProvider?: boolean;
    lastProviderUpdate?: Date;
  };
}

export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);

// Indexes
CalendarEventSchema.index({ sessionId: 1 }, { unique: true });
CalendarEventSchema.index(
  { providerEventId: 1, provider: 1 },
  { unique: true }
);
CalendarEventSchema.index({ lastSyncedAt: 1 });
