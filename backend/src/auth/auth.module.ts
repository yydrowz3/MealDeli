import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth.guard";
import { UsersModule } from "src/users/users.module";

@Module({
    imports: [UsersModule], // usersmodule instead of userservice, cuz only the module is exporting service
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AuthModule {}
