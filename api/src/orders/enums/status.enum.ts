import { registerEnumType } from '@nestjs/graphql';
import { OrderStatus } from '../../generated/prisma/enums';

registerEnumType(OrderStatus, { name: 'OrderStatus' });

export { OrderStatus };
