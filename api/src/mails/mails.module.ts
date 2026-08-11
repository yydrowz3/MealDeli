import { DynamicModule, Global, Module } from "@nestjs/common";
import { CONFIG_OPTIONS } from "../common/common.constants";
import { MailsModuleOptions } from "./mails.interface";

@Module({})
@Global()
export class MailsModule {
  static forRoot(options: MailsModuleOptions): DynamicModule {
    return {
      module: MailsModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
      ],
      exports: [],
    };
  }
}
