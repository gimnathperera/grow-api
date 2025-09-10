import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ClientDocument = Client &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class Client {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  // Demographics
  @Prop()
  dateOfBirth?: Date;

  @Prop()
  gender?: string;

  @Prop({ type: Object })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  // Goals and preferences
  @Prop({ type: [String] })
  goals?: string[];

  @Prop()
  fitnessLevel?: string;

  @Prop()
  medicalConditions?: string[];

  @Prop()
  dietaryRestrictions?: string[];

  @Prop()
  preferredWorkoutTimes?: string[];

  @Prop()
  preferredWorkoutTypes?: string[];

  // Terms and conditions
  @Prop()
  termsAcceptedAt?: Date;

  @Prop()
  privacyPolicyAcceptedAt?: Date;

  // Coach assignment
  @Prop({ type: Types.ObjectId, ref: "Coach" })
  assignedCoachId?: Types.ObjectId;

  // Tags and categorization
  @Prop({ type: [String] })
  tags?: string[];

  // Files and documents
  @Prop({ type: [String] })
  files?: string[];

  // Status and notes
  @Prop({ default: "active" })
  status: string;

  @Prop()
  notes?: string;

  // Emergency contact
  @Prop({ type: Object })
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };

  // Communication preferences
  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: true })
  smsNotifications: boolean;

  @Prop()
  preferredLanguage?: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

// Indexes
ClientSchema.index({ userId: 1 }, { unique: true });
ClientSchema.index({ assignedCoachId: 1 });
ClientSchema.index({ tags: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ createdAt: -1 });
