import { UserRole } from '@/users/user-role.enum';

export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
