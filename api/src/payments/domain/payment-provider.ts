import { registerEnumType } from '@nestjs/graphql';

export enum PaymentProvider {
  PADDLE = 'PADDLE',
}

registerEnumType(PaymentProvider, {
  name: 'PaymentProvider',
  description: 'The verified provider that produced the payment fact.',
});
