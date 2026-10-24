import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dto/output.dto';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../enums/role.enum';

@InputType()
export class SignUpInput {
  @Field(() => String)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @Field(() => String)
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @Field(() => UserRole, { nullable: true })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

@ObjectType()
export class SignUpOutput extends CoreOutput {}
