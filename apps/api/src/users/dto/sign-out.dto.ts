import { ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';

@ObjectType()
export class SignOutOutput extends CoreOutput {}
