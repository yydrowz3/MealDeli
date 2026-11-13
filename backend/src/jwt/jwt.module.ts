import { DynamicModule, Global, Module } from "@nestjs/common";
import { JwtService } from "./jwt.service";
import { CONFIG_OPTIONS } from "../common/common.constants";
import { JwtModuleOptions } from "./jwt.interfaces";

@Module({})
@Global()
export class JwtModule {
    static forRoot(options: JwtModuleOptions): DynamicModule {
        return {
            module: JwtModule,
            providers: [
                { provide: CONFIG_OPTIONS, useValue: options },
                JwtService,
            ],
            exports: [JwtService],
        };
    }
}
