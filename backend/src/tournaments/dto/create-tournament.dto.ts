import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTournamentDto {
  @IsString({ message: 'Tournament name must be a string' })
  @IsNotEmpty({ message: 'Tournament name cannot be empty' })
  name!: string;

  @IsString({ message: 'Time control must be a string (e.g. 5+0, 3+2)' })
  @IsNotEmpty({ message: 'Time control cannot be empty' })
  timeControl!: string;

  @IsOptional()
  @IsInt({ message: 'Initial time in seconds must be an integer' })
  @Min(30, { message: 'Initial time must be at least 30 seconds' })
  initialTimeSeconds?: number;

  @IsOptional()
  @IsInt({ message: 'Increment in seconds must be an integer' })
  @Min(0, { message: 'Increment cannot be negative' })
  incrementSeconds?: number;

  @IsNotEmpty({ message: 'Start date time is required' })
  startDateTime!: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'OPEN', 'ONGOING', 'COMPLETED'])
  status?: 'DRAFT' | 'OPEN' | 'ONGOING' | 'COMPLETED';
}

