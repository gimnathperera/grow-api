import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type CoachDocument = Coach &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class Coach {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  // Professional information
  @Prop({ type: [String] })
  specialties: string[];

  @Prop()
  bio?: string;

  @Prop({ type: [String] })
  certifications: string[];

  @Prop()
  yearsOfExperience?: number;

  @Prop()
  education?: string[];

  // Availability rules
  @Prop({ type: Object })
  availabilityRules?: {
    workingDays: string[]; // ['monday', 'tuesday', ...]
    workingHours: {
      start: string; // '09:00'
      end: string; // '17:00'
    };
    timezone: string;
    maxSessionsPerDay?: number;
    maxSessionsPerWeek?: number;
    breakTimeBetweenSessions?: number; // minutes
  };

  // KPIs and performance cache
  @Prop({ type: Object })
  kpisCache?: {
    totalSessions: number;
    totalClients: number;
    averageRating: number;
    totalEarnings: number;
    lastUpdated: Date;
  };

  // Rates and pricing
  @Prop()
  hourlyRate?: number;

  @Prop({ type: [Object] })
  sessionTypes?: {
    type: string;
    duration: number; // minutes
    price: number;
  }[];

  // Status and settings
  @Prop({ default: "active" })
  status: string;

  @Prop({ default: true })
  acceptingNewClients: boolean;

  @Prop()
  notes?: string;

  // Social media and portfolio
  @Prop({ type: Object })
  socialMedia?: {
    instagram?: string;
    linkedin?: string;
    website?: string;
  };

  @Prop({ type: [String] })
  portfolioImages?: string[];

  // Communication preferences
  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: true })
  smsNotifications: boolean;

  @Prop()
  preferredLanguage?: string;
}

export const CoachSchema = SchemaFactory.createForClass(Coach);

// Indexes
CoachSchema.index({ userId: 1 }, { unique: true });
CoachSchema.index({ specialties: 1 });
CoachSchema.index({ status: 1 });
CoachSchema.index({ acceptingNewClients: 1 });
CoachSchema.index({ createdAt: -1 });
