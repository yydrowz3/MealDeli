import { CLOCK, SystemClock } from './clock';
import { Module } from '@nestjs/common';

@Module({
  providers: [
    SystemClock,
    {
      provide: CLOCK,
      useExisting: SystemClock,
    },
  ],
  exports: [CLOCK],
})
export class TimeModule {}
