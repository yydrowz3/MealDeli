import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  OWNER = 'OWNER',
  COURIER = 'COURIER',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'The role of the user in the system',
});
