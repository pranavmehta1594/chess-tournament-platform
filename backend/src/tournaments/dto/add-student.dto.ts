import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddStudentDto {
  @IsUUID('all', { message: 'A valid student UUID is required' })
  @IsNotEmpty({ message: 'studentId cannot be empty' })
  studentId!: string;
}

