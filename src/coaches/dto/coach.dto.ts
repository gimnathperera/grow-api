import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class AvailabilityRulesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  workingDays: string[];

  @ApiProperty()
  @IsObject()
  workingHours: {
    start: string;
    end: string;
  };

  @ApiProperty()
  @IsString()
  timezone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxSessionsPerDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxSessionsPerWeek?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  breakTimeBetweenSessions?: number;
}

export class SessionTypeDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  @IsNumber()
  price: number;
}

export class SocialMediaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;
}

export class CreateCoachDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  education?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => AvailabilityRulesDto)
  @IsObject()
  availabilityRules?: AvailabilityRulesDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiPropertyOptional({ type: [SessionTypeDto] })
  @IsOptional()
  @IsArray()
  @Type(() => SessionTypeDto)
  sessionTypes?: SessionTypeDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  acceptingNewClients?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => SocialMediaDto)
  @IsObject()
  socialMedia?: SocialMediaDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioImages?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}

export class UpdateCoachDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  education?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => AvailabilityRulesDto)
  @IsObject()
  availabilityRules?: AvailabilityRulesDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiPropertyOptional({ type: [SessionTypeDto] })
  @IsOptional()
  @IsArray()
  @Type(() => SessionTypeDto)
  sessionTypes?: SessionTypeDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptingNewClients?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => SocialMediaDto)
  @IsObject()
  socialMedia?: SocialMediaDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioImages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
