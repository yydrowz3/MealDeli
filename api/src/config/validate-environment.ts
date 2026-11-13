import {
  EnvironmentVariables,
  environmentVariablesSchema,
} from '@/config/environment.variables';
import type { ZodError } from 'zod';

function formatEnvironmentErrors(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.') || 'environment';
    return `${path}: ${issue.message}`;
  });

  return `Environment validation failed: ${issues.join('; ')}`;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const result = environmentVariablesSchema.safeParse(config);
  if (!result.success) {
    throw new Error(formatEnvironmentErrors(result.error));
  }

  return result.data;
}
