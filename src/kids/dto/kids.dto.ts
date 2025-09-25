import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsNotEmpty,
} from "class-validator";

export class CreateKidDto {
  @ApiProperty({
    description: "Unique identifier of the parent user who owns this kid profile",
    example: "507f1f77bcf86cd799439012",
  })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({
    description: "Full name of the child",
    example: "Emma Johnson",
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: ["boy", "girl"],
    description: "Gender of the child",
    example: "girl",
  })
  @IsEnum(["boy", "girl"])
  gender: "boy" | "girl";

  @ApiProperty({
    description: "Age of the child in years",
    example: 12,
    minimum: 1,
    maximum: 18,
  })
  @IsInt()
  @Min(1)
  @Max(18)
  age: number;

  @ApiProperty({
    description: "Location/city where the child is based",
    example: "New York, NY",
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description:
      "Whether the child is currently participating in sports activities",
    example: true,
  })
  @IsBoolean()
  isInSports: boolean;

  @ApiProperty({
    enum: ["personal", "group"],
    description: "Preferred training style for the child",
    example: "group",
  })
  @IsEnum(["personal", "group"])
  preferredTrainingStyle: "personal" | "group";
}

export class UpdateKidDto {
  @ApiProperty({
    description: "Full name of the child",
    example: "Emma Johnson",
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    enum: ["boy", "girl"],
    description: "Gender of the child",
    example: "girl",
    required: false,
  })
  @IsEnum(["boy", "girl"])
  gender?: "boy" | "girl";

  @ApiProperty({
    description: "Age of the child in years",
    example: 12,
    minimum: 1,
    maximum: 18,
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(18)
  age?: number;

  @ApiProperty({
    description: "Location/city where the child is based",
    example: "New York, NY",
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiProperty({
    description:
      "Whether the child is currently participating in sports activities",
    example: true,
    required: false,
  })
  @IsBoolean()
  isInSports?: boolean;

  @ApiProperty({
    enum: ["personal", "group"],
    description: "Preferred training style for the child",
    example: "group",
    required: false,
  })
  @IsEnum(["personal", "group"])
  preferredTrainingStyle?: "personal" | "group";
}
