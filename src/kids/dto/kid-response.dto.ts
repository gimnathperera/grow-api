import { ApiProperty } from "@nestjs/swagger";

export class KidResponseDto {
  @ApiProperty({
    description: "Unique identifier of the kid",
    example: "507f1f77bcf86cd799439011",
  })
  _id: string;

  @ApiProperty({
    description: "Parent user ID who owns this kid profile",
    example: "507f1f77bcf86cd799439012",
  })
  parentId: string;

  @ApiProperty({
    description: "Full name of the child",
    example: "Emma Johnson",
  })
  name: string;

  @ApiProperty({
    description: "Gender of the child",
    enum: ["boy", "girl"],
    example: "girl",
  })
  gender: "boy" | "girl";

  @ApiProperty({
    description: "Age of the child in years",
    example: 12,
  })
  age: number;

  @ApiProperty({
    description: "Location/city where the child is based",
    example: "New York, NY",
  })
  location: string;

  @ApiProperty({
    description:
      "Whether the child is currently participating in sports activities",
    example: true,
  })
  isInSports: boolean;

  @ApiProperty({
    description: "Preferred training style for the child",
    enum: ["personal", "group"],
    example: "group",
  })
  preferredTrainingStyle: "personal" | "group";

  @ApiProperty({
    description: "Timestamp when the kid profile was created",
    example: "2024-01-15T10:30:00.000Z",
  })
  createdAt: string;

  @ApiProperty({
    description: "Timestamp when the kid profile was last updated",
    example: "2024-01-15T10:30:00.000Z",
  })
  updatedAt: string;
}

export class KidsListResponseDto {
  @ApiProperty({
    description: "Array of kid profiles",
    type: [KidResponseDto],
  })
  data: KidResponseDto[];

  @ApiProperty({
    description: "Metadata about the response",
    example: {
      traceId: "get-kids",
      timestamp: "2024-01-15T10:30:00.000Z",
    },
  })
  meta: {
    traceId: string;
    timestamp: string;
  };
}

export class KidDetailResponseDto {
  @ApiProperty({
    description: "Single kid profile",
    type: KidResponseDto,
  })
  data: KidResponseDto;

  @ApiProperty({
    description: "Metadata about the response",
    example: {
      traceId: "get-kid",
      timestamp: "2024-01-15T10:30:00.000Z",
    },
  })
  meta: {
    traceId: string;
    timestamp: string;
  };
}
