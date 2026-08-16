import { HideField, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';

@ObjectType()
export class Verification extends CoreEntity {
  @HideField()
  userId!: string;

  @HideField()
  tokenHash!: string;

  @HideField()
  expiresAt!: Date;
}
