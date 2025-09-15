import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class CreateKidDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['boy', 'girl'] })
  @IsEnum(['boy', 'girl'])
  gender: 'boy' | 'girl';

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(18)
  age: number;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty()
  @IsBoolean()
  isInSports: boolean;

  @ApiProperty({ enum: ['personal', 'group'] })
  @IsEnum(['personal', 'group'])
  preferredTrainingStyle: 'personal' | 'group';
}
