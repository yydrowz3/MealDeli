import { DynamicModule } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { JwtModuleOptions } from './jwt.interface';
import { JwtService } from './jwt.service';

export class JwtModule {
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      global: true,
      module: JwtModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        JwtService,
      ],
      exports: [JwtService],
    };
  }
}
