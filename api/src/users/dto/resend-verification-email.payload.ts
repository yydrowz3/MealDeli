import { OperationPayload } from '@/common/dto/operation.payload';
import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ResendVerificationEmailPayload extends OperationPayload {}
