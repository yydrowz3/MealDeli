import { registerEnumType } from '@nestjs/graphql';
import { UserRole } from '../../generated/prisma/enums';

// export enum UserRole {
//   Customer = "CUSTOMER",
//   Owner = "OWNER",
//   Courier = "Courier",
// }

registerEnumType(UserRole, { name: 'UserRole' });

export { UserRole };
