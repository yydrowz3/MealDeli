import { UploadPurpose } from '@/uploads/domain/upload-purpose';
import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UploadImageBody {
  @Transform(trimString)
  @IsEnum(UploadPurpose)
  purpose!: UploadPurpose;
}
