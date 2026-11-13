import { UserRole } from '@/users/user-role.enum';
import { SetMetadata } from '@nestjs/common';

export const ROLES_METADATA_KEY = 'auth:roles';

export const Roles = (
  ...roles: readonly UserRole[]
): MethodDecorator & ClassDecorator => SetMetadata(ROLES_METADATA_KEY, roles);
