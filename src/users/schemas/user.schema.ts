import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { UserRole } from "../../common/guards/roles.guard";
import { Kid } from "@/kids/schemas/kid.schema";

export type UserDocument = User &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: UserRole, type: String })
  role: UserRole;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: "active", enum: ["active", "inactive", "suspended"] })
  status: string;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop()
  lockedUntil?: Date;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop()
  phoneVerifiedAt?: Date;

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop()
  twoFactorSecret?: string;

  @Prop({ default: false })
  kidsDataCompleted: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: Kid.name }], default: [] })
  kids: Types.ObjectId[] | Kid[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

UserSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_: unknown, ret: any) => {
    if (ret._id) {
      ret._id = ret._id.toString();
    }
    if (Array.isArray(ret.kids)) {
      ret.kids = ret.kids.map((kid: any) =>
        kid && kid._id ? { ...kid, _id: kid._id.toString() } : kid?.toString?.() ?? kid
      );
    }
    return ret;
  },
});
