import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  timeControl?: string;

  @IsOptional()
  @IsInt()
  @Min(30)
  initialTimeSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  incrementSeconds?: number;

  @IsOptional()
  startDateTime?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'OPEN', 'ONGOING', 'COMPLETED'])
  status?: 'DRAFT' | 'OPEN' | 'ONGOING' | 'COMPLETED';

  @IsOptional()
  @IsString()
  winnerId?: string;
}
