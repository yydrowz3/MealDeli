import { registerEnumType } from "@nestjs/graphql";

export enum UserRole {
  Customer = "CUSTOMER",
  Owner = "OWNER",
  Courier = "Courier",
}

registerEnumType(UserRole, { name: "UserRole" });
