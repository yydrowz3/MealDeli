import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../users/enums/role.enum";

export const ROLES_KEY = "roles";

export type AllowedRole = UserRole | "Any";

export const Roles = (...roles: AllowedRole[]) => SetMetadata(ROLES_KEY, roles);
