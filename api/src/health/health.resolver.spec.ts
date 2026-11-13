import { HealthResolver } from './health.resolver';

describe('HealthResolver', () => {
  it('reports that the API is available', () => {
    const resolver = new HealthResolver();

    expect(resolver.apiStatus()).toBe('ok');
  });
});
