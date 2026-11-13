import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HealthResolver {
  @Query(() => String, {
    description: 'Reports whether the API process is available.',
  })
  apiStatus(): string {
    return 'ok';
  }
}
